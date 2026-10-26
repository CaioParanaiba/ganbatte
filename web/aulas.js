/* Ganbatte · aulas, dentro do chefão aberto (aba Chefões): o jogador manda o áudio e/ou os slides de uma aula, o servidor
 * transcreve (faster-whisper, se instalado) e a IA ligada escreve o resumo e sugere tarefas de estudo. Cada sugestão espera a
 * escolha do jogador: não adicionar, adicionar (POST /api/add, com +fac.SIGLA e aula:DATA) ou juntar com uma tarefa aberta
 * parecida (POST /api/act edit, que só acrescenta aula:DATA e o prazo). O resumo abre em /aulas/SIGLA/ARQUIVO.html.
 * Carregado depois de ia.js: usa CTX, D, HOJE, BOSSES, UI, RENDER, render, recarrega, post, esc, toast, ddmm, avB e o
 * estilo .wz do assistente.
 */
(function(){
'use strict';

document.head.insertAdjacentHTML('beforeend', `<style>
.cn-au{display:grid;gap:4px}
.au-top{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap} .au-top .btn{margin-left:auto}
.au{border-top:1px solid var(--hair);padding:9px 0} .au-top + .au,.au-top + .au-j{border-top:0}
.au-l{display:flex;gap:10px;align-items:baseline;font-size:13.5px;min-width:0}
.au-l .dt{font:600 12px var(--f-mono);color:var(--soft);white-space:nowrap}
.au-l a{color:var(--ink);font-weight:600;text-decoration:none} .au-l a:hover{text-decoration:underline}
.au-l .au-tr{font:11.5px var(--f-mono);color:var(--soft)} .au-l .x{margin-left:auto}
.au-c{margin:8px 0 0 52px;border:1px solid var(--hair);border-radius:10px;padding:4px 12px 10px;background:var(--panel)}
.au-ch{display:flex;gap:10px;align-items:baseline;padding:6px 0 2px;font:600 10.5px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.1em}
.au-ch span{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:500;color:var(--soft)} .au-ch span.cheia{color:var(--amb)}
.au-g{font:600 10.5px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.1em;padding:10px 0 2px}
.au-s{display:grid;grid-template-columns:20px minmax(0,1fr);gap:2px 8px;align-items:center;padding:6px 0;border-top:1px solid var(--hair)}
.au-g + .au-s{border-top:0}
.au-s > input[type=checkbox]{margin:0;accent-color:var(--volt)}
.au-s input[type=text]{width:100%;font:13.5px var(--f-ui);color:var(--ink);background:none;border:1px solid transparent;border-radius:7px;padding:3px 6px;margin-left:-7px}
.au-s input[type=text]:hover,.au-s input[type=text]:focus{border-color:var(--hair);background:var(--panel2)}
.au-sm{grid-column:2;display:flex;gap:4px 12px;align-items:center;flex-wrap:wrap}
.au-s small{flex:1 1 260px;font:11.5px var(--f-mono);color:var(--soft)} .au-s small .av{color:var(--amb)}
.au-s small .pri{font-weight:700} .au-s small .pri.A{color:var(--red)} .au-s small .pri.B{color:var(--amb)}
.au-s .ac{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-left:auto}
.au-s select{max-width:180px;font:12px var(--f-ui);background:var(--panel2);color:var(--ink);border:1px solid var(--hair);border-radius:6px;padding:2px 4px}
.au-s.off input[type=text],.au-s.off small{opacity:.5}
.au-s.lig{opacity:.6} .au-s.lig .lt{font-size:13px;color:var(--soft)} .au-s.lig small{flex:none}
.au-mais{padding:6px 0 0}
.au-cf{display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--hair);padding-top:10px;margin-top:6px}
.au-cf small{font:11.5px var(--f-mono);color:var(--faint)}
.au-ok{margin:6px 0 0 52px;font:11.5px var(--f-mono);color:var(--faint)} .au-ok .go{font-size:11.5px}
.au-j{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font:12.5px var(--f-mono);color:var(--soft);padding:8px 0;border-top:1px solid var(--hair)}
.au-j .bar{flex:0 0 140px;height:5px;border-radius:99px;background:var(--track);overflow:hidden} .au-j .bar b{display:block;height:100%;background:var(--volt)}
.au-j.erro{color:var(--red)} .au-j .ac{margin-left:auto;display:flex;gap:12px}
.au-bd{display:inline-block;margin-left:8px;font:600 10.5px var(--f-mono);color:var(--volt);border:1px solid color-mix(in srgb,var(--volt) 50%,var(--hair));border-radius:99px;padding:0 7px;vertical-align:2px}
#au .wz{max-width:620px} #au code{font:12px var(--f-mono);background:var(--panel2);border:1px solid var(--hair);border-radius:6px;padding:4px 8px;display:block;white-space:pre-wrap;word-break:break-all;margin-top:6px}
#au .au-trb{display:grid;gap:4px} #au .au-trb .lb{display:flex;align-items:center;gap:6px;font:600 11px var(--f-mono);color:var(--faint);letter-spacing:.08em;text-transform:uppercase}
#au .au-trb .lb .ac{margin-left:auto;display:flex;gap:6px} #au .au-trb .lb .btn{text-transform:none;letter-spacing:0} #au .au-trb small.grande{color:var(--red)}
#au textarea{min-height:110px;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:13px var(--f-ui);color:var(--ink);width:100%}
#au .au-av{border-left:3px solid var(--amb);background:var(--panel2);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--soft)}
#au .au-pb{height:5px;border-radius:99px;background:var(--track);overflow:hidden;flex:1;min-width:80px} #au .au-pb b{display:block;height:100%;background:var(--volt)}
@media (max-width:720px){ .au-c{margin-left:0} .au-s .ac{margin-left:0} }
</style>`);

let AU = {aulas:[], jobs:[], whisper:{ok:true, como:''}, ementas:{}};
const ETAPA = {fila:'na fila', transcrevendo:'transcrevendo', lendo:'lendo os slides', resumindo:'a IA está resumindo'};
const rodando = () => AU.jobs.some(j => j.etapa !== 'erro');
const pendentes = d => AU.aulas.filter(a => a.sigla === d).reduce((n, a) => n + a.sugestoes.filter(s => !s.estado).length, 0);
const TR_MAX = 400000;   // o mesmo AULA_TR_MAX do servidor
const norm = t => GBx.norm(String(t || '')).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
async function carrega(){ try { const r = await fetch('/api/aulas', {cache:'no-store'}); const j = await r.json(); if(j.ok) AU = {ementas:{}, ...j}; } catch(e){} }
const editando = () => document.activeElement && document.activeElement.closest && document.activeElement.closest('.cn-au,#au');
/* com aula rodando, confere a cada 3 s; parou de rodar (terminou ou deu erro), recarrega o jogo e redesenha */
let poll = null;
function vigia(){
  if(poll || !rodando()) return;
  poll = setInterval(async () => {
    const antes = rodando(); await carrega();
    if(!rodando()){ clearInterval(poll); poll = null; if(antes){ await recarrega().catch(() => {}); toast('Aula pronta <small>veja o resumo e as sugestões no chefão</small>'); } }
    if(cur === 'b2' && !editando()) render();
  }, 3000);
}

/* ---------- o cartão de sugestões (#214) ----------
   Entregas e estudos juntos, cada um com a caixa marcada ou não (as entregas vêm marcadas; dos estudos, os 3 de mais pontos) e,
   no estudo, o item da ementa. "Juntar com" pode ser uma tarefa aberta (ela ganha a marca da aula) ou, num estudo, outro estudo
   ainda sem decisão, desta aula ou de outra: os dois viram uma tarefa só, com o nome da união. O botão do fim grava tudo:
   marcada entra, desmarcada fica como "não adicionada" (dá para rever). SEL guarda as escolhas até lá, por "aula:índice". */
const SEL = {}, MAIS = new Set();
const tipoDe = s => s.tipo === 'estudo' ? 'estudo' : 'entrega';   // sugestão de antes da #214 não tem tipo: é entrega
const itensDe = d => ((AU.ementas || {})[d] || {}).itens || [];
function sel(a, s, i, b){
  const k = `${a.id}:${i}`;
  if(!SEL[k]){ const t = s.juntar && alvo(s, b); SEL[k] = {on: s.marcada !== false, item: s.item || '', alvo: t ? 't:' + t.n : '', nome:''}; }
  return SEL[k];
}
/* a tarefa aberta que a IA apontou para juntar (mesmo texto, ou a mais parecida, com metade das palavras em comum) */
function alvo(s, b){
  const j = norm(s.juntar); if(j){ const t = b.open.find(t => norm(t.txt) === j || j.includes(norm(t.txt))); if(t) return t; }
  const ws = new Set(norm(s.texto).split(' ').filter(w => w.length > 3)); if(!ws.size) return null;
  let melhor = null, nota = .5;
  for(const t of b.open){ const wt = norm(t.txt).split(' ').filter(w => w.length > 3), c = wt.filter(w => ws.has(w)).length / Math.max(ws.size, wt.length, 1); if(c >= nota){ nota = c; melhor = t; } }
  return melhor;
}
/* os estudos ainda sem decisão da disciplina, de todas as aulas: com quem um estudo pode se juntar */
const estudosAbertos = d => AU.aulas.filter(a => a.sigla === d).flatMap(a => a.sugestoes.map((s, i) => ({a, s, i, k:`${a.id}:${i}`}))).filter(x => !x.s.estado && tipoDe(x.s) === 'estudo');
/* quem vai junto com quem: {alvo "aula:i": a sugestão que o puxou} */
const ligadas = () => { const m = {}; for(const [k, v] of Object.entries(SEL)) if(v.on && v.alvo.startsWith('s:')) m[v.alvo.slice(2)] = k; return m; };
const semResumo = t => t.replace(/\s*\(resumos? [^)]*\)\s*$/i, '').trim();
function nomeUniao(x, y){
  const ds = [...new Set([x.a.data, y.a.data])].sort().map(ddmm);
  return `${semResumo(x.s.texto)} e ${semResumo(y.s.texto).replace(/^estudar\s+/i, '')} (${ds.length > 1 ? 'resumos ' + ds.join(' e ') : 'resumo ' + ds[0]})`;
}
const EST = {nao:'não adicionada', add:'adicionada', juntar:'juntada'};
function sugRow(a, s, i, b, lig){
  const k = `${a.id}:${i}`, st = sel(a, s, i, b), est = tipoDe(s) === 'estudo', its = itensDe(a.sigla);
  if(lig[k]){ const [aid, j] = lig[k].split(':'), o = AU.aulas.find(x => x.id === aid);
    return `<div class="au-s lig"><span></span><span class="lt">↳ ${esc(s.texto)}</span><div class="au-sm"><small>vai junto com um estudo ${o && o.id !== a.id ? `da aula de ${ddmm(o.data)}` : 'de cima'}: grave por lá</small></div></div>`; }
  const uniao = st.alvo.startsWith('s:'), outros = est ? estudosAbertos(a.sigla).filter(x => x.k !== k && !(SEL[x.k] && SEL[x.k].on && SEL[x.k].alvo.startsWith('s:')) && !(lig[x.k] && lig[x.k] !== k)) : [];
  const meta = [s.resultado ? '→ ' + s.resultado : '', s.est, s.due ? 'prazo ' + ddmm(s.due) : '', s.av ? 'prepara ' + s.av : '', s.motivo, s.min ? 'na aula: ' + s.min : ''].filter(Boolean).map(esc).join(' · ');
  return `<div class="au-s${st.on ? '' : ' off'}"><input type="checkbox" data-auon="${k}"${st.on ? ' checked' : ''} aria-label="adicionar esta sugestão">
    <input type="text" data-autxt="${k}" value="${esc(uniao ? st.nome : st.texto != null ? st.texto : s.texto)}" aria-label="${uniao ? 'nome da tarefa unida' : 'texto da tarefa'}" title="dá para editar antes de adicionar">
    <div class="au-sm"><small title="${esc(s.detalhe)}">${s.pri ? `<span class="pri ${s.pri}">(${s.pri})</span> ` : ''}${uniao ? 'os dois estudos viram uma tarefa só' + (meta ? ' · ' : '') : ''}${meta}${s.aviso ? ` · <span class="av">${esc(s.aviso)}</span>` : ''}</small>
      <span class="ac">${est && its.length ? `<select data-auitem="${k}" aria-label="item da ementa"><option value="">sem item</option>${its.map(it => `<option value="${esc(it.k)}"${it.k === st.item ? ' selected' : ''}>${esc(it.k)} · ${esc(it.t.slice(0, 40))}</option>`).join('')}</select>` : ''}
      ${b.open.length || outros.length ? `<select data-aualvo="${k}" aria-label="juntar com"><option value="">tarefa nova</option>
        ${b.open.length ? `<optgroup label="juntar com uma tarefa aberta">${b.open.map(o => `<option value="t:${o.n}"${st.alvo === 't:' + o.n ? ' selected' : ''}>${esc(o.txt.slice(0, 60))}</option>`).join('')}</optgroup>` : ''}
        ${outros.length ? `<optgroup label="juntar com outro estudo">${outros.map(x => `<option value="s:${x.k}"${st.alvo === 's:' + x.k ? ' selected' : ''}>${esc(x.s.texto.slice(0, 60))}</option>`).join('')}</optgroup>` : ''}</select>` : ''}
      ${uniao && window.GB_IA && GB_IA.ligada() ? `<button type="button" class="go" data-aunome="${k}" title="a IA propõe um nome para a união">nome pela IA</button>` : ''}</span></div></div>`;
}
function cartao(a, b, lig){
  const pend = a.sugestoes.map((s, i) => [s, i]).filter(([s]) => !s.estado);
  const ents = pend.filter(([s]) => tipoDe(s) === 'entrega'), ests = pend.filter(([s]) => tipoDe(s) === 'estudo');
  const vis = MAIS.has(a.id) ? ests : ests.filter(([s, i]) => s.marcada !== false || (SEL[`${a.id}:${i}`] || {}).on);
  const n = pend.filter(([s, i]) => { const st = sel(a, s, i, b); return st.on && !lig[`${a.id}:${i}`]; }).length;
  return `<div class="au-c"><div class="au-ch">sugestões<span class="${b.open.length >= 5 ? 'cheia' : ''}" title="só informação: quem decide é você">${b.d}: ${b.open.length} aberta${b.open.length === 1 ? '' : 's'}</span></div>
    ${ents.length ? `<div class="au-g">entregas e avisos</div>${ents.map(([s, i]) => sugRow(a, s, i, b, lig)).join('')}` : ''}
    ${ests.length ? `<div class="au-g">estudos</div>${vis.map(([s, i]) => sugRow(a, s, i, b, lig)).join('')}
      ${vis.length < ests.length ? `<div class="au-mais"><button type="button" class="go" data-aumais="${a.id}">ver mais ${ests.length - vis.length} estudo${ests.length - vis.length > 1 ? 's' : ''}</button></div>` : ''}` : ''}
    ${pend.every(([s, i]) => lig[`${a.id}:${i}`]) ? '' : `<div class="au-cf"><button type="button" class="btn v" data-auconf="${a.id}">${n ? `adicionar ${n} marcada${n > 1 ? 's' : ''}` : 'não adicionar nenhuma'}</button><small>as desmarcadas ficam como não adicionadas (dá para rever)</small></div>`}</div>`;
}
function aulaRow(a, b, lig){
  const pend = a.sugestoes.some(s => !s.estado), feitas = a.sugestoes.filter(s => s.estado);
  return `<div class="au"><div class="au-l"><span class="dt">${ddmm(a.data)}</span><a href="/aulas/${a.html}" target="_blank" rel="noopener">${esc(a.assunto)}</a>${a.md ? `<a class="au-tr" href="/aulas/${a.md}" target="_blank" rel="noopener">transcrição</a>` : ''}
      <button type="button" class="go x" data-auapaga="${a.id}" title="apagar o resumo e a transcrição (as tarefas ficam)">apagar</button></div>
    ${pend ? cartao(a, b, lig) : ''}
    ${feitas.length ? `<div class="au-ok">${['add','juntar','nao'].map(e => { const n = feitas.filter(s => s.estado === e).length; return n ? `${n} ${EST[e]}${n > 1 ? 's' : ''}` : ''; }).filter(Boolean).join(' · ')}${a.sugestoes.some(s => s.estado === 'nao') ? ` · <button type="button" class="go" data-auvolta="${a.id}">rever as não adicionadas</button>` : ''}</div>` : ''}</div>`;
}
function jobRow(j){
  if(j.etapa === 'erro') return `<div class="au-j erro"><span>${ddmm(j.data)} · ${esc(j.erro)}</span><span class="ac"><button type="button" class="go" data-aurefaz="${j.id}">tentar de novo</button><button type="button" class="go" data-aucancela="${j.id}">apagar</button></span></div>`;
  const min = Math.floor(j.seg / 60);
  return `<div class="au-j"><span>${ddmm(j.data)} · ${ETAPA[j.etapa] || j.etapa}${j.etapa === 'transcrevendo' ? ` ${j.prog}%` : ''}</span>${j.etapa === 'transcrevendo' ? `<span class="bar"><b style="width:${j.prog}%"></b></span>` : ''}
    <small>${min ? `${min} min` : 'agora'}</small><span class="ac"><button type="button" class="go" data-aucancela="${j.id}">cancelar</button></span></div>`;
}
function secao(b){
  const as = AU.aulas.filter(a => a.sigla === b.d).sort((p, q) => q.data.localeCompare(p.data) || q.id.localeCompare(p.id)), js = AU.jobs.filter(j => j.sigla === b.d), lig = ligadas();
  return `<div class="cn-au"><div class="au-top"><p class="cn-vz">${as.length || js.length ? `${as.length} aula${as.length === 1 ? '' : 's'} resumida${as.length === 1 ? '' : 's'}` : 'Mande o áudio, os slides ou a transcrição de uma aula: a IA escreve o resumo e sugere entregas e estudos, e você escolhe o que entra na Lista.'}</p>
      <button type="button" class="btn v" data-aunova="${b.d}">mandar aula</button></div>
    ${js.map(jobRow).join('')}${as.map(a => aulaRow(a, b, lig)).join('')}</div>`;
}
CN_ABAS.au = {n:'aulas', h:secao, c:b => { const n = pendentes(b.d), roda = AU.jobs.some(j => j.sigla === b.d && j.etapa !== 'erro');
  return roda ? '<small class="on">…</small>' : n ? `<small class="on" title="${n} sugestão(ões) esperando">${n}</small>` : AU.aulas.filter(a => a.sigla === b.d).length || ''; }};
const rB2a = RENDER.b2;
RENDER.b2 = S => { rB2a(S);
  for(const b of S.bs){
    const el = document.querySelector(`.cn-b[data-cnd="${b.d}"]`); if(!el) continue;
    const n = pendentes(b.d), roda = AU.jobs.some(j => j.sigla === b.d && j.etapa !== 'erro');
    if(n || roda) el.querySelector('.cn-h .nm').insertAdjacentHTML('beforeend', `<span class="au-bd" title="${roda ? 'aula sendo processada' : n + ' sugestão(ões) de estudo esperando'}">${roda ? 'aula…' : n}</span>`);
  }
};

/* ---------- gravar as escolhas do cartão ---------- */
const decidir = (id, i, estado) => post('/api/aulas/decidir', {id, i, estado}).then(() => { const a = AU.aulas.find(x => x.id === id); if(a) a.sugestoes[i].estado = estado; });
function linha(a, s, txt, item){
  const conf = /^conferir/i.test(txt);
  return [s.pri ? `(${s.pri})` : '', txt.trim(), `+fac.${a.sigla}`, conf ? '' : '@estudo', s.av ? `av:${s.av}` : '', s.due ? `due:${s.due}` : '', item ? `top:${item}` : '', `aula:${a.data}`].filter(Boolean).join(' ');
}
/* juntar com uma tarefa aberta: ela só ganha a marca da aula, o prazo (se não tinha) e o item escolhido */
async function juntaTarefa(t, a, s, item){
  let corpo = t.raw.replace(/^\([A-Z]\) /, '').replace(/^\d{4}-\d{2}-\d{2} /, '');
  if(!/(^|\s)aula:/.test(corpo)) corpo += ` aula:${a.data}`;
  if(s.due && !/(^|\s)due:/.test(corpo)) corpo += ` due:${s.due}`;
  if(item) corpo = /(^|\s)top:\S+/.test(corpo) ? corpo.replace(/(^|\s)top:\S+/, `$1top:${item}`) : corpo + ` top:${item}`;
  await post('/api/act', {raw:t.raw, action:'edit', value:corpo});
}
let gravando = false;
async function confirma(aid){
  const a = AU.aulas.find(x => x.id === aid); if(!a || gravando) return;
  const b = BOSSES.find(x => x.d === a.sigla) && estado().bs.find(x => x.d === a.sigla); if(!b) return;
  const lig = ligadas(), feitos = {add:0, juntar:0, uniao:0, nao:0};
  gravando = true;
  try {
    for(const [i, s] of a.sugestoes.entries()){
      const k = `${a.id}:${i}`; if(s.estado || lig[k]) continue;
      const st = sel(a, s, i, b), txt = (((document.querySelector(`[data-autxt="${k}"]`) || {}).value) || (st.alvo.startsWith('s:') ? st.nome : st.texto) || '').trim();
      if(!st.on){ await decidir(a.id, i, 'nao'); feitos.nao++; continue; }
      if(st.alvo.startsWith('t:')){
        const t = D.abertas.find(t => t.n === +st.alvo.slice(2)); if(!t) throw new Error('a tarefa escolhida para juntar não está mais aberta');
        await juntaTarefa(t, a, s, st.item); await decidir(a.id, i, 'juntar'); feitos.juntar++; continue;
      }
      if(st.alvo.startsWith('s:')){
        const [oid, j] = st.alvo.slice(2).split(':'), o = AU.aulas.find(x => x.id === oid), os = o && o.sugestoes[+j];
        if(!os || os.estado) throw new Error('o estudo escolhido para juntar já foi decidido');
        const velha = o.data < a.data ? o : a;   // a tarefa unida guarda a aula mais antiga; a outra fica citada no nome
        await post('/api/add', {text: linha(velha, {...s, pri: [s.pri, os.pri].filter(Boolean).sort()[0] || '', av: s.av || os.av}, txt || nomeUniao({a, s}, {a:o, s:os}), st.item)});
        await decidir(a.id, i, 'juntar'); await decidir(o.id, +j, 'juntar'); feitos.uniao++; delete SEL[st.alvo.slice(2)]; continue;
      }
      await post('/api/add', {text: linha(a, s, txt || s.texto, tipoDe(s) === 'estudo' ? st.item : '')}); await decidir(a.id, i, 'add'); feitos.add++;
    }
    toast(feitos.add + feitos.juntar + feitos.uniao ? `Sugestões gravadas <small>${[feitos.add ? `${feitos.add} na Lista` : '', feitos.juntar ? `${feitos.juntar} juntada${feitos.juntar > 1 ? 's' : ''} a tarefas abertas` : '', feitos.uniao ? `${feitos.uniao} ${feitos.uniao > 1 ? 'pares de estudos unidos' : 'par de estudos unido'}` : '', feitos.nao ? `${feitos.nao} não adicionada${feitos.nao > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}</small>` : 'Nenhuma sugestão adicionada <small>dá para rever as não adicionadas</small>');
  } catch(err){ toast('Não gravou tudo: ' + esc(err.message)); }
  finally { gravando = false; MAIS.delete(aid); await recarrega().catch(() => {}); render(); }
}
async function nomeIA(k){
  const st = SEL[k]; if(!st || !st.alvo.startsWith('s:')) return;
  const [aid, i] = k.split(':'), [oid, j] = st.alvo.slice(2).split(':'), a = AU.aulas.find(x => x.id === aid), o = AU.aulas.find(x => x.id === oid);
  if(!a || !o) return;
  const x = {a, s:a.sugestoes[+i]}, y = {a:o, s:o.sugestoes[+j]}, ds = [...new Set([a.data, o.data])].sort().map(ddmm);
  const pedido = `Junte estas duas tarefas de estudo numa só e dê um nome curto para ela, de até 75 caracteres, começando com "Estudar" e dizendo o que as duas cobrem (ex.: "Estudar cache: mapeamento direto e associativo"). Termine com "(${ds.length > 1 ? 'resumos ' + ds.join(' e ') : 'resumo ' + ds[0]})".\n1) ${x.s.texto}: ${x.s.detalhe || ''}\n2) ${y.s.texto}: ${y.s.detalhe || ''}\nResponda só com o nome, numa linha, sem aspas.`;
  try { const r = (await GB_IA.rodaIA(pedido, 'nome da união', '', true)).split('\n').map(l => l.trim().replace(/^["'“]|["'”]$/g, '')).filter(Boolean)[0];
    if(r && SEL[k]){ SEL[k].nome = r.slice(0, 110); render(); } }
  catch(err){ if(!GB_IA.cancelado(err)) toast('A IA não respondeu: ' + esc(err.message)); }
}

/* ---------- mandar aula ---------- */
let M = null;
function abre(d){ M = {d, data:HOJE, audio:null, slides:[], tr:'', fo:foco(d), err:'', env:null}; desenha(); }
/* o "o que pesa" da última aula da disciplina, para não digitar de novo */
const foco = d => (AU.aulas.filter(a => a.sigla === d && a.foco).sort((p, q) => q.data.localeCompare(p.data))[0] || {}).foco || '';
/* guarda o que está no formulário antes de redesenhar */
function le(){ const v = id => (document.getElementById(id) || {}).value; M.d = v('au-d') || M.d; M.data = v('au-dt') || M.data; M.tr = v('au-tr') ?? M.tr; M.fo = v('au-fo') ?? M.fo; }
/* tamanho e duração da transcrição (pela maior marca de tempo), para conferir que entrou inteira */
function trInfo(t){
  if(!t.trim()) return 'cole o texto, use o botão colar ou escolha o arquivo (.md, .txt, .srt, .vtt)';
  let seg = 0; for(const m of t.matchAll(/(?<![\d:])(\d{1,2}):([0-5]\d):([0-5]\d)(?![\d:])/g)) seg = Math.max(seg, m[1] * 3600 + m[2] * 60 + +m[3]);
  const kb = new Blob([t]).size / 1024, h = Math.floor(seg / 3600), min = Math.floor(seg % 3600 / 60);
  return [`${kb < 1 ? 'menos de 1' : Math.round(kb)} KB`, seg ? `${h ? h + ' h ' : ''}${min} min de marcas de tempo` : 'sem marcas de tempo',
    t.length > TR_MAX ? `grande demais: o limite é ${TR_MAX / 1000} mil caracteres (umas 8 h de aula)` : ''].filter(Boolean).join(', ');
}
/* legenda .srt/.vtt → texto com uma marca [HH:MM:SS] a cada 2 min, como o Whisper do jogo (sem a numeração e os tempos de cada fala) */
function legenda(txt){
  const ls = txt.replace(/\r/g, '').split('\n'), tempo = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,]\d{3}\s*-->/, out = [];
  let prox = 0, dentro = false;
  ls.forEach((l, i) => {
    const s = l.trim(), m = s.match(tempo);
    if(m){ dentro = true; const b = Math.floor(((+m[1] || 0) * 3600 + +m[2] * 60 + +m[3]) / 120) * 120;
      if(b >= prox){ out.push(`\n\n[${[b / 3600, b % 3600 / 60, b % 60].map(x => String(Math.floor(x)).padStart(2, '0')).join(':')}]\n`); prox = b + 120; } return; }
    if(!s){ dentro = false; return; }
    if(/^\d+$/.test(s) && tempo.test((ls[i + 1] || '').trim())) return;   // o número da fala no .srt
    if(!dentro) return;   // WEBVTT, NOTE, STYLE...
    out.push(s.replace(/<[^>]+>/g, '') + ' ');
  });
  return out.join('').trim();
}
async function colar(){
  le();
  try { const t = await navigator.clipboard.readText(); if(t.trim()){ M.tr = t; M.err = ''; } else M.err = 'A área de transferência está vazia.'; }
  catch(e){ M.err = 'O navegador não deixou ler a área de transferência: clique no campo e aperte Ctrl+V.'; }
  desenha(); if(M.err) document.getElementById('au-tr').focus();
}
function fecha(){ const el = document.getElementById('au'); if(el) el.remove(); M = null; }
function desenha(){
  let bg = document.getElementById('au'); if(!bg){ bg = document.createElement('div'); bg.id = 'au'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const b = BOSSES.find(x => x.d === M.d) || BOSSES[0], lig = window.GB_IA && GB_IA.ligada(), env = M.env;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="au-t">
    <div class="wz-top">${avB(b, 42)}<div><h2 id="au-t">Mandar aula</h2><p>A IA resume a aula e sugere o que estudar; você escolhe o que entra na Lista.</p></div></div>
    <div class="wz-body">
      ${lig ? '' : '<div class="au-av">A IA não está ligada. Ligue-a em <b>Configurações → IA</b> (Claude Code, Codex, Gemini CLI ou Antigravity) para resumir aulas.</div>'}
      <div class="wz-f"><label>Disciplina<select id="au-d">${BOSSES.map(x => `<option value="${x.d}"${x.d === M.d ? ' selected' : ''}>${esc(x.d)} · ${esc(x.n)}</option>`).join('')}</select></label>
        <label>Data da aula<input type="date" id="au-dt" value="${M.data}" max="${HOJE}"></label></div>
      <label>Áudio da aula<input type="file" id="au-a" accept="audio/*,video/mp4,video/webm,.m4a,.opus,.amr,.3gp,.mkv">
        <small class="h">${M.audio ? `${esc(M.audio.name)} · ${(M.audio.size / 1e6).toFixed(0)} MB` : 'gravação do celular (m4a, mp3, ogg, opus, wav...)'}</small></label>
      ${AU.whisper.ok ? '' : `<div class="au-av">Para transcrever o áudio aqui mesmo (sem gastar a IA), instale o Whisper uma vez, no terminal:<code>${esc(AU.whisper.como)}</code>Sem ele, mande só os slides ou cole a transcrição abaixo.</div>`}
      <label>Slides (PDF)<input type="file" id="au-s" accept=".pdf,.txt,.md" multiple>
        <small class="h">${M.slides.length ? M.slides.map(f => esc(f.name)).join(' · ') : 'opcional: ajudam a IA a acertar os termos e a ligar a aula ao material'}</small></label>
      <div class="au-trb"><span class="lb">Já tenho a transcrição<span class="ac"><button type="button" class="btn" data-aucola title="lê a área de transferência">colar</button><button type="button" class="btn" data-auarq title=".md, .txt, .srt ou .vtt">escolher arquivo</button></span></span>
        <input type="file" id="au-tf" accept=".md,.txt,.srt,.vtt,text/plain,text/markdown" hidden>
        <textarea id="au-tr" placeholder="cole aqui o texto da aula (Teams, Zoom, legenda, Whisper...)">${esc(M.tr)}</textarea><small class="h${M.tr.length > TR_MAX ? ' grande' : ''}" id="au-tri">${esc(trInfo(M.tr))}</small></div>
      <label>O que pesa nesta disciplina<input id="au-fo" maxlength="600" value="${esc(M.fo)}" placeholder="opcional: o trabalho pede X, Y e Z; a prova é só de exercícios...">
        <small class="h">a IA dá mais espaço no resumo ao que a disciplina cobra (o plano de ensino da pasta planos entra sozinho)</small></label>
      <p class="sub">Roda em segundo plano: a transcrição leva de 15 min a 1 h por hora de aula, e a IA mais alguns minutos (uns 20 a 30 mil tokens por aula). Pode fechar e continuar jogando.</p>
    </div>
    <div class="wz-foot"><span class="err" role="alert">${esc(M.err)}</span>${env ? `<span class="au-pb" title="enviando ${env.p}%"><b style="width:${env.p}%"></b></span><small class="sub">${esc(env.t)}</small>` : ''}
      <span style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-aufecha>cancelar</button><button type="button" class="btn v" data-auenvia${env || !lig ? ' disabled' : ''}>mandar</button></span></div></div>`;
}
function sobe(aid, f, i, n){
  return new Promise((ok, erro) => {
    const x = new XMLHttpRequest();
    x.open('POST', `/api/aulas/arquivo?id=${aid}&nome=${encodeURIComponent(f.name.replace(/[^\w .()-]/g, '_').slice(-100))}`);
    x.setRequestHeader('X-Painel', '1');
    x.upload.onprogress = e => { if(M && e.lengthComputable){ M.env = {p: Math.round(e.loaded / e.total * 100), t:`enviando ${i}/${n}: ${f.name}`}; const b = document.querySelector('#au .au-pb b'); if(b) b.style.width = M.env.p + '%'; else desenha(); } };
    x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch(e){} j.ok ? ok() : erro(new Error(j.error || 'o envio falhou')); };
    x.onerror = () => erro(new Error(SEM_SERVIDOR));
    x.send(f);
  });
}
async function envia(){
  le();
  if(M.tr.length > TR_MAX){ M.err = `A transcrição é grande demais (${Math.round(M.tr.length / 1000)} mil caracteres; o limite é ${TR_MAX / 1000} mil).`; desenha(); return; }
  if(!M.audio && !M.slides.length && !M.tr.trim()){ M.err = 'Escolha o áudio, os slides ou cole a transcrição.'; desenha(); return; }
  if(M.audio && !AU.whisper.ok && !M.tr.trim()){ M.err = 'Sem o Whisper não dá para transcrever o áudio: instale (comando acima) ou cole a transcrição.'; desenha(); return; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(M.data)){ M.err = 'Escolha a data da aula.'; desenha(); return; }
  M.err = ''; M.env = {p:0, t:'preparando'}; desenha();
  try {
    const {id} = await post('/api/aulas/nova', {sigla:M.d, data:M.data});
    const fs = [M.audio, ...M.slides].filter(Boolean);
    for(let i = 0; i < fs.length; i++) await sobe(id, fs[i], i + 1, fs.length);
    await post('/api/aulas/processar', {id, transcricao: M.tr.trim() || undefined, foco: M.fo.trim()});
    const d = M.d; fecha(); UI.cnab.add(d); UI.cnaba[d] = 'au';
    await carrega(); render(); vigia();
    toast('Aula enviada <small>roda em segundo plano; o andamento aparece no chefão</small>');
  } catch(err){ if(M){ M.env = null; M.err = err.message; desenha(); } }
}

/* as escolhas do cartão de sugestões ficam em SEL até o botão do fim */
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset && (t.dataset.auon || t.dataset.auitem || t.dataset.aualvo); if(!k || !SEL[k]) return;
  const st = SEL[k], txt = document.querySelector(`[data-autxt="${k}"]`);
  if(t.dataset.auon){ st.on = t.checked; if(!st.on && st.alvo.startsWith('s:')) st.alvo = ''; }
  if(t.dataset.auitem !== undefined) st.item = t.value;
  if(t.dataset.aualvo !== undefined){
    if(txt && !st.alvo.startsWith('s:')) st.texto = txt.value;
    st.alvo = t.value; st.on = st.on || !!t.value;
    if(st.alvo.startsWith('s:')){ const [aid, i] = k.split(':'), [oid, j] = st.alvo.slice(2).split(':'), a = AU.aulas.find(x => x.id === aid), o = AU.aulas.find(x => x.id === oid);
      st.nome = nomeUniao({a, s:{...a.sugestoes[+i], texto: st.texto || a.sugestoes[+i].texto}}, {a:o, s:o.sugestoes[+j]});
      const os = SEL[`${oid}:${j}`]; if(!st.item && os && os.item) st.item = os.item; }
  }
  if(cur === 'b2') render();
});
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.autxt; if(k && SEL[k]){ if(SEL[k].alvo.startsWith('s:')) SEL[k].nome = e.target.value; else SEL[k].texto = e.target.value; } });
document.addEventListener('change', e => {
  if(!M) return;
  if(e.target.id === 'au-a'){ le(); M.audio = e.target.files[0] || null; desenha(); }
  if(e.target.id === 'au-s'){ le(); M.slides = [...e.target.files]; desenha(); }
  if(e.target.id === 'au-d'){ const fo = foco(M.d); le(); if(!M.fo.trim() || M.fo === fo) M.fo = foco(M.d); desenha(); }
  if(e.target.id === 'au-tf' && e.target.files[0]){ const f = e.target.files[0]; le();
    f.text().then(t => { if(!M) return; M.tr = /\.(srt|vtt)$/i.test(f.name) ? legenda(t) : t; M.err = ''; desenha(); }, () => { if(M){ M.err = 'Não consegui ler o arquivo.'; desenha(); } }); }
});
document.addEventListener('input', e => {
  if(!M || e.target.id !== 'au-tr') return;
  const i = document.getElementById('au-tri'); if(i){ i.textContent = trInfo(e.target.value); i.classList.toggle('grande', e.target.value.length > TR_MAX); }
});
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  const nv = q('[data-aunova]'); if(nv){ abre(nv.dataset.aunova); return; }
  if(q('[data-aufecha]')){ fecha(); return; }
  if(q('[data-auenvia]')){ envia(); return; }
  if(q('[data-aucola]')){ colar(); return; }
  if(q('[data-auarq]')){ document.getElementById('au-tf').click(); return; }
  const cf = q('[data-auconf]'); if(cf){ cf.disabled = true; await confirma(cf.dataset.auconf); return; }
  const ms = q('[data-aumais]'); if(ms){ MAIS.add(ms.dataset.aumais); render(); return; }
  const nm = q('[data-aunome]'); if(nm){ nm.disabled = true; await nomeIA(nm.dataset.aunome); return; }
  const vt = q('[data-auvolta]'); if(vt){ const a = AU.aulas.find(x => x.id === vt.dataset.auvolta); if(!a) return;
    for(const [i, s] of a.sugestoes.entries()) if(s.estado === 'nao'){ await post('/api/aulas/decidir', {id:a.id, i, estado:''}).catch(() => {}); s.estado = ''; }
    render(); return; }
  const ap = q('[data-auapaga]'); if(ap){ const a = AU.aulas.find(x => x.id === ap.dataset.auapaga);
    if(!a || !confirm(`Apagar o resumo e a transcrição de "${a.assunto}"? As tarefas que já entraram na Lista ficam.`)) return;
    try { await post('/api/aulas/apagar', {id:a.id}); await carrega(); render(); } catch(err){ toast('Não apagou: ' + esc(err.message)); } return; }
  const cc = q('[data-aucancela]'); if(cc){ try { await post('/api/aulas/cancela', {id:cc.dataset.aucancela}); } catch(err){} await carrega(); render(); return; }
  const rf = q('[data-aurefaz]'); if(rf){ try { await post('/api/aulas/processar', {id:rf.dataset.aurefaz}); await carrega(); render(); vigia(); } catch(err){ toast('Não deu: ' + esc(err.message)); } return; }
});
document.addEventListener('keydown', e => { if(M && e.key === 'Escape' && !M.env) fecha(); });

window.GB_AULAS = {dados: () => AU, carrega};
carrega().then(() => { if(CTX && cur === 'b2') render(); vigia(); });
})();
