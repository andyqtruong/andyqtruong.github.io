/* Measurements stay in source units; only the mass display converts kg to g. */
(async () => {
 const chart=document.getElementById('bungee-chart');
 if(!chart) return;
 const filter=document.getElementById('cord-filter');
 const picker=document.querySelector('.cord-picker'),cordOptions=picker.querySelector('.cord-options'),cordCurrent=document.getElementById('cord-current');
 const modes=[...document.querySelectorAll('[data-chart-mode]')];
 const readout=document.getElementById('point-readout');
 let mode='3d';
 try {
  const response=await fetch(document.querySelector('a[download][href*="bungee-may"]').href);
  if(!response.ok) throw new Error('Data unavailable');
  const rows=(await response.text()).trim().split(/\r?\n/).slice(1).map(line=>line.split(',').map(Number));
  const lengths=[...new Set(rows.map(r=>r[0]))].sort((a,b)=>a-b);
  for(const length of lengths){const option=document.createElement('button');option.type='button';option.dataset.cordLength=String(length);option.setAttribute('aria-pressed','false');option.textContent=`${length} m`;cordOptions.append(option);}
  cordOptions.addEventListener('click',event=>{const option=event.target.closest('[data-cord-length]');if(!option)return;filter.value=option.dataset.cordLength;picker.open=false;picker.querySelector('summary').focus();render();});
  picker.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();picker.open=false;picker.querySelector('summary').focus();}});
  document.addEventListener('pointerdown',event=>{if(picker.open&&!picker.contains(event.target))picker.open=false;});
  const css=getComputedStyle(document.documentElement);
  const ink=css.getPropertyValue('--ink').trim(), muted=css.getPropertyValue('--muted').trim(), gold=css.getPropertyValue('--accent').trim(), blue=css.getPropertyValue('--chart-blue').trim(), grid=css.getPropertyValue('--line').trim();
  const scale=[[0,blue],[.5,ink],[1,gold]];
  const axis=(title,range)=>({title:{text:title,font:{size:12}},range,color:muted,gridcolor:grid,zeroline:false,showbackground:false,tickfont:{size:11}});
  async function render(reset=false){
   cordCurrent.textContent=filter.value==='all'?'All lengths':filter.value+' m';
   for(const option of cordOptions.querySelectorAll('button'))option.setAttribute('aria-pressed',String(option.dataset.cordLength===filter.value));
   const selected=filter.value==='all'?rows:rows.filter(r=>r[0]===Number(filter.value));
   modes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chartMode===mode)));
   document.getElementById('data-count').textContent=`${selected.length} / ${rows.length} measured drops`;
   document.getElementById('data-help').textContent=mode==='3d'?'Drag to orbit · Scroll or pinch to zoom · Select a point for details':'Drag to zoom · Double-click to reset · Select a point for details';
   const trace={type:mode==='3d'?'scatter3d':'scatter',mode:'markers',x:selected.map(r=>r[1]*1000),y:selected.map(r=>mode==='3d'?r[0]:r[2]),customdata:selected,
    marker:{size:mode==='3d'?6:10,opacity:1,color:selected.map(r=>r[0]),colorscale:scale,cmin:1,cmax:6,showscale:true,line:{color:ink,width:.5},colorbar:{title:{text:'Cord (m)',font:{size:11}},tickfont:{size:10},thickness:8,len:.65,x:1}},
    hovertemplate:'Mass: %{customdata[1]:.4f} kg<br>Cord: %{customdata[0]} m<br>Stretched: %{customdata[2]:.3f} m<extra></extra>'};
   if(mode==='3d')trace.z=selected.map(r=>r[2]);
   const layout={paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial, sans-serif',color:ink},showlegend:false,margin:{l:mode==='3d'?(chart.clientWidth<600?25:0):60,r:35,t:15,b:mode==='3d'?35:55},uirevision:reset?Date.now():mode,
    scene:{xaxis:axis('Mass (g)',[50,650]),yaxis:axis('Cord length (m)',[.5,6.5]),zaxis:axis('Stretched length (m)',[3.5,9.2]),bgcolor:'rgba(0,0,0,0)',aspectmode:'manual',aspectratio:{x:1.15,y:1.15,z:.9},camera:{eye:chart.clientWidth<600?{x:2.8,y:2.8,z:2}:{x:1.3,y:1.3,z:1.05}}},
    xaxis:axis('Mass (g)',[50,650]),yaxis:axis('Stretched length (m)',[3.5,9.2]),hoverlabel:{bgcolor:css.getPropertyValue('--dark').trim(),font:{color:ink}}};
   await Plotly.react(chart,[trace],layout,{responsive:true,displayModeBar:false,scrollZoom:true});
   readout.textContent='Select a point to inspect its measurement.';
  }
  chart.replaceChildren();
  await render();
  chart.on('plotly_click',event=>{const r=event.points[0].customdata;readout.textContent=`${Number((r[1]*1000).toFixed(2))} g mass · ${r[0]} m cord · ${r[2]} m stretched`;});
  modes.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.chartMode;render(true);}));
  document.getElementById('data-reset').addEventListener('click',()=>{filter.value='all';picker.open=false;render(true);});
  new ResizeObserver(()=>Plotly.Plots.resize(chart)).observe(chart);
 } catch(error){chart.textContent='The interactive chart could not load. You can still view all measurements below or download the CSV.';console.error(error);}
})();

