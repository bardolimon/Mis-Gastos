(() => {
// ---------- Catálogo ----------
const CATS = [
  {id:"comida", n:"Comida fuera", c:"--c1", ab:"CO", kw:["taco","tacos","comida","restaurante","cafe","café","starbucks","burrito","pizza","hamburguesa","lonche","desayuno","cena","almuerzo","sushi","birria","carne asada","mariscos","tortas","antojo","elote","helado","nieve","oxxo","didi food","uber eats","rappi"]},
  {id:"super", n:"Súper y despensa", c:"--c2", ab:"SU", kw:["super","súper","walmart","soriana","ley","costco","calimax","smart","sams","sam's","despensa","mandado","bodega","chedraui","heb","frutas","verdura","tortillas"]},
  {id:"educacion", n:"Colegiaturas y escuela", c:"--c3", ab:"ED", kw:["colegiatura","escuela","cetys","prepa","inscripcion","inscripción","libro","libros","utiles","útiles","uniforme","curso","examen","pianse","piense"]},
  {id:"transporte", n:"Gasolina y auto", c:"--c4", ab:"AU", kw:["gasolina","gas station","pemex","uber","didi","estacionamiento","taller","llanta","carro","auto","caseta","verificacion","verificación","lavado","aceite","seguro auto"]},
  {id:"hogar", n:"Casa y servicios", c:"--c5", ab:"CA", kw:["luz","cfe","agua","cespm","internet","renta","hipoteca","telmex","izzi","totalplay","gas","telefono","teléfono","celular","telcel","att","at&t","limpieza","ferreteria","ferretería","home depot","mueble"]},
  {id:"salud", n:"Salud", c:"--c6", ab:"SA", kw:["farmacia","doctor","medico","médico","medicina","dentista","consulta","laboratorio","similares","guadalajara","benavides","lentes","gym","gimnasio"]},
  {id:"apps", n:"Apps, IA y canales", c:"--c7", ab:"IA", kw:["netflix","spotify","youtube","elevenlabs","suno","chatgpt","claude","midjourney","google one","icloud","apple","canva","capcut","adobe","suscripcion","suscripción","metricool","envato","flow","veo","kling","runway","dominio","hosting"]},
  {id:"ocio", n:"Salidas y ocio", c:"--c8", ab:"OC", kw:["cine","cinepolis","cinépolis","bar","concierto","boletos","salida","paseo","viaje","hotel","juego","fiesta","cerveza"]},
  {id:"personal", n:"Ropa y personal", c:"--c9", ab:"PE", kw:["ropa","zapatos","tenis","corte","peluqueria","peluquería","barberia","barbería","perfume","amazon","mercado libre","liverpool","coppel"]},
  {id:"donativos", n:"Regalos y donativos", c:"--c10", ab:"RG", kw:["regalo","limosna","ofrenda","donativo","diezmo","cumpleaños","misa","parroquia"]},
  {id:"otros", n:"Otros", c:"--c10", ab:"OT", kw:[]}
];
const CAT = Object.fromEntries(CATS.map(c=>[c.id,c]));
const METODOS = [{id:"efectivo",n:"Efectivo"},{id:"debito",n:"Débito"},{id:"credito",n:"Crédito"}];
const DEF_AJ = {presupuestos:{}, recurrentes:[
  {id:"r1",nombre:"Colegiatura",monto:0,cat:"educacion",dia:5},
  {id:"r2",nombre:"Luz (CFE)",monto:0,cat:"hogar",dia:15},
  {id:"r3",nombre:"Internet",monto:0,cat:"hogar",dia:10}
], hormiga:150};

// ---------- Utilidades ----------
const $ = s => document.querySelector(s);
const fmt = new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"});
const fmt0 = new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0});
const money = v => fmt.format(v||0);
const money0 = v => fmt0.format(Math.round(v||0));
const esc = s => String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const pad = n => String(n).padStart(2,"0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const ym = s => s.slice(0,7);
const daysIn = (y,m) => new Date(y,m,0).getDate();
const monthName = (y,m) => { const t=new Date(y,m-1,1).toLocaleDateString("es-MX",{month:"long",year:"numeric"}); return t.charAt(0).toUpperCase()+t.slice(1); };
const cssVar = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const uid = () => "g" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");

function toast(msg){
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(),2400);
}

// Interpreta "tacos 120", "$1,250 colegiatura efectivo", "ayer gasolina 600"
function parseQuick(text){
  const out={monto:null,cat:null,nota:"",metodo:null,fecha:today()};
  let t=" "+text.trim()+" ";
  const m=t.match(/\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/);
  if(m){ out.monto=parseFloat(m[1].replace(/,/g,"")+(m[2]?"."+m[2]:"")); t=t.replace(m[0]," "); }
  const n=norm(t);
  if(/\b(efectivo|cash)\b/.test(n)){out.metodo="efectivo";t=t.replace(/\befectivo\b|\bcash\b/i," ");}
  else if(/\b(credito|tdc)\b/.test(n)){out.metodo="credito";t=t.replace(/\bcr[eé]dito\b|\btdc\b/i," ");}
  else if(/\b(debito|tarjeta)\b/.test(n)){out.metodo="debito";t=t.replace(/\bd[eé]bito\b|\btarjeta\b/i," ");}
  if(/\bayer\b/.test(n)){const d=new Date();d.setDate(d.getDate()-1);out.fecha=ymd(d);t=t.replace(/\bayer\b/i," ");}
  out.nota=t.replace(/\s+/g," ").trim();
  out.cat=guessCat(out.nota);
  return out;
}
function guessCat(txt){
  const n=" "+norm(txt)+" ";
  let best=null,len=0;
  for(const c of CATS) for(const k of c.kw){const kk=norm(k); if(n.includes(kk) && kk.length>len){best=c.id;len=kk.length;}}
  return best;
}

// ---------- Estado ----------
let gastos=[]; let aj=structuredClone(DEF_AJ);
let tab="inicio"; let cur=(()=>{const d=new Date();return {y:d.getFullYear(),m:d.getMonth()+1};})();
let filtro={q:"",cat:""}; let mode="local"; let col=null; let loaded=false;
const canImages=false;
try{const t=localStorage.getItem("mg_tab"); if(t) tab=t;}catch(e){}

// ---------- Datos de ejemplo (solo para mostrar, nunca se guardan) ----------
function demoData(){
  const d=new Date(), y=d.getFullYear(), m=d.getMonth()+1, last=Math.max(1,d.getDate());
  const rows=[[1,"educacion",3850,"Colegiatura"],[2,"super",1420,"Súper Calimax"],[2,"comida",120,"Tacos"],[3,"transporte",900,"Gasolina"],[4,"apps",399,"ElevenLabs"],[5,"comida",85,"Café"],[6,"hogar",780,"Luz CFE"],[7,"ocio",340,"Cine"],[8,"comida",210,"Birria"],[9,"super",960,"Costco"],[10,"apps",220,"Suno"],[11,"salud",450,"Farmacia"],[12,"comida",65,"Elote"],[13,"transporte",850,"Gasolina"],[14,"hogar",599,"Internet"],[15,"comida",140,"Tacos"],[16,"personal",520,"Corte y tenis"],[17,"comida",95,"Café"],[18,"super",1180,"Súper Ley"],[19,"donativos",200,"Ofrenda"],[20,"comida",160,"Tortas"],[21,"apps",380,"Google One"]];
  const prev=rows.map(([dd,c,v,n],i)=>({id:"dp"+i,fecha:`${m===1?y-1:y}-${pad(m===1?12:m-1)}-${pad(dd)}`,cat:c,monto:Math.round(v*0.9),nota:n,metodo:"debito"}));
  const now=rows.filter(r=>r[0]<=last).map(([dd,c,v,n],i)=>({id:"d"+i,fecha:`${y}-${pad(m)}-${pad(dd)}`,cat:c,monto:v,nota:n,metodo:i%3?"debito":"efectivo",trabajo:c==="apps"}));
  return {gastos:[...now,...prev], pres:{comida:1800,super:4000,transporte:2000,apps:900}};
}
const isDemo = () => loaded && gastos.length===0;
const data = () => isDemo()? demoData().gastos : gastos;
const presup = () => isDemo()? demoData().pres : (aj.presupuestos||{});

// ---------- Almacenamiento: caché local + Google Sheets ----------
let cfg=null, queue=[], hojaUrl="", syncing=false, syncErr="", lastSync=0;
try{cfg=JSON.parse(localStorage.getItem("mg_cfg")||"null");queue=JSON.parse(localStorage.getItem("mg_queue")||"[]");hojaUrl=localStorage.getItem("mg_hoja")||"";}catch(e){}
const b64dec = t => decodeURIComponent(escape(atob(t.replace(/-/g,"+").replace(/_/g,"/"))));
function parseConn(text){
  text=String(text||"").trim(); if(text.includes("c=")) text=text.split("c=")[1];
  try{const j=JSON.parse(b64dec(text)); if(j.u&&j.k) return {u:j.u,k:j.k};}catch(e){}
  return null;
}
function setCfg(c){cfg=c; try{localStorage.setItem("mg_cfg",JSON.stringify(cfg));}catch(e){}}
function saveQueue(){try{localStorage.setItem("mg_queue",JSON.stringify(queue));}catch(e){}}
function saveLocal(){try{localStorage.setItem("mg_gastos",JSON.stringify(gastos));localStorage.setItem("mg_aj",JSON.stringify(aj));localStorage.setItem("mg_hoja",hojaUrl);}catch(e){}}
function loadLocal(){try{gastos=JSON.parse(localStorage.getItem("mg_gastos")||"[]");const a=JSON.parse(localStorage.getItem("mg_aj")||"null");if(a)aj={...DEF_AJ,...a};}catch(e){gastos=[];}}
const toRow = g => ({id:g.id,fecha:g.fecha,monto:+g.monto,categoria:CAT[g.cat]?.n||"Otros",nota:g.nota||"",pago:METODOS.find(m=>m.id===g.metodo)?.n||"Débito",trabajo:!!g.trabajo,recId:g.recId||"",creado:g.creado||Date.now()});
const fromRow = r => ({id:String(r.id),fecha:String(r.fecha),monto:+r.monto||0,cat:(CATS.find(c=>c.n===r.categoria||c.id===r.categoria)||CAT.otros).id,nota:r.nota||"",metodo:(METODOS.find(m=>m.n===r.pago||m.id===r.pago)||METODOS[1]).id,trabajo:!!r.trabajo,recId:r.recId||"",creado:+r.creado||0});
function setStatus(){
  const s=$("#status");
  if(!cfg){s.className="status";s.innerHTML="<i></i>Solo en este dispositivo";return;}
  if(syncing){s.className="status";s.innerHTML="<i></i>Sincronizando…";return;}
  if(syncErr){s.className="status";s.innerHTML=`<i></i>${esc(syncErr)}${queue.length?` · ${queue.length} por subir`:""}`;return;}
  s.className="status on";s.innerHTML="<i></i>Guardado en tu hoja de Google";
}
function applyServer(j){
  let g=(j.gastos||[]).map(fromRow); let a=j.ajustes||{};
  for(const op of queue){
    if(op.op==="put"){const v=fromRow(op.g);const i=g.findIndex(x=>x.id===v.id); if(i>=0)g[i]=v; else g.push(v);}
    else if(op.op==="del") g=g.filter(x=>x.id!==op.id);
    else if(op.op==="aj") a=op.aj;
  }
  gastos=g; aj={...DEF_AJ,...a}; if(j.hoja) hojaUrl=j.hoja; saveLocal();
}
async function flush(){
  if(!cfg||syncing) return; syncing=true; setStatus();
  try{
    let res;
    if(queue.length){
      const ops=queue.slice();
      res=await fetch(cfg.u,{method:"POST",body:JSON.stringify({k:cfg.k,ops})});
      const j=await res.json(); if(!j.ok) throw new Error(j.error||"error");
      queue=queue.slice(ops.length); saveQueue(); applyServer(j);
    } else {
      res=await fetch(cfg.u+"?k="+encodeURIComponent(cfg.k)+"&t="+Date.now());
      const j=await res.json(); if(!j.ok) throw new Error(j.error||"error"); applyServer(j);
    }
    syncErr=""; lastSync=Date.now();
  }catch(e){ syncErr = e.message==="clave" ? "La clave de conexión no coincide" : "Sin conexión, se subirá después"; }
  syncing=false; setStatus(); render();
  if(queue.length && !syncErr) flush();
}
function enqueue(op){
  if(op.op==="aj") queue=queue.filter(x=>x.op!=="aj");
  queue.push(op); saveQueue(); saveLocal();
  if(cfg) flush();
}
async function putGasto(g){
  const clean={id:g.id,tipo:"gasto",monto:+g.monto,cat:g.cat,nota:g.nota||"",fecha:g.fecha,metodo:g.metodo||"debito",trabajo:!!g.trabajo,recId:g.recId||"",creado:g.creado||Date.now()};
  const i=gastos.findIndex(x=>x.id===g.id);
  if(i>=0) gastos[i]=clean; else gastos.push(clean);
  render(); enqueue({op:"put",g:toRow(clean)});
}
async function delGasto(id){
  gastos=gastos.filter(x=>x.id!==id); render(); enqueue({op:"del",id});
}
let ajTimer=null;
function saveAj(){ saveLocal(); clearTimeout(ajTimer); ajTimer=setTimeout(()=>enqueue({op:"aj",aj:JSON.parse(JSON.stringify(aj))}),500); }
function initStore(){
  const fromHash=parseConn(location.hash.includes("c=")?location.hash:"");
  if(fromHash) setCfg(fromHash);
  loadLocal(); loaded=true; setStatus(); render();
  if(cfg) flush();
  document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") flush(); });
  window.addEventListener("online",()=>flush());
}

// ---------- Cálculos ----------
function monthRows(y,m){const k=`${y}-${pad(m)}`;return data().filter(g=>ym(g.fecha)===k);}
function prevYM(y,m){return m===1?{y:y-1,m:12}:{y,m:m-1};}
function sum(a){return a.reduce((s,g)=>s+(+g.monto||0),0);}
function byCat(rows){const o={};for(const g of rows)o[g.cat]=(o[g.cat]||0)+(+g.monto||0);return Object.entries(o).sort((a,b)=>b[1]-a[1]);}
function isCurrentMonth(){const d=new Date();return cur.y===d.getFullYear()&&cur.m===d.getMonth()+1;}

// ---------- Render ----------
function render(){
  $("#mLabel").textContent=monthName(cur.y,cur.m);
  document.querySelectorAll("nav.tabs [data-tab]").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false"));
  const v=$("#view");
  if(!loaded){v.innerHTML=`<div class="card empty">Cargando tus gastos…</div>`;return;}
  v.innerHTML = tab==="inicio"?vInicio(): tab==="movs"?vMovs(): tab==="pres"?vPres(): vAjustes();
  bindView();
}

function demoBanner(){
  return isDemo()?`<div class="demo"><span><b>Datos de ejemplo.</b> Así se verá tu resumen. Desaparecen en cuanto registres tu primer gasto.</span><button class="btn small" data-act="add">Registrar mi primer gasto</button></div>`:"";
}

function vInicio(){
  const rows=monthRows(cur.y,cur.m), total=sum(rows);
  const p=prevYM(cur.y,cur.m); const prevRows=monthRows(p.y,p.m);
  const now=new Date(); const dim=daysIn(cur.y,cur.m);
  const dayCut=isCurrentMonth()?now.getDate():dim;
  const prevSame=sum(prevRows.filter(g=>+g.fecha.slice(8)<=dayCut));
  const delta=prevSame?((total-prevSame)/prevSame)*100:null;
  const pres=presup(); const presTotal=Object.values(pres).reduce((s,v)=>s+(+v||0),0);
  const presCats=Object.keys(pres).filter(k=>+pres[k]>0);
  const spentInBudget=sum(rows.filter(g=>presCats.includes(g.cat)));
  const pct=presTotal?Math.min(100,spentInBudget/presTotal*100):0;
  const left=presTotal-spentInBudget; const daysLeft=isCurrentMonth()?dim-now.getDate()+1:0;
  const [ent,dec]=fmt.format(total).split(".");
  let hero=`<section class="card hero">
    <div class="eyebrow">Gastado en ${esc(new Date(cur.y,cur.m-1,1).toLocaleDateString("es-MX",{month:"long"}))}</div>
    <div class="big num">${esc(ent)}<span class="cents">.${esc(dec||"00")}</span></div>
    <div class="hero-row">
      ${delta===null?`<span class="pill">Primer mes registrado</span>`:`<span class="pill ${delta>0?"up":"down"}">${delta>0?"▲":"▼"} ${Math.abs(delta).toFixed(0)}% vs ${esc(new Date(p.y,p.m-1,1).toLocaleDateString("es-MX",{month:"short"}))}${isCurrentMonth()?" al día "+dayCut:""}</span>`}
      <span class="pill">${rows.length} movimientos</span>
    </div>`;
  if(presTotal){
    hero+=`<div class="meter" role="img" aria-label="${pct.toFixed(0)}% del presupuesto usado"><i class="${left<0?"over":""}" style="width:${pct}%"></i></div>
    <div class="hero-foot num"><span><b>${money0(spentInBudget)}</b> de ${money0(presTotal)} presupuestados</span><span>${left>=0?money0(left)+" disponibles":money0(-left)+" excedido"}</span></div>`;
    if(isCurrentMonth()&&left>0) hero+=`<div class="safe">Puedes gastar <strong class="num">${money0(left/daysLeft)}</strong> al día en tus categorías con presupuesto durante los ${daysLeft} días que faltan.</div>`;
  } else hero+=`<div class="safe">Define presupuestos por categoría y aquí verás cuánto puedes gastar al día. <button class="btn small" data-tab-go="pres" style="margin-left:4px">Definir</button></div>`;
  hero+=`</section>`;

  const quick=`<form class="quick" id="quickForm" autocomplete="off"><input id="quickIn" placeholder="Escribe: tacos 120" aria-label="Registro rápido" enterkeyhint="done"><button class="btn" type="submit">Agregar</button></form>`;

  // Donut
  const bc=byCat(rows); let donut="";
  if(total>0){
    const R=60,C=2*Math.PI*R; let off=0;
    const arcs=bc.map(([c,v])=>{const len=v/total*C; const s=`<circle r="${R}" cx="75" cy="75" fill="none" stroke="var(${CAT[c]?.c||"--c10"})" stroke-width="20" stroke-dasharray="${Math.max(0,len-1.5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 75 75)"/>`; off+=len; return s;}).join("");
    const top=bc[0];
    donut=`<section class="card"><h2>¿En qué se va el dinero?<span class="sub">toca una categoría</span></h2>
    <div class="donut-wrap"><svg viewBox="0 0 150 150" role="img" aria-label="Distribución por categoría"><circle r="60" cx="75" cy="75" fill="none" stroke="var(--surface-2)" stroke-width="20"/>${arcs}
      <text x="75" y="70" text-anchor="middle" style="font:600 10px var(--body);fill:var(--muted)">Mayor gasto</text>
      <text x="75" y="88" text-anchor="middle" style="font:800 15px var(--display);fill:var(--ink)">${(top[1]/total*100).toFixed(0)}%</text></svg>
    <div class="legend">${bc.map(([c,v])=>`<button data-filter-cat="${c}"><span class="dot" style="background:var(${CAT[c]?.c||"--c10"})"></span><span class="nm">${esc(CAT[c]?.n||c)}</span><span class="v num"><b>${money0(v)}</b> · ${(v/total*100).toFixed(0)}%</span></button>`).join("")}</div></div></section>`;
  } else donut=`<section class="card empty">Aún no hay gastos en este mes.</section>`;

  // Barras diarias
  const daily=Array(dim).fill(0); rows.forEach(g=>daily[+g.fecha.slice(8)-1]+=+g.monto||0);
  const maxD=Math.max(1,...daily); const W=340,H=150,pb=18,pt=8; const bw=W/dim;
  const elapsed=isCurrentMonth()?now.getDate():dim; const avg=sum(rows)/Math.max(1,elapsed);
  const yAvg=H-pb-(avg/maxD)*(H-pb-pt);
  const bars=daily.map((v,i)=>{const h=(v/maxD)*(H-pb-pt);const isToday=isCurrentMonth()&&i===now.getDate()-1;return `<rect x="${i*bw+1}" y="${H-pb-h}" width="${Math.max(1,bw-2)}" height="${Math.max(v?2:0,h)}" rx="2" fill="${isToday?"var(--accent)":"var(--c2)"}" opacity="${i<elapsed?1:.25}"><title>${i+1}: ${money0(v)}</title></rect>`;}).join("");
  const ticks=[1,8,15,22,dim].map(d=>`<text x="${(d-.5)*bw}" y="${H-4}" text-anchor="middle">${d}</text>`).join("");
  const barsCard=`<section class="card"><h2>Día con día<span class="sub num">promedio ${money0(avg)}/día</span></h2>
    <svg class="bars" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gasto por día del mes">${bars}
    ${avg?`<line x1="0" x2="${W}" y1="${yAvg}" y2="${yAvg}" stroke="var(--accent)" stroke-dasharray="4 4" stroke-width="1.2"/>`:""}${ticks}</svg></section>`;

  // Insights
  const hormigaLim=+aj.hormiga||150; const hormiga=rows.filter(g=>+g.monto<=hormigaLim); const hTot=sum(hormiga);
  const biggest=[...rows].sort((a,b)=>b.monto-a.monto)[0];
  const weekend=sum(rows.filter(g=>{const d=new Date(g.fecha+"T12:00");return d.getDay()===0||d.getDay()===6;}));
  const trabajo=sum(rows.filter(g=>g.trabajo));
  const efectivo=sum(rows.filter(g=>g.metodo==="efectivo"));
  const ins=total?`<div class="insights">
    <div class="ins ${hTot>total*.12?"hot":""}"><span class="eyebrow">Gastos hormiga</span><span class="k num">${money0(hTot)}</span><p>${hormiga.length} compras de ${money0(hormigaLim)} o menos. Son el ${(hTot/total*100).toFixed(0)}% del mes.</p></div>
    <div class="ins"><span class="eyebrow">Gasto más grande</span><span class="k num">${money0(biggest?.monto)}</span><p>${esc(biggest?.nota||CAT[biggest?.cat]?.n||"")} · ${esc(CAT[biggest?.cat]?.n||"")}</p></div>
    <div class="ins"><span class="eyebrow">Fines de semana</span><span class="k num">${(weekend/total*100).toFixed(0)}%</span><p>${money0(weekend)} se fueron en sábado y domingo.</p></div>
    <div class="ins"><span class="eyebrow">Trabajo y canales</span><span class="k num">${money0(trabajo)}</span><p>Marcados como gasto de trabajo. Efectivo del mes: ${money0(efectivo)}.</p></div>
  </div>`:"";

  // Recurrentes pendientes
  const pend=(aj.recurrentes||[]).filter(r=>+r.monto>0 && !rows.some(g=>g.recId===r.id || (g.cat===r.cat && norm(g.nota||"").includes(norm(r.nombre).split(" ")[0]))));
  const recCard=!isDemo()&&isCurrentMonth()&&pend.length?`<section class="card"><h2>Pagos fijos pendientes<span class="sub">este mes</span></h2>
    ${pend.map(r=>`<div class="rec"><div class="ico" style="background:var(${CAT[r.cat]?.c})">${CAT[r.cat]?.ab}</div><div><b>${esc(r.nombre)}</b><small>Día ${r.dia} · ${money(r.monto)}</small></div><button class="btn small" data-rec="${r.id}">Registrar</button></div>`).join("")}</section>`:"";

  return connectCard()+demoBanner()+hero+quick+recCard+donut+barsCard+ins;
}

function vMovs(){
  let rows=monthRows(cur.y,cur.m);
  if(filtro.cat) rows=rows.filter(g=>g.cat===filtro.cat);
  if(filtro.q){const q=norm(filtro.q); rows=rows.filter(g=>norm((g.nota||"")+" "+(CAT[g.cat]?.n||"")).includes(q));}
  rows.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.creado||0)-(a.creado||0));
  const groups={}; rows.forEach(g=>(groups[g.fecha]=groups[g.fecha]||[]).push(g));
  const opts=`<option value="">Todas las categorías</option>`+CATS.map(c=>`<option value="${c.id}" ${filtro.cat===c.id?"selected":""}>${esc(c.n)}</option>`).join("");
  let html=demoBanner()+`<div class="filters"><input id="fq" type="search" placeholder="Buscar: tacos, gasolina…" value="${esc(filtro.q)}" aria-label="Buscar"><select id="fc" aria-label="Categoría">${opts}</select></div>`;
  if(filtro.cat||filtro.q) html+=`<div class="hint num">${rows.length} movimientos · ${money(sum(rows))}</div>`;
  if(!rows.length) return html+`<div class="card empty">No hay movimientos con ese filtro en este mes.</div>`;
  for(const [f,list] of Object.entries(groups)){
    const d=new Date(f+"T12:00");
    html+=`<div class="day"><div class="day-h"><span>${esc(d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"short"}))}</span><span class="num">${money(sum(list))}</span></div>`;
    html+=list.map(g=>`<button class="tx" data-edit="${g.id}"><div class="ico" style="background:var(${CAT[g.cat]?.c||"--c10"})">${CAT[g.cat]?.ab||"OT"}</div><div class="d"><b>${esc(g.nota||CAT[g.cat]?.n)}</b><small>${esc(CAT[g.cat]?.n||"")} · ${esc(METODOS.find(m=>m.id===g.metodo)?.n||"")}${g.trabajo?'<span class="tag">TRABAJO</span>':""}</small></div><div class="m num">${money(g.monto)}</div></button>`).join("");
    html+=`</div>`;
  }
  return html;
}

function vPres(){
  const rows=monthRows(cur.y,cur.m); const bc=Object.fromEntries(byCat(rows)); const pres=aj.presupuestos||{};
  const list=CATS.filter(c=>c.id!=="otros").map(c=>{
    const b=+pres[c.id]||0, s=bc[c.id]||0, p=b?s/b*100:0;
    const st=!b?"":p>=100?`<span class="state bad">Excedido</span>`:p>=80?`<span class="state warn">Cerca del límite</span>`:`<span class="state ok">Bien</span>`;
    return `<div class="brow"><div class="t"><span><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(${c.c});margin-right:6px"></span>${esc(c.n)} ${st}</span><span class="num">${money0(s)}${b?" / "+money0(b):""}</span></div>
    ${b?`<div class="track"><i style="width:${Math.min(100,p)}%;background:var(${p>=100?"--bad":p>=80?"--warn":c.c})"></i></div>`:""}
    <div class="field"><input inputmode="decimal" id="p_${c.id}" data-pres="${c.id}" placeholder="Sin presupuesto" value="${b||""}" aria-label="Presupuesto mensual para ${esc(c.n)}"></div></div>`;
  }).join("");
  const recs=(aj.recurrentes||[]).map((r,i)=>`<div class="rec" style="grid-template-columns:1fr auto"><div class="row2" style="grid-template-columns:1.4fr 1fr .6fr;gap:6px">
      <input class="r-in" id="rn_${r.id}" data-r="${i}" data-k="nombre" value="${esc(r.nombre)}" aria-label="Nombre" style="border:1px solid var(--line);background:var(--bg);border-radius:10px;padding:9px;font-size:16px;min-width:0">
      <input class="r-in" id="rm_${r.id}" data-r="${i}" data-k="monto" inputmode="decimal" value="${r.monto||""}" placeholder="Monto" aria-label="Monto" style="border:1px solid var(--line);background:var(--bg);border-radius:10px;padding:9px;font-size:16px;min-width:0">
      <input class="r-in" id="rd_${r.id}" data-r="${i}" data-k="dia" inputmode="numeric" value="${r.dia||""}" placeholder="Día" aria-label="Día de pago" style="border:1px solid var(--line);background:var(--bg);border-radius:10px;padding:9px;font-size:16px;min-width:0">
    </div><button class="btn small ghost" data-rdel="${i}" aria-label="Quitar">✕</button></div>`).join("");
  return `<section class="card"><h2>Presupuesto mensual<span class="sub">por categoría</span></h2><p class="hint" style="margin-bottom:14px">Pon un tope a las categorías que quieres cuidar. Deja vacías las demás.</p><div class="blist">${list}</div></section>
  <section class="card"><h2>Pagos fijos<span class="sub">nombre · monto · día</span></h2><p class="hint" style="margin-bottom:8px">Colegiaturas, servicios y suscripciones. Te aparecen en el resumen para registrarlos con un toque.</p>${recs}
  <div style="margin-top:10px"><button class="btn small ghost" id="recAdd">Agregar pago fijo</button></div></section>
  <section class="card"><h2>Gasto hormiga</h2><div class="field"><label for="hormigaIn">Considerar “hormiga” las compras de hasta</label><input id="hormigaIn" inputmode="decimal" value="${aj.hormiga||150}"></div></section>`;
}

function connectCard(){
  if(cfg) return "";
  return `<section class="card"><h2>Conecta tu hoja de Google</h2><p class="hint" style="margin-bottom:10px">Así tus gastos se guardan en tu Google Sheets y los ves igual en el celular y en la computadora.</p><button class="btn small" data-tab-go="ajustes">Conectar</button></section>`;
}
function vAjustes(){
  const conn = cfg ? `<section class="card"><h2>Tu hoja de Google</h2>
      <p class="hint">${syncErr?esc(syncErr):"Conectado. Cada gasto se guarda en tu hoja y aparece en todos tus dispositivos."}${lastSync?` Última sincronización: ${new Date(lastSync).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}.`:""}</p>
      <div class="filters" style="margin-top:12px"><button class="btn small" id="syncBtn">Sincronizar ahora</button>${hojaUrl?`<a class="btn small ghost" style="text-decoration:none" href="${esc(hojaUrl)}" target="_blank" rel="noopener">Abrir en Google Sheets</a>`:""}</div>
      <div id="offZone" style="margin-top:12px"><button class="btn small ghost" id="offBtn">Desconectar este dispositivo</button></div></section>`
    : `<section class="card setup"><h2>Conecta tu hoja de Google</h2>
      <p class="hint">Pega aquí el código de conexión que te envié. Solo se hace una vez en cada dispositivo.</p>
      <div class="field"><label for="connIn">Código de conexión</label><textarea id="connIn" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea></div>
      <div id="connMsg" class="hint"></div><button class="btn" id="connBtn">Conectar</button></section>`;
  return conn+`<section class="card"><h2>Instálala en tu iPhone</h2><ol class="steps">
    <li>Abre tu enlace de Mis Gastos en <b>Safari</b>.</li>
    <li>Toca <b>Compartir</b> (el cuadro con la flecha hacia arriba).</li>
    <li>Elige <b>Agregar a pantalla de inicio</b>.</li></ol>
    <p class="hint" style="margin-top:10px">En la computadora, guarda el mismo enlace en tus marcadores.</p></section>
  <section class="card"><h2>Respaldo</h2><p class="hint" style="margin-bottom:10px">Tus gastos ya viven en tu hoja de Google. También puedes descargar un CSV.</p>
    <button class="btn" id="csvBtn" ${gastos.length?"":"disabled"}>Descargar CSV (${gastos.length})</button></section>
  <section class="card"><h2>Cómo escribir rápido</h2><p class="hint">En la barra del resumen escribe el gasto como lo dirías: <b>tacos 120</b>, <b>gasolina 650 efectivo</b>, <b>ayer colegiatura 3850</b>. La app detecta el monto, la categoría, la forma de pago y la fecha.</p></section>`;
}

// ---------- Hoja de captura / edición ----------
function openSheet(pre={}){
  const editing=!!pre.id && gastos.some(g=>g.id===pre.id);
  const g={id:pre.id||uid(),monto:pre.monto??"",cat:pre.cat||"",nota:pre.nota||"",fecha:pre.fecha||today(),metodo:pre.metodo||"debito",trabajo:!!pre.trabajo,creado:pre.creado,recId:pre.recId};
  const host=$("#sheetHost");
  const draw=()=>{
    host.innerHTML=`<div class="scrim" id="scrim"><form class="sheet" id="gForm" role="dialog" aria-label="${editing?"Editar gasto":"Nuevo gasto"}" autocomplete="off">
      <div class="grab"></div>
      <h3>${editing?"Editar gasto":"Nuevo gasto"}<button type="button" id="xBtn" aria-label="Cerrar">✕</button></h3>
      <div class="amount"><span>$</span><input id="gMonto" inputmode="decimal" placeholder="0" value="${g.monto}" aria-label="Monto"></div>
      <div class="field"><label for="gNota">¿En qué?</label><input id="gNota" placeholder="Tacos, súper, colegiatura…" value="${esc(g.nota)}"></div>
      ${canImages&&!editing?`<div class="scan"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><label for="gFoto">Tomar foto del ticket y llenar automático</label><input type="file" id="gFoto" accept="image/*" capture="environment"></div>`:""}
      <div class="field"><span class="flabel">Categoría</span><div class="chips">${CATS.map(c=>`<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${g.cat===c.id}"><span class="dot" style="background:var(${c.c})"></span>${esc(c.n)}</button>`).join("")}</div></div>
      <div class="field"><span class="flabel">Forma de pago</span><div class="seg">${METODOS.map(m=>`<button type="button" data-met="${m.id}" aria-pressed="${g.metodo===m.id}">${m.n}</button>`).join("")}</div></div>
      <div class="row2"><div class="field"><label for="gFecha">Fecha</label><input type="date" id="gFecha" value="${g.fecha}"></div>
      <label class="switch" for="gTrab"><span>Trabajo / canales<small>Para separar lo deducible</small></span><input type="checkbox" id="gTrab" ${g.trabajo?"checked":""}></label></div>
      <div id="sheetMsg" class="hint"></div>
      <button class="btn" type="submit" style="padding:15px">${editing?"Guardar cambios":"Guardar gasto"}</button>
      ${editing?`<div id="delZone"><button type="button" class="btn danger" id="delBtn" style="width:100%">Borrar este gasto</button></div>`:""}
    </form></div>`;
    const sync=()=>{g.monto=$("#gMonto").value;g.nota=$("#gNota").value;g.fecha=$("#gFecha").value;g.trabajo=$("#gTrab").checked;};
    $("#scrim").addEventListener("click",e=>{if(e.target.id==="scrim")close();});
    $("#xBtn").onclick=close;
    $("#gNota").addEventListener("input",e=>{ if(!g._catTouched){const c=guessCat(e.target.value); if(c&&c!==g.cat){g.cat=c; host.querySelectorAll("[data-cat]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.cat===c));}}});
    host.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{g.cat=b.dataset.cat;g._catTouched=true;host.querySelectorAll("[data-cat]").forEach(x=>x.setAttribute("aria-pressed",x===b));});
    host.querySelectorAll("[data-met]").forEach(b=>b.onclick=()=>{g.metodo=b.dataset.met;host.querySelectorAll("[data-met]").forEach(x=>x.setAttribute("aria-pressed",x===b));});
    $("#gForm").onsubmit=e=>{e.preventDefault();sync();
      const m=parseFloat(String(g.monto).replace(/[$,\s]/g,""));
      if(!(m>0)){$("#sheetMsg").textContent="Escribe el monto del gasto.";$("#gMonto").focus();return;}
      if(!g.cat) g.cat=guessCat(g.nota)||"otros";
      putGasto({...g,monto:m}); close(); toast(editing?"Gasto actualizado":`Guardado: ${money(m)} en ${CAT[g.cat].n}`);
    };
    const del=$("#delBtn"); if(del) del.onclick=()=>{
      $("#delZone").innerHTML=`<div class="inline-confirm"><span>¿Borrar definitivamente?</span><button type="button" class="btn small danger" id="delYes">Sí, borrar</button><button type="button" class="btn small ghost" id="delNo">Cancelar</button></div>`;
      $("#delYes").onclick=()=>{delGasto(g.id);close();toast("Gasto borrado");};
      $("#delNo").onclick=draw;
    };
    if(!editing && !g.monto) setTimeout(()=>$("#gMonto")?.focus(),60);
  };
  const close=()=>{host.innerHTML="";};
  draw();
}

// ---------- Eventos ----------
function bindView(){
  const qf=$("#quickForm"); if(qf) qf.onsubmit=e=>{e.preventDefault(); const v=$("#quickIn").value.trim(); if(!v) return;
    const p=parseQuick(v);
    if(p.monto>0 && p.cat){ putGasto({id:uid(),monto:p.monto,cat:p.cat,nota:p.nota.replace(/^./,c=>c.toUpperCase()),fecha:p.fecha,metodo:p.metodo||"debito"}); toast(`Guardado: ${money(p.monto)} en ${CAT[p.cat].n}`); }
    else openSheet({monto:p.monto??"",cat:p.cat||"",nota:p.nota.replace(/^./,c=>c.toUpperCase()),fecha:p.fecha,metodo:p.metodo||"debito"});
  };
  document.querySelectorAll("[data-act='add']").forEach(b=>b.onclick=()=>openSheet());
  document.querySelectorAll("[data-tab-go]").forEach(b=>b.onclick=()=>go(b.dataset.tabGo));
  document.querySelectorAll("[data-filter-cat]").forEach(b=>b.onclick=()=>{filtro={q:"",cat:b.dataset.filterCat};go("movs");});
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const g=gastos.find(x=>x.id===b.dataset.edit); if(g) openSheet(g); else toast("Es un ejemplo. Registra tus propios gastos para editarlos.");});
  document.querySelectorAll("[data-rec]").forEach(b=>b.onclick=()=>{const r=aj.recurrentes.find(x=>x.id===b.dataset.rec); const d=new Date(); putGasto({id:uid(),monto:+r.monto,cat:r.cat,nota:r.nombre,fecha:ymd(d),metodo:"debito",recId:r.id}); toast(`${r.nombre} registrado`);});
  const fq=$("#fq"); if(fq) fq.oninput=e=>{filtro.q=e.target.value; const pos=e.target.selectionStart; render(); const n=$("#fq"); n.focus(); try{n.setSelectionRange(pos,pos);}catch(_){}};
  const fc=$("#fc"); if(fc) fc.onchange=e=>{filtro.cat=e.target.value;render();};
  document.querySelectorAll("[data-pres]").forEach(i=>i.onchange=()=>{const v=parseFloat(i.value.replace(/[$,\s]/g,""));aj.presupuestos={...aj.presupuestos}; if(v>0) aj.presupuestos[i.dataset.pres]=v; else delete aj.presupuestos[i.dataset.pres]; saveAj(); render();});
  document.querySelectorAll(".r-in").forEach(i=>i.onchange=()=>{const r=aj.recurrentes[+i.dataset.r]; const k=i.dataset.k; r[k]=k==="nombre"?i.value.trim():(parseFloat(i.value.replace(/[$,\s]/g,""))||0); if(k==="nombre"){r.cat=guessCat(r.nombre)||r.cat||"otros";} saveAj();});
  document.querySelectorAll("[data-rdel]").forEach(b=>b.onclick=()=>{aj.recurrentes.splice(+b.dataset.rdel,1);saveAj();render();});
  const ra=$("#recAdd"); if(ra) ra.onclick=()=>{aj.recurrentes=[...(aj.recurrentes||[]),{id:"r"+Date.now().toString(36),nombre:"",monto:0,cat:"otros",dia:1}];saveAj();render();};
  const hi=$("#hormigaIn"); if(hi) hi.onchange=()=>{aj.hormiga=parseFloat(hi.value)||150;saveAj();};
  const csv=$("#csvBtn"); if(csv) csv.onclick=exportCSV;
  const cb=$("#connBtn"); if(cb) cb.onclick=()=>{const c=parseConn($("#connIn").value); if(!c){$("#connMsg").textContent="Ese código no es válido. Cópialo completo, tal como te lo envié.";return;} setCfg(c); syncErr=""; toast("Conectado. Sincronizando…"); flush();};
  const sb=$("#syncBtn"); if(sb) sb.onclick=()=>flush();
  const ob=$("#offBtn"); if(ob) ob.onclick=()=>{$("#offZone").innerHTML=`<div class="inline-confirm"><span>¿Desconectar este dispositivo? Tus datos siguen en la hoja.</span><button class="btn small danger" id="offYes">Desconectar</button><button class="btn small ghost" id="offNo">Cancelar</button></div>`;$("#offYes").onclick=()=>{cfg=null;try{localStorage.removeItem("mg_cfg");}catch(e){}setStatus();render();};$("#offNo").onclick=render;};
}
function go(t){tab=t;try{localStorage.setItem("mg_tab",t);}catch(e){} render(); window.scrollTo(0,0);}
document.querySelectorAll("nav.tabs [data-tab]").forEach(b=>b.onclick=()=>go(b.dataset.tab));
$("#addBtn").onclick=()=>openSheet();
$("#mPrev").onclick=()=>{cur=prevYM(cur.y,cur.m);render();};
$("#mNext").onclick=()=>{cur=cur.m===12?{y:cur.y+1,m:1}:{y:cur.y,m:cur.m+1};render();};

function exportCSV(){
  const head="fecha,monto,categoria,descripcion,forma_pago,trabajo\n";
  const body=[...gastos].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(g=>[g.fecha,(+g.monto).toFixed(2),CAT[g.cat]?.n||g.cat,g.nota||"",METODOS.find(m=>m.id===g.metodo)?.n||"",g.trabajo?"sí":"no"].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob(["﻿"+head+body],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`mis-gastos-${today()}.csv`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }

render();
initStore();
})();
