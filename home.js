const car=document.getElementById('home-car');
if(car){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 try{
  await import('./assets/vendor/model-viewer.min.js');
  car.addEventListener('load',()=>car.closest('.car-cover').classList.add('is-loaded'),{once:true});
  const size=window.matchMedia('(max-width: 760px)');
  // Fit the complete model for every yaw angle, including perspective depth.
  const [width,height,length]=car.dataset.modelSize.split(' ').map(Number);
  const horizontal=Math.hypot(width,length)/2;
  const elevation=15*Math.PI/180,halfFov=15*Math.PI/180;
  const vertical=horizontal*Math.sin(elevation)+height/2*Math.cos(elevation);
  const depth=horizontal*Math.cos(elevation)+height/2*Math.sin(elevation);
  const frame=()=>{
   const aspect=car.clientWidth/Math.max(1,car.clientHeight);
   const distance=(Math.max(vertical/Math.tan(halfFov),horizontal/(Math.tan(halfFov)*aspect))+depth)*1.03;
   car.cameraOrbit='-35deg 75deg '+distance+'m';
  };
  frame();size.addEventListener('change',frame);
  new ResizeObserver(frame).observe(car);
  car.src=car.dataset.src;
  car.rotationPerSecond='12deg';
  const observer=new IntersectionObserver(entries=>{
   car.autoRotate=entries[0].isIntersecting&&!reduced.matches;
  },{threshold:.1});
  observer.observe(car);
  reduced.addEventListener('change',()=>car.autoRotate=!reduced.matches);
 }catch{ /* Keep the CAD poster available if WebGL cannot load. */ }
}



// The cover uses the same measured CSV as the full Bungee Drop page.
const plot=document.getElementById('home-bungee-plot');
if(plot){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=window.matchMedia('(max-width: 760px)');
 let ready=false,visible=false,loading=false,frame=0,last=0,angle=.8;
 const camera=()=>{const radius=mobile.matches?3:1.95;return{x:radius*Math.cos(angle),y:radius*Math.sin(angle),z:mobile.matches?1.7:1.35};};
 const stop=()=>{cancelAnimationFrame(frame);frame=0;last=0;};
 function tick(time){
  if(!visible||document.hidden||reduced.matches||!ready){stop();return;}
  frame=requestAnimationFrame(tick);
  if(time-last<90)return;
  angle+=Math.min((time-(last||time))/1000,.2)*.12;last=time;
  Plotly.relayout(plot,{'scene.camera.eye':camera()});
 }
 const run=()=>{if(visible&&ready&&!document.hidden&&!reduced.matches&&!frame)frame=requestAnimationFrame(tick);else if(!visible||document.hidden||reduced.matches)stop();};
 async function initialize(){
  if(loading)return;loading=true;
  try{
   const library=new Promise((resolve,reject)=>{if(window.Plotly){resolve();return;}const script=document.createElement('script');script.src=plot.dataset.plotly;script.onload=resolve;script.onerror=reject;document.head.append(script);});
   const csv=fetch(plot.dataset.csv).then(response=>{if(!response.ok)throw Error('Measurements unavailable');return response.text();});
   const [,text]=await Promise.all([library,csv]);
   const rows=text.trim().split(/\r?\n/).slice(1).map(line=>line.split(',').map(Number));
   const css=getComputedStyle(document.documentElement),color=name=>css.getPropertyValue('--'+name).trim();
   const axis=(title,range)=>({title:{text:title,font:{size:12}},range,color:color('muted'),gridcolor:color('line'),zeroline:false,showbackground:false,tickfont:{size:10},showspikes:false});
   await Plotly.newPlot(plot,[{type:'scatter3d',mode:'markers',x:rows.map(r=>r[1]*1000),y:rows.map(r=>r[0]),z:rows.map(r=>r[2]),hoverinfo:'skip',marker:{size:6.5,color:rows.map(r=>r[0]),colorscale:[[0,color('chart-blue')],[.5,color('ink')],[1,color('accent')]],cmin:1,cmax:6,opacity:1,line:{width:.4,color:color('ink')}}}],{
    paper_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial, sans-serif',color:color('ink')},margin:{l:15,r:15,t:15,b:40},showlegend:false,
    scene:{xaxis:axis('Mass (g)',[50,650]),yaxis:axis('Cord length (m)',[.5,6.5]),zaxis:axis('Stretched length (m)',[3.5,9.2]),bgcolor:'rgba(0,0,0,0)',aspectmode:'manual',aspectratio:{x:1.2,y:1.2,z:.95},camera:{eye:camera()}}
   },{responsive:true,staticPlot:false,displayModeBar:false,scrollZoom:false});
   ready=true;plot.closest('.bungee-live-art').classList.add('is-loaded');
   new ResizeObserver(()=>{if(ready)Plotly.Plots.resize(plot);}).observe(plot);
   run();
  }catch(error){console.warn('Bungee cover uses its static preview.',error);}
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;run();},{threshold:.2}).observe(plot);
 const preload=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){initialize();preload.disconnect();}},{rootMargin:'100% 0px'});preload.observe(plot);
 document.addEventListener('visibilitychange',run);reduced.addEventListener('change',run);
 mobile.addEventListener('change',()=>{if(ready)Plotly.relayout(plot,{'scene.camera.eye':camera()});});
}
const panelLinks=[...document.querySelectorAll('.home-pagination a')];
if(panelLinks.length){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.body.classList.toggle('home-light-section',entry.target.id==='home-warwolf');for(const link of panelLinks){const active=link.hash==='#'+entry.target.id;if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');}}},{threshold:.6});
 for(const link of panelLinks){const section=document.querySelector(link.hash);if(section)observer.observe(section);}
}


// Highlight only the title's text bounds or the visible model/plot, not its full-page link.
const projectCovers=[...document.querySelectorAll('.car-cover,.immersive-project')];
if(projectCovers.length){
 let active=null,pointer=null,timer=0;
 const textRanges=new Map(projectCovers.map(link=>{const title=link.querySelector('.cover-caption strong,.immersive-caption h2'),range=document.createRange();range.selectNodeContents(title);return[link,range];}));
 const inside=(p,r)=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;
 function hit(link,p){
  if(!inside(p,link.getBoundingClientRect()))return false;
  const top=document.elementFromPoint(p.x,p.y);if(!top||!link.contains(top))return false;
  if([...textRanges.get(link).getClientRects()].some(r=>inside(p,r)))return true;
  const viewer=link.querySelector('model-viewer');
  if(viewer&&inside(p,viewer.getBoundingClientRect())){
   if(typeof viewer.materialFromPoint!=='function')return false;
   const r=viewer.getBoundingClientRect();
   // Picking uses layout pixels; compensate for the small visual hover scale.
   const x=r.left+(p.x-r.left)*viewer.clientWidth/r.width,y=r.top+(p.y-r.top)*viewer.clientHeight/r.height;
   try{const material=viewer.materialFromPoint(x,y);return !!material&&material.pbrMetallicRoughness.baseColorFactor[3]>.05;}catch{return false;}
  }
  const plot=link.querySelector('.bungee-live-art');
  if(plot){
   const r=plot.getBoundingClientRect(),width=Math.min(r.width*.7,r.height*1.08),height=r.height*.8,cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
   return inside(p,{left:cx-width/2,right:cx+width/2,top:cy-height/2,bottom:cy+height/2});
  }
  return false;
 }
 function clear(){clearTimeout(timer);timer=0;for(const link of projectCovers)link.classList.remove('is-project-hover');active=null;pointer=null;}
 function update(){
  timer=0;if(!active||!pointer||document.hidden){clear();return;}
  const top=document.elementFromPoint(pointer.x,pointer.y);
  if(!top||!active.contains(top)){clear();return;}
  active.classList.toggle('is-project-hover',hit(active,pointer));
  // Recheck a stationary cursor while an auto-rotating model moves underneath it.
  timer=setTimeout(update,120);
 }
 for(const link of projectCovers){
  link.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'){clear();return;}
   if(active!==link){clear();active=link;}pointer={x:event.clientX,y:event.clientY};
   clearTimeout(timer);timer=0;update();
  },{passive:true});
  link.addEventListener('pointerleave',()=>{if(active===link)clear();});
  link.addEventListener('pointercancel',clear);
  link.addEventListener('click',event=>{if(event.detail>0&&!hit(link,{x:event.clientX,y:event.clientY}))event.preventDefault();});
 }
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 window.addEventListener('scroll',()=>{if(active){clearTimeout(timer);timer=0;update();}},{passive:true});
}
