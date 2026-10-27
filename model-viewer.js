import {createSteeringControls} from './psr-steering.js?v=0f4868ed5a';
const section = document.querySelector('.model-section');
if (section) {
  const stage = section.querySelector('.model-stage');
  const retry = section.querySelector('.model-load');
  const poster = section.querySelector('.model-poster');
  const status = section.querySelector('.model-status');
  const reset = section.querySelector('.model-reset');
  const toggle = section.querySelector('.model-label-toggle');
  const choices = section.querySelector('.model-components');
  const inspector = section.querySelector('.model-inspector');
  const stateButtons = [...section.querySelectorAll('[data-state]')];
  const states = {
    complete: {title:'Complete car',variant:null,orbit:'45deg 65deg auto',description:'Complete assembly with the bodywork installed. Select a label for the component description; the floor label turns the model over.',labels:['front-wing','rear-wing','floor','suspension','rear-suspension','sidepod','diffuser','shark-fin']},
    body: {title:'Body off',variant:'Body off',orbit:'45deg 48deg auto',description:'Bodywork removed. Browse the grouped inventory to inspect internal components, mounts, and hardware. Repeated parts share a label; the selected part is marked on the model.',labels:[], inventory:true},
    power: {title:'Power & control',variant:'Power & control',orbit:'45deg 35deg auto',description:'Electronics and the wheel-speed sensor mount are exposed. The chassis, wheel hubs, and knuckles are translucent to show their positions.',labels:['controller','esc','imu','logger','wheel-speed','perfboard','battery']},
    drivetrain: {title:'Drivetrain',variant:'Drivetrain',description:'Motor, differential, halfshafts, and exposed hubs. The front hubs remain visible to inspect the wheel-speed magnet pockets.',labels:['differential','motor','shaft','halfshafts','rear-hub','magnet-pockets']},
    cooling: {title:'Cooling',variant:'Cooling',description:'Follow the sidepod and top air intakes to the motor, ducting, and fan. Body panels and ducts are translucent.',labels:['side-intakes','side-intake-right','top-intake','fan','motor','fan-mount','ducting']},
    dynamics: {title:'Dynamics',variant:'Dynamics',description:'Select a topic to see its geometry guides on the CAD assembly. Ackermann includes interactive steering.',labels:['caster','kpi','camber','toe','anti-squat','ackermann']},
    aero: {title:'Aerodynamics',variant:'Aerodynamics',description:'Wings, shark fin, floor, diffuser, and sidepods with illustrative airflow paths. Arrows indicate intended flow direction; they are not CFD results and do not encode speed or pressure.',labels:['front-wing','rear-wing','floor','diffuser','sidepod','shark-fin','bargeboards','floor-edge']} 
  };
  let steeringControls;
  const axleControls=section.querySelector('.model-axle-controls');
  let axleFocus='both';
  const selectedView=label=>label.axleViews?.[axleFocus]||label;
  function applyAxleFocus(moveCamera=true){
    const enabled=activeState==='dynamics'&&!!activeComponent?.axleViews;axleControls.hidden=!enabled;
    for(const b of axleControls.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.axleFocus===axleFocus));
    section.dataset.axleFocus=enabled?axleFocus:'';
    for(const n of viewer.querySelectorAll('[data-guide-axle]'))n.hidden=enabled&&(axleFocus!=='both'?n.dataset.guideAxle!==axleFocus:!n.classList.contains('dynamics-angle')&&!n.classList.contains('steering-wheel-angle'));
    if(enabled&&moveCamera){const view=selectedView(activeComponent);viewer.cameraTarget=view.target.map(n=>n+'m').join(' ');viewer.cameraOrbit=view.orbit;viewer.fieldOfView='30deg';section.querySelector('.model-workspace').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  }
  axleControls.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{axleFocus=b.dataset.axleFocus;applyAxleFocus();}));
  let viewer, labels = [], views = {}, inventory = [], activeState = 'complete', labelsOn = true, activeComponent=null;
  function selectComponent(id, focus = false) {
    const label = labels.find(item => item.id === id);
    activeComponent=label;
    section.querySelector('.model-detail h3').textContent = label.title;
    section.querySelector('.model-detail p').textContent = label.description;
    for (const button of section.querySelectorAll('[data-component]')) {
      const active = button.dataset.component === id;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    }
    viewer.querySelectorAll('[data-dynamics-guide]').forEach(node=>node.remove());
    if(activeState==='dynamics'){
      viewer.setAttribute('variant-name',label.guideVariant);
      for(const [index,item] of (id==='ackermann'?[]:label.guideLabels||[]).entries()){
        const caption=document.createElement('span');caption.className='model-guide-label'+(item.reference?' guide-reference':'')+(item.angle?' dynamics-angle':'');caption.slot='hotspot-guide-'+index;caption.dataset.dynamicsGuide='';if(item.axle)caption.dataset.guideAxle=item.axle;caption.dataset.position=item.position.map(n=>n+'m').join(' ');caption.dataset.normal='0 1 0';caption.textContent=item.title;viewer.append(caption);
      }
      status.textContent='Dynamics / '+label.title;
    }
    steeringControls?.setActive(activeState==='dynamics'&&id==='ackermann');
    applyAxleFocus(false);
    if (focus) {
      const view=activeState==='dynamics'?selectedView(label):label;
      viewer.cameraTarget = view.target.map(n => n + 'm').join(' ');
      viewer.cameraOrbit = view.orbit;
      viewer.fieldOfView = '30deg';
      if(activeState==='dynamics')section.querySelector('.model-workspace').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }
  }
  function resetCamera() {
    const view=activeState==='dynamics'&&activeComponent?selectedView(activeComponent):views[activeState];
    viewer.cameraTarget = view ? view.target.map(n => n + 'm').join(' ') : 'auto auto auto';
    viewer.cameraOrbit = activeState === 'complete' && viewer.clientWidth >= 760 ? '35deg 75deg 0.72m' : view ? view.orbit : states[activeState].orbit;
    viewer.fieldOfView = '30deg';
    viewer.jumpCameraToGoal();
  }
  function setState(name) {
    activeState = name;
    const state = states[name];
    if(state.variant)viewer.setAttribute('variant-name',state.variant);else viewer.removeAttribute('variant-name');
    section.querySelector('.aero-note').hidden = name !== 'aero';
    viewer.setAttribute('shadow-intensity', ['power','drivetrain','cooling','dynamics','aero'].includes(name) ? '0' : '0.7');
    for (const button of stateButtons) button.setAttribute('aria-pressed', String(button.dataset.state === name));
    section.querySelector('.model-state-description').textContent = state.description;
    viewer.querySelectorAll('[slot^="hotspot"]').forEach(node => node.remove());
    choices.replaceChildren();
    const ids=state.inventory?inventory:state.labels;
    viewer.classList.toggle('inventory-mode',!!state.inventory||name==='dynamics');
    const groups=new Map();
    ids.forEach((id, index) => {
      const label = labels.find(item => item.id === id);
    activeComponent=label;
      const hotspot = document.createElement('button');
      hotspot.type = 'button';
      hotspot.className = 'model-hotspot';
      hotspot.slot = 'hotspot-' + id;
      hotspot.dataset.position = label.position.map(n => n + 'm').join(' ');
      hotspot.dataset.normal = label.normal || '0 1 0';
      hotspot.dataset.visibilityAttribute = 'visible';
      hotspot.dataset.component = id;
      hotspot.setAttribute('aria-label', label.title);
      const number = document.createElement('span');
      number.className = 'hotspot-number';
      number.textContent = index + 1;
      const name = document.createElement('span');
      name.className = 'hotspot-label';
      name.textContent = label.title;
      hotspot.append(number, name);
      hotspot.addEventListener('click', () => selectComponent(id, true));
      viewer.append(hotspot);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.component = id;
      const indexLabel=document.createElement('span');indexLabel.className='component-index';indexLabel.textContent=(index+1)+' / '; 
      const partTitle=document.createElement('span');partTitle.className='component-title';partTitle.textContent=label.title;
      button.append(indexLabel,partTitle);
      button.addEventListener('click', () => selectComponent(id, true));
      if(state.inventory){
        const category=label.category||'Other components';
        if(!groups.has(category)){
          const group=document.createElement('details');group.className='component-group';group.open=category==='Electronics';
          const heading=document.createElement('summary');heading.textContent=category;
          const list=document.createElement('div');list.className='component-group-items';group.append(heading,list);choices.append(group);groups.set(category,list);
        }
        groups.get(category).append(button);
      }else choices.append(button);
    });
    viewer.classList.toggle('labels-off', !labelsOn);
    selectComponent(ids[0]);
    resetCamera();
    status.textContent = 'PSR9000 / ' + state.title;
  }
  function onError() {
    viewer?.remove();
    poster.hidden = false;
    poster.querySelector('p').textContent = 'The 3D model couldn’t load.';
    retry.hidden = false;
    retry.disabled = false;
    reset.disabled = true;
    stateButtons.forEach(button => button.disabled = true);
    inspector.hidden = true;
    status.textContent = 'Try again, or open the Onshape viewer using the link above.';
  }
  async function initialize() {
    retry.disabled = true;
    retry.hidden = true;
    poster.querySelector('p').textContent = 'Loading the 3D model…';
    try {
      const [, response] = await Promise.all([
        import('./assets/vendor/model-viewer.min.js'),
        fetch(section.dataset.modelLabels)
      ]);
      if (!response.ok) throw new Error('Component data could not load');
      const data = await response.json();
      labels = data.labels;
      views = data.views;
      inventory = data.inventory;
      viewer = document.createElement('model-viewer');
      viewer.setAttribute('alt', 'Interactive PSR9000 RC car. Choose a display state to inspect internal components. Drag or use arrow keys to rotate; scroll or pinch to zoom.');
      for (const [key,value] of Object.entries({'camera-controls':'','touch-action':'pan-y','shadow-intensity':'0.7','shadow-softness':'1',exposure:'1.1','environment-image':section.dataset.environment,'tone-mapping':'aces','camera-orbit':states.complete.orbit,'field-of-view':'30deg','interaction-prompt':'none','min-camera-orbit':'auto auto 0.04m',loading:'eager'})) viewer.setAttribute(key,value);
      viewer.addEventListener('load', async () => {
        viewer.animationName='Steering';await viewer.updateComplete;viewer.pause();viewer.currentTime=.5;
        steeringControls=createSteeringControls(section,viewer,data.steeringData);
        poster.hidden = true;
        reset.disabled = false;
        stateButtons.forEach(button => button.disabled = false);
        inspector.hidden = false;
        setState(activeState);
      }, {once:true});
      viewer.addEventListener('error', onError, {once:true});
      stage.prepend(viewer);
      viewer.src = section.dataset.modelSrc;
    } catch { onError(); }
  }
  stateButtons.forEach(button => button.addEventListener('click', () => setState(button.dataset.state)));
  reset.addEventListener('click',()=>{steeringControls?.center();resetCamera();});
  retry.addEventListener('click', initialize);
  toggle.addEventListener('click', () => {
    labelsOn = !labelsOn;
    toggle.setAttribute('aria-pressed', String(labelsOn));
    const text=labelsOn?'Labels on':'Labels off';
    toggle.querySelector('.icon-link-label').textContent=text;
    toggle.setAttribute('aria-label',text);
    toggle.title=text;
    viewer?.classList.toggle('labels-off', !labelsOn);
  });
  // Automatic load: no launch click is required.
  initialize();
}

