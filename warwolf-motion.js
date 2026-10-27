// Source coordinates are Z-up. This is a staged visual sequence referenced to
// IMG_2575.mov (baseplate pickup, trailing sling, sweep, release), not a solver.
export const motion={pivot:[-.3613817074,.063571032,.4911075573],weight:[-.6929967214,.063571032,.7147847216],tip:[.148,.063571032,.147],ball:[-.24,.063571032,.0685],peak:95*Math.PI/180,release:1.87,duration:6.5};
motion.shortLength=Math.hypot(motion.weight[0]-motion.pivot[0],motion.weight[2]-motion.pivot[2]);
motion.initial=Math.atan2(motion.pivot[2]-motion.weight[2],motion.pivot[0]-motion.weight[0]);
motion.slingLength=Math.hypot(motion.ball[0]-motion.tip[0],motion.ball[2]-motion.tip[2]);
const smooth=x=>x*x*(3-2*x),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function armAngle(t){
 if(t<.55)return motion.initial;
 if(t<1.95)return motion.initial+(motion.peak-motion.initial)*Math.pow((t-.55)/1.4,2.15);
 if(t<2.75){const x=t-1.95;return motion.peak+Math.sin(x*18)*Math.exp(-x*6)*Math.PI/180;}
 if(t<3.55)return motion.peak;
 if(t<6.2)return motion.peak+(motion.initial-motion.peak)*smooth((t-3.55)/2.65);
 return motion.initial;
}
export function transformArm(p,t){const phi=armAngle(t),d=phi-motion.initial,c=Math.cos(d),s=Math.sin(d),x=p[0]-motion.pivot[0],z=p[2]-motion.pivot[2],dx=motion.weight[0]+motion.shortLength*Math.cos(phi)-motion.pivot[0];return[motion.pivot[0]+dx+c*x-s*z,p[1],motion.pivot[2]+s*x+c*z];}
// Find when the cord can first lift the pouch clear of the baseplate.
let low=.55,high=1.95;for(let i=0;i<40;i++){const t=(low+high)/2;if(transformArm(motion.tip,t)[2]-motion.ball[2]<motion.slingLength)low=t;else high=t;}motion.liftOff=(low+high)/2;
function loadedPouch(t){
 const tip=transformArm(motion.tip,t),L=motion.slingLength;
 if(t<=motion.liftOff){const dz=tip[2]-motion.ball[2];return[tip[0]-Math.sqrt(Math.max(0,L*L-dz*dz)),motion.ball[1],motion.ball[2]];}
 const u=Math.min(1,(t-motion.liftOff)/(motion.release-motion.liftOff)),theta=(-90+145*Math.pow(u,1.65))*Math.PI/180;
 return[tip[0]+L*Math.cos(theta),tip[1],tip[2]+L*Math.sin(theta)];
}
const releasePoint=loadedPouch(motion.release),before=loadedPouch(motion.release-.004);
const flightVelocity=releasePoint.map((v,i)=>(v-before[i])/.004*1.65);
const followAngle=t=>(270-215*Math.exp(-(t-motion.release)*1.8)*Math.cos((t-motion.release)*3.2))*Math.PI/180;
export function slingPose(t){
 const tip=transformArm(motion.tip,t);let pouch,opened=t>=motion.release&&t<6.2;
 if(t<motion.release||t>=6.2)pouch=loadedPouch(t>=6.2?0:t);
 else if(t<3.55){const theta=followAngle(t);pouch=[tip[0]+motion.slingLength*Math.cos(theta),tip[1],tip[2]+motion.slingLength*Math.sin(theta)];}
 else {const phi=armAngle(t),u=Math.max(0,Math.min(1,(phi-motion.initial)/(motion.peak-motion.initial))),reverse=.55+1.4*Math.pow(u,1/2.15),loaded=loadedPouch(Math.min(reverse,motion.release));const settle=followAngle(3.55),hanging=[tip[0]+motion.slingLength*Math.cos(settle),tip[1],tip[2]+motion.slingLength*Math.sin(settle)];pouch=mix(hanging,loaded,smooth(Math.min(1,(t-3.55)/.5)));}
 const retainedEnd=[pouch[0],pouch[1]-.027,pouch[2]-.018],releaseEnd=[pouch[0],pouch[1]+.027,pouch[2]-.018];
 let free=tip;
 if(opened){const x=t-motion.release,hang=[pouch[0]+.18*Math.sin(x*6),pouch[1]+.012,pouch[2]-motion.slingLength*.85];free=mix(tip,hang,smooth(Math.min(1,x/.32)));if(t>5.6)free=mix(free,tip,smooth(Math.min(1,(t-5.6)/.6)));}
 let ball=pouch,visible=true;
 if(t>=motion.release&&t<3.1){const x=t-motion.release;ball=releasePoint.map((v,i)=>v+flightVelocity[i]*x-(i===2?2*x*x:0));}
 else if(t>=3.1&&t<6.2){ball=motion.ball;visible=false;}
 return {tip,pouch,ball,visible,cords:{retained:[tip,retainedEnd],release:[free,releaseEnd]}};
}
export function webPoint(p){return[p[0],p[2],-p[1]];}
