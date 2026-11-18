(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let chapter=0, audioCtx=null, musicOn=false, sfxOn=true, musicTimer=null;
  const sections=$$('.chapter'), dots=$$('.chapter-dot'), fxLayer=$('#fxLayer');

  function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); }
  const tones={number:[330,.035,'sine'], '+':[523,.09,'triangle'], '-':[392,.09,'triangle'], '*':[659,.09,'triangle'], '/':[440,.09,'triangle'], equals:[784,.14,'sine'], clear:[220,.1,'square'], backspace:[277,.06,'sine'], success:[1046,.25,'sine']};
  function sound(type){ if(!sfxOn)return; ensureAudio(); const [freq,dur,wave]=tones[type]||tones.number; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(.055,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur); }
  function startMusic(){ ensureAudio(); stopMusic(); musicOn=true; $('#musicToggle').textContent='♫ On'; $('#musicToggle').setAttribute('aria-pressed','true'); $('#musicToggle').setAttribute('aria-label','Turn background music off'); const notes=[261.63,329.63,392,493.88,440,392,329.63,293.66];let i=0;musicTimer=setInterval(()=>{if(!musicOn)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=notes[i++%notes.length]/2;g.gain.setValueAtTime(.018,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+1.7);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+1.8)},850); }
  function stopMusic(){musicOn=false;clearInterval(musicTimer);musicTimer=null;const b=$('#musicToggle');b.textContent='♫ Off';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Turn background music on')}

  function goTo(n){chapter=Math.max(0,Math.min(4,n));sections.forEach((s,i)=>{s.classList.toggle('active',i===chapter);s.setAttribute('aria-hidden',i!==chapter)});dots.forEach((d,i)=>{d.classList.toggle('active',i===chapter);i===chapter?d.setAttribute('aria-current','step'):d.removeAttribute('aria-current')});sections[chapter].scrollTop=0;sections[chapter].querySelector('h2')?.focus?.({preventScroll:true}); if(chapter===3) drawGalaxy();}
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>goTo(chapter+1)));$$('[data-prev]').forEach(b=>b.addEventListener('click',()=>goTo(chapter-1)));dots.forEach(b=>b.addEventListener('click',()=>goTo(+b.dataset.go)));
  function restart(){goTo(0);$('#opening').classList.remove('hidden');$('#beginStory').focus();closeSurprise();}
  $('#restartStory').addEventListener('click',restart);$('#finishStory').addEventListener('click',restart);
  $('#beginStory').addEventListener('click',()=>{$('#opening').classList.add('hidden');ensureAudio();goTo(0);setTimeout(()=>$('#chapter1').focus(),600)});
  $('#musicToggle').addEventListener('click',()=>musicOn?stopMusic():startMusic());
  $('#sfxToggle').addEventListener('click',e=>{sfxOn=!sfxOn;e.currentTarget.textContent=sfxOn?'SFX On':'SFX Off';e.currentTarget.setAttribute('aria-pressed',String(sfxOn));e.currentTarget.setAttribute('aria-label',sfxOn?'Turn interaction sounds off':'Turn interaction sounds on')});

  $('#envelope').addEventListener('click',e=>{if(e.target.closest('[contenteditable=true]'))return;const open=e.currentTarget.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.setAttribute('aria-label',open?'Close secret letter':'Open secret letter');sound(open?'success':'backspace');if(open)spawnFx(15,['❤','✦'])});
  $('#flower').addEventListener('click',e=>{const bloomed=e.currentTarget.classList.toggle('bloomed');e.currentTarget.setAttribute('aria-pressed',String(bloomed));$('#flowerMessage').classList.toggle('show',bloomed);sound(bloomed?'success':'backspace');if(bloomed)spawnFx(30,['🌸','✦','·'])});
  $$('.star').forEach(star=>star.addEventListener('click',()=>{$('#starMessage').textContent=star.dataset.message;star.classList.add('chosen');sound('number');spawnFx(7,['✦','·'])}));

  function spawnFx(count,symbols=['✦']){if(reduceMotion)return;for(let i=0;i<count;i++){const e=document.createElement('span');e.className='fx';e.textContent=symbols[Math.floor(Math.random()*symbols.length)];e.style.setProperty('--x',Math.random()*100+'%');e.style.setProperty('--t',(1.8+Math.random()*2.7)+'s');e.style.setProperty('--s',(12+Math.random()*22)+'px');e.style.color=['#ff83b5','#ffd083','#c295ff','#fff'][i%4];fxLayer.append(e);setTimeout(()=>e.remove(),4700)}}

  // Calculator
  let current='0', previous=null, operator=null, waiting=false, expression=''; const display=$('#display'), expr=$('#expression'), status=$('#calcStatus'), history=$('#history');
  function render(){display.textContent=current;expr.textContent=expression||'Ready'}
  function inputNumber(n){sound('number');if(waiting){current=n==='.'?'0.':n;waiting=false}else if(n==='.'&&!current.includes('.'))current+='.';else if(n!=='.')current=current==='0'?n:current+n;if(current.length>14)current=current.slice(0,14);render()}
  function selectOperator(op){sound(op);const value=Number(current);if(!Number.isFinite(value))return reset('Invalid number');if(previous!==null&&!waiting)calculate(false);previous=Number(current);operator=op;waiting=true;expression=`${format(previous)} ${symbol(op)}`;render()}
  function symbol(op){return ({'*':'×','/':'÷','+':'+','-':'−'})[op]||op}
  function format(n){return Number.isInteger(n)?String(n):String(Number(n.toFixed(10)))}
  function calculate(show=true){if(operator===null||previous===null)return;const a=previous,b=Number(current);let result; if(operator==='/'&&b===0){reset('Cannot divide by zero');return}if(operator==='+')result=a+b;if(operator==='-')result=a-b;if(operator==='*')result=a*b;if(operator==='/')result=a/b;if(!Number.isFinite(result)){reset('Calculation error');return}const equation=`${format(a)} ${symbol(operator)} ${format(b)} = ${format(result)}`;current=format(result);expression=equation;previous=null;operator=null;waiting=true;addHistory(equation);render();if(show)animateResult(result)}
  function animateResult(result){sound('equals');display.classList.remove('rise');void display.offsetWidth;display.classList.add('rise');status.textContent='SUCCESS ✦';spawnFx(22,['✦','·']);if(result===143)setTimeout(openSurprise,450);else setTimeout(()=>status.textContent='Beautifully calculated',900)}
  function clear(){sound('clear');current='0';previous=null;operator=null;waiting=false;expression='';status.textContent='Cleared';render()}
  function reset(msg){current='0';previous=null;operator=null;waiting=false;expression='';status.textContent=msg;render()}
  function backspace(){sound('backspace');if(waiting)return;current=current.length>1?current.slice(0,-1):'0';render()}
  function percent(){sound('number');current=format(Number(current)/100);render()}
  function addHistory(text){if(history.children.length===1&&history.firstElementChild.textContent==='No calculations yet.')history.innerHTML='';const li=document.createElement('li');li.textContent=text;history.prepend(li);while(history.children.length>10)history.lastElementChild.remove()}
  $$('.key').forEach(key=>key.addEventListener('click',()=>{if(key.dataset.num!==undefined)inputNumber(key.dataset.num);else if(key.dataset.op)selectOperator(key.dataset.op);else ({equals:()=>calculate(),clear,backspace,percent}[key.dataset.action]||(()=>{}))()}));
  $('#calcSound').addEventListener('click',e=>{sfxOn=!sfxOn;e.currentTarget.textContent=sfxOn?'Sound on':'Sound off';e.currentTarget.setAttribute('aria-pressed',String(sfxOn));$('#sfxToggle').textContent=sfxOn?'SFX On':'SFX Off';$('#sfxToggle').setAttribute('aria-pressed',String(sfxOn))});
  addEventListener('keydown',e=>{if($('#opening:not(.hidden)')||!$('#chapter5').classList.contains('active')||!$('#surprise').hidden)return;if(/^[0-9.]$/.test(e.key)){inputNumber(e.key);e.preventDefault()}else if(['+','-','*','/'].includes(e.key)){selectOperator(e.key);e.preventDefault()}else if(e.key==='Enter'||e.key==='='){calculate();e.preventDefault()}else if(e.key==='Backspace'){backspace();e.preventDefault()}else if(e.key==='Escape'){clear();e.preventDefault()}else if(e.key==='%'){percent();e.preventDefault()}});

  function openSurprise(){sound('success');const s=$('#surprise');s.hidden=false;document.body.style.overflow='hidden';spawnFx(70,['❤','🌹','✦','●']);drawSurprise();$('#closeSurprise').focus()}
  function closeSurprise(){const s=$('#surprise');if(s.hidden)return;s.hidden=true;document.body.style.overflow='hidden';$('#display').focus?.()}
  $('#closeSurprise').addEventListener('click',closeSurprise);$('#closeSurpriseButton').addEventListener('click',closeSurprise);$('#surprise').addEventListener('click',e=>{if(e.target===$('#surprise'))closeSurprise()});

  function setupCanvas(canvas){const dpr=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w:rect.width,h:rect.height}}
  function drawAmbient(){const c=$('#ambientCanvas'),{ctx,w,h}=setupCanvas(c);const dots=Array.from({length:55},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+.3,a:Math.random()*.5+.15}));ctx.clearRect(0,0,w,h);dots.forEach(p=>{ctx.fillStyle=`rgba(255,198,223,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()})}
  function drawGalaxy(){const c=$('#galaxyCanvas'),{ctx,w,h}=setupCanvas(c);const g=ctx.createRadialGradient(w*.53,h*.42,10,w*.5,h*.5,Math.max(w,h)*.65);g.addColorStop(0,'#502a70');g.addColorStop(.35,'#19113d');g.addColorStop(1,'#04030e');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(let i=0;i<180;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.75+.2})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*1.4+.2,0,7);ctx.fill()}}
  function drawSurprise(){const c=$('#surpriseCanvas'),{ctx,w,h}=setupCanvas(c);ctx.clearRect(0,0,w,h);for(let i=0;i<100;i++){ctx.fillStyle=['#ff6fa8','#cd8cff','#ffd079','#fff'][i%4];ctx.globalAlpha=.8;ctx.fillRect(Math.random()*w,Math.random()*h,3+Math.random()*5,3+Math.random()*8)}ctx.globalAlpha=1}
  addEventListener('resize',()=>{drawAmbient();if(chapter===3)drawGalaxy();if(!$('#surprise').hidden)drawSurprise()});
  document.addEventListener('input',e=>{if(e.target.matches('[contenteditable=true]')){try{localStorage.setItem('snehitha-'+(e.target.id||e.target.closest('.memory-card')?.querySelector('.memory-year')?.textContent+e.target.tagName),e.target.textContent)}catch(_){}}});
  render();drawAmbient();goTo(0);
})();