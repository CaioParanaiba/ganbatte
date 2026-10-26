/* Ganbatte · ementa e caçada da prova, dentro do chefão aberto (aba Chefões, #214).
 * A ementa é a lista de itens do conteúdo programático (a IA lê os planos de ensino da pasta planos/ e o jogador aprova). Os estudos
 * são tarefas normais do todo.txt com top:ITEM (vêm das aulas, aulas.js); a aba "ementa" mostra cada item com os seus estudos,
 * os itens "ainda sem aula" e os estudos "fora da ementa". Cada avaliação tem uma faixa na ementa (o item onde a matéria começa e
 * onde termina) e o botão "ativar caçada da prova", que monta a caçada só com o que está dentro da faixa: estudos concluídos antes
 * da primeira ativação viram revisões (uma por estudo), os pendentes entram como estão (ganham +cac.NOME) e os itens sem estudo
 * viram "Estudar X (sem resumo...)". O jogador vê a lista antes de gravar; o botão também atualiza, sem duplicar.
 * Grava a ementa e as faixas por POST /api/ementa (ementas.json) e a caçada no estado.json: cacadas[NOME] = {n, criada, prazo,
 * prova: {d, av, ativada}}, com as etapas pelo /api/add e /api/act. Carregado depois de aulas.js: usa GB_AULAS (os dados das aulas
 * e as ementas), CN_ABAS, CTX, D, EST, HOJE, BOSSES, UI, render, recarrega, post, esc, toast, ddmm, estado, discOf e o estilo .wz.
 */
(function(){
'use strict';

document.head.insertAdjacentHTML('beforeend', `<style>
.em{display:grid;gap:2px}
.em-top{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:4px} .em-top .btn{margin-left:auto}
.em-u{font:600 10.5px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.1em;padding:12px 0 2px}
.em-u:first-child{padding-top:0}
.em-i{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:2px 10px;align-items:baseline;padding:7px 0;border-top:1px solid var(--hair);font-size:13.5px}
.em-u + .em-i{border-top:0}
.em-i .ek{font:600 12px var(--f-mono);color:var(--soft)} .em-i .t small{font:11px var(--f-mono);color:var(--faint);margin-left:6px}
.em-i .n{font:600 11.5px var(--f-mono);color:var(--soft);white-space:nowrap} .em-i .n.vz{font-weight:400;color:var(--faint)}
.em-i.fora .t{color:var(--soft)}
.em-es{grid-column:2/-1;display:grid;gap:1px}
.em-e{display:flex;gap:7px;align-items:baseline;font-size:12.5px;color:var(--soft);min-width:0} .em-e b{font:600 11px var(--f-mono);color:var(--faint);flex:none}
.em-e.ok b{color:var(--grn)} .em-e.ok span{text-decoration:line-through;text-decoration-color:var(--faint)}
.em-mk{display:flex;align-items:center;gap:10px;font:600 11px var(--f-mono);color:var(--amb);padding:4px 0}
.em-mk::before,.em-mk::after{content:"";flex:1;border-top:1px dashed color-mix(in srgb,var(--amb) 55%,var(--hair))}
.em-fx{grid-column:1/-1;display:flex;gap:6px 10px;align-items:center;flex-wrap:wrap;font:11.5px var(--f-mono);color:var(--soft)}
.em-fx b{color:var(--ink);font-weight:600} .em-fx .sg{color:var(--faint)} .em-fx .ok{color:var(--grn)}
.em-fx select{max-width:200px;font:12px var(--f-ui);background:var(--panel2);color:var(--ink);border:1px solid var(--hair);border-radius:6px;padding:2px 4px}
.em-fx .btn{padding:3px 10px;font-size:12px} .em-fx .sep{color:var(--faint)}
#emd .wz,#emc .wz{max-width:760px}
.emd-r{display:grid;grid-template-columns:18px minmax(0,1fr) 80px minmax(0,2fr) 90px 30px;gap:6px;align-items:center}
.emd-r input[type=text],.emd-r select{font-size:13px;padding:5px 7px}
.emd-r input[readonly]{color:var(--soft);background:transparent}
.emd-r small{grid-column:2/-1;font:11px var(--f-mono);color:var(--faint);margin-top:-3px}
.emd-h{display:grid;grid-template-columns:18px minmax(0,1fr) 80px minmax(0,2fr) 90px 30px;gap:6px;font:600 10.5px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.08em}
.emd-ls{display:grid;gap:8px;max-height:46vh;overflow:auto;padding-right:4px}
.emd-pl{display:flex;gap:6px 14px;flex-wrap:wrap} .emd-pl label{flex-direction:row;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font:13px var(--f-ui);color:var(--soft)}
.emc-g{font:600 10.5px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.1em;padding-top:6px}
.emc-r{display:grid;grid-template-columns:20px minmax(0,1fr);gap:4px 8px;align-items:center;font-size:13.5px}
.emc-r input[type=text]{font-size:13px;padding:4px 7px} .emc-r small{grid-column:2;font:11px var(--f-mono);color:var(--faint)}
.emc-r input[type=checkbox]{margin:0;accent-color:var(--volt)}
.emc-av{border-left:3px solid var(--amb);background:var(--panel2);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--soft)}
@media (max-width:720px){ .emd-r,.emd-h{grid-template-columns:18px 70px minmax(0,1fr) 30px} .emd-r .u,.emd-r .a,.emd-h .u,.emd-h .a{display:none} }
</style>`);

const dados = () => window.GB_AULAS ? GB_AULAS.dados() : {aulas:[], ementas:{}};
const ementa = d => { const e = (dados().ementas || {})[d] || {}; return {itens: e.itens || [], faixas: e.faixas || {}}; };
const low = s => String(s || '').toLowerCase();
const normT = t => GBx.norm(String(t || '')).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
async function gravaEmenta(d, corpo){
  const r = await post('/api/ementa', {sigla:d, ...corpo});
  dados().ementas = r.ementas;
}

/* ---------- estudos por item ----------
   estudo = tarefa da disciplina com top:ITEM, ou que veio de uma aula (aula:) e começa com "Estudar". top: de item que não existe
   (ou estudo sem top:) fica em "fora da ementa". Item unido a outro guarda as chaves antigas (alias) e continua achando os estudos */
function estudos(b){
  const its = ementa(b.d).itens, chave = {}, por = {}, fora = [];
  for(const it of its){ por[it.k] = []; for(const k of [it.k].concat(it.alias || [])) chave[low(k)] = it.k; }
  for(const t of D.abertas.concat(D.feitas)){
    if(discOf(t) !== b.d || (!t.top && !(t.aula && /^estudar\b/i.test(t.txt)))) continue;
    const k = t.top && chave[low(t.top)];
    if(k) por[k].push(t); else fora.push(t);
  }
  const ordem = (p, q) => (!!p.done - !!q.done) || String(p.done || p.aula || '').localeCompare(String(q.done || q.aula || ''));
  for(const k in por) por[k].sort(ordem);
  return {por, fora: fora.sort(ordem)};
}

/* ---------- faixa de cada avaliação ----------
   início: o escolhido, ou o item seguinte ao fim da última avaliação anterior (pela data) que tem fim, ou o primeiro item que o
   plano liga a ela, ou o primeiro da ementa; fim: o escolhido, ou nenhum (ainda não definido) */
const provas = b => b.avs.filter(a => !a.cont).sort((p, q) => String(p.dt).localeCompare(String(q.dt)) || p.k.localeCompare(q.k));
function faixa(b, a){
  const {itens, faixas} = ementa(b.d), idx = k => itens.findIndex(i => i.k === k), fx = faixas[String(a.k).toUpperCase()] || {};
  const ps = provas(b), ant = ps.slice(0, Math.max(0, ps.indexOf(a))).reverse().map(x => faixa(b, x)).find(f => f.fim >= 0);
  const pl = itens.findIndex(i => i.av === String(a.k).toUpperCase());
  const padrao = ant ? Math.min(ant.fim + 1, itens.length - 1) : Math.max(pl, 0);
  const ini = idx(fx.ini) >= 0 ? idx(fx.ini) : padrao, fim = idx(fx.fim);
  return {ini, fim, padrao, escolhido: !!fx.ini, its: itens.slice(ini, fim >= ini ? fim + 1 : itens.length)};
}
/* sugestão para o fim: o aviso do professor numa aula, a avaliação que o plano liga aos itens ou o último item que já teve aula */
function sugereFim(b, a){
  const {itens} = ementa(b.d), f = faixa(b, a), k = String(a.k).toUpperCase();
  const au = dados().aulas.filter(x => x.sigla === b.d && (x.faixas || []).some(y => y.av === k)).sort((p, q) => q.data.localeCompare(p.data))[0];
  if(au){ const y = au.faixas.find(y => y.av === k); if(itens.some(i => i.k === y.fim)) return {k:y.fim, de:`a aula de ${ddmm(au.data)} (${y.min})`}; }
  const pl = itens.map((i, n) => [i, n]).filter(([i, n]) => i.av === k && n >= f.ini).pop();
  if(pl) return {k:pl[0].k, de:'o plano de ensino'};
  const {por} = estudos(b), ul = itens.map((i, n) => [i, n]).filter(([i, n]) => n >= f.ini && por[i.k].length).pop();
  return ul ? {k:ul[0].k, de:'o último item que já teve aula'} : null;
}

/* ---------- aba "ementa" ---------- */
UI.emfil = UI.emfil || {};
function abaEmenta(b){
  const {itens} = ementa(b.d);
  if(!itens.length) return `<p class="cn-vz">A ementa é a lista de itens do conteúdo do plano de ensino. Com ela, cada estudo que vem das aulas fica no seu item, você vê o que ainda não teve aula e cada avaliação ganha a sua faixa de matéria e a caçada da prova.</p>
    <div class="cn-op"><button type="button" class="btn v" data-emedit="${b.d}">montar a ementa</button></div>`;
  const ps = provas(b), fil = ps.find(a => a.k === UI.emfil[b.d]), {por, fora} = estudos(b);
  const f = fil && faixa(b, fil), vis = f ? f.its : itens;
  const fins = {}; for(const a of ps){ const x = faixa(b, a); if(x.fim >= 0) (fins[itens[x.fim].k] = fins[itens[x.fim].k] || []).push(a); }
  let u = null, h = '';
  for(const it of vis){
    if((it.u || '') !== u){ u = it.u || ''; if(u) h += `<div class="em-u">${esc(u)}</div>`; }
    const es = por[it.k], ok = es.filter(t => t.done).length;
    h += `<div class="em-i"><span class="ek">${esc(it.k)}</span><span class="t">${esc(it.t)}${it.orig ? `<small>${esc(it.orig)}</small>` : ''}</span>
      <span class="n${es.length ? '' : ' vz'}">${es.length ? `${ok}/${es.length}` : 'ainda sem aula'}</span>
      ${es.length ? `<span class="em-es">${es.map(t => `<span class="em-e${t.done ? ' ok' : ''}"><b>${t.done ? '✓' : '○'}</b><span>${esc(t.txt)}</span></span>`).join('')}</span>` : ''}</div>`;
    if(fins[it.k]) h += `<div class="em-mk" title="${esc(fins[it.k].map(a => a.n).join(' e '))}">${fins[it.k].map(a => esc(a.k)).join(' e ')} vai até aqui</div>`;
  }
  if(fora.length && !f) h += `<div class="em-u">fora da ementa</div><div class="em-i fora"><span class="ek">—</span><span class="t">estudos sem item (ou com um item que saiu da ementa)</span><span class="n">${fora.filter(t => t.done).length}/${fora.length}</span>
    <span class="em-es">${fora.map(t => `<span class="em-e${t.done ? ' ok' : ''}"><b>${t.done ? '✓' : '○'}</b><span>${esc(t.txt)}${t.top ? ` <small class="mono">top:${esc(t.top)}</small>` : ''}</span></span>`).join('')}</span></div>`;
  const comEst = itens.filter(i => por[i.k].length).length;
  return `<div class="em"><div class="em-top">${ps.length ? `<div class="nl-seg" role="group" aria-label="Itens de qual avaliação"><button type="button" data-emfil="${b.d}:" aria-pressed="${!fil}">tudo</button>${ps.map(a => `<button type="button" data-emfil="${b.d}:${esc(a.k)}" aria-pressed="${fil === a}" title="${esc(a.n)}">${esc(a.k)}</button>`).join('')}</div>` : ''}
      <span class="sub mono">${itens.length} itens · ${comEst} com estudo</span><button type="button" class="btn" data-emedit="${b.d}">editar ementa</button></div>
    ${f && f.fim < 0 ? `<p class="cn-vz">O fim da matéria de ${esc(fil.n)} ainda não foi definido: a lista vai até o último item. Defina na aba avaliações.</p>` : ''}${h}</div>`;
}
CN_ABAS.em = {n:'ementa', h:abaEmenta, c:b => ementa(b.d).itens.length || ''};

/* ---------- a linha da faixa e da caçada em cada avaliação (aba avaliações) ---------- */
const cacDaProva = (b, a) => Object.entries(EST.cacadas || {}).find(([s, m]) => m && m.prova && m.prova.d === b.d && m.prova.av === a.k && !m.apagada);
function avLinha(b, a){
  const {itens} = ementa(b.d); if(!itens.length || a.cont) return '';
  const id = `${b.d}:${a.k}`, f = faixa(b, a), cc = cacDaProva(b, a);
  if(UI.emfx === id){
    const sg = sugereFim(b, a), op = (v, sel) => itens.map(i => `<option value="${esc(i.k)}"${i.k === sel ? ' selected' : ''}>${esc(i.k)} · ${esc(i.t.slice(0, 40))}</option>`).join('');
    return `<span class="em-fx">de <select id="emfx-i" aria-label="começa em"><option value="">padrão: ${esc(itens[f.padrao] ? itens[f.padrao].k : '—')}</option>${op('', f.escolhido ? itens[f.ini].k : '')}</select>
      até <select id="emfx-f" aria-label="termina em"><option value="">ainda não sei</option>${op('', f.fim >= 0 ? itens[f.fim].k : (sg ? sg.k : ''))}</select>
      <button type="button" class="btn v" data-emfxok="${id}">salvar</button><button type="button" class="go" data-emfx="">cancelar</button>
      ${sg ? `<span class="sg">sugestão: até ${esc(sg.k)}, pelo que diz ${esc(sg.de)}</span>` : ''}</span>`;
  }
  const c = cc && estado().grupos.cac[cc[0]];
  let cac = '';
  if(c){ const n = plano(b, a).novas;
    cac = c.fim ? `<span class="ok">caçada fechada</span>` : `<span>caçada ${c.tudoFeitas}/${c.tudo.length}</span>${n ? `<button type="button" class="go" data-emcac="${id}">atualizar (+${n})</button>` : '<span class="sg">em dia</span>'}`; }
  else if(a.dt >= HOJE && a.nota == null) cac = `<button type="button" class="btn" data-emcac="${id}">ativar caçada da prova</button>`;
  if(f.fim < 0 && a.dt < HOJE && !cc) return '';   // avaliação que já passou sem faixa: nada a fazer aqui (o início da próxima se escolhe nela)
  const sg = f.fim < 0 && sugereFim(b, a);
  const fx = f.fim >= 0 ? `matéria <b>${esc(itens[f.ini].k)} → ${esc(itens[f.fim].k)}</b> (${f.its.length} ${f.its.length === 1 ? 'item' : 'itens'}) <button type="button" class="go" data-emfx="${id}">mudar</button>`
    : `matéria: até onde vai? <button type="button" class="go" data-emfx="${id}">definir</button>${sg ? `<span class="sg">sugestão: até ${esc(sg.k)}</span><button type="button" class="go" data-emusa="${id}:${esc(sg.k)}">usar</button>` : ''}`;
  return `<span class="em-fx">${fx}${cac ? `<span class="sep">·</span>${cac}` : ''}</span>`;
}
async function salvaFaixa(d, k, ini, fim){
  const fx = {...ementa(d).faixas}; fx[String(k).toUpperCase()] = {ini, fim};
  try { await gravaEmenta(d, {faixas:fx}); UI.emfx = ''; render(); toast(fim ? `Faixa salva <small>${esc(k)} vai até ${esc(fim)}</small>` : 'Faixa salva'); }
  catch(err){ toast('Não salvou: ' + esc(err.message)); }
}

/* ---------- caçada da prova ----------
   o que a caçada ganharia agora, só dentro da faixa: revisões (estudo concluído até o dia da primeira ativação, fora da caçada),
   pendentes (estudo aberto fora de qualquer caçada) e itens sem nenhum estudo (só com o fim da faixa definido). Sem duplicar:
   revisão que já existe na caçada (mesmo texto) não volta, e item que ganhou o "sem resumo" já tem estudo */
const revTxt = t => `Revisar ${t.txt.replace(/^estudar\s+/i, '')}, estudado em ${ddmm(t.done)}`;
function plano(b, a){
  const f = faixa(b, a), {por} = estudos(b), cc = cacDaProva(b, a), slug = cc ? cc[0] : '', corte = cc ? cc[1].prova.ativada : HOJE;
  const etapas = slug ? D.abertas.concat(D.feitas).filter(t => GBx.cacDe(t) === slug) : [], ja = new Set(etapas.map(t => normT(t.txt)));
  const rev = [], pend = [], sem = [];
  for(const it of f.its){
    const es = por[it.k];
    for(const t of es){
      if(GBx.cacDe(t)) continue;
      if(t.done){ if(t.done <= corte && !ja.has(normT(revTxt(t)))) rev.push({it, t, txt:revTxt(t)}); }
      else pend.push({it, t});
    }
    if(!es.length && f.fim >= 0) sem.push({it, txt:`Estudar ${it.t} (sem resumo; usar slides ou livro)`});
  }
  return {f, slug, corte, rev, pend, sem, novas: rev.length + pend.length + sem.length};
}
let C = null;
function abreCac(d, k){
  const b = estado().bs.find(x => x.d === d), a = b && b.avs.find(x => x.k === k); if(!a) return;
  const P = plano(b, a), cc = cacDaProva(b, a);
  if(!P.novas){ toast(cc ? 'A caçada já está em dia <small>nada novo dentro da faixa</small>' : 'Nada para pôr na caçada <small>defina a faixa ou mande aulas</small>'); return; }
  C = {d, k, P, nome: cc ? cc[1].n : `${a.n} · ${b.d}`, novo: !cc, tira: new Set(), txt:{}};
  desenhaCac();
}
function desenhaCac(){
  let bg = document.getElementById('emc'); if(!bg){ bg = document.createElement('div'); bg.id = 'emc'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const b = estado().bs.find(x => x.d === C.d), a = b.avs.find(x => x.k === C.k), {P} = C, {itens} = ementa(C.d);
  const row = (id, txt, edit, sub) => `<div class="emc-r"><input type="checkbox" data-emct="${id}"${C.tira.has(id) ? '' : ' checked'} aria-label="incluir">
    ${edit ? `<input type="text" data-emctx="${id}" value="${esc(C.txt[id] != null ? C.txt[id] : txt)}" aria-label="texto da etapa">` : `<span>${esc(txt)}</span>`}<small>${esc(sub)}</small></div>`;
  const n = P.novas - C.tira.size;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="emc-t">
    <div class="wz-top">${avB(b, 42)}<div><h2 id="emc-t">${C.novo ? 'Ativar caçada da prova' : 'Atualizar caçada da prova'}</h2><p>${esc(a.n)} · ${esc(b.d)} · prova em ${ddmm(a.dt)}</p></div></div>
    <div class="wz-body">
      ${P.f.fim < 0 ? `<div class="emc-av">O fim da matéria ainda não foi definido: a caçada leva só o que já tem estudo, de ${esc(itens[P.f.ini].k)} em diante. Para incluir os itens sem estudo, defina até onde vai a matéria na aba avaliações.</div>` : `<p class="sub">Só o que está na faixa ${esc(itens[P.f.ini].k)} → ${esc(itens[P.f.fim].k)}. As etapas novas não têm prazo próprio: o prazo é o da caçada, o dia da prova.</p>`}
      ${C.novo ? `<label>nome da caçada<input id="emc-n" maxlength="80" value="${esc(C.nome)}"></label>` : ''}
      ${P.rev.length ? `<div class="emc-g">revisões · ${P.rev.length}</div><p class="sub" style="margin:0">Um estudo concluído ${C.novo ? 'até hoje' : `até ${ddmm(P.corte)}, o dia da primeira ativação`} vira uma revisão.</p>${P.rev.map((x, i) => row('r' + i, x.txt, true, x.it.k + ' · ' + x.it.t)).join('')}` : ''}
      ${P.pend.length ? `<div class="emc-g">estudos pendentes · ${P.pend.length}</div><p class="sub" style="margin:0">Entram na caçada como estão (as mesmas tarefas).</p>${P.pend.map((x, i) => row('p' + i, x.t.txt, false, x.it.k + ' · ' + x.it.t)).join('')}` : ''}
      ${P.sem.length ? `<div class="emc-g">itens sem estudo · ${P.sem.length}</div>${P.sem.map((x, i) => row('s' + i, x.txt, true, x.it.k)).join('')}` : ''}
    </div>
    <div class="wz-foot"><span class="err" role="alert" id="emc-err"></span><span style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-emcfecha>cancelar</button>
      <button type="button" class="btn v" data-emcok${n ? '' : ' disabled'}>${C.novo ? 'criar a caçada' : 'acrescentar'} · ${n} etapa${n === 1 ? '' : 's'}</button></span></div></div>`;
}
function fechaCac(){ const el = document.getElementById('emc'); if(el) el.remove(); C = null; }
function novoSlug(nome){
  const base = GBx.slugDe(nome) || 'prova', usado = s => (EST.cacadas && EST.cacadas[s]) || D.abertas.concat(D.feitas).some(t => GBx.cacDe(t) === s);
  let s = base, i = 2; while(usado(s)) s = `${base}-${i++}`; return s;
}
async function gravaCac(){
  const c = C; if(!c || c.salvando) return;
  const b = estado().bs.find(x => x.d === c.d), a = b.avs.find(x => x.k === c.k), P = c.P, err = document.getElementById('emc-err');
  const nome = c.novo ? ((document.getElementById('emc-n') || {}).value || '').trim() : c.nome;
  if(!nome){ err.textContent = 'Dê um nome para a caçada.'; return; }
  c.salvando = true; document.querySelector('[data-emcok]').disabled = true;
  const txt = id => ((document.querySelector(`[data-emctx="${id}"]`) || {}).value || '').trim();
  let feitas = 0;
  try {
    const slug = P.slug || novoSlug(nome);
    EST.cacadas = EST.cacadas || {};
    const m = EST.cacadas[slug] = EST.cacadas[slug] || {};
    Object.assign(m, {n:nome.slice(0, 80), criada:m.criada || HOJE, prazo:a.dt, prova:{d:c.d, av:a.k, ativada:(m.prova && m.prova.ativada) || HOJE}});
    await post('/api/jogo/estado', {estado:EST});
    const lin = (t, it) => [t, `+fac.${c.d}`, '@estudo', it ? `top:${it.k}` : '', `+cac.${slug}`].filter(Boolean).join(' ');
    for(const [i, x] of P.rev.entries()) if(!c.tira.has('r' + i)){ await post('/api/add', {text: lin(txt('r' + i) || x.txt)}); feitas++; }
    for(const [i, x] of P.sem.entries()) if(!c.tira.has('s' + i)){ await post('/api/add', {text: lin(txt('s' + i) || x.txt, x.it)}); feitas++; }
    for(const [i, x] of P.pend.entries()) if(!c.tira.has('p' + i)){
      const corpo = x.t.raw.replace(/^\([A-Z]\) /, '').replace(/^\d{4}-\d{2}-\d{2} /, '');
      await post('/api/act', {raw:x.t.raw, action:'edit', value:`${corpo} +cac.${slug}`}); feitas++;
    }
    fechaCac(); await recarrega(); render();
    toast(`${c.novo ? 'Caçada da prova criada' : 'Caçada atualizada'} <small>${esc(nome)} · ${feitas} etapa${feitas === 1 ? '' : 's'} · prazo ${ddmm(a.dt)}</small>`);
  } catch(e){
    c.salvando = false; if(err) err.textContent = (feitas ? `Gravou ${feitas} etapa(s) e parou: ` : 'Não gravou: ') + e.message;
    if(feitas){ await recarrega().catch(() => {}); fechaCac(); render(); }
    else { const bt = document.querySelector('[data-emcok]'); if(bt) bt.disabled = false; }
  }
}

/* ---------- editor da ementa ----------
   a IA lê os planos da disciplina (todos os que têm a sigla ou o nome no nome do arquivo; teoria e prática viram uma lista só,
   sem repetir) e propõe "unidade | chave | item | origem | avaliação"; o jogador edita, une, apaga e salva. A chave de um item
   que já tem estudo não muda (é ela que está no top: das tarefas); unir guarda as chaves dos outros no item que fica */
let M = null;
const planosDe = d => { const j = (CTX.JOG.disciplinas || []).find(x => x.d === d) || {}, sem = t => GBx.norm(String(t)).replace(/[^a-z0-9]/g, '');
  const ps = window.GB_IA ? GB_IA.planos() : [];
  return ps.filter(f => new RegExp(`(^|[^a-z0-9])${GBx.norm(d).replace(/[^a-z0-9]/g, '')}([^a-z0-9]|$)`).test(GBx.norm(f)) || (j.n && sem(j.n).length > 3 && sem(f).includes(sem(j.n)))); };
function abreEd(d){
  const b = BOSSES.find(x => x.d === d); if(!b) return;
  const st = estudos(estado().bs.find(x => x.d === d) || {d}), uso = {};
  for(const [k, ts] of Object.entries(st.por)) uso[k] = ts.length;
  M = {d, b, its: ementa(d).itens.map(i => ({...i, alias:[...(i.alias || [])], orig0:i.k})), uso, sel:new Set(), pls:new Set(planosDe(d)), obs:[], err:'', confirma:''};
  desenhaEd();
}
function le(){ document.querySelectorAll('[data-emdf]').forEach(el => { const [i, c] = el.dataset.emdf.split(':'); if(M.its[+i]) M.its[+i][c] = el.value; }); }
function desenhaEd(){
  let bg = document.getElementById('emd'); if(!bg){ bg = document.createElement('div'); bg.id = 'emd'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const avs = (estado().bs.find(x => x.d === M.d) || {avs:[]}).avs, lig = window.GB_IA && GB_IA.ligada(), ps = window.GB_IA ? GB_IA.planos() : [];
  const ta = `<textarea id="emd-cola" placeholder="Unidade 1 | 1.1 | Arquitetura em camadas | teoria | P1&#10;Unidade 1 | 1.2 | Modelo OSI | ambos | P1" style="min-height:80px;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:12.5px var(--f-mono);color:var(--ink)"></textarea>
    <div><button type="button" class="btn" data-emdcola>usar estas linhas</button></div>`;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="emd-t">
    <div class="wz-top">${avB(M.b, 42)}<div><h2 id="emd-t">Ementa · ${esc(M.d)}</h2><p>Os itens do conteúdo programático, na ordem do plano. As datas do cronograma não entram.</p></div></div>
    <div class="wz-body">
      <div class="ce-sec" style="border-top:0;padding-top:0"><h3>Com IA${lig ? ` (${esc(GB_IA.nomeAg())})` : ''}</h3>
        <p>${lig ? 'Marque os planos de ensino da disciplina e a IA monta a lista. Com dois planos (teoria e prática), ela junta os dois sem repetir e diz de onde veio cada item. A lista nova substitui a de baixo: confira e salve.' : 'Copie o pedido, cole numa IA junto com o plano de ensino e cole a resposta aqui. Com uma IA de terminal, ligue-a em Configurações → IA e ela faz isso sozinha.'}</p>
        ${lig ? `<div class="emd-pl">${ps.length ? ps.map(f => `<label><input type="checkbox" data-empl="${esc(f)}"${M.pls.has(f) ? ' checked' : ''}> ${esc(f)}</label>`).join('') : '<span class="sub">nenhum plano na pasta planos (envie pelo editor de avaliações)</span>'}</div>
          <div><button type="button" class="btn v" data-emdia${!M.pls.size || GB_IA.rodando() ? ' disabled' : ''}>ler ${M.pls.size > 1 ? `os ${M.pls.size} planos` : 'o plano'} com IA</button></div>
          <details><summary class="sub" style="cursor:pointer">ou copiar e colar</summary><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><div><button type="button" class="btn" data-emdcopia>copiar pedido para a IA</button></div>${ta}</div></details>`
          : `<div><button type="button" class="btn" data-emdcopia>copiar pedido para a IA</button></div>${ta}`}
        ${M.obs.length ? `<div class="ce-obs"><b>Observações da IA</b><ul>${M.obs.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}</div>
      <div class="ce-sec"><h3>Itens <small class="sub">${M.its.length}</small></h3>
        ${M.its.length ? `<div class="emd-h"><span></span><span class="u">unidade</span><span>chave</span><span>item</span><span class="a">avaliação</span><span></span></div>` : ''}
        <div class="emd-ls">${M.its.map((it, i) => { const n = M.uso[it.orig0] || 0;
          return `<div class="emd-r"><input type="checkbox" data-emsel="${i}"${M.sel.has(i) ? ' checked' : ''} aria-label="selecionar para unir">
            <input type="text" class="u" data-emdf="${i}:u" value="${esc(it.u || '')}" maxlength="120" placeholder="unidade" aria-label="unidade">
            <input type="text" data-emdf="${i}:k" value="${esc(it.k)}" maxlength="12" aria-label="chave"${n ? ` readonly title="${n} estudo(s) usam esta chave (top:${esc(it.k)})"` : ''}>
            <input type="text" data-emdf="${i}:t" value="${esc(it.t)}" maxlength="240" aria-label="item">
            <select class="a" data-emdf="${i}:av" aria-label="avaliação que cobra"><option value="">—</option>${avs.filter(a => !a.cont).map(a => `<option${a.k.toUpperCase() === String(it.av || '').toUpperCase() ? ' selected' : ''}>${esc(a.k)}</option>`).join('')}</select>
            <button type="button" class="wz-x" data-emdel="${i}" aria-label="apagar ${esc(it.k)}">✕</button>
            ${it.orig || n || it.alias.length ? `<small>${[it.orig ? 'de: ' + it.orig : '', n ? `${n} estudo${n > 1 ? 's' : ''}` : '', it.alias.length ? 'unido com ' + it.alias.join(', ') : ''].filter(Boolean).map(esc).join(' · ')}</small>` : ''}</div>`; }).join('')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button type="button" class="btn" data-emdadd>+ item</button>
          <button type="button" class="btn" data-emduni${M.sel.size > 1 ? '' : ' disabled'}>unir ${M.sel.size > 1 ? M.sel.size + ' ' : ''}selecionados</button>
          <span class="sub">A chave vai nas tarefas como <span class="mono">top:CHAVE</span>: só letras, números, ponto e hífen.</span></div></div>
    </div>
    <div class="wz-foot"><span class="err" role="alert">${esc(M.err)}</span><span style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-emdfecha>cancelar</button><button type="button" class="btn v" data-emdsalva>salvar</button></span></div></div>`;
}
function fechaEd(){ const el = document.getElementById('emd'); if(el) el.remove(); M = null; }
function pedido(d, pls){
  const j = (CTX.JOG.disciplinas || []).find(x => x.d === d) || {}, avs = (AVAL[d] || []).filter(a => !a.cont), its = M ? M.its : ementa(d).itens;
  return [`Leia ${pls.length > 1 ? `os ${pls.length} planos de ensino em anexo` : 'o plano de ensino em anexo'} da disciplina ${d}${j.n ? ` (${j.n})` : ''} e monte a ementa para o meu jogo de tarefas: a lista dos itens do conteúdo programático, na ordem do plano.`,
    pls.length > 1 ? `São ${pls.length} planos da mesma disciplina (por exemplo, teoria e prática): junte as ementas numa lista só, sem repetir o que for igual nos dois, e diga em "origem" de qual plano veio cada item (o nome curto, como teoria ou prática; nos dois, "ambos").` : '', '',
    'Responda SÓ com linhas neste formato, uma por item, sem texto antes ou depois, sem tabela e sem markdown:', 'unidade | chave | item | origem | avaliação', '',
    'Regras:',
    '- unidade: o nome da unidade ou do módulo do plano, repetido em cada item dela. Sem unidades, deixe vazio.',
    '- chave: a numeração do item no plano (ex.: 1.2, 3.1.4). Sem numeração, numere você (unidade.item). Só letras, números, ponto e hífen, sem espaço, até 12 caracteres e sem repetir.',
    '- item: o assunto, curto (até 100 caracteres), com as palavras do plano.',
    `- origem: ${pls.length > 1 ? 'de qual plano veio.' : 'deixe vazio.'}`,
    '- avaliação: a chave da avaliação (lista abaixo) que o plano diz que cobra esse item. Se o plano não diz, deixe vazio.',
    '- O cronograma e as datas das aulas não entram: só a lista de itens interessa.',
    '- Para me avisar de algo, use uma linha começando com #.', '',
    'Avaliações da disciplina (chave | nome):', ...(avs.length ? avs.map(a => `${a.k} | ${a.n}`) : ['(nenhuma cadastrada)']),
  ].concat(its.length ? ['', 'Ementa que está hoje no jogo (mantenha a chave dos itens que continuam):', ...its.map(i => `${i.u || ''} | ${i.k} | ${i.t} | ${i.orig || ''} | ${i.av || ''}`)] : []).filter((l, i, v) => l !== '' || v[i - 1] !== '').join('\n');
}
/* resposta da IA (ou linhas coladas) → itens; o item que já existia (mesma chave) guarda as chaves unidas */
function cola(txt){
  const novos = [], obs = [];
  for(let l of String(txt).split('\n')){
    l = l.replace(/`/g, '').trim(); if(l.startsWith('#')){ const o = l.replace(/^#+\s*/, '').trim(); if(o) obs.push(o); continue; }
    if(!l || /^[-|: ]+$/.test(l)) continue;
    const p = l.split('|').map(x => x.trim());   // unidade vazia também começa com "|": só tira as bordas de tabela que passam das 5 colunas
    if(p.length > 5 && !p[0]) p.shift(); if(p.length > 5 && !p[p.length - 1]) p.pop();
    if(p.length < 3 || /^chave$/i.test(p[1])) continue;
    const k = p[1].replace(/\s+/g, '').replace(/[^\w.\-]/g, '').slice(0, 12), velho = M.its.find(i => i.orig0 && low(i.orig0) === low(k));
    if(!k || !p[2]) continue;
    novos.push({u:p[0], k, t:p[2], orig:p[3] || '', av:(p[4] || '').toUpperCase(), alias: velho ? velho.alias : [], orig0: velho ? velho.orig0 : ''});
  }
  if(!novos.length){ M.err = 'Não achei nenhuma linha no formato "unidade | chave | item | origem | avaliação".'; desenhaEd(); return; }
  /* item com estudo que a IA deixou de fora fica no fim, para não perder a ligação: o jogador apaga se quiser */
  for(const i of M.its) if(i.orig0 && M.uso[i.orig0] && !novos.some(n => n.orig0 === i.orig0)) novos.push(i);
  M.its = novos; M.obs = obs; M.sel.clear(); M.err = ''; desenhaEd(); toast(`${novos.length} itens <small>confira e salve</small>`);
}
async function rodaIA(){
  const d = M.d, pls = [...M.pls]; if(!pls.length){ toast('Marque pelo menos um plano'); return; }
  try { const txt = await GB_IA.rodaIA(pedido(d, pls), `ementa de ${d}`, pls);
    if(!M || M.d !== d){ toast(`A ementa de ${d} chegou, mas o editor foi fechado`); return; } le(); cola(txt); }
  catch(err){ if(GB_IA.cancelado(err)) return; if(M){ M.err = 'A IA não respondeu: ' + err.message; desenhaEd(); } else toast('A IA não respondeu: ' + esc(err.message)); }
}
function une(){
  le(); const grupo = [...M.sel].sort((p, q) => p - q).map(i => M.its[i]); if(grupo.length < 2) return;
  const fica = grupo.find(i => i.orig0 && M.uso[i.orig0]) || grupo[0], outros = grupo.filter(i => i !== fica);   // fica o que já tem estudo
  fica.t = [fica.t, ...outros.map(o => o.t)].join('; ').slice(0, 240);
  fica.alias = [...new Set(fica.alias.concat(...outros.map(o => [o.orig0 || o.k, ...o.alias])))].filter(k => k && low(k) !== low(fica.k));
  M.its = M.its.filter(i => !outros.includes(i)); M.sel.clear(); desenhaEd();
}
async function salvaEd(){
  le();
  const its = M.its.map(i => ({k:String(i.k).trim(), u:i.u, t:String(i.t).trim(), orig:i.orig, av:i.av, alias:i.alias}));
  if(its.some(i => !/^[\w.\-]{1,12}$/.test(i.k))){ M.err = 'Toda chave precisa ter de 1 a 12 letras, números, ponto ou hífen, sem espaço.'; desenhaEd(); return; }
  if(its.some(i => !i.t)){ M.err = 'Todo item precisa de um texto.'; desenhaEd(); return; }
  const todas = its.flatMap(i => [i.k, ...i.alias].map(low)); if(new Set(todas).size !== todas.length){ M.err = 'Há duas chaves iguais.'; desenhaEd(); return; }
  const somem = Object.entries(M.uso).filter(([k, n]) => n && !todas.includes(low(k))).map(([k]) => k), aviso = somem.join(', ');
  if(aviso && M.confirma !== aviso){ M.confirma = aviso; M.err = `${aviso} tem estudo: sem o item, os estudos vão para "fora da ementa". Clique em salvar de novo para confirmar.`; desenhaEd(); return; }
  const ks = new Set(its.map(i => i.k)), fx = {};
  for(const [av, f] of Object.entries(ementa(M.d).faixas)){ const n = {ini: ks.has(f.ini) ? f.ini : '', fim: ks.has(f.fim) ? f.fim : ''}; if(n.ini || n.fim) fx[av] = n; }
  try { await gravaEmenta(M.d, {itens:its, faixas:fx}); }
  catch(err){ M.err = 'Não salvou: ' + err.message; desenhaEd(); return; }
  const d = M.d; fechaEd(); UI.cnaba[d] = 'em'; render(); toast(`Ementa salva <small>${its.length} itens</small>`);
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const q = s => e.target.closest(s); let b;
  if((b = q('[data-emedit]'))){ abreEd(b.dataset.emedit); return; }
  if((b = q('[data-emfil]'))){ const [d, k] = b.dataset.emfil.split(':'); UI.emfil[d] = k; render(); return; }
  if((b = q('[data-emfx]'))){ UI.emfx = b.dataset.emfx; render(); return; }
  if((b = q('[data-emfxok]'))){ const [d, k] = b.dataset.emfxok.split(':'); salvaFaixa(d, k, document.getElementById('emfx-i').value, document.getElementById('emfx-f').value); return; }
  if((b = q('[data-emusa]'))){ const [d, k, fim] = b.dataset.emusa.split(':'); salvaFaixa(d, k, (ementa(d).faixas[k.toUpperCase()] || {}).ini || '', fim); return; }
  if((b = q('[data-emcac]'))){ const [d, k] = b.dataset.emcac.split(':'); abreCac(d, k); return; }
  if(C){
    if(q('[data-emcfecha]')){ fechaCac(); return; }
    if(q('[data-emcok]')){ gravaCac(); return; }
  }
  if(!M) return;
  if(q('[data-emdfecha]')){ fechaEd(); return; }
  if(q('[data-emdsalva]')){ salvaEd(); return; }
  if(q('[data-emdadd]')){ le(); M.its.push({u: M.its.length ? M.its[M.its.length - 1].u : '', k:'', t:'', orig:'', av:'', alias:[], orig0:''}); desenhaEd(); const r = document.querySelectorAll('[data-emdf$=":k"]'); r[r.length - 1].focus(); return; }
  if((b = q('[data-emdel]'))){ le(); const i = +b.dataset.emdel; M.its.splice(i, 1); M.sel = new Set([...M.sel].filter(x => x !== i).map(x => x > i ? x - 1 : x)); desenhaEd(); return; }
  if(q('[data-emduni]')){ une(); return; }
  if(q('[data-emdia]')){ le(); rodaIA(); return; }
  if(q('[data-emdcopia]')){ GB_IA.copia(pedido(M.d, [...M.pls].length ? [...M.pls] : planosDe(M.d)), 'Pedido da ementa'); return; }
  if(q('[data-emdcola]')){ le(); cola(document.getElementById('emd-cola').value); return; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if(C && t.dataset.emct){ if(t.checked) C.tira.delete(t.dataset.emct); else C.tira.add(t.dataset.emct); document.querySelectorAll('[data-emctx]').forEach(x => C.txt[x.dataset.emctx] = x.value); desenhaCac(); return; }
  if(!M) return;
  if(t.dataset.emsel){ if(t.checked) M.sel.add(+t.dataset.emsel); else M.sel.delete(+t.dataset.emsel); le(); desenhaEd(); return; }
  if(t.dataset.empl){ if(t.checked) M.pls.add(t.dataset.empl); else M.pls.delete(t.dataset.empl); le(); desenhaEd(); }
});
document.addEventListener('input', e => { if(C && e.target.id === 'emc-n') C.nome = e.target.value; });
document.addEventListener('keydown', e => { if(e.key !== 'Escape') return; if(C && !C.salvando) fechaCac(); else if(M) fechaEd(); });

window.GB_EMENTA = {avLinha, faixa, plano, estudos};
if(CTX && cur === 'b2') render();
})();
