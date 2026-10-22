/* Ganbatte · aulas, dentro do chefão aberto (Chefões novos): o jogador manda o áudio e/ou os slides de uma aula, o servidor
 * transcreve (faster-whisper, se instalado) e a IA ligada escreve o resumo e sugere tarefas de estudo. Cada sugestão espera a
 * escolha do jogador: não adicionar, adicionar (POST /api/add, com +fac.SIGLA e aula:DATA) ou juntar com uma tarefa aberta
 * parecida (POST /api/act edit, que só acrescenta aula:DATA e o prazo). O resumo abre em /aulas/SIGLA/ARQUIVO.html.
 * Carregado depois de ia.js: usa CTX, D, HOJE, BOSSES, UI, RENDER, render, recarrega, post, esc, toast, ddmm, avB e o
 * estilo .wz do assistente.
 */
(function(){
'use strict';

document.head.insertAdjacentHTML('beforeend', `<style>
.cn-au{grid-column:1/-1;border-top:1px solid var(--hair);padding-top:12px}
.cn-au h4{display:flex;align-items:center;gap:6px} .cn-au h4 .btn{margin-left:auto;text-transform:none;letter-spacing:0}
.au{border-top:1px solid var(--hair);padding:8px 0} .cn-au h4 + .au,.cn-au h4 + .au-j{border-top:0}
.au-l{display:flex;gap:10px;align-items:baseline;font-size:13.5px;min-width:0}
.au-l .dt{font:600 12px var(--f-mono);color:var(--soft);white-space:nowrap}
.au-l a{color:var(--ink);font-weight:600;text-decoration:none} .au-l a:hover{text-decoration:underline}
.au-l .au-tr{font:11.5px var(--f-mono);color:var(--soft)} .au-l .x{margin-left:auto}
.au-s{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:3px 10px;align-items:center;margin:6px 0 0 52px}
.au-s .pri{font:700 12px var(--f-mono);color:var(--soft)} .au-s .pri.A{color:var(--red)} .au-s .pri.B{color:var(--amb)}
.au-s input{width:100%;font:13.5px var(--f-ui);color:var(--ink);background:none;border:1px solid transparent;border-radius:7px;padding:3px 6px;margin-left:-7px}
.au-s input:hover,.au-s input:focus{border-color:var(--hair);background:var(--panel2)}
.au-s small{grid-column:2/-1;font:11.5px var(--f-mono);color:var(--soft)}
.au-s .ac{display:flex;gap:6px;align-items:center}
.au-s select{max-width:190px;font:12px var(--f-ui);background:var(--panel2);color:var(--ink);border:1px solid var(--hair);border-radius:6px;padding:2px 4px}
.au-ok{margin:6px 0 0 52px;font:11.5px var(--f-mono);color:var(--faint)} .au-ok .go{font-size:11.5px}
.au-j{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font:12.5px var(--f-mono);color:var(--soft);padding:8px 0;border-top:1px solid var(--hair)}
.au-j .bar{flex:0 0 140px;height:5px;border-radius:99px;background:var(--track);overflow:hidden} .au-j .bar b{display:block;height:100%;background:var(--volt)}
.au-j.erro{color:var(--red)} .au-j .ac{margin-left:auto;display:flex;gap:12px}
.au-bd{display:inline-block;margin-left:8px;font:600 10.5px var(--f-mono);color:var(--volt);border:1px solid color-mix(in srgb,var(--volt) 50%,var(--hair));border-radius:99px;padding:0 7px;vertical-align:2px}
#au .wz{max-width:620px} #au code{font:12px var(--f-mono);background:var(--panel2);border:1px solid var(--hair);border-radius:6px;padding:4px 8px;display:block;white-space:pre-wrap;word-break:break-all;margin-top:6px}
#au textarea{min-height:110px;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:13px var(--f-ui);color:var(--ink);width:100%}
#au .au-av{border-left:3px solid var(--amb);background:var(--panel2);border-radius:8px;padding:8px 12px;font-size:13px;color:var(--soft)}
#au .au-pb{height:5px;border-radius:99px;background:var(--track);overflow:hidden;flex:1;min-width:80px} #au .au-pb b{display:block;height:100%;background:var(--volt)}
</style>`);

let AU = {aulas:[], jobs:[], whisper:{ok:true, como:''}};
const ETAPA = {fila:'na fila', transcrevendo:'transcrevendo', lendo:'lendo os slides', resumindo:'a IA está resumindo'};
const rodando = () => AU.jobs.some(j => j.etapa !== 'erro');
const pendentes = d => AU.aulas.filter(a => a.sigla === d).reduce((n, a) => n + a.sugestoes.filter(s => !s.estado).length, 0);
const norm = t => GBx.norm(String(t || '')).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
async function carrega(){ try { const r = await fetch('/api/aulas', {cache:'no-store'}); const j = await r.json(); if(j.ok) AU = j; } catch(e){} }
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

/* a tarefa aberta que a sugestão pode juntar: a que a IA apontou (mesmo texto) ou a mais parecida (metade das palavras em comum) */
function alvo(s, b){
  const j = norm(s.juntar); if(j){ const t = b.open.find(t => norm(t.txt) === j || j.includes(norm(t.txt))); if(t) return t; }
  const ws = new Set(norm(s.texto).split(' ').filter(w => w.length > 3)); if(!ws.size) return null;
  let melhor = null, nota = .5;
  for(const t of b.open){ const wt = norm(t.txt).split(' ').filter(w => w.length > 3), c = wt.filter(w => ws.has(w)).length / Math.max(ws.size, wt.length, 1); if(c >= nota){ nota = c; melhor = t; } }
  return melhor;
}
const EST = {nao:'não adicionada', add:'adicionada', juntar:'juntada'};
function sugRow(a, s, i, b){
  const t = alvo(s, b), k = `${a.id}:${i}`;
  return `<div class="au-s"><span class="pri ${s.pri}">${s.pri ? `(${s.pri})` : ''}</span><input data-autxt="${k}" value="${esc(s.texto)}" aria-label="texto da tarefa" title="dá para editar antes de adicionar">
    <span class="ac"><button type="button" class="go" data-audec="${k}:nao" title="não adicionar">✕</button><button type="button" class="btn" data-audec="${k}:add">+ adicionar</button>
      ${b.open.length ? `<select data-aualvo="${k}" aria-label="juntar com qual tarefa"><option value="">juntar com…</option>${b.open.map(o => `<option value="${o.n}"${t === o ? ' selected' : ''}>${esc(o.txt.slice(0, 60))}</option>`).join('')}</select><button type="button" class="btn" data-audec="${k}:juntar">⇄ juntar</button>` : ''}</span>
    <small title="${esc(s.detalhe)}">${[s.est, s.due ? 'prazo ' + ddmm(s.due) : '', s.av ? 'prepara ' + s.av : '', s.motivo].filter(Boolean).map(esc).join(' · ')}</small></div>`;
}
function aulaRow(a, b){
  const pend = a.sugestoes.map((s, i) => [s, i]).filter(([s]) => !s.estado), feitas = a.sugestoes.filter(s => s.estado);
  return `<div class="au"><div class="au-l"><span class="dt">${ddmm(a.data)}</span><a href="/aulas/${a.html}" target="_blank" rel="noopener">${esc(a.assunto)}</a>${a.md ? `<a class="au-tr" href="/aulas/${a.md}" target="_blank" rel="noopener">transcrição</a>` : ''}
      <button type="button" class="go x" data-auapaga="${a.id}" title="apagar o resumo e a transcrição (as tarefas ficam)">apagar</button></div>
    ${pend.map(([s, i]) => sugRow(a, s, i, b)).join('')}
    ${feitas.length ? `<div class="au-ok">${['add','juntar','nao'].map(e => { const n = feitas.filter(s => s.estado === e).length; return n ? `${n} ${EST[e]}${n > 1 ? 's' : ''}` : ''; }).filter(Boolean).join(' · ')}${a.sugestoes.some(s => s.estado === 'nao') ? ` · <button type="button" class="go" data-auvolta="${a.id}">rever as não adicionadas</button>` : ''}</div>` : ''}</div>`;
}
function jobRow(j){
  if(j.etapa === 'erro') return `<div class="au-j erro"><span>${ddmm(j.data)} · ${esc(j.erro)}</span><span class="ac"><button type="button" class="go" data-aurefaz="${j.id}">tentar de novo</button><button type="button" class="go" data-aucancela="${j.id}">apagar</button></span></div>`;
  const min = Math.floor(j.seg / 60);
  return `<div class="au-j"><span>${ddmm(j.data)} · ${ETAPA[j.etapa] || j.etapa}${j.etapa === 'transcrevendo' ? ` ${j.prog}%` : ''}</span>${j.etapa === 'transcrevendo' ? `<span class="bar"><b style="width:${j.prog}%"></b></span>` : ''}
    <small>${min ? `${min} min` : 'agora'}</small><span class="ac"><button type="button" class="go" data-aucancela="${j.id}">cancelar</button></span></div>`;
}
function secao(b){
  const as = AU.aulas.filter(a => a.sigla === b.d).sort((p, q) => q.data.localeCompare(p.data) || q.id.localeCompare(p.id)), js = AU.jobs.filter(j => j.sigla === b.d);
  return `<div class="cn-s cn-au"><h4>aulas<small>${as.length}</small><button type="button" class="btn v" data-aunova="${b.d}">mandar aula</button></h4>
    ${js.map(jobRow).join('')}${as.map(a => aulaRow(a, b)).join('')}
    ${as.length || js.length ? '' : '<p class="sub">Mande o áudio e/ou os slides de uma aula: a IA escreve o resumo e sugere o que estudar, e você escolhe o que entra na Lista.</p>'}</div>`;
}
const rB2a = RENDER.b2;
RENDER.b2 = S => { rB2a(S); if(!UI.cnova) return;
  for(const b of S.bs){
    const el = document.querySelector(`.cn-b[data-cnd="${b.d}"]`); if(!el) continue;
    const n = pendentes(b.d), roda = AU.jobs.some(j => j.sigla === b.d && j.etapa !== 'erro');
    if(n || roda) el.querySelector('.cn-h .nm').insertAdjacentHTML('beforeend', `<span class="au-bd" title="${roda ? 'aula sendo processada' : n + ' sugestão(ões) de estudo esperando'}">${roda ? 'aula…' : n}</span>`);
    const op = el.querySelector('.cn-op'); if(op) op.insertAdjacentHTML('beforebegin', secao(b));
  }
};

/* ---------- decidir uma sugestão ---------- */
async function decide(aid, i, estado){
  const a = AU.aulas.find(x => x.id === aid), s = a && a.sugestoes[i]; if(!s) return;
  try {
    if(estado === 'add'){
      const txt = (document.querySelector(`[data-autxt="${aid}:${i}"]`) || {}).value || s.texto, conf = /^conferir/i.test(txt);
      const linha = [s.pri ? `(${s.pri})` : '', txt.trim(), `+fac.${a.sigla}`, conf ? '' : '@estudo', s.av ? `av:${s.av}` : '', s.due ? `due:${s.due}` : '', `aula:${a.data}`].filter(Boolean).join(' ');
      await post('/api/add', {text:linha});
    }
    if(estado === 'juntar'){
      const n = +(document.querySelector(`[data-aualvo="${aid}:${i}"]`) || {}).value, t = D.abertas.find(t => t.n === n);
      if(!t){ toast('Escolha com qual tarefa juntar'); return; }
      const corpo = t.raw.replace(/^\([A-Z]\) /, '').replace(/^\d{4}-\d{2}-\d{2} /, '');
      await post('/api/act', {raw:t.raw, action:'edit', value: corpo + (/(^|\s)aula:/.test(corpo) ? '' : ` aula:${a.data}`) + (s.due && !/(^|\s)due:/.test(corpo) ? ` due:${s.due}` : '')});
    }
    await post('/api/aulas/decidir', {id:aid, i, estado});
    s.estado = estado;
    if(estado === 'add' || estado === 'juntar') await recarrega();
    render();
    if(estado === 'add') toast('Adicionada à Lista');
    else if(estado === 'juntar') toast('Juntada <small>a tarefa ganhou a marca desta aula</small>');
  } catch(err){ toast('Não deu: ' + esc(err.message)); }
}

/* ---------- mandar aula ---------- */
let M = null;
function abre(d){ M = {d, data:HOJE, audio:null, slides:[], err:'', env:null}; desenha(); }
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
      <details${M.tr ? ' open' : ''}><summary class="sub" style="cursor:pointer">já tenho a transcrição (Teams, Zoom, legenda...)</summary><textarea id="au-tr" placeholder="cole aqui o texto da aula">${esc(M.tr || '')}</textarea></details>
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
  M.d = document.getElementById('au-d').value; M.data = document.getElementById('au-dt').value; M.tr = document.getElementById('au-tr').value;
  if(!M.audio && !M.slides.length && !M.tr.trim()){ M.err = 'Escolha o áudio, os slides ou cole a transcrição.'; desenha(); return; }
  if(M.audio && !AU.whisper.ok && !M.tr.trim()){ M.err = 'Sem o Whisper não dá para transcrever o áudio: instale (comando acima) ou cole a transcrição.'; desenha(); return; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(M.data)){ M.err = 'Escolha a data da aula.'; desenha(); return; }
  M.err = ''; M.env = {p:0, t:'preparando'}; desenha();
  try {
    const {id} = await post('/api/aulas/nova', {sigla:M.d, data:M.data});
    const fs = [M.audio, ...M.slides].filter(Boolean);
    for(let i = 0; i < fs.length; i++) await sobe(id, fs[i], i + 1, fs.length);
    await post('/api/aulas/processar', {id, transcricao: M.tr.trim() || undefined});
    const d = M.d; fecha(); UI.cnab.add(d);
    await carrega(); render(); vigia();
    toast('Aula enviada <small>roda em segundo plano; o andamento aparece no chefão</small>');
  } catch(err){ if(M){ M.env = null; M.err = err.message; desenha(); } }
}

document.addEventListener('change', e => {
  if(!M) return;
  if(e.target.id === 'au-a'){ M.audio = e.target.files[0] || null; M.d = document.getElementById('au-d').value; M.tr = document.getElementById('au-tr').value; desenha(); }
  if(e.target.id === 'au-s'){ M.slides = [...e.target.files]; M.d = document.getElementById('au-d').value; M.tr = document.getElementById('au-tr').value; desenha(); }
  if(e.target.id === 'au-d'){ M.d = e.target.value; M.tr = document.getElementById('au-tr').value; desenha(); }
});
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  const nv = q('[data-aunova]'); if(nv){ abre(nv.dataset.aunova); return; }
  if(q('[data-aufecha]')){ fecha(); return; }
  if(q('[data-auenvia]')){ envia(); return; }
  const dc = q('[data-audec]'); if(dc){ const [aid, i, est] = dc.dataset.audec.split(':'); dc.disabled = true; await decide(aid, +i, est); return; }
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

carrega().then(() => { if(CTX && cur === 'b2') render(); vigia(); });
})();
