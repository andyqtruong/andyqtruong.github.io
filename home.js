const car=document.getElementById('home-car');
if(car){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 try{
  await import('./model-runtime.js');
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



const panelLinks=[...document.querySelectorAll('.home-pagination a')];
if(panelLinks.length){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.body.classList.toggle('home-light-section',entry.target.id==='home-warwolf');for(const link of panelLinks){const active=link.hash==='#'+entry.target.id;if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');}}},{threshold:.6});
 for(const link of panelLinks){const section=document.querySelector(link.hash);if(section)observer.observe(section);}
}


// Highlight only the title's text bounds or the visible model, not its full-page link.
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
