// Ideal Ackermann geometry; dimensions are measured from the CAD hub centers.
export function steeringAngles(handwheel,geometry){
 if(geometry.mechanism)return mechanismSteering(handwheel,geometry.mechanism);
 const delta=handwheel/5*Math.PI/180,sign=Math.sign(delta),L=geometry.wheelbase;
 if(Math.abs(delta)<1e-8)return {left:0,right:0,radius:Infinity,inner:null};
 const radius=L/Math.tan(Math.abs(delta));
 return {left:sign*Math.atan(L/(radius+sign*geometry.track/2)),right:sign*Math.atan(L/(radius-sign*geometry.track/2)),radius,inner:sign>0?'right':'left'};
}
export const steeringLimit=135;

// Apply the same toe-in/toe-out sign convention on the mirrored front wheels.
export const toeAngle=(side,heading)=>side==='left'?-heading:heading;
export function formatToeAngle(side,heading){
 const degrees=Math.round(toeAngle(side,heading)*180/Math.PI*100)/100;
 return (degrees>0?'+':degrees<0?'−':'')+Math.abs(degrees).toFixed(2)+'°';
}

const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const rotateVector=(v,k,a)=>add(add(mul(v,Math.cos(a)),mul(cross(k,v),Math.sin(a))),mul(k,dot(k,v)*(1-Math.cos(a))));
export function mechanismSteering(handwheel,mechanism){
 const rackAngle=handwheel/steeringLimit*mechanism.maxRackAngle,result={rackAngle,inner:null};
 for(const side of mechanism.sides){
  const inner=add(mechanism.pivot,rotateVector(sub(side.inner,mechanism.pivot),[0,1,0],rackAngle)),v=sub(side.outer,side.pivot),d=sub(side.pivot,inner),parallel=mul(side.axis,dot(side.axis,v)),perp=sub(v,parallel),w=add(d,parallel);
  const A=2*dot(w,perp),B=2*dot(w,cross(side.axis,v)),C=dot(w,w)+dot(perp,perp)-side.length**2,r=Math.hypot(A,B),cos=-C/r;
  if(Math.abs(cos)>1+1e-8)throw Error('Steering linkage beyond travel');
  const phase=Math.atan2(B,A),offset=Math.acos(Math.max(-1,Math.min(1,cos))),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),roots=[wrap(phase+offset),wrap(phase-offset)],theta=roots.sort((a,b)=>Math.abs(a)-Math.abs(b))[0];
  result[side.id+'Axis']=-theta;
  const heading=rotateVector(side.forward||[0,0,1],side.axis,theta);result[side.id]=-Math.atan2(heading[0],heading[2]);
  result[side.id+'Inner']=inner;result[side.id+'Outer']=add(side.pivot,rotateVector(v,side.axis,theta));
 }
 if(Math.abs(handwheel)>.001)result.inner=handwheel>0?'right':'left';
 return result;
}
