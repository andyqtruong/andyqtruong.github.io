const button=document.querySelector('.menu-toggle');
const navigation=document.getElementById('site-navigation');
const main=document.querySelector('main');
const scrim=document.createElement('div');
scrim.className='nav-scrim';
scrim.setAttribute('aria-hidden','true');
document.body.append(scrim);
navigation.hidden=false;
navigation.inert=true;
navigation.setAttribute('aria-hidden','true');
document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
function setMenu(open){
 button.setAttribute('aria-expanded',String(open));
 button.setAttribute('aria-label',open?'Close navigation':'Open navigation');
 navigation.inert=!open;
 navigation.setAttribute('aria-hidden',String(!open));
 document.body.classList.toggle('nav-open',open);
 navigation.classList.toggle('is-open',open);
 document.body.style.overflow=open?'hidden':'';
 main.inert=open;
 if(open)navigation.querySelector('nav a').focus();
}
button.addEventListener('click',()=>setMenu(button.getAttribute('aria-expanded')!=='true'));
navigation.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
scrim.addEventListener('click',()=>{setMenu(false);button.focus();});
document.addEventListener('keydown',event=>{
 if(button.getAttribute('aria-expanded')!=='true')return;
 if(event.key==='Escape'){setMenu(false);button.focus();}
 if(event.key==='Tab'){
  const items=[document.querySelector('.mobile-bar .brand-mark'),button,...navigation.querySelectorAll('nav a,.sidebar-footer a')];
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
