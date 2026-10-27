/* A clipped duplicate gives text and icons the same synchronized wipe as the home-page name. */
(()=>{
 const selector='button:not(.model-hotspot),a[href],summary', layers=new WeakMap(), pending=new Set();
 const layout=['display','box-sizing','padding-top','padding-right','padding-bottom','padding-left','border-top-width','border-right-width','border-bottom-width','border-left-width','font-size','font-weight','font-style','line-height','letter-spacing','word-spacing','text-transform','text-align','white-space','overflow-wrap','word-break','align-items','align-content','justify-content','justify-items','flex-direction','flex-wrap','column-gap','row-gap','grid-template-columns','grid-template-rows'];
 let serial=0,frame=0;
 function sync(action){
  if(!action.isConnected||action.closest('model-viewer'))return;
  let layer=layers.get(action);
  if(!layer){layer=document.createElement('span');layer.className='psr-action-reveal';layer.setAttribute('aria-hidden','true');layer.setAttribute('inert','');layers.set(action,layer);}
  const style=getComputedStyle(action);
  if(style.position==='static')action.style.position='relative';
  if(style.display==='inline')action.style.display='inline-block';
  for(const prop of layout)layer.style.setProperty(prop,prop==='display'&&style.display==='inline'?'inline-block':style.getPropertyValue(prop));
  layer.style.borderStyle='solid';layer.style.borderColor='transparent';
  for(const side of ['top','right','bottom','left'])layer.style[side]=-(parseFloat(style.getPropertyValue('border-'+side+'-width'))||0)+'px';
  if(action.tagName==='BUTTON'&&['block','inline-block','flow-root'].includes(style.display)){
   layer.style.display='flex';layer.style.alignItems='center';
   layer.style.justifyContent=style.textAlign==='left'||style.textAlign==='start'?'flex-start':style.textAlign==='right'||style.textAlign==='end'?'flex-end':'center';
  }
  const children=[...action.childNodes].filter(n=>n!==layer).map(n=>n.cloneNode(true));
  layer.replaceChildren(...children);
  // SVG definitions need fresh IDs; the original control and all handlers stay untouched.
  const ids=new Map(),suffix='-psr-wipe-'+(++serial);
  for(const el of layer.querySelectorAll('[id]')){const id=el.id;ids.set(id,id+suffix);el.id=id+suffix;}
  for(const el of layer.querySelectorAll('*')){
   for(const attr of [...el.attributes]){
    let value=attr.value;
    for(const [oldId,newId]of ids){value=value.split('url(#'+oldId+')').join('url(#'+newId+')');if((attr.name==='href'||attr.name==='xlink:href')&&value==='#'+oldId)value='#'+newId;}
    if(value!==attr.value)el.setAttribute(attr.name,value);
   }
   if(el.matches('a,button,input,select,textarea,[tabindex],[contenteditable]')){el.setAttribute('tabindex','-1');el.removeAttribute('contenteditable');}
  }
  if(layer.parentNode!==action)action.append(layer);
 }
 function flush(){frame=0;for(const action of pending)sync(action);pending.clear();}
 function queue(action){if(!action||action.closest('.psr-action-reveal,model-viewer'))return;pending.add(action);if(!frame)frame=requestAnimationFrame(flush);}
 const resize=new ResizeObserver(entries=>{for(const entry of entries)queue(entry.target);});
 function enhance(root){
  if(!(root instanceof Element)||root.closest('.psr-action-reveal'))return;
  const items=[...(root.matches(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const action of items){
   if(action.closest('.psr-action-reveal,model-viewer'))continue;
   if(!action.hasAttribute('data-psr-action'))action.setAttribute('data-psr-action','');
   resize.observe(action);
   queue(action);
  }
 }
 enhance(document.body);
 const observer=new MutationObserver(records=>{
  for(const record of records){
   const target=record.target.nodeType===1?record.target:record.target.parentElement;
   if(target?.closest('.psr-action-reveal'))continue;
   if(record.type==='childList'){
    const changed=[...record.addedNodes,...record.removedNodes];
    if(changed.length&&changed.every(n=>n.nodeType===1&&n.classList.contains('psr-action-reveal')))continue;
    for(const node of record.removedNodes){
     if(!(node instanceof Element))continue;
     for(const action of [...(node.matches('[data-psr-action]')?[node]:[]),...node.querySelectorAll('[data-psr-action]')]){resize.unobserve(action);pending.delete(action);}
    }
    for(const node of record.addedNodes)enhance(node);
   }
   queue(target?.closest(selector));
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-label','aria-pressed','class','style']});
 document.addEventListener('pointerenter',event=>queue(event.target instanceof Element?event.target.closest(selector):null),true);
 document.addEventListener('focusin',event=>queue(event.target.closest(selector)));
 document.fonts.ready.then(()=>document.querySelectorAll('[data-psr-action]').forEach(queue));
})();
