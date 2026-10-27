import {motion,transformArm,slingPose,webPoint} from './warwolf-motion.js?v=4053af39c4';
// Shared launch clip: button on the case study, occasional visible-only cover launches.
const models=[...document.querySelectorAll('model-viewer[data-warwolf]')];
if(models.length){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 try{
  await import('./assets/vendor/model-viewer.min.js');
  for(const viewer of models){
   const cover=viewer.hasAttribute('data-cover'),container=viewer.parentElement,section=viewer.closest('.warwolf-model');
   const launchButton=section?.querySelector('.warwolf-launch'),status=section?.querySelector('.warwolf-status');
   let inspection=null;
   let visible=false,loaded=false,running=false,timer=0,savedCamera=null,hasLaunched=false;
   const state=value=>{container.dataset.launchState=value;if(section)section.dataset.launchState=value;};state('idle');
   const clear=()=>{clearTimeout(timer);timer=0;};
   function button(busy){if(!launchButton)return;launchButton.disabled=!loaded||busy;launchButton.setAttribute('aria-busy',String(busy));launchButton.querySelector('.launch-label').textContent=busy?'Launching':'Launch';launchButton.setAttribute('aria-label',busy?'Launching':'Launch');}
   function fitAction(){
    const size=viewer.dataset.actionSize.split(' ').map(Number),center=viewer.dataset.actionCenter;
    const orbit=viewer.getCameraOrbit(),horizontal=Math.hypot(size[0],size[2])/2,halfHeight=size[1]/2;
    const vertical=halfHeight*Math.abs(Math.sin(orbit.phi))+horizontal*Math.abs(Math.cos(orbit.phi));
    const depth=horizontal*Math.abs(Math.sin(orbit.phi))+halfHeight*Math.abs(Math.cos(orbit.phi));
    const aspect=viewer.clientWidth/Math.max(1,viewer.clientHeight),tan=Math.tan(Math.PI/12);
    const distance=(Math.max(vertical/tan,horizontal/(tan*aspect))+depth)*1.06;
    viewer.cameraTarget=center.split(' ').map(n=>n+'m').join(' ');viewer.cameraOrbit=`${orbit.theta}rad ${orbit.phi}rad ${distance}m`;viewer.fieldOfView='30deg';
   }
   function schedule(){
    clear();if(!cover||!loaded||running||!visible||document.hidden||reduced.matches)return;
    timer=setTimeout(()=>{timer=0;launch();},hasLaunched?15000+Math.random()*6000:3500);
   }
   function rotate(){viewer.autoRotate=cover&&visible&&!document.hidden&&!reduced.matches&&!running;}
   function restore(){if(!savedCamera)return;viewer.cameraTarget=savedCamera.target;viewer.cameraOrbit=savedCamera.orbit;viewer.fieldOfView=savedCamera.fov;savedCamera=null;}
   function finish(cancelled=false){
    if(!running)return;viewer.pause();viewer.currentTime=0;running=false;inspection?.update();restore();state('idle');button(false);
    if(status)status.textContent=cancelled?'Ready to launch.':'Launch complete. Ready to launch again.';
    rotate();schedule();
   }
   function launch(){
    if(!loaded||running||(cover&&(!visible||document.hidden||reduced.matches)))return;
    clear();if(!cover)section.scrollIntoView({block:'center',behavior:reduced.matches?'auto':'smooth'});const orbit=viewer.getCameraOrbit(),target=viewer.getCameraTarget();
    savedCamera={orbit:`${orbit.theta}rad ${orbit.phi}rad ${orbit.radius}m`,target:`${target.x}m ${target.y}m ${target.z}m`,fov:viewer.fieldOfView};
    running=true;inspection?.animate();hasLaunched=true;viewer.autoRotate=false;state('launching');button(true);
    container.dataset.launchCount=String(Number(container.dataset.launchCount||0)+1);
    if(status)status.textContent='Launching Warwolf.';
    fitAction();viewer.currentTime=0;viewer.play({repetitions:1});
   }
   function sync(){
    if(!visible||document.hidden){clear();if(running)finish(true);}
    if(reduced.matches&&cover){clear();if(running)finish(true);}
    rotate();if(!running)schedule();
   }
   if(section){
    const data=await fetch(viewer.dataset.details).then(r=>{if(!r.ok)throw Error('Warwolf labels unavailable');return r.json();});
    const choices=section.querySelector('.model-components'),detail=section.querySelector('.warwolf-detail'),stateButtons=[...section.querySelectorAll('[data-warwolf-state]')];
    let selected='arm',labels=data.labels,frame=0;
    const point=label=>{const t=viewer.currentTime||0;let p=label.position;if(label.moving==='sling'){const pose=slingPose(t);p=pose.pouch.map((v,i)=>v+(pose.tip[i]-v)*.45);}else if(label.moving==='projectile')p=slingPose(t).ball;else if(label.moving)p=transformArm(p,t);return webPoint(p);};
    const hotspots=new Map();
    function update(){for(const label of labels){const h=hotspots.get(label.id),position=point(label);viewer.updateHotspot({name:h.slot,position:position.join(' '),normal:'0 1 0'});h.hidden=label.id==='projectile'&&viewer.currentTime>=motion.release&&viewer.currentTime<6.2;}}
    function animate(){cancelAnimationFrame(frame);const tick=()=>{update();if(running)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);}
    function select(id,focus=false){
     if(running)finish(true);selected=id;const label=labels.find(l=>l.id===id);
     for(const b of choices.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.component===id));
     for(const [key,h]of hotspots){h.classList.toggle('is-active',key===id);h.setAttribute('aria-pressed',String(key===id));}
     detail.querySelector('h3').textContent=label.title;detail.querySelector('p').textContent=label.description;
     if(focus){viewer.scrollIntoView({block:'center',behavior:reduced.matches?'auto':'smooth'});if(['vertical','horizontal','counterweight','sling','projectile'].includes(id))setState('panels');viewer.cameraTarget=point(label).map(x=>x+'m').join(' ');viewer.cameraOrbit=id==='sling'?'65deg 60deg .85m':id==='projectile'?'65deg 65deg .65m':'-135deg 65deg .95m';}
    }
    function setState(name){
     if(running)finish(true);if(name==='panels')viewer.setAttribute('variant-name','Decorative panels off');else viewer.removeAttribute('variant-name');
     for(const b of stateButtons)b.setAttribute('aria-pressed',String(b.dataset.warwolfState===name));
    }
    labels.forEach((label,index)=>{
     const b=document.createElement('button');b.type='button';b.dataset.component=label.id;b.setAttribute('aria-pressed','false');
     const count=document.createElement('span');count.className='component-index';count.textContent=String(index+1);const title=document.createElement('span');title.className='component-title';title.textContent=label.title;b.append(count,title);b.addEventListener('click',()=>select(label.id,true));choices.append(b);
     const h=document.createElement('button');h.type='button';h.className='warwolf-hotspot';h.slot='hotspot-warwolf-'+label.id;h.dataset.position=point(label).join(' ');h.dataset.normal='0 1 0';h.setAttribute('aria-label',label.title);h.innerHTML='<span class="warwolf-marker">'+(index+1)+'</span><span class="warwolf-hotspot-title"></span>';h.querySelector('.warwolf-hotspot-title').textContent=label.title;h.addEventListener('click',()=>select(label.id,true));viewer.append(h);hotspots.set(label.id,h);
    });
    for(const b of stateButtons)b.addEventListener('click',()=>{setState(b.dataset.warwolfState);viewer.cameraTarget='auto auto auto';viewer.cameraOrbit='-135deg 67deg auto';});
    inspection={update,animate};select(selected);update();
   }
   viewer.rotationPerSecond='9deg';viewer.autoRotateDelay=0;viewer.animationCrossfadeDuration=0;
   viewer.addEventListener('load',()=>{
    container.classList.add('is-loaded');loaded=viewer.availableAnimations.includes('Launch');
    viewer.animationName='Launch';viewer.pause();viewer.currentTime=0;inspection?.update();for(const b of section?.querySelectorAll('[data-warwolf-state]')||[])b.disabled=false;button(false);sync();
    if(status)status.textContent=loaded?'Ready to launch.':'The launch animation could not load.';
   },{once:true});
   viewer.addEventListener('finished',()=>finish());
   viewer.addEventListener('error',()=>{clear();loaded=false;if(running)finish(true);button(false);if(status)status.textContent='The 3D model could not load. Reload the page to try again.';});
   new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=(cover?.6:.1);sync();},{threshold:[0,.1,.25,.6]}).observe(viewer);
   const preload=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){viewer.src=viewer.dataset.src;preload.disconnect();}},{rootMargin:'80% 0px'});preload.observe(viewer);
   new ResizeObserver(()=>{if(running)fitAction();}).observe(viewer);
   reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
   launchButton?.addEventListener('click',launch);
   section?.querySelector('.warwolf-reset')?.addEventListener('click',()=>{clear();finish(true);viewer.pause();viewer.currentTime=0;viewer.cameraOrbit='-135deg 67deg auto';viewer.cameraTarget='auto auto auto';viewer.fieldOfView='30deg';viewer.resetTurntableRotation();});
  }
 }catch{const status=document.querySelector('.warwolf-status');if(status)status.textContent='The 3D viewer could not load. Reload the page to try again.';}
}
