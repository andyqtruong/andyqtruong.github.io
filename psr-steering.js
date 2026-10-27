import {steeringAngles,steeringLimit,rotateVector,formatToeAngle} from './psr-steering-math.js?v=5a3781f398';
export function createSteeringControls(section,viewer,data){
 const panel=section.querySelector('.steering-panel'),workspace=section.querySelector('.model-workspace'),dial=panel.querySelector('.steering-dial'),rotor=panel.querySelector('.steering-wheel-art');
 let value=0,active=false,drag=null;
 const wheels=data.sides.map(s=>({...s,key:s.id,axle:'front'}));
 function update(next){
  value=Math.max(-steeringLimit,Math.min(steeringLimit,Number(next)||0));const angles=steeringAngles(value,data.geometry);
  viewer.pause();viewer.currentTime=Math.min(1-1e-6,.5+value/(2*steeringLimit));rotor.style.transform=`rotate(${value}deg)`;
  section.dataset.steeringAngle=String(Math.round(value));
  for(const side of wheels){
   const caption=viewer.querySelector(`[data-wheel-angle="${side.key}"]`);if(!caption)continue;
   const offset=side.axle==='front'?rotateVector(side.hub.map((v,i)=>v-side.pivot[i]),side.axis,-angles[side.id+'Axis']):null,hub=offset?side.pivot.map((v,i)=>v+offset[i]):side.hub;
   const position=[hub[0]+(side.hub[0]<data.geometry.centerX?-.038:.038),.043,hub[2]].map(n=>n+'m').join(' ');
   const text=formatToeAngle(side.id,side.axle==='front'?angles[side.id]:side.heading);caption.textContent=text;caption.setAttribute('aria-label',`${side.axle==='rear'?'Rear':'Front'} ${side.id} wheel ${text}`);caption.dataset.position=position;viewer.updateHotspot({name:caption.slot,position});
  }
 }
 function setActive(enabled){
  active=enabled;panel.hidden=!enabled;workspace.classList.toggle('has-steering',enabled);
  viewer.querySelectorAll('[data-wheel-angle]').forEach(n=>n.remove());
  if(enabled)for(const side of wheels){const caption=document.createElement('span');caption.className='model-guide-label steering-wheel-angle';caption.slot='hotspot-wheel-angle-'+side.key;caption.dataset.dynamicsGuide='';caption.dataset.wheelAngle=side.key;caption.dataset.guideAxle=side.axle;caption.dataset.position=side.hub.map(n=>n+'m').join(' ');caption.dataset.normal='0 1 0';viewer.append(caption);}
  update(0);
 }
 panel.querySelector('.steering-center').addEventListener('click',()=>update(0));
 dial.addEventListener('keydown',event=>{if(!active)return;if(['ArrowLeft','ArrowRight','Home'].includes(event.key)){event.preventDefault();update(event.key==='Home'?0:value+(event.key==='ArrowRight'?5:-5));}});
 const angle=event=>{const r=dial.getBoundingClientRect();return Math.atan2(event.clientY-r.top-r.height/2,event.clientX-r.left-r.width/2)*180/Math.PI;};
 dial.addEventListener('pointerdown',event=>{if(!active)return;event.preventDefault();drag={id:event.pointerId,last:angle(event)};dial.setPointerCapture(event.pointerId);dial.classList.add('is-dragging');});
 dial.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const a=angle(event);let d=a-drag.last;if(d>180)d-=360;if(d< -180)d+=360;drag.last=a;update(value+d);});
 const end=()=>{drag=null;dial.classList.remove('is-dragging');};dial.addEventListener('pointerup',end);dial.addEventListener('pointercancel',end);dial.addEventListener('lostpointercapture',end);dial.addEventListener('dblclick',()=>update(0));
 return{setActive,center:()=>update(0)};
}
