/* Hunter.todo · caçadas e expedições (0.5.8). Carregado depois de conquistas.js: usa CTX, EST, D, HOJE, UI, LA, render, recarrega,
 * post, esc, ic, NC, pct, fmt, ddmm, toast, rowL, valeL, tagDe, discOf, formL, prevL, cur e o estilo .wz do assistente (guia.js).
 * As regras (o que é etapa, marco, bônus) ficam em motor.js, grupos(); aqui só o desenho e as gravações.
 * Lista: o bloco de cada caçada, as etiquetas de caçada e de expedição nas tarefas, o campo "caçada" do formulário e as teclas
 * N (o formulário numa janela, de qualquer aba) e C (uma caçada inteira, uma etapa por linha).
 * Aba Expedições: cinco formas de ver a mesma expedição (cards, trilha, quadro, foco, cronograma); a escolhida fica neste navegador.
 * Grava em estado.json: cacadas {nome: {n, exp, criada, fim, bonus}} e expedicoes {nome: {n, ic, sub, ini, fim, bonus}}.
 * As etapas são linhas normais do todo.txt com +cac.nome; as tarefas soltas de uma expedição levam +exp.nome.
 */
(function(){
'use strict';
const HJ = window.HJ;

document.head.insertAdjacentHTML('beforeend', `<style>
/* caçada na Lista: um agrupador com vida e ícone genérico (sem foto) */
.l-cacb{border-top:1px solid var(--hair);background:color-mix(in srgb,var(--amb) 4%,var(--panel))}
.l-list>.l-cacb:first-child{border-top:0}
.l-cach{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px 12px;align-items:center;padding:9px 12px}
.l-cact{display:flex;gap:10px;align-items:center;border:0;background:none;padding:0;cursor:pointer;text-align:left;min-width:0}
.x-alvo{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:var(--amb);border:1.5px dashed color-mix(in srgb,var(--amb) 70%,var(--hair));font-size:14px;flex:none}
.l-cacb.fim .x-alvo,.x-alvo.ok{background:var(--grn);color:var(--bg);border:0}
.l-cacn{font:600 14px var(--f-ui);display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;min-width:0;overflow-wrap:anywhere}
.l-cacn small{font:600 10px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--amb)}
.l-cacr{display:flex;gap:10px;align-items:center;font:600 11.5px var(--f-mono);color:var(--soft);white-space:nowrap}
.x-vida{display:flex;gap:2px;width:96px;height:8px} .x-vida i{flex:1;border-radius:2px;background:var(--track)} .x-vida i.on{background:var(--amb)}
.l-cacb.fim .x-vida i{background:var(--grn)}
.l-cacl{border:0!important;border-radius:0!important;background:none!important;border-top:1px dashed var(--hair)!important;margin-left:24px}
.l-cacl .l-task{border-top:1px dashed var(--hair)} .l-cacl .l-task:first-child{border-top:0}
.l-cacb .l-tag.x-tcac{display:none}
.l-cacf{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:4px 12px 10px 50px;font:11.5px var(--f-mono);color:var(--faint)}
.l-tag.x-tcac{color:var(--amb);background:color-mix(in srgb,var(--amb) 12%,transparent)}
.l-tag.x-texp{color:var(--aura);background:color-mix(in srgb,var(--aura) 13%,transparent)}
.l-tag .ic{font-size:11px;margin-right:3px}
/* peças das expedições */
.x-ring{--p:0;--s:46px;width:var(--s);height:var(--s);border-radius:50%;display:grid;place-items:center;flex:none;background:conic-gradient(var(--aura) calc(var(--p)*1%),var(--track) 0)}
.x-ring>span{width:calc(var(--s) - 7px);height:calc(var(--s) - 7px);border-radius:50%;background:var(--panel);display:grid;place-items:center;color:var(--aura);font-size:calc(var(--s)*.42)}
.x-marcos{display:flex;gap:3px;height:10px;min-width:60px} .x-marcos i{flex:1;border-radius:3px;background:var(--track)} .x-marcos i.on{background:var(--aura)}
.x-marcos i.meio{background:linear-gradient(90deg,color-mix(in srgb,var(--aura) 55%,var(--track)) var(--q),var(--track) 0)}
.x-sem{display:flex;gap:3px;flex-wrap:wrap} .x-sem i{width:12px;height:12px;border-radius:3px;background:var(--track)}
.x-sem i.h1{background:color-mix(in srgb,var(--aura) 35%,var(--track))} .x-sem i.h2{background:color-mix(in srgb,var(--aura) 65%,var(--track))} .x-sem i.h3{background:var(--aura)}
.x-mini{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:2px 10px;align-items:center;padding:7px 0;border:0;border-top:1px solid var(--hair);background:none;width:100%;text-align:left;cursor:pointer}
.x-mini:first-child{border-top:0;padding-top:0}
.x-mini b{font:600 13.5px var(--f-ui)} .x-mini small{display:block;font:11.5px var(--f-mono);color:var(--soft)}
.x-mini .pc{font:700 12px var(--f-mono);color:var(--aura)}
.x-top{display:flex;gap:12px;align-items:center;min-width:0} .x-top>div{min-width:0}
.x-top b{display:block;font:700 16px var(--f-hud);overflow-wrap:anywhere} .x-top small{display:block;font-size:12.5px;color:var(--soft)}
.x-st{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.x-head{display:flex;gap:10px 16px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.x-head h2.h{margin:0;font:700 20px var(--f-hud)}
.x-head p{margin:0;color:var(--soft);font-size:13px;flex:1 1 320px;max-width:80ch}
.x-vis{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
.x-vis>span{font:600 10.5px var(--f-mono);color:var(--faint);letter-spacing:.1em;text-transform:uppercase;margin-right:4px}
.x-sel{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.x-add{display:flex;gap:6px;align-items:center;padding:6px 0 2px}
.x-add input{flex:1;min-width:0;background:none;border:1px dashed var(--hair);border-radius:8px;padding:6px 9px;font:13.5px var(--f-ui);color:var(--ink)}
.x-add input:focus{border-style:solid;border-color:var(--volt);outline:none}
.x-add input::placeholder{color:var(--faint)}
.x-rules{display:grid;gap:6px;font-size:13px;color:var(--soft)} .x-rules b{color:var(--ink);font-weight:600}
.x-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}
.x-note{font-size:12.5px;color:var(--soft);margin:8px 0 0} .x-note b{color:var(--ink)}
.x-flat{border:0!important;border-radius:0!important;background:none!important}
.x-flat .l-task{padding-inline:2px}
.x-mrc{border-top:1px solid var(--hair);padding:10px 0;display:grid;gap:6px} .x-mrc:first-of-type{border-top:0;padding-top:0}
.x-mrch{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.x-mrch b{font:600 14px var(--f-ui);flex:1;min-width:140px;overflow-wrap:anywhere}
.x-n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:700 11px var(--f-mono);border:1.5px solid var(--aura);color:var(--aura);flex:none}
.x-mrc.ok .x-n{background:var(--aura);color:var(--bg)} .x-mrc.agora .x-n{border-color:var(--amb);color:var(--amb)}
.x-corpo{margin-left:34px;min-width:0}
.x-pbar{height:6px;border-radius:3px;background:var(--track);overflow:hidden;margin-left:34px} .x-pbar i{display:block;height:100%;background:var(--amb)}
.x-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.x-card{display:grid;gap:10px;text-align:left;cursor:pointer;font:inherit;color:inherit}
.x-card[aria-pressed="true"]{border-color:color-mix(in srgb,var(--aura) 60%,var(--hair));box-shadow:0 0 0 3px color-mix(in srgb,var(--aura) 14%,transparent)}
.x-det{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;margin-top:14px}
.x-col{display:grid;gap:14px;align-content:start}
@media (max-width:900px){.x-det{grid-template-columns:1fr}}
/* trilha */
.x-trailw{overflow-x:auto}
.x-trail{position:relative;display:flex;min-width:640px;padding:30px 8px 8px}
.x-trail::before{content:"";position:absolute;left:50px;right:50px;top:58px;border-top:3px dashed var(--hair)}
.x-stn{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;position:relative;z-index:1;min-width:0;padding:0 4px;border:0;background:none;font:inherit;color:inherit}
button.x-stn{cursor:pointer}
.x-stn .dot{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--panel);border:2px dashed var(--hair);color:var(--faint);font-size:22px}
.x-stn.ok .dot{border:2px solid var(--aura);background:color-mix(in srgb,var(--aura) 18%,var(--panel));color:var(--aura)}
.x-stn.agora .dot{border:3px solid var(--amb);color:var(--amb);box-shadow:0 0 0 6px color-mix(in srgb,var(--amb) 15%,transparent)}
.x-stn.sel .dot{outline:2px solid var(--volt);outline-offset:4px}
.x-stn.ini .dot,.x-stn.fim .dot{width:40px;height:40px;margin-block:8px;font-size:16px}
.x-stn.fim .dot{border-style:solid;border-color:var(--amb);color:var(--amb)}
.x-stn b{font:600 13px var(--f-ui);overflow-wrap:anywhere} .x-stn small{font:11px var(--f-mono);color:var(--soft)}
.x-stn .eu{position:absolute;top:-26px;font:700 10px var(--f-mono);color:var(--bg);background:var(--amb);border-radius:99px;padding:2px 8px;white-space:nowrap}
/* quadro */
.x-kb{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;align-items:flex-start}
.x-kcol{flex:0 0 280px;background:var(--panel);border:1px solid var(--hair);border-radius:14px;display:flex;flex-direction:column;min-width:0;font:inherit;color:inherit}
.x-kcol.ok{flex-basis:200px;opacity:.8}
.x-kcol.agora{border-color:color-mix(in srgb,var(--amb) 55%,var(--hair))}
.x-kh{padding:12px 12px 10px;border-bottom:1px solid var(--hair);display:grid;gap:6px}
.x-kh b{font:600 14px var(--f-ui);overflow-wrap:anywhere} .x-kh small{font:11px var(--f-mono);color:var(--soft)}
.x-kh .x-k{font:600 10px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--aura)}
.x-kcol.agora .x-kh .x-k{color:var(--amb)}
.x-kbody{padding:8px;display:grid;gap:6px}
.x-kc{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;font-size:13.5px}
.x-kc.done .l-ck{background:var(--c);border-color:var(--c)} .x-kc.done .tx{color:var(--faint);text-decoration:line-through}
.x-kc .tx{overflow-wrap:anywhere}
/* foco */
.x-foco{display:grid;gap:14px}
.x-fc{display:grid;grid-template-columns:minmax(0,270px) minmax(0,1fr);gap:16px}
@media (max-width:820px){.x-fc{grid-template-columns:1fr}}
.x-fc .esq{display:grid;gap:10px;align-content:start}
.x-prox .cap{margin:0 0 4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.x-prox .cap b{color:var(--amb);letter-spacing:0;text-transform:none;font:600 13px var(--f-ui)}
/* cronograma */
.x-gantt{overflow-x:auto}
.x-gt{min-width:720px;display:grid;grid-template-columns:210px minmax(0,1fr);row-gap:10px;padding-top:6px}
.x-gt .hd{position:relative;height:20px;font:600 10.5px var(--f-mono);color:var(--faint)}
.x-gt .hd span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
.x-gt .lb{font:600 13px var(--f-ui);display:flex;gap:8px;align-items:center;min-width:0;padding-right:10px} .x-gt .lb small{font:11px var(--f-mono);color:var(--soft);margin-left:auto}
.x-gt .tr{position:relative;height:30px;border-radius:8px;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(100%/9 - 1px),var(--hair) calc(100%/9 - 1px),var(--hair) calc(100%/9))}
.x-gt .br{position:absolute;top:9px;height:12px;border-radius:6px;background:color-mix(in srgb,var(--aura) 28%,transparent);border:1px solid color-mix(in srgb,var(--aura) 55%,transparent)}
.x-gt .br.ok{background:color-mix(in srgb,var(--aura) 60%,transparent)}
.x-gt .pt{position:absolute;top:8px;width:14px;height:14px;border-radius:50%;transform:translateX(-50%);border:2px solid var(--amb);background:var(--panel);cursor:pointer;padding:0}
.x-gt .pt.f{background:var(--aura);border-color:var(--aura)} .x-gt .pt.late{border-color:var(--red)} .x-gt span.pt{cursor:default}
.x-gt .hj{position:absolute;top:-24px;bottom:-4px;border-left:2px solid var(--volt);pointer-events:none}
.x-gt .hj span{position:absolute;top:13px;left:4px;font:700 10px var(--f-mono);color:var(--volt)}
.x-semanas{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:14px}
/* janelas */
.wz.x-wz{max-width:640px}
.x-wz textarea{width:100%;min-height:120px;resize:vertical;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:9px 11px;font:14px/1.5 var(--f-ui);color:var(--ink)}
.x-ics{display:flex;gap:6px;flex-wrap:wrap}
.x-ics button{width:38px;height:38px;border-radius:10px;border:1px solid var(--hair);background:var(--panel2);display:grid;place-items:center;cursor:pointer;color:var(--soft);font-size:18px}
.x-ics button[aria-pressed="true"]{border-color:var(--aura);color:var(--aura);background:color-mix(in srgb,var(--aura) 14%,var(--panel2))}
.wz.xn{max-width:900px}
.wz.xn .l-add{border:0;padding:0;background:none}
.wz.xn label.l-box{flex-direction:row;align-items:center;gap:8px;font:inherit;color:inherit;letter-spacing:0;text-transform:none}
.wz.xn .l-box input{background:none;border:0;border-radius:0;padding:10px 2px;font:15px var(--f-ui)}
.wz.xn .l-seg select,.wz.xn .l-cacs input,.wz.xn #l-date{padding:3px 10px;border-radius:99px;font:12.5px var(--f-ui)}
.xn h3 small{font:500 12px var(--f-mono);color:var(--faint);margin-left:8px}
</style>`);
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-alvo" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></symbol>
  <symbol id="i-flag" viewBox="0 0 24 24"><path d="M6 21V4M6 4h11l-2 4 2 4H6"/></symbol>
  <symbol id="i-bau" viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="10" rx="1.5"/><path d="M4 13h16M6 9a6 4 0 0112 0M11 12h2v3h-2z"/></symbol></svg>`);

/* ---------- utilidades ---------- */
const ICS = ['island','tower','int','tra','con','esp','emi','man','scroll','card','crown','flame','moon','spider','coin','antenna','thread','bullet','bag','copy'];
const VIS = [['cards','Cards','todas lado a lado'],['trilha','Trilha','os marcos como paradas de um caminho'],['quadro','Quadro','uma coluna por marco, etapas em cartões'],['foco','Foco','só o próximo passo de cada uma'],['crono','Cronograma','os marcos no calendário']];
const X = {vis:'cards', sel:'', marco:undefined, verFeitas:{}, fold:{}, conf:'', foco:'', velhas:false};
try { const v = localStorage.getItem('hj-expv'); if(VIS.some(x => x[0] === v)) X.vis = v; } catch(e){}
const g = S => S.grupos || {cac:{}, exp:{}};
const ativas = S => Object.values(g(S).exp).filter(e => !e.fim).sort((p, q) => (p.ini || '').localeCompare(q.ini || '') || p.slug.localeCompare(q.slug));
const xpDa = (t, S) => { const o = S.xs.find(o => o.t === t); return o ? o.x : 0; };
const porDue = (p, q) => (p.due || '9').localeCompare(q.due || '9') || (p.n || 0) - (q.n || 0);
const vida = c => `<span class="x-vida" title="vida: ${c.abertas.length} de ${c.etapas.length} etapas">${c.etapas.map((t, i) => `<i class="${i >= c.feitas ? 'on' : ''}"></i>`).join('')}</span>`;
const ring = (e, s) => `<span class="x-ring" style="--p:${pct(e.ok, e.marcos.length)}${s ? `;--s:${s}px` : ''}"><span>${ic(e.ic)}</span></span>`;
const marcos = e => `<div class="x-marcos" title="vida da expedição: os marcos que faltam">${e.marcos.map(c => c.fim ? '<i class="on"></i>' : `<i class="meio" style="--q:${pct(c.feitas, c.etapas.length)}%"></i>`).join('') || '<i></i>'}</div>`;
const semanas = e => `<div class="x-sem" title="tarefas feitas por semana, nas últimas 12">${e.semanas.map((n, i) => `<i class="${n >= 5 ? 'h3' : n >= 3 ? 'h2' : n ? 'h1' : ''}" title="${i === 11 ? 'esta semana' : `há ${11 - i} semana${11 - i > 1 ? 's' : ''}`}: ${n} tarefa${n === 1 ? '' : 's'}"></i>`).join('')}</div>`;
const salva = () => post('/api/jogo/estado', {estado:EST});
const meta = (k, slug) => { EST[k] = EST[k] || {}; return EST[k][slug] = EST[k][slug] || {}; };
const novoSlug = (nome, k) => { const b = HJ.slugDe(nome) || 'sem-nome', usado = s => (EST[k] && EST[k][s]) || (k === 'cacadas' ? D.abertas.concat(D.feitas).some(t => HJ.cacDe(t) === s) : D.abertas.concat(D.feitas).some(t => HJ.expDe(t) === s));
  let s = b, i = 2; while(usado(s)) s = `${b}-${i++}`; return s; };
/* uma etapa já feita que saiu do todo.txt (foi para o done.txt): o ✓ reabre pela rota /api/reabre (#27) */
const ckDone = t => CTX.SRV || window.HJ_DEMO ? `<button type="button" class="l-ck" data-xreab="${esc(t.raw)}" aria-label="reabrir: ${esc(t.txt)}">✓</button>` : '<span class="l-ck" aria-hidden="true">✓</span>';
async function reabreE(raw){
  const S = estado(), t = D.feitas.find(t => t.raw === raw), x = t ? xpDa(t, S) : 0;
  /* o XP do dia já fechado fica gravado (xpDias, que só sobe): o servidor tira o desta etapa, senão ela contaria duas vezes */
  await acaoL(() => post('/api/reabre', {raw, xp:x}), `Reaberta <small>${t ? esc(t.txt) : ''}</small>`);
}
const rowE = (t, S) => t.done && !t.n ? `<li class="l-task done" style="--c:${NC(HJ.nenDe(t))}">${ckDone(t)}<div class="l-body"><span class="l-txt">${esc(t.txt)}</span></div><div class="l-right"><span class="l-xp">+${xpDa(t, S)}</span></div></li>`
  : rowL(t, S, t.done ? xpDa(t, S) : undefined);
const addIn = (alvo, ph) => `<form class="x-add" data-xadd="${esc(alvo)}" autocomplete="off"><input aria-label="${esc(ph)}" placeholder="${esc(ph)}"><button class="btn" type="submit">+</button></form>`;
const fechaBtn = (c, S) => `<button type="button" class="btn" data-cfecha="${esc(c.slug)}">${c.exp ? `fechar marco · +${HJ.bonusMarco(c)} XP` : 'fechar caçada'}</button>`;

/* ---------- a linha de uma etapa nova (campo "+ etapa" e janela da caçada) ----------
   prazo no fim do texto ("amanhã", "sexta", "15/10"); o tipo pelas palavras ou, sem palavra conhecida, o das outras etapas */
function prazoDe(txt){
  let m = txt.match(/\s+(hoje|amanh[ãa]|sexta)$/i);
  if(m){ const w = HJ.norm(m[1]); return [txt.slice(0, m.index).trim(), w === 'hoje' ? HOJE : w === 'amanha' ? HJ.addD(HOJE, 1) : HJ.addD(HOJE, (4 - HJ.dow(HOJE) + 7) % 7 || 7)]; }
  m = txt.match(/\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)$/);
  if(m){ const d = HJ.isoData(m[1], HOJE); if(d) return [txt.slice(0, m.index).trim(), d]; }
  return [txt.trim(), ''];
}
function linhaEtapa(txt, o){
  const [t, due] = prazoDe(txt), base = o.base;
  const disc = o.disc !== undefined ? o.disc : base ? discOf(base) : '';
  let k = o.tipo || (HJ.sugereTipo(t, !!disc) || {}).k || (base ? HJ.tipoDe(base) : '');
  if(k === 'fac' && !disc) k = 'vid';
  const tag = ['ent','est','tre','hab'].includes(k) ? tagDe(k) : '';
  return [t, disc ? '+fac.' + disc : '', tag && !t.toLowerCase().includes(tag.toLowerCase()) ? tag : '', o.grupo, due ? 'due:' + due : ''].filter(Boolean).join(' ');
}
async function addEtapa(alvo, txt, S){
  const [k, slug] = alvo.split(':'), G = g(S);
  if(k === 'cac'){ const c = G.cac[slug]; await post('/api/add', {text: linhaEtapa(txt, {grupo:'+cac.' + slug, base:c && c.etapas[0]})}); return c ? c.n : slug; }
  const e = G.exp[slug]; await post('/api/add', {text: linhaEtapa(txt, {grupo:'+exp.' + slug, base:e && e.soltas[0]})}); return e ? e.n : slug;
}

/* ---------- Lista ---------- */
function blocosLista(S){
  return Object.values(g(S).cac).filter(c => c.abertas.length || (!c.fim && c.etapas.length)).map(c => {
    const e = c.exp && g(S).exp[c.exp], tudo = !c.abertas.length, fold = UI.cfold && UI.cfold[c.slug];
    const h = `<li class="l-cacb${tudo ? ' fim' : ''}"><div class="l-cach">
      <button type="button" class="l-cact" data-cfold="${esc(c.slug)}" aria-expanded="${!fold}"><span class="x-alvo">${tudo ? '✓' : ic('alvo')}</span>
        <span class="l-cacn"><small>caçada</small>${esc(c.n)}${e ? `<span class="l-tag x-texp">${ic(e.ic)}${esc(e.n)} · marco ${e.marcos.indexOf(c) + 1}</span>` : ''}</span></button>
      <span class="l-cacr">${vida(c)}${tudo ? 'todas feitas' : `faltam ${c.abertas.length} de ${c.etapas.length}`}</span>
      <span class="l-cacr"><button type="button" class="l-ib" data-cedit="${esc(c.slug)}" title="editar a caçada" aria-label="editar a caçada ${esc(c.n)}">✎</button><button type="button" class="l-ib" data-cfold="${esc(c.slug)}" aria-label="${fold ? 'abrir' : 'recolher'}">${fold ? '▸' : '▾'}</button></span></div>
      ${fold ? '' : `<ul class="l-list l-cacl">${c.abertas.slice().sort(porDue).map(t => rowL(t, S)).join('')}</ul>
      <div class="l-cacf">${c.feitas ? `<span>${c.feitas} feita${c.feitas > 1 ? 's' : ''}</span>` : ''}<button type="button" class="go" data-cetapa="${esc(c.slug)}">+ etapa</button>${tudo ? fechaBtn(c, S) : ''}${c.fim && c.abertas.length ? '<span>reaberta: feche de novo quando terminar</span>' : ''}</div>`}</li>`;
    return {due:c.due, prova:null, h, x:c.abertas.reduce((s, t) => s + valeL(t, S).x, 0)};
  });
}
function etiquetas(t, S){
  const G = g(S), c = HJ.cacDe(t), e = HJ.expDe(t);
  return (c && G.cac[c] ? `<span class="l-tag x-tcac">${ic('alvo')}${esc(G.cac[c].n)}</span>` : '') + (e && G.exp[e] ? `<span class="l-tag x-texp">${ic(G.exp[e].ic)}${esc(G.exp[e].n)}</span>` : '');
}
function lateral(S){
  const L = ativas(S);
  if(!L.length) return `<p class="sub" style="margin:0">Um projeto que dura semanas (o TCC, um app, a iniciação científica) vira uma expedição: as caçadas dele são os marcos. <button class="go" data-xnova>criar uma →</button></p>`;
  return L.map(e => `<button type="button" class="x-mini" data-xir="${esc(e.slug)}">${ring(e, 32)}<span><b>${esc(e.n)}</b><small>${e.atual ? `agora: ${esc(e.atual.n)} · ${e.atual.feitas}/${e.atual.etapas.length}` : e.marcos.length ? 'todos os marcos fechados' : 'sem marcos ainda'}</small></span><span class="pc">${e.ok}/${e.marcos.length}</span></button>`).join('');
}
/* campo "caçada" do formulário: as abertas (avulsas e por expedição) e "+ nova caçada" */
function formCacadas(){
  const sel = document.getElementById('l-cac'); if(!sel || !CTX) return;
  const S = estado(), G = g(S), abertas = Object.values(G.cac).filter(c => !c.fim || c.abertas.length);
  const grupo = (nome, cs) => cs.length ? `<optgroup label="${esc(nome)}">${cs.map(c => `<option value="${esc(c.slug)}">${esc(c.n)}</option>`).join('')}</optgroup>` : '';
  const html = '<option value="">nenhuma</option>' + grupo('avulsas', abertas.filter(c => !c.exp || !G.exp[c.exp]))
    + ativas(S).map(e => grupo(e.n, abertas.filter(c => c.exp === e.slug))).join('') + '<option value="+nova">+ nova caçada…</option>';
  if(sel.dataset.h !== html){ sel.innerHTML = html; sel.dataset.h = html; }
  const v = UI.lcac || ''; sel.value = [...sel.options].some(o => o.value === v) ? v : ''; UI.lcac = sel.value;
  const nova = sel.value === '+nova', cn = document.getElementById('l-cacn'), cx = document.getElementById('l-cacx');
  cn.hidden = cx.hidden = !nova;
  const xh = '<option value="">sem expedição (avulsa)</option>' + ativas(S).map(e => `<option value="${esc(e.slug)}">marco de ${esc(e.n)}</option>`).join('');
  if(cx.dataset.h !== xh){ const v2 = cx.value; cx.innerHTML = xh; cx.dataset.h = xh; cx.value = v2; }
  const det = document.getElementById('l-det'), mb = document.getElementById('l-more');
  det.hidden = !UI.ldet; mb.setAttribute('aria-expanded', !!UI.ldet); mb.textContent = UI.ldet ? 'menos ▴' : 'detalhes ▾';
}
function tagForm(){
  const sel = document.getElementById('l-cac'); if(!sel || !sel.value) return '';
  if(sel.value !== '+nova') return '+cac.' + sel.value;
  const n = document.getElementById('l-cacn').value.trim();
  return n ? '+cac.' + novoSlug(n, 'cacadas') : '';
}
async function antesDeAdicionar(){
  const sel = document.getElementById('l-cac'); if(!sel || sel.value !== '+nova') return;
  const n = document.getElementById('l-cacn').value.trim(); if(!n) throw new Error('dê um nome para a caçada nova');
  const slug = novoSlug(n, 'cacadas'), exp = document.getElementById('l-cacx').value || null;
  Object.assign(meta('cacadas', slug), {n:n.slice(0, 80), exp, criada:HOJE}); await salva();
  X.criou = slug;
}
function depoisDeAdicionar(){
  if(X.criou){ UI.lcac = X.criou; X.criou = ''; const cn = document.getElementById('l-cacn'); if(cn) cn.value = ''; }
  if(document.getElementById('xn')) fechaN();
}

/* ---------- tecla N: o mesmo formulário da Lista, com os detalhes abertos, numa janela ---------- */
const N = {};
function abreN(cac){
  if(!CTX || document.getElementById('xn')) return;
  const f = document.getElementById('l-add'); N.casa = f.parentNode; N.prox = f.nextSibling; N.det = UI.ldet; UI.ldet = true;
  if(cac !== undefined) UI.lcac = cac;
  const bg = document.createElement('div'); bg.className = 'wz-bg'; bg.id = 'xn';
  bg.innerHTML = `<div class="wz xn" role="dialog" aria-modal="true" aria-labelledby="xn-t"><div class="wz-body"><h3 id="xn-t">Nova tarefa<small>Enter adiciona · Esc fecha · C cria uma caçada inteira</small></h3><div id="xn-slot"></div></div></div>`;
  document.body.appendChild(bg); document.getElementById('xn-slot').appendChild(f); formL();
  document.getElementById('l-txt').focus();
}
function fechaN(){
  const bg = document.getElementById('xn'); if(!bg) return;
  const f = document.getElementById('l-add'); N.casa.insertBefore(f, N.prox); UI.ldet = N.det; bg.remove(); formL();
}

/* ---------- janelas: caçada nova (C), editar caçada, expedição nova ou editada ---------- */
function janela(id, titulo, corpo, ok){
  fechaJanela();
  const bg = document.createElement('div'); bg.className = 'wz-bg'; bg.id = id;
  bg.innerHTML = `<div class="wz x-wz" role="dialog" aria-modal="true" aria-labelledby="${id}-t"><div class="wz-body"><h3 id="${id}-t">${titulo}</h3>${corpo}</div>
    <div class="wz-foot"><span class="err" role="alert" id="${id}-err"></span><span style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-xfecha>cancelar</button><button type="button" class="btn v" data-xok>${ok}</button></span></div></div>`;
  document.body.appendChild(bg); const f = bg.querySelector('input,textarea,select'); if(f) f.focus();
}
function fechaJanela(){ document.querySelectorAll('#xc,#xe,#xx').forEach(x => x.remove()); }
const erro = (id, m) => { const el = document.getElementById(id + '-err'); if(el) el.textContent = m; };
const expSelect = (id, v) => `<select id="${id}">${'<option value="">nenhuma (caçada avulsa)</option>' + ativas(estado()).map(e => `<option value="${esc(e.slug)}"${e.slug === v ? ' selected' : ''}>${esc(e.n)}</option>`).join('')}</select>`;
function abreC(exp){
  if(!CTX) return;
  const tipos = [['','o jogo decide'], ['ent','entrega'], ['est','estudo'], ['tre','treino e projetos'], ['vid','vida']];
  janela('xc', 'Nova caçada', `<p>Uma tarefa grande dividida em etapas. Na Lista, as etapas ficam juntas, com uma barra de quantas faltam; cada uma vale o XP normal dela. Numa expedição, a caçada vira um <b>marco</b>, e fechá-la dá bônus.</p>
    <div class="wz-f"><label>nome<input id="xc-n" maxlength="80" placeholder="ex.: Trabalho da mãe"></label><label>expedição${expSelect('xc-x', exp || '')}</label>
      <label>tipo das etapas<select id="xc-t">${tipos.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label>
      <label>disciplina<select id="xc-d"><option value="">nenhuma</option>${BOSSES.map(b => `<option>${esc(b.d)}</option>`).join('')}</select></label></div>
    <label>etapas, uma por linha<textarea id="xc-e" placeholder="Pesquisar o tema&#10;Escrever a introdução&#10;Montar os slides amanhã&#10;Revisar com ela 20/10"></textarea><small class="h">"hoje", "amanhã", "sexta" ou uma data no fim da linha viram o prazo da etapa. Ctrl+Enter cria.</small></label>`, 'criar caçada');
}
async function criaC(){
  const n = document.getElementById('xc-n').value.trim(), exp = document.getElementById('xc-x').value || null, tipo = document.getElementById('xc-t').value, disc = document.getElementById('xc-d').value;
  const ls = document.getElementById('xc-e').value.split('\n').map(s => s.trim()).filter(Boolean);
  if(!n) return erro('xc', 'Dê um nome para a caçada.');
  if(!ls.length) return erro('xc', 'Escreva pelo menos uma etapa.');
  const slug = novoSlug(n, 'cacadas');
  try {
    Object.assign(meta('cacadas', slug), {n:n.slice(0, 80), exp, criada:HOJE}); await salva();
    for(const l of ls) await post('/api/add', {text: linhaEtapa(l, {grupo:'+cac.' + slug, tipo, disc})});
    await recarrega();
  } catch(err){ return erro('xc', 'Não criou: ' + err.message); }
  fechaJanela(); render(); toast(`Caçada criada <small>${esc(n)} · ${ls.length} etapa${ls.length > 1 ? 's' : ''}${exp ? ' · marco novo' : ''}</small>`);
}
function abreEditC(slug){
  const c = g(estado()).cac[slug]; if(!c) return;
  janela('xe', 'Editar caçada', `<div class="wz-f"><label>nome<input id="xe-n" maxlength="80" value="${esc(c.n)}"></label><label>expedição${expSelect('xe-x', c.exp || '')}</label></div>
    <p>As etapas continuam com <span class="mono">+cac.${esc(slug)}</span> no todo.txt; o nome aqui é só o que aparece no jogo.${c.fim ? ` Fechada em ${ddmm(c.fim)}.` : ''}</p>`, 'salvar');
  X.edita = slug;
}
async function salvaEditC(){
  const n = document.getElementById('xe-n').value.trim(); if(!n) return erro('xe', 'O nome não pode ficar vazio.');
  const c = g(estado()).cac[X.edita], m = meta('cacadas', X.edita);
  Object.assign(m, {n:n.slice(0, 80), exp:document.getElementById('xe-x').value || null, criada:m.criada || (c && c.criada) || HOJE});
  try { await salva(); } catch(err){ return erro('xe', 'Não salvou: ' + err.message); }
  fechaJanela(); render(); toast('Caçada salva');
}
function abreX(slug){
  const e = slug && g(estado()).exp[slug];
  X.xic = e ? e.ic : 'island'; X.xedita = slug || '';
  janela('xx', e ? 'Editar expedição' : 'Nova expedição', `${e ? '' : '<p>Um projeto que dura semanas ou meses: o TCC, um app seu, a iniciação científica, o estágio. Ele é feito de <b>marcos</b> (cada marco é uma caçada, com as suas etapas) e de tarefas soltas. Fechar um marco dá bônus; concluir a expedição dá +10 XP por semana em que você mexeu nela (até 20 semanas).</p>'}
    <div class="wz-f"><label>nome<input id="xx-n" maxlength="60" value="${e ? esc(e.n) : ''}" placeholder="ex.: Hunter.todo"></label><label>em uma linha<input id="xx-s" maxlength="120" value="${e ? esc(e.sub) : ''}" placeholder="ex.: o app que faço com os amigos"></label></div>
    <label>ícone</label><div class="x-ics" role="group" aria-label="Ícone">${ICS.map(k => `<button type="button" data-xic="${k}" aria-pressed="${k === X.xic}" aria-label="${k}">${ic(k)}</button>`).join('')}</div>`, e ? 'salvar' : 'criar expedição');
}
async function salvaX(){
  const n = document.getElementById('xx-n').value.trim(); if(!n) return erro('xx', 'Dê um nome para a expedição.');
  const slug = X.xedita || novoSlug(n, 'expedicoes'), m = meta('expedicoes', slug);
  Object.assign(m, {n:n.slice(0, 60), sub:document.getElementById('xx-s').value.trim().slice(0, 120), ic:X.xic, ini:m.ini || HOJE});
  try { await salva(); } catch(err){ return erro('xx', 'Não salvou: ' + err.message); }
  fechaJanela(); X.sel = slug; if(cur !== 'x') tab('x'); else render(); toast(X.xedita ? 'Expedição salva' : `Expedição criada <small>${esc(n)} · agora crie o primeiro marco</small>`);
}

/* ---------- fechar marco, concluir expedição ---------- */
async function fechaCac(slug){
  const S = estado(), c = g(S).cac[slug]; if(!c || c.abertas.length) return;
  const m = meta('cacadas', slug), b = c.exp ? Math.max(+m.bonus || 0, HJ.bonusMarco(c)) : 0;
  Object.assign(m, {n:c.n, exp:c.exp, criada:c.criada, fim:HOJE, bonus:b});
  try { await salva(); } catch(err){ toast('Não fechou: ' + esc(err.message)); return; }
  const e = c.exp && g(estado()).exp[c.exp]; render();
  if(e){ toast(`Marco fechado! <small>+${b} XP · ${esc(e.n)} ${e.ok}/${e.marcos.length}</small>`); if(window.HJ_FX) HJ_FX.festa(); }
  else toast(`Caçada fechada <small>${esc(c.n)}</small>`);
}
async function concluiX(slug){
  const e = g(estado()).exp[slug]; if(!e) return;
  const m = meta('expedicoes', slug), b = HJ.bonusExp(e);
  Object.assign(m, {n:e.n, ic:e.ic, sub:e.sub, ini:e.ini, fim:HOJE, bonus:b});
  try { await salva(); } catch(err){ toast('Não concluiu: ' + esc(err.message)); return; }
  X.conf = ''; X.sel = ''; render(); toast(`Expedição concluída! <small>${esc(e.n)} · +${b} XP por ${e.semAtivas} semana${e.semAtivas === 1 ? '' : 's'} ativa${e.semAtivas === 1 ? '' : 's'}</small>`); if(window.HJ_FX) HJ_FX.festa();
}
async function reabreX(slug){
  const m = meta('expedicoes', slug); m.fim = null; m.bonus = 0;
  try { await salva(); } catch(err){ toast('Não reabriu: ' + esc(err.message)); return; }
  X.sel = slug; render(); toast('Expedição reaberta <small>o bônus do fim sai de novo quando você concluir</small>');
}

/* ---------- aba Expedições: peças comuns às visões ---------- */
function etapas(c, S, lim){
  const ab = c.abertas.slice().sort(porDue), fe = c.etapas.filter(t => t.done), ver = X.verFeitas[c.slug], mostra = lim ? ab.slice(0, lim) : ab;
  return `<ul class="l-list x-flat">${mostra.map(t => rowE(t, S)).join('')}${ver ? fe.map(t => rowE(t, S)).join('') : ''}</ul>
    <div class="x-st" style="margin-top:4px;font:11.5px var(--f-mono);color:var(--soft)">${lim && ab.length > lim ? `<span>+${ab.length - lim} depois</span>` : ''}${fe.length ? `<button type="button" class="go" data-xfeitas="${esc(c.slug)}">${ver ? 'esconder as feitas' : `${fe.length} feita${fe.length > 1 ? 's' : ''} · mostrar`}</button>` : ''}${!ab.length && (!c.fim || c.abertas.length) ? fechaBtn(c, S) : ''}</div>
    ${c.fim && !c.abertas.length ? '' : addIn('cac:' + c.slug, `+ etapa em ${c.n} (ex.: Testar no celular amanhã)`)}`;
}
function marco(e, c, i, S, sempre){
  const agora = c === e.atual, aberto = sempre || X.marco === c.slug || (agora && X.marco === undefined);
  return `<div class="x-mrc${c.fim ? ' ok' : agora ? ' agora' : ''}"><div class="x-mrch"><span class="x-n">${c.fim ? '✓' : i + 1}</span><b>${esc(c.n)}</b>
      ${c.fim ? `<span class="pill">fechado ${ddmm(c.fim)}</span><span class="pill bon">+${c.bonus} XP</span>` : `<span class="pill">${c.feitas}/${c.etapas.length} etapas</span>${agora ? '<span class="pill bon">marco atual</span>' : ''}`}
      <button type="button" class="l-ib" data-cedit="${esc(c.slug)}" title="editar o marco" aria-label="editar ${esc(c.n)}">✎</button>${sempre ? '' : `<button type="button" class="go" data-xmarco="${esc(c.slug)}">${aberto ? 'recolher' : 'abrir'}</button>`}</div>
    ${c.fim ? '' : `<div class="x-pbar"><i style="width:${pct(c.feitas, c.etapas.length)}%"></i></div>`}
    ${aberto ? `<div class="x-corpo">${etapas(c, S)}</div>` : ''}</div>`;
}
const cab = e => `<div class="x-top">${ring(e)}<div><b>${esc(e.n)}</b>${e.sub ? `<small>${esc(e.sub)}</small>` : ''}</div></div>`;
const stats = e => `<span class="pill">${e.ok}/${e.marcos.length} marco${e.marcos.length === 1 ? '' : 's'}</span><span class="pill">desde ${ddmm(e.ini)}</span>${e.ganho ? `<span class="pill bon">+${e.ganho} XP nos marcos</span>` : ''}`;
const cSoltas = (e, S) => `<div class="card"><h2><span class="c">~/</span>tarefas soltas</h2>${e.soltas.length ? `<ul class="l-list x-flat">${e.soltas.filter(t => !t.done || t.n).slice().sort(porDue).map(t => rowE(t, S)).join('')}</ul>` : ''}${addIn('exp:' + e.slug, '+ tarefa solta (sem marco)')}
      <p class="x-note">O que não cabe num marco. Vale o XP normal e conta como semana ativa.</p></div>`;
const cSemanas = e => `<div class="card"><h2><span class="c">~/</span>semanas ativas · ${e.semAtivas}</h2>${semanas(e)}<p class="x-note">Semana com pelo menos uma tarefa da expedição feita. É o que paga o fim: <b>+${HJ.EXP_SEMANA} XP por semana</b>, até 20.</p></div>`;
const lado = (e, S) => cSoltas(e, S) + cSemanas(e) + cRecompensa(e);
function cRecompensa(e){
  const conf = X.conf === e.slug;
  return `<div class="card"><h2><span class="c">~/</span>recompensa</h2><div class="x-rules"><span>marcos fechados: <b>+${e.ganho} XP</b></span><span>concluir hoje: <b>+${HJ.bonusExp(e)} XP</b></span><span>XP das tarefas até agora: <b>${fmt(e.xp || 0)} XP</b></span>
      <span>cada marco: ${HJ.MARCO_ETAPA} XP por etapa (até 12) + ${HJ.MARCO_DIA} por dia diferente com etapa feita (até 10)</span></div>
      <div class="x-acts"><button type="button" class="btn v" data-xmarconovo="${esc(e.slug)}">+ marco (nova caçada)</button><button type="button" class="btn" data-xedit="${esc(e.slug)}">editar</button>
        ${conf ? `<button type="button" class="btn" data-xfimok="${esc(e.slug)}" style="border-color:var(--grn)">sim, concluir · +${HJ.bonusExp(e)} XP</button><button type="button" class="go" data-xfim="">cancelar</button>`
          : `<button type="button" class="btn" data-xfim="${esc(e.slug)}"${e.ok ? '' : ' disabled title="feche pelo menos um marco antes"'}>concluir expedição</button>`}</div></div>`;
}
const seletor = (L, sel) => `<div class="x-sel" role="group" aria-label="Expedição">${L.map(x => `<button type="button" class="l-chip" data-xsel="${esc(x.slug)}" aria-pressed="${x.slug === sel.slug}" style="--c:var(--aura)">${ic(x.ic)} ${esc(x.n)} · ${x.ok}/${x.marcos.length}</button>`).join('')}<button type="button" class="l-chip" data-xnova>+ nova expedição</button></div>`;
const semMarco = e => `<div class="card"><p style="margin:0">${esc(e.n)} ainda não tem marcos. Um marco é uma caçada: uma parte do projeto com as suas etapas (ex.: "Versão 1.0", "Capítulo 2").</p><div class="x-acts"><button type="button" class="btn v" data-xmarconovo="${esc(e.slug)}">+ primeiro marco</button></div></div>`;

/* 1 · cards + detalhe */
function vCards(L, e, S){
  return `<div class="x-grid">${L.map(x => `<button type="button" class="card x-card" data-xsel="${esc(x.slug)}" aria-pressed="${x === e}">${cab(x)}${marcos(x)}<span class="x-st">${stats(x)}</span>${semanas(x)}</button>`).join('')}
      <button type="button" class="card x-card" data-xnova style="place-content:center;justify-items:center;border-style:dashed;color:var(--soft);min-height:140px">${ic('island')}<b style="font:600 14px var(--f-ui)">+ nova expedição</b></button></div>
    <div class="x-det">${e.marcos.length ? `<div class="card"><h2><span class="c">~/</span>${esc(e.n)} · marcos</h2>${e.marcos.map((c, i) => marco(e, c, i, S)).join('')}</div>` : semMarco(e)}<div class="x-col">${lado(e, S)}</div></div>`;
}
/* 2 · trilha */
function vTrilha(L, e, S){
  const sel = e.marcos.find(c => c.slug === X.marco) || e.atual || e.marcos[e.marcos.length - 1];
  const st = e.marcos.map(c => { const agora = c === e.atual;
    return `<button type="button" class="x-stn${c.fim ? ' ok' : agora ? ' agora' : ''}${c === sel ? ' sel' : ''}" data-xmarco="${esc(c.slug)}">${agora ? '<span class="eu">você está aqui</span>' : ''}<span class="dot">${c.fim ? '✓' : ic('alvo')}</span>
      <b>${esc(c.n)}</b><small>${c.fim ? `fechado ${ddmm(c.fim)} · +${c.bonus} XP` : `${c.feitas}/${c.etapas.length} etapas${agora ? '' : ' · depois'}`}</small></button>`; }).join('');
  return `${seletor(L, e)}<div class="card"><h2><span class="c">~/</span>mapa · ${esc(e.n)}<span class="sub" style="margin-left:auto">clique numa parada</span></h2>
      <div class="x-trailw"><div class="x-trail"><div class="x-stn ini"><span class="dot">${ic('flag')}</span><b>Partida</b><small>${ddmm(e.ini)}</small></div>${st}
        <button type="button" class="x-stn fim" data-xmarconovo="${esc(e.slug)}" title="acrescentar um marco"><span class="dot">${ic('bau')}</span><b>Fim</b><small>+${HJ.bonusExp(e)} XP hoje · + marco</small></button></div></div></div>
    <div class="x-det">${sel ? `<div class="card"><h2><span class="c">~/</span>parada ${e.marcos.indexOf(sel) + 1} de ${e.marcos.length}</h2>${marco(e, sel, e.marcos.indexOf(sel), S, true)}</div>` : semMarco(e)}<div class="x-col">${lado(e, S)}</div></div>`;
}
/* 3 · quadro: uma coluna por marco, como a aba Chefões */
const cartao = (t, S) => { const dc = t.due && !t.done ? (t.due < HOJE ? ' l-late' : t.due === HOJE ? ' l-hoje' : '') : '', pode = !t.done || t.n;
  return `<div class="x-kc${t.done ? ' done' : ''}" style="--c:${NC(HJ.nenDe(t))}"${pode ? ` data-ln="${t.n}"` : ''}>${pode ? `<button type="button" class="l-ck" data-l="${t.done ? 'reopen' : 'done'}" aria-label="${t.done ? 'reabrir' : 'concluir'}: ${esc(t.txt)}">${t.done ? '✓' : ''}</button>` : ckDone(t)}
    <span class="l-body"><span class="tx">${esc(t.txt)}</span>${t.due && !t.done ? `<span class="l-tags"><span class="l-tag${dc}">${dueTxt(t.due)}</span></span>` : ''}</span><span class="l-xp">+${t.done ? xpDa(t, S) : valeL(t, S).x}</span></div>`; };
function vQuadro(L, e, S){
  const cols = e.marcos.map((c, i) => { const ver = X.verFeitas[c.slug], fe = c.etapas.filter(t => t.done);
    if(c.fim && !c.abertas.length && !ver) return `<div class="x-kcol ok"><div class="x-kh"><span class="x-k">marco ${i + 1} · fechado</span><b>${esc(c.n)}</b><small>${ddmm(c.fim)} · +${c.bonus} XP · ${c.etapas.length} etapa${c.etapas.length === 1 ? '' : 's'}</small><button type="button" class="go" data-xfeitas="${esc(c.slug)}" style="text-align:left">ver etapas</button></div></div>`;
    return `<div class="x-kcol${c === e.atual ? ' agora' : ''}${c.fim && !c.abertas.length ? ' ok' : ''}"><div class="x-kh"><span class="x-k">marco ${i + 1}${c === e.atual ? ' · atual' : ''}</span><b>${esc(c.n)}</b>
        <span class="x-vida" style="width:100%">${c.etapas.map((t, j) => `<i class="${j >= c.feitas ? 'on' : ''}"></i>`).join('')}</span><small>${c.feitas}/${c.etapas.length} etapas${c.fim ? '' : ` · fechar dá +${HJ.bonusMarco(c)} XP`}</small></div>
      <div class="x-kbody">${c.abertas.slice().sort(porDue).map(t => cartao(t, S)).join('')}${ver || !c.abertas.length ? fe.map(t => cartao(t, S)).join('') : ''}
        ${fe.length && c.abertas.length ? `<button type="button" class="go" data-xfeitas="${esc(c.slug)}">${ver ? 'esconder as feitas' : `${fe.length} feita${fe.length > 1 ? 's' : ''}`}</button>` : ''}
        ${!c.abertas.length && !c.fim ? fechaBtn(c, S) : ''}${c.fim && !c.abertas.length ? `<button type="button" class="go" data-xfeitas="${esc(c.slug)}">recolher</button>` : addIn('cac:' + c.slug, '+ etapa')}</div></div>`; }).join('');
  const soltas = `<div class="x-kcol"><div class="x-kh"><span class="x-k" style="color:var(--soft)">sem marco</span><b>Tarefas soltas</b><small>XP normal · contam como semana ativa</small></div><div class="x-kbody">${e.soltas.filter(t => !t.done || t.n).slice().sort(porDue).map(t => cartao(t, S)).join('')}${addIn('exp:' + e.slug, '+ solta')}</div></div>`;
  const novo = `<button type="button" class="x-kcol" data-xmarconovo="${esc(e.slug)}" style="border-style:dashed;cursor:pointer;padding:18px;color:var(--soft);font:600 13px var(--f-ui);flex-basis:170px;align-items:center">+ marco<small class="sub">nova caçada</small></button>`;
  return `${seletor(L, e)}<div class="card" style="margin-bottom:12px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">${cab(e)}<div style="flex:1;min-width:160px">${marcos(e)}</div><span class="x-st">${stats(e)}<span class="pill bon">concluir hoje: +${HJ.bonusExp(e)} XP</span><button type="button" class="go" data-xedit="${esc(e.slug)}">editar</button></span></div>
    <div class="x-kb">${cols}${novo}${soltas}</div><div class="x-det" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${cSemanas(e)}${cRecompensa(e)}</div>`;
}
/* 4 · foco: só o próximo passo de cada projeto */
function vFoco(L, e, S){
  return `<div class="x-foco">${L.map(x => { const tudo = X.fold['f:' + x.slug], c = x.atual;
    return `<div class="card"><div class="x-fc"><div class="esq">${cab(x)}${marcos(x)}<span class="x-st">${stats(x)}</span>${semanas(x)}
        <div class="x-acts" style="margin-top:2px"><button type="button" class="go" data-xfold="f:${esc(x.slug)}">${tudo ? 'só o próximo passo' : `ver os ${x.marcos.length} marcos`}</button><button type="button" class="go" data-xmarconovo="${esc(x.slug)}">+ marco</button><button type="button" class="go" data-xsel="${esc(x.slug)}" data-xvis="cards">recompensa →</button></div></div>
      <div class="x-prox">${tudo ? x.marcos.map((m, i) => marco(x, m, i, S)).join('') : c ? `<p class="cap">próximo passo · marco ${x.marcos.indexOf(c) + 1} de ${x.marcos.length} <b>${esc(c.n)}</b><span class="pill">${c.feitas}/${c.etapas.length}</span></p>${etapas(c, S, 3)}` : `<p class="x-note" style="margin:0">${x.marcos.length ? 'Todos os marcos fechados: conclua a expedição ou crie um marco novo.' : 'Sem marcos ainda.'}</p>`}
        ${x.soltas.some(t => !t.done) ? `<p class="cap" style="margin:12px 0 0">soltas</p><ul class="l-list x-flat">${x.soltas.filter(t => !t.done).sort(porDue).map(t => rowE(t, S)).join('')}</ul>` : ''}</div></div></div>`; }).join('')}
    <button type="button" class="card" data-xnova style="border-style:dashed;cursor:pointer;color:var(--soft);font:600 14px var(--f-ui)">+ nova expedição</button></div>`;
}
/* 5 · cronograma: os marcos numa linha do tempo; embaixo, as etapas por semana */
function vCrono(L, e, S){
  const ini = HJ.addD(HOJE, -HJ.dow(HOJE) - 28), N9 = 63, fimJ = HJ.addD(ini, N9), x = d => pct(HJ.dias(ini, d), N9);
  const linha = (c, i) => { const ds = c.etapas.map(t => t.done || t.due).filter(Boolean).sort(), a = ds[0] || HOJE, b = ds[ds.length - 1] || HOJE, l = x(a < ini ? ini : a), w = Math.max(1.5, x(b) - l);
    return `<div class="lb"><span class="x-n" style="width:20px;height:20px;font-size:10px;${c.fim ? 'background:var(--aura);color:var(--bg)' : ''}">${c.fim ? '✓' : i + 1}</span>${esc(c.n)}<small>${c.feitas}/${c.etapas.length}</small></div>
      <div class="tr">${b >= ini ? `<span class="br${c.fim ? ' ok' : ''}" style="left:${l}%;width:${w}%"></span>` : ''}${c.etapas.filter(t => { const d = t.done || t.due; return d && d >= ini && d <= fimJ; }).map(t => { const d = t.done || t.due, k = `pt${t.done ? ' f' : t.due < HOJE ? ' late' : ''}`, tt = `${esc(t.txt)} · ${t.done ? 'feita ' + ddmm(t.done) : 'prazo ' + ddmm(t.due)}`;
        return !t.done || t.n ? `<button type="button" class="${k}" data-ln="${t.n}" data-l="${t.done ? 'reopen' : 'done'}" style="left:${x(d)}%" title="${tt} (clique para ${t.done ? 'reabrir' : 'concluir'})" aria-label="${tt}"></button>` : `<button type="button" class="${k}" data-xreab="${esc(t.raw)}" style="left:${x(d)}%" title="${tt} (clique para reabrir)" aria-label="${tt}"></button>`; }).join('')}
        ${i === 0 ? `<span class="hj" style="left:${x(HOJE)}%"><span>hoje</span></span>` : ''}</div>`; };
  const abertas = e.marcos.flatMap(c => c.abertas).concat(e.soltas.filter(t => !t.done)).sort(porDue), dom = HJ.addD(HOJE, 6 - HJ.dow(HOJE));
  const grupos = [['Atrasadas', t => t.due && t.due < HOJE], ['Esta semana', t => t.due && t.due >= HOJE && t.due <= dom], ['Próxima semana', t => t.due && t.due > dom && t.due <= HJ.addD(dom, 7)], ['Depois', t => t.due && t.due > HJ.addD(dom, 7)], ['Sem data', t => !t.due]];
  return `${seletor(L, e)}<div class="card"><h2><span class="c">~/</span>cronograma · ${esc(e.n)}<span class="sub" style="margin-left:auto">cada ponto é uma etapa: clique para marcar</span></h2>
      ${e.marcos.length ? `<div class="x-gantt"><div class="x-gt"><div></div><div class="hd">${Array.from({length:9}, (_, i) => HJ.addD(ini, 7*i)).map(d => `<span style="left:${x(d)}%">${ddmm(d)}</span>`).join('')}</div>${e.marcos.map(linha).join('')}</div></div>` : '<p class="x-note">Sem marcos ainda.</p>'}
      <div class="x-st" style="margin-top:12px">${stats(e)}<span class="pill bon">concluir hoje: +${HJ.bonusExp(e)} XP</span><button type="button" class="go" data-xmarconovo="${esc(e.slug)}">+ marco</button><button type="button" class="go" data-xedit="${esc(e.slug)}">editar</button></div></div>
    <div class="x-semanas">${grupos.map(([n, f]) => { const l = abertas.filter(f); return l.length ? `<div class="card"><h2><span class="c">~/</span>${n}<span class="sub" style="margin-left:auto">${l.length}</span></h2><ul class="l-list x-flat">${l.map(t => rowL(t, S)).join('')}</ul></div>` : ''; }).join('')}
      <div class="card"><h2><span class="c">~/</span>etapa nova</h2>${e.marcos.filter(c => !c.fim || c.abertas.length).map(c => `<p class="cap" style="margin:6px 0 0">${esc(c.n)}</p>${addIn('cac:' + c.slug, '+ etapa (ex.: Gráficos sexta)')}`).join('')}<p class="cap" style="margin:6px 0 0">sem marco</p>${addIn('exp:' + e.slug, '+ tarefa solta')}</div></div>`;
}

function aba(S){
  const root = document.getElementById('x-root'); if(!root) return;
  const L = ativas(S), velhas = Object.values(g(S).exp).filter(e => e.fim);
  if(!L.some(e => e.slug === X.sel)) X.sel = L[0] ? L[0].slug : '';
  const e = L.find(x => x.slug === X.sel);
  const head = `<div class="x-head"><h2 class="h">Expedições</h2><p>Projetos longos, fora das disciplinas. Cada marco é uma caçada: feche as etapas dela para ganhar o bônus do marco. As tarefas também aparecem na Lista.</p>
    <div class="x-vis" role="group" aria-label="Visão"><span>ver como</span>${VIS.map(([k, n, d]) => `<button type="button" class="l-chip" data-xvis="${k}" aria-pressed="${X.vis === k}" title="${d}">${n}</button>`).join('')}</div>
    <button type="button" class="btn v" data-xnova>+ nova expedição</button></div>`;
  const corpo = !e ? `<div class="card" style="max-width:720px"><h2><span class="c">~/</span>nenhuma expedição ainda</h2><p style="margin:0 0 8px">Uma expedição é um projeto que dura semanas ou meses e não é de uma disciplina: o TCC, um app seu, a iniciação científica, o estágio.</p>
      <p class="x-note" style="margin:0">Ela é feita de <b>marcos</b>: cada marco é uma caçada, com as suas etapas. Fechar um marco dá ${HJ.MARCO_ETAPA} XP por etapa e ${HJ.MARCO_DIA} por dia diferente em que você trabalhou nele; concluir a expedição dá +${HJ.EXP_SEMANA} XP por semana ativa.</p>
      <div class="x-acts"><button type="button" class="btn v" data-xnova>+ criar a primeira</button></div></div>`
    : ({cards:vCards, trilha:vTrilha, quadro:vQuadro, foco:vFoco, crono:vCrono})[X.vis](L, e, S);
  const fim = velhas.length ? `<details class="card" style="margin-top:14px"${X.velhas ? ' open' : ''}><summary class="go" data-xvelhas style="list-style:none">concluídas (${velhas.length})</summary>
      ${velhas.map(v => `<div class="x-mini" style="cursor:default">${ring(v, 32)}<span><b>${esc(v.n)}</b><small>concluída em ${ddmm(v.fim)} · +${v.bonus} XP no fim · ${v.marcos.length} marcos</small></span><button type="button" class="go" data-xreabre="${esc(v.slug)}">reabrir</button></div>`).join('')}</details>` : '';
  root.innerHTML = head + corpo + fim;
  if(X.foco){ const f = root.querySelector(`[data-xadd="${CSS.escape(X.foco)}"] input`); if(f) f.focus(); X.foco = ''; }
}

/* ---------- cliques, envios e teclas ---------- */
document.addEventListener('click', async ev => {
  const q = s => ev.target.closest(s); let b;
  if(q('#l-more')){ UI.ldet = !UI.ldet; formCacadas(); if(UI.ldet) formL(); return; }
  if((b = q('[data-cfold]'))){ UI.cfold = UI.cfold || {}; const k = b.dataset.cfold; UI.cfold[k] = !UI.cfold[k]; render(); return; }
  if((b = q('[data-cetapa]'))){ UI.ldet = true; UI.lcac = b.dataset.cetapa; formL(); const t = document.getElementById('l-txt'); t.focus(); t.scrollIntoView({block:'center'}); return; }
  if((b = q('[data-cedit]'))){ abreEditC(b.dataset.cedit); return; }
  if((b = q('[data-cfecha]'))){ b.disabled = true; fechaCac(b.dataset.cfecha); return; }
  if(q('[data-xnova]')){ abreX(); return; }
  if((b = q('[data-xedit]'))){ abreX(b.dataset.xedit); return; }
  if((b = q('[data-xmarconovo]'))){ abreC(b.dataset.xmarconovo); return; }
  if((b = q('[data-xir]'))){ X.sel = b.dataset.xir; X.marco = undefined; tab('x'); return; }
  if((b = q('[data-xvis]'))){ X.vis = b.dataset.xvis; if(b.dataset.xsel) X.sel = b.dataset.xsel; X.marco = undefined; try { localStorage.setItem('hj-expv', X.vis); } catch(e){} render(); return; }
  if((b = q('[data-xsel]'))){ X.sel = b.dataset.xsel; X.marco = undefined; X.conf = ''; render(); return; }
  if((b = q('[data-xmarco]'))){ const m = b.dataset.xmarco, e = g(estado()).exp[X.sel], aberto = X.marco === m || (X.marco === undefined && e && e.atual && e.atual.slug === m);
    X.marco = X.vis === 'trilha' ? m : aberto ? null : m; render(); return; }
  if((b = q('[data-xfeitas]'))){ const k = b.dataset.xfeitas; X.verFeitas[k] = !X.verFeitas[k]; render(); return; }
  if((b = q('[data-xfold]'))){ const k = b.dataset.xfold; X.fold[k] = !X.fold[k]; render(); return; }
  if((b = q('[data-xfim]'))){ X.conf = b.dataset.xfim; render(); return; }
  if((b = q('[data-xfimok]'))){ b.disabled = true; concluiX(b.dataset.xfimok); return; }
  if((b = q('[data-xreabre]'))){ reabreX(b.dataset.xreabre); return; }
  if((b = q('[data-xreab]'))){ b.disabled = true; reabreE(b.dataset.xreab); return; }
  if(q('[data-xvelhas]')){ X.velhas = !document.querySelector('[data-xvelhas]').parentNode.open; return; }
  if((b = q('[data-xic]'))){ X.xic = b.dataset.xic; document.querySelectorAll('[data-xic]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if(q('[data-xfecha]')){ fechaJanela(); return; }
  if(q('[data-xok]')){ if(document.getElementById('xc')) criaC(); else if(document.getElementById('xe')) salvaEditC(); else if(document.getElementById('xx')) salvaX(); return; }
  if(ev.target.id === 'xn'){ fechaN(); return; }
  if(['xc','xe','xx'].includes(ev.target.id)){ fechaJanela(); return; }
});
document.addEventListener('change', ev => { if(ev.target.id === 'l-cac'){ UI.lcac = ev.target.value; formCacadas(); prevL(); if(UI.lcac === '+nova') document.getElementById('l-cacn').focus(); } });
document.addEventListener('input', ev => { if(ev.target.id === 'l-cacn') prevL(); });
document.addEventListener('submit', async ev => {
  const f = ev.target.closest('[data-xadd]'); if(!f) return;
  ev.preventDefault(); const inp = f.querySelector('input'), v = inp.value.trim(); if(!v) return;
  inp.disabled = true;
  try { const nome = await addEtapa(f.dataset.xadd, v, estado()); await recarrega(); X.foco = f.dataset.xadd; render(); toast(`Adicionada em ${esc(nome)}`); }
  catch(err){ inp.disabled = false; toast('Não adicionou: ' + esc(err.message)); }
});
document.addEventListener('keydown', ev => {
  if(ev.key === 'Escape'){ if(document.getElementById('xn')){ fechaN(); return; } if(document.querySelector('#xc,#xe,#xx')){ fechaJanela(); return; } }
  if(ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && document.getElementById('xc')){ ev.preventDefault(); criaC(); return; }
  if(ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
  const a = document.activeElement; if(a && (a.matches('input,textarea,select') || a.isContentEditable)) return;
  if(document.querySelector('.wz-bg, #tr-pop')) return;   // outra janela ou um tutorial aberto
  if(ev.key === 'n' || ev.key === 'N'){ ev.preventDefault(); abreN(); }
  else if(ev.key === 'c' || ev.key === 'C'){ ev.preventDefault(); abreC(cur === 'x' ? X.sel : ''); }
});

window.HJ_EXP = {aba, blocosLista, etiquetas, lateral, formCacadas, tagForm, antesDeAdicionar, depoisDeAdicionar, abreN, abreC};
})();
