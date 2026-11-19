// Mi Grupo - PWA de jefe de grupo. La URL del Web App se guarda en Ajustes (localStorage), nunca en el código.
const FIXED=['No. Control','Apellido Paterno','Apellido Materno','Nombres','Teléfono','Correo'];
const MES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const store=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let cfg=load('cfg',{url:'',token:''}),data=load('data',{headers:[...FIXED],rows:[]}),queue=load('queue',[]);
let tab='pase',q='',idx=0,att={},openCol=null,syncing=false;

const hoy=()=>{const d=new Date();return d.getDate()+'/'+MES[d.getMonth()]};
const name=r=>`${r[3]} ${r[1]} ${r[2]}`.replace(/\s+/g,' ').trim();
const ini=r=>((r[3]||'?')[0]+(r[1]||'')[0]).toUpperCase();
const isDate=h=>/^\d{1,2}\/[A-Za-z]{3}$/.test(h);
const extras=()=>data.headers.slice(6).filter(h=>!isDate(h));
const faltas=r=>r.slice(6).filter(v=>v==='F').length;
const empty=t=>`<p class="p-8 text-center text-slate-500">${t}</p>`;
const match=r=>norm(r.slice(0,4).join(' ')).includes(norm(q));
function toast(t){const e=$('#t');e.textContent=t;e.hidden=false;clearTimeout(toast.k);toast.k=setTimeout(()=>e.hidden=true,2200)}

// ---------- Datos locales + cola offline ----------
function apply(o){
  const h=data.headers,R=data.rows,f=c=>R.findIndex(r=>r[0]==c);
  const addCol=n=>{h.push(n);R.forEach(r=>r.push(''));return h.length-1};
  if(o.a==='add')R.push([...o.s,...Array(Math.max(0,h.length-6)).fill('')]);
  if(o.a==='update'){const i=f(o.c);if(i>-1)R[i].splice(0,6,...o.s)}
  if(o.a==='delete'){const i=f(o.c);if(i>-1)R.splice(i,1)}
  if(o.a==='addCol'&&!h.includes(o.col))addCol(o.col);
  if(o.a==='delCol'){const i=h.indexOf(o.col);if(i>5){h.splice(i,1);R.forEach(r=>r.splice(i,1))}}
  if(o.a==='setVals'){let i=h.indexOf(o.col);if(i<0)i=addCol(o.col);R.forEach(r=>{if(r[0] in o.v)r[i]=o.v[r[0]]})}
}
function act(o){apply(o);queue.push(o);store('data',data);store('queue',queue);render();flush()}
const post=o=>fetch(cfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...o,token:cfg.token})}).then(r=>r.json());
async function flush(){
  if(syncing||!queue.length||!cfg.url||!navigator.onLine)return;
  syncing=true;badge();
  try{
    while(queue.length){
      const r=await post(queue[0]);
      if(r.error==='token'){toast('Token incorrecto');throw 0}
      if(!r.ok)toast('Servidor: '+r.error);
      queue.shift();store('queue',queue);
    }
    syncing=false;await pull();
  }catch(_){}
  syncing=false;badge();
}
async function pull(){
  if(!cfg.url||queue.length||!navigator.onLine)return;
  try{const r=await(await fetch(cfg.url+'?action=list&token='+encodeURIComponent(cfg.token))).json();
    if(r.ok){data=r.data;store('data',data);render()}else toast(r.error==='token'?'Token incorrecto':r.error)}catch(_){}
}

// ---------- Vistas ----------
const strike=r=>{const n=faltas(r);return n>3?`<p class="mt-4 inline-block rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium">⚠ ${n} faltas · riesgo de perder derecho a examen</p>`:`<p class="mt-4 text-sm text-slate-500">${n} falta${n==1?'':'s'}</p>`};
function vPase(){
  const R=data.rows;if(!R.length)return empty('Agrega alumnos en la pestaña Alumnos.');
  if(idx>=R.length)return vFin();
  const r=R[idx];
  return `<div class="p-4 space-y-4">
    <div class="h-1.5 bg-slate-200 rounded"><div class="h-full bg-blue-700 rounded" style="width:${idx/R.length*100}%"></div></div>
    <p class="text-sm text-slate-500">${idx+1} de ${R.length} · ${hoy()}</p>
    <div class="bg-white rounded-3xl p-8 text-center border border-slate-200">
      <div class="mx-auto w-28 h-28 rounded-full bg-[#14213D] text-white text-4xl font-semibold grid place-items-center">${esc(ini(r))}</div>
      <h2 class="mt-5 text-2xl font-semibold leading-tight">${esc(name(r))}</h2>
      <p class="text-slate-500 mt-1">${esc(r[0])}</p>${strike(r)}</div>
    <div class="grid grid-cols-2 gap-3">
      <button data-a="mark" data-v="F" class="py-10 rounded-2xl bg-red-600 text-white text-xl font-semibold active:scale-95">Falta</button>
      <button data-a="mark" data-v="P" class="py-10 rounded-2xl bg-green-600 text-white text-xl font-semibold active:scale-95">Presente</button></div>
    <div class="flex justify-between text-sm text-blue-700"><button data-a="back">Atrás</button><button data-a="copy">Copiar reporte de hoy</button></div></div>`;
}
function vFin(){
  const v=Object.values(att),f=v.filter(x=>x==='F').length,b='w-full py-4 rounded-2xl font-medium ';
  return `<div class="p-6 space-y-3 text-center"><h2 class="text-2xl font-semibold">Pase terminado</h2>
    <p class="text-slate-600 pb-2">${v.length-f} presentes · ${f} faltas</p>
    <button data-a="save" class="${b}bg-blue-700 text-white">Guardar en la hoja (${hoy()})</button>
    <button data-a="copy" class="${b}bg-green-600 text-white">Copiar reporte de hoy</button>
    <button data-a="back" class="${b}bg-white border border-slate-300">Corregir el último</button>
    <button data-a="again" class="${b}text-slate-500">Nuevo pase</button></div>`;
}
function vAlum(){
  const L=data.rows.filter(match),btn='px-3 py-2 rounded-lg text-sm ';
  return `<div class="p-4 space-y-2">${L.map(r=>{const n=faltas(r);return `<div class="bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-2">
    <div class="flex-1 min-w-0"><p class="font-medium truncate">${esc(name(r))}</p><p class="text-sm text-slate-500">${esc(r[0])}${r[4]?' · '+esc(r[4]):''}</p>
    <p class="text-sm ${n>3?'text-red-600 font-medium':'text-slate-500'}">${n>3?'⚠ ':''}${n} falta${n==1?'':'s'}</p></div>
    <button data-a="edit" data-v="${esc(r[0])}" class="${btn}bg-slate-100">Editar</button>
    <button data-a="del" data-v="${esc(r[0])}" class="${btn}bg-red-50 text-red-700">Eliminar</button></div>`}).join('')||empty('Sin resultados.')}</div>
    <button data-a="add" class="fixed right-4 bottom-24 rounded-full bg-blue-700 text-white px-5 py-3 shadow-lg font-medium">Agregar alumno</button>`;
}
function vExtra(){
  if(openCol){const i=data.headers.indexOf(openCol);
    return `<div class="p-4 space-y-2"><button data-a="closeCol" class="text-blue-700 text-sm">‹ Columnas</button><h2 class="text-lg font-semibold">${esc(openCol)}</h2>
    ${data.rows.filter(match).map(r=>{const on=r[i]==='Sí';return `<button data-a="tog" data-v="${esc(r[0])}" class="w-full flex justify-between items-center rounded-2xl p-4 border ${on?'bg-green-50 border-green-300':'bg-white border-slate-200'}"><span class="text-left">${esc(name(r))}</span><span class="font-semibold ${on?'text-green-700':'text-slate-400'}">${on?'✔ Listo':'Pendiente'}</span></button>`}).join('')}</div>`}
  return `<div class="p-4 space-y-3"><div class="flex gap-2"><input id="nc" placeholder="Ej. Cuota Taller $50" class="flex-1 rounded-xl border border-slate-300 px-3 py-3 text-base"><button data-a="addCol" class="rounded-xl bg-blue-700 text-white px-4 font-medium">Crear</button></div>
  ${extras().map(c=>{const i=data.headers.indexOf(c),n=data.rows.filter(r=>r[i]==='Sí').length;return `<div class="bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-2"><div class="flex-1"><p class="font-medium">${esc(c)}</p><p class="text-sm text-slate-500">${n} de ${data.rows.length} listos</p></div>
  <button data-a="openCol" data-v="${esc(c)}" class="px-3 py-2 rounded-lg bg-slate-100 text-sm">Abrir</button><button data-a="delCol" data-v="${esc(c)}" class="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">Borrar</button></div>`}).join('')||empty('Aún no hay columnas. Crea una arriba.')}</div>`;
}
function vCfg(){
  const i='w-full rounded-xl border border-slate-300 px-3 py-3 text-base mt-1';
  return `<div class="p-4 space-y-3"><label class="block text-sm">URL del Web App de Apps Script<input id="u" value="${esc(cfg.url)}" placeholder="https://script.google.com/macros/s/.../exec" class="${i}"></label>
  <label class="block text-sm">Token (opcional, el mismo de Code.gs)<input id="tk" value="${esc(cfg.token)}" class="${i}"></label>
  <button data-a="cfg" class="w-full py-3 rounded-xl bg-blue-700 text-white font-medium">Guardar y sincronizar</button>
  <button data-a="sync" class="w-full py-3 rounded-xl bg-white border border-slate-300">Sincronizar ahora (${queue.length} pendientes)</button>
  <p class="text-xs text-slate-500">Estos datos solo se guardan en este dispositivo.</p></div>`;
}
function modal(r){
  const m=$('#m');
  m.innerHTML=`<form id="f" class="p-5 space-y-3"><h3 class="text-lg font-semibold">${r?'Editar alumno':'Agregar alumno'}</h3>
  ${FIXED.map((h,i)=>`<label class="block text-sm">${h}<input name="${i}" value="${esc(r?r[i]:'')}" ${i==0?'required':''} ${i==0&&r?'readonly':''} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base"></label>`).join('')}
  <div class="flex gap-2 pt-2"><button type="button" id="x" class="flex-1 py-3 rounded-xl bg-slate-100">Cancelar</button><button class="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium">Guardar</button></div></form>`;
  m.showModal();$('#x').onclick=()=>m.close();
  $('#f').onsubmit=e=>{e.preventDefault();
    const s=FIXED.map((_,i)=>e.target.elements[i].value.trim());
    if(!r&&data.rows.some(x=>x[0]==s[0]))return toast('Ese No. Control ya existe');
    act({a:r?'update':'add',c:s[0],s});m.close()};
}
function reporte(){
  const R=data.rows,h=data.headers.indexOf(hoy());
  const l=Object.keys(att).length?R.filter(r=>att[r[0]]==='F'):h<0?[]:R.filter(r=>r[h]==='F');
  return `📌 *Reporte de Asistencia - ${hoy()}*\nAlumnos con falta:\n`+(l.length?l.map(r=>'- '+name(r)).join('\n'):'- Ninguno');
}
function badge(){
  const n=queue.length,on=navigator.onLine,b=$('#bd');
  b.textContent=!cfg.url?'Configura Ajustes':n?`Sincronización pendiente (${n})`:on?'Sincronizado':'Sin conexión';
  b.className='text-xs px-2 py-1 rounded-full '+(!cfg.url||n?'bg-amber-400 text-slate-900':on?'bg-green-500/25 text-green-200':'bg-slate-600');
}
function render(){
  $('#sb').hidden=!['alum','extra'].includes(tab);
  $('#main').innerHTML={pase:vPase,alum:vAlum,extra:vExtra,cfg:vCfg}[tab]();
  document.querySelectorAll('nav [data-a]').forEach(b=>b.classList.toggle('text-blue-700',b.dataset.v===tab));
  document.querySelectorAll('nav [data-a]').forEach(b=>b.classList.toggle('font-semibold',b.dataset.v===tab));
  badge();
}

// ---------- Eventos ----------
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,v=b.dataset.v,R=data.rows,row=c=>R.find(r=>r[0]==c);
  if(a==='tab'){tab=v;openCol=null;q='';$('#q').value=''}
  else if(a==='mark'){att[R[idx][0]]=v;idx++}
  else if(a==='back'){if(idx>0)idx--}
  else if(a==='save'){if(Object.keys(att).length){act({a:'setVals',col:hoy(),v:{...att}});toast('Asistencia guardada')}}
  else if(a==='again'){att={};idx=0}
  else if(a==='copy'){try{await navigator.clipboard.writeText(reporte());toast('Reporte copiado')}catch{toast('No se pudo copiar')}}
  else if(a==='add')return modal();
  else if(a==='edit')return modal(row(v));
  else if(a==='del'){if(confirm('¿Eliminar a '+name(row(v))+'?'))act({a:'delete',c:v})}
  else if(a==='addCol'){const n=$('#nc').value.trim();if(n&&!data.headers.includes(n))act({a:'addCol',col:n})}
  else if(a==='delCol'){if(confirm(`¿Borrar la columna "${v}" también de Google Sheets? No se puede deshacer.`))act({a:'delCol',col:v})}
  else if(a==='openCol')openCol=v;
  else if(a==='closeCol')openCol=null;
  else if(a==='tog'){const i=data.headers.indexOf(openCol);act({a:'setVals',col:openCol,v:{[v]:row(v)[i]==='Sí'?'':'Sí'}})}
  else if(a==='cfg'){cfg={url:$('#u').value.trim(),token:$('#tk').value.trim()};store('cfg',cfg);toast('Guardado');await flush();await pull()}
  else if(a==='sync'){await flush();await pull()}
  render();
});
$('#q').addEventListener('input',e=>{q=e.target.value;render()});
addEventListener('online',()=>{badge();flush()});addEventListener('offline',badge);
render();flush().then(pull);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
