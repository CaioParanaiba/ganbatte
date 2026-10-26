/* Ganbatte · guia: o assistente da primeira entrada (licença, o ciclo, os 6 tipos, hábitos, matérias), o editor de disciplinas,
 * a aba Chefões vazia e o tutorial de cada aba.
 * Carregado depois do script da página: usa CTX, EST, NEN, HOJE, tab, render, post, recarrega, esc, ic, NC, salvaUI, D, estado, fmt.
 * O assistente grava por POST /api/config {jogador, avaliacoes}; o tutorial lembra as abas já vistas em estado.json (tour).
 */
(function(){
'use strict';

/* ---------- estilo ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
#av-contrib{position:fixed;right:16px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:57;width:min(360px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow-y:auto;background:var(--panel);border:1px solid var(--volt);border-radius:14px;padding:14px 16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.7);font:14px/1.45 var(--f-ui);color:var(--ink)}
#av-contrib .avc-top{display:flex;gap:8px;align-items:center;font:700 15px var(--f-hud);margin-bottom:8px}
#av-contrib .avc-top .ic{width:20px;height:20px;color:var(--volt)}
#av-contrib ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
#av-contrib li{padding-top:8px;border-top:1px solid var(--hair)}
#av-contrib li small{display:block;color:var(--soft);font-size:12.5px}
#av-contrib .avc-bt{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
.wz-bg{position:fixed;inset:0;z-index:60;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(6px);overflow-y:auto;padding:24px 16px calc(24px + env(safe-area-inset-bottom,0px))}
.wz{max-width:860px;margin:0 auto;background:var(--panel);border:1px solid var(--hair);border-radius:18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}
.wz-top{display:flex;gap:14px;align-items:center;padding:18px 22px;border-bottom:1px solid var(--hair)}
.wz-top img{width:42px;height:42px}
.wz-top h2{margin:0;font:700 20px var(--f-hud)} .wz-top p{margin:0;color:var(--soft);font-size:13px}
.wz-steps{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}
.wz-steps i{width:26px;height:5px;border-radius:3px;background:var(--track)} .wz-steps i.on{background:var(--volt)}
.wz-body{padding:20px 22px;display:flex;flex-direction:column;gap:14px}
.wz-body h3{margin:0;font:700 17px var(--f-hud)}
.wz-body p{margin:0;color:var(--soft);font-size:14px;max-width:72ch}
.wz-body p b{color:var(--ink)}
.wz-f{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.wz label{display:flex;flex-direction:column;gap:4px;font:600 11px var(--f-mono);color:var(--faint);letter-spacing:.08em;text-transform:uppercase}
.wz label.srv-op{flex-direction:row;gap:8px;align-items:center;font:14px var(--f-ui);color:var(--ink);letter-spacing:0;text-transform:none}
.wz input,.wz select{background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:14px var(--f-ui);color:var(--ink);text-transform:none;letter-spacing:0;min-width:0}
.wz input.bad{border-color:var(--red)}
.wz small.h{font:12px var(--f-ui);color:var(--soft);text-transform:none;letter-spacing:0}
.wz-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.wz-card{border:1px solid var(--hair);border-radius:12px;padding:12px;background:var(--panel2);display:flex;flex-direction:column;gap:4px}
.wz-card b{font:700 14px var(--f-hud);display:flex;gap:8px;align-items:center}
.wz-card span{font-size:13px;color:var(--soft)}
.wz-bg .wz-sm{font-size:13px}
/* licença (passos 1 e 6): visual seco, só borda, tipografia e o 念 de fundo; o carimbo é a única animação */
.wz-lic{width:100%;max-width:360px;aspect-ratio:1.586;border-radius:14px;border:1.5px solid var(--volt);background:var(--panel2);position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto 1fr auto;gap:8px 14px;padding:14px 16px}
.wz-lic .lic-kj{position:absolute;right:-6px;bottom:-24px;font:700 120px/1 "Noto Serif JP",serif;color:color-mix(in srgb,var(--volt) 10%,transparent);pointer-events:none}
.wz-lic .lic-lt{grid-column:1/-1;display:flex;justify-content:space-between;font:600 10.5px var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--volt)}
.wz-lic .lic-ph{width:74px;height:92px;border-radius:8px;border:1px solid var(--hair);background:var(--panel) center/cover}
.wz-lic .lic-dd{display:flex;flex-direction:column;gap:2px;min-width:0}
.wz-lic .lic-dd b{font:700 20px/1.1 var(--f-hud);overflow-wrap:anywhere} .wz-lic .lic-dd span{font:12px var(--f-mono);color:var(--soft);overflow-wrap:anywhere}
.wz-lic dl{display:grid;grid-template-columns:auto 1fr;gap:1px 10px;margin:8px 0 0;font:11.5px var(--f-mono)} .wz-lic dt{color:var(--faint)} .wz-lic dd{margin:0}
.wz-lic .lic-lb{grid-column:1/-1;font:11px var(--f-mono);color:var(--faint);letter-spacing:.2em;overflow:hidden;white-space:nowrap}
.wz-lic.carimbo{animation:wz-carimbo .7s cubic-bezier(.2,.9,.25,1.2) both}
.wz-lic .lic-selo{position:absolute;right:14px;top:34px;font:700 11px var(--f-mono);letter-spacing:.12em;color:var(--grn);border:1.5px solid var(--grn);border-radius:6px;padding:2px 7px;transform:rotate(-8deg);animation:wz-selo .4s .55s both}
@keyframes wz-carimbo{0%{transform:scale(1.25) rotate(-4deg);opacity:0}60%{transform:scale(.98) rotate(.5deg);opacity:1}100%{transform:none}}
@keyframes wz-selo{from{opacity:0;transform:rotate(-8deg) scale(1.6)}to{opacity:1;transform:rotate(-8deg)}}
@media (prefers-reduced-motion:reduce){.wz-lic.carimbo,.wz-lic .lic-selo{animation:none}}
.wz-quem{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,340px);gap:20px;align-items:start}
.wz-quem.wz-fim{grid-template-columns:minmax(0,340px) minmax(0,1fr);align-items:center}
.wz-col{display:flex;flex-direction:column;gap:12px;min-width:0}
/* passo 2: o ciclo */
.wz-loop{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1.3fr);gap:10px;align-items:stretch}
.wz-loop .arr{align-self:center;font:700 18px var(--f-mono);color:var(--faint)}
.wz-lp{border:1px solid var(--hair);border-radius:12px;padding:12px;background:var(--panel2);display:flex;flex-direction:column;gap:4px;min-width:0}
.wz-lp .wz-k{font:600 10.5px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--volt)}
.wz-lp b{font:700 15px var(--f-hud)} .wz-lp span{font-size:13px;color:var(--soft)}
.wz-lp ul{margin:2px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;font-size:13px;color:var(--soft)} .wz-lp li b{font:600 13px var(--f-ui);color:var(--ink)}
.wz-also{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.wz-also div{border-top:2px solid var(--c);padding-top:8px;font-size:13px;color:var(--soft);min-width:0} .wz-also div b{display:block;font:700 14px var(--f-hud);color:var(--ink)}
.wz-cap{margin:0;font:600 11px var(--f-mono);color:var(--faint);letter-spacing:.12em;text-transform:uppercase}
/* passo 3: o hexágono */
.wz-hex{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:18px;align-items:center}
.wz-hex svg{width:100%;height:auto;display:block}
.wz-hex svg .g{fill:none;stroke:var(--hair);stroke-width:1}
.wz-hex svg [data-wznen]{cursor:pointer} .wz-hex svg circle{stroke:var(--panel);stroke-width:3}
.wz-hex svg text{font:600 10.5px var(--f-mono);fill:var(--soft)} .wz-hex svg .on text{fill:var(--ink);font-weight:800}
.wz-tp{border:1px solid var(--hair);border-left:4px solid var(--c);border-radius:12px;padding:14px 16px;background:var(--panel2);display:flex;flex-direction:column;gap:8px;min-width:0}
.wz-tp header{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.wz-tp h4{margin:0;font:700 20px var(--f-hud);color:var(--c)} .wz-tp header span{font:600 12px var(--f-mono);color:var(--soft)}
.wz-tp header em{margin-left:auto;font:700 13px var(--f-mono);font-style:normal}
.wz-tp code{font:12px var(--f-mono);color:var(--soft);background:var(--panel);border-radius:6px;padding:3px 8px;overflow-wrap:anywhere}
.wz-tp .no{font-size:12.5px;color:var(--faint)}
.wz-nens{display:flex;gap:6px;flex-wrap:wrap}
.wz-nens button{border:1.5px solid var(--hair);background:none;border-radius:99px;padding:3px 10px;cursor:pointer;font:600 12px var(--f-mono);color:var(--soft)}
.wz-nens button[aria-pressed="true"]{border-color:var(--c);color:var(--c)}
/* passo 4: hábitos e integrações */
.wz-hb{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px;align-items:start}
.wz-pts{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13.5px;color:var(--soft)} .wz-pts b{color:var(--ink);font-weight:600}
.wz-ig{border:1px solid var(--hair);border-radius:12px;background:var(--panel2);padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.wz-bg .wz-ig label.sw{flex-direction:row;gap:10px;align-items:center;font:14px var(--f-ui);color:var(--ink);letter-spacing:0;text-transform:none;cursor:pointer}
.wz-ig label.sw b{font:700 14px var(--f-hud);display:block} .wz-ig label.sw small{display:block;font-size:12px;color:var(--soft)}
.wz-ig label.sw input{margin-left:auto;width:18px;height:18px;accent-color:var(--grn)}
.wz-ig > span{font-size:12.5px;color:var(--soft)} .wz-ig > span b{color:var(--ink)}
/* passo 5: matérias */
.wz-opts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.wz-op{border:1.5px solid var(--hair);border-radius:14px;padding:14px;background:var(--panel2);cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:6px;min-width:0;color:var(--ink);font:inherit}
.wz-op b{font:700 15px var(--f-hud)} .wz-op span{font-size:13px;color:var(--soft)} .wz-op span b{font:600 13px var(--f-ui);color:var(--ink)}
.wz-op[aria-pressed="true"]{border-color:var(--volt);background:color-mix(in srgb,var(--volt) 7%,var(--panel2))}
/* aba Chefões vazia */
.b2-vazio{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px}
.b2-vazio h3{margin:0 0 6px;font:700 22px var(--f-hud)} .b2-vazio p{margin:0 0 8px;color:var(--soft);font-size:14px} .b2-vazio p b{color:var(--ink)}
.b2-ryo{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.b2-ryo i{width:34px;height:34px;border-radius:50%;border:1.5px dashed var(--faint);display:grid;place-items:center;font:700 12px var(--f-hud);color:var(--faint);font-style:normal}
.b2-cam{display:flex;flex-direction:column;gap:8px}
.b2-cam > div{border:1px solid var(--hair);border-radius:12px;padding:12px 14px;background:var(--panel2);display:flex;flex-direction:column;gap:6px}
.b2-cam > div.rec{border-color:color-mix(in srgb,var(--volt) 50%,var(--hair))}
.b2-cam b{font:700 14px var(--f-hud)} .b2-cam span{font-size:13px;color:var(--soft)}
.b2-cam .bt{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.wz-disc{display:flex;flex-direction:column;gap:8px}
.wz-row{display:grid;grid-template-columns:110px minmax(0,1fr) 150px 150px 34px;gap:8px;align-items:end}
.wz-row.wz-hrow{grid-template-columns:minmax(0,1fr) 150px 34px}
.wz-row .boss{grid-column:1/-1;font:12px var(--f-mono);color:var(--soft);margin-top:-2px}
.wz-x{border:1px solid var(--hair);background:none;border-radius:9px;height:36px;cursor:pointer;color:var(--soft)} .wz-x:hover{color:var(--red);border-color:var(--red)}
.wz-foot{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:14px 22px;border-top:1px solid var(--hair);flex-wrap:wrap}
.wz-foot .err{color:var(--red);font-size:13px}
.wz-av{display:flex;gap:10px;flex-wrap:wrap}
.wz-av button{width:64px;height:64px;border-radius:50%;border:2px solid var(--hair);background:var(--panel2) center/cover;cursor:pointer;padding:0}
.wz-av button[aria-pressed="true"]{border-color:var(--volt);box-shadow:0 0 0 3px color-mix(in srgb,var(--volt) 25%,transparent)}
@media (max-width:720px){ .wz-f,.wz-cards,.wz-quem,.wz-quem.wz-fim,.wz-also,.wz-hex,.wz-hb,.wz-opts,.b2-vazio{grid-template-columns:1fr} .wz-row{grid-template-columns:1fr 1fr} .wz-row .wz-x{grid-column:2} .wz-row.wz-hrow{grid-template-columns:minmax(0,1fr) 128px 34px} .wz-row.wz-hrow .wz-x{grid-column:auto}
  .wz-steps{display:none} .wz-loop{grid-template-columns:1fr} .wz-loop .arr{justify-self:center;transform:rotate(90deg)} .wz-hex svg{max-width:280px;margin:0 auto} }

.tr-hole{position:fixed;z-index:70;border-radius:14px;box-shadow:0 0 0 9999px rgba(8,10,16,.66);outline:2px solid var(--volt);pointer-events:none;transition:all .2s ease}
.tr-pop{position:fixed;z-index:71;width:min(360px,calc(100vw - 32px));background:var(--panel);border:1px solid var(--volt);border-radius:14px;padding:14px 16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.7)}
.tr-pop .tr-k{font:600 11px var(--f-mono);color:var(--faint);letter-spacing:.1em;text-transform:uppercase}
.tr-pop h4{margin:4px 0 6px;font:700 16px var(--f-hud)}
.tr-pop p{margin:0;font-size:14px;color:var(--soft)} .tr-pop p b{color:var(--ink)}
.tr-pop .bt{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
.tr-pop .bt .pl{margin-right:auto}
.gnav .tr-q{margin-left:4px}
@media (prefers-reduced-motion:reduce){.tr-hole{transition:none}}
</style>`);

/* ---------- assistente da primeira entrada ---------- */
const TIPOS = [
  {k:'ent', n:'Entrega',   c:5, pre:'@', ess:'um <b>trabalho seu que alguém cobra</b> ou avalia: lista entregue, trabalho, atividade no sistema da faculdade, relatório do estágio. Ter prazo não basta.', ex:'Entregar a lista 3 de derivadas +fac.CALC2 {tag} due:sexta', xp:25, no:'Pagar um boleto tem prazo, mas ninguém avalia: é vida.'},
  {k:'est', n:'Estudo',    c:0, pre:'@', ess:'tempo de <b>aprender</b>: revisar, ler, resumir, fazer exercícios. Ninguém cobra, mas é o que prepara a prova. Tarefa só com a disciplina já é estudo.', ex:'Revisar integrais por partes +fac.CALC2 {tag}', xp:15, no:'Entregar a lista não é estudo: alguém cobra, então é entrega.'},
  {k:'tre', n:'Treino', c:1, pre:'+', ess:'<b>prática de programação fora da matéria</b>: Codeforces, contest, LeetCode, upsolve.', ex:'Virtual contest no Codeforces {tag}', xp:10, no:'O trabalho prático de uma disciplina não é treino: é entrega.'},
  {k:'pro', n:'Projeto', c:2, pre:'+', ess:'<b>criar algo seu</b>, fora da matéria: o seu app, site ou bot, ajudar num projeto (como o próprio Ganbatte).', ex:'Fazer a página inicial do meu site {tag}', xp:10, no:'O projeto final de uma disciplina é entrega: alguém avalia.'},
  {k:'hab', n:'Hábito',    c:4, pre:'+', ess:'o que se <b>repete todo dia</b>: digitação, leitura, exercício.', ex:'Treino de digitação {tag}', xp:5, no:'Tem data (aluguel todo dia 1)? Não é hábito: é uma tarefa que repete.'},
  {k:'vid', n:'Vida',      c:3, pre:'',  ess:'<b>todo o resto</b>: casa, família, saúde, documentos. Sem tag nenhuma.', ex:'Renovar a carteirinha do RU', xp:10, fixo:'sem tag'},
];
const RYODAN = [['Chrollo','crown','O líder: rouba a técnica dos outros.'],['Feitan','spider','Rápido e cruel nos detalhes.'],['Machi','thread','Costura tudo com fios de Nen.'],
  ['Nobunaga','bullet','Um corte só, se você entrar no alcance.'],['Uvogin','horn','Força bruta: só cai com treino.'],['Shalnark','antenna','Controla tudo por antenas.'],
  ['Shizuku','vacuum','Aspira qualquer coisa e esquece o resto.'],['Kortopi','copy','Copia tudo, mas a cópia some.'],['Franklin','bullet','Rajada sem fim de exercícios.'],
  ['Phinks','wing','Cada giro do braço bate mais forte.'],['Pakunoda','spider','Lê as memórias: sabe o que você não estudou.'],['Bonolenov','cat','O som da batalha.']];
const W = {editar:false, passo:0, nome:'', nick:'', av:'logo', tags:{}, habs:[], hid:[], cfOn:false, cfH:'', cfM:3, disc:[], ini:'', fim:'', p1:40, p2:60, err:'', nen:0, mat:'depois'};
/* frequência do hábito: 0 = todo dia; 1 a 6 = vezes por semana (seg a dom) */
const freqSel = (attr, v) => `<select ${attr} aria-label="Frequência">${[0,1,2,3,4,5,6].map(n => `<option value="${n}"${+v === n ? ' selected' : ''}>${n ? n + '× por semana' : 'todo dia'}</option>`).join('')}</select>`;
/* id do hábito: o que ele já tinha, mesmo com o nome mudado (renomear não zera o nível nem o histórico); hábito novo: pelo nome,
   sem repetir o id de outro (renomeado "Leitura" para "Ler", um "Leitura" novo vira h-leitura-2) */
const habsJSON = (nomes, freq, ids = []) => { const usados = new Set(ids.filter(Boolean));
  return nomes.map((n,i) => [String(n).trim(), +freq[i] || 0, ids[i]]).filter(([n]) => n).map(([n,f,id]) => {
    if(!id){ const b = slug(n); id = b; for(let k = 2; usados.has(id); k++) id = b + '-' + k; usados.add(id); }
    return f ? {id, n, semana:f} : {id, n}; }); };
const slug = n => 'h-' + (norm(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'habito');
const HANDLE = /^[A-Za-z0-9_.-]{3,24}$/, DUO_US = /^[A-Za-z0-9_.-]{1,40}$/;
function chefaoDe(d, i){
  const b = (BOSSES || []).find(b => b.d === d.d);
  if(b && W.editar) return [b.semNome ? '' : b.n0 ?? b.n, b.ic, b.why0 ?? b.why];   // o que está no arquivo, não o nome do retrato
  return ['', 'spider', ''];   // chefão novo sem nome (#203): o jogador escolhe o personagem pelo retrato, na aba Chefões
}
/* blocos do avaliacoes.txt por disciplina: do "# comentário" logo acima do [SIGLA] até o próximo bloco */
function blocos(txt){
  const L = String(txt||'').split('\n'), out = {}; let cur = null, buf = [];
  const fecha = () => { if(cur) out[cur] = buf.join('\n'); };
  for(let i = 0; i < L.length; i++){
    const m = L[i].trim().match(/^\[(\w+)\]/);
    if(m){ let k = buf.length; while(k > 0 && buf[k-1].trim().startsWith('#')) k--; const com = cur ? buf.splice(k) : []; fecha(); cur = m[1].toUpperCase(); buf = com.concat(L[i]); continue; }
    if(cur) buf.push(L[i]);
  }
  fecha(); return out;
}
const tagPadrao = k => { const T = GBx.TAGS[k]; return !T ? '' : T.ctx[0] ? '@' + T.ctx[0] : T.proj[0] ? '+' + T.proj[0] : ''; };
const limpaTag = (k, v) => { const pre = TIPOS.find(t => t.k === k).pre; v = String(v||'').trim().toLowerCase().replace(/\s+/g, ''); if(!v) return ''; if(v[0] !== '@' && v[0] !== '+') v = pre + v; return v.length > 1 ? v : ''; };
const iso = d => d.toISOString().slice(0,10);
function semestrePadrao(){
  const [y, m] = HOJE.split('-').map(Number);
  return m <= 6 ? [`${y}-02-01`, `${y}-06-30`, `${y}-08-01`] : [`${y}-08-01`, `${y}-12-15`, `${y+1}-02-01`];
}
function meio(a, b, f){ const x = new Date(a + 'T12:00:00Z'), y = new Date(b + 'T12:00:00Z'); return iso(new Date(+x + (y - x) * f)); }
function iniciaW(){
  const j = CTX.JOG || {};
  const [ini, fim] = j.semestre ? [j.semestre.ini, j.semestre.fim] : semestrePadrao();
  Object.assign(W, {passo:0, nome: j.nome && j.nome !== 'Hunter' ? j.nome : '', nick: j.nick || '', av: UI.avatar || 'logo', ini, fim, err:'', nen:0, mat: j.materias || 'depois'});
  for(const t of TIPOS) if(!t.fixo) W.tags[t.k] = tagPadrao(t.k);
  W.habs = (j.habitos && j.habitos.length ? j.habitos.map(h => h.n) : ['Treino de digitação', 'Leitura (20 min)', 'Academia']);
  W.hf = (j.habitos && j.habitos.length ? j.habitos.map(h => h.semana || 0) : [0, 0, 2]);
  W.hid = (j.habitos || []).map(h => h.id);
  W.cfOn = !!(j.cf && j.cf.handle); W.cfH = (j.cf && j.cf.handle) || ''; W.cfM = (j.cf && j.cf.meta) || 3;
  W.duoOn = !!(j.duo && j.duo.usuario); W.duoU = (j.duo && j.duo.usuario) || '';
  /* a primeira entrada não pede disciplinas (#127): elas vão na aba Chefões; as que já existirem no jogador.json continuam */
  W.disc = (j.disciplinas || []).map(d => ({...d, n1: d.n1 || meio(ini, fim, .45), n2: d.n2 || meio(ini, fim, .95)}));
}
const PASSOS_1 = ['Quem é você', 'Como funciona', 'Os 6 tipos', 'Tarefa, caçada, projeto', 'Hábitos', 'Matérias', 'Licença'];
let PASSOS = PASSOS_1;
const nHabs = () => W.habs.filter(Boolean).length + (W.cfOn ? 1 : 0) + (W.duoOn ? 1 : 0);
/* a licença: monta-se ao vivo no passo 1 e volta carimbada no último */
function licHTML(carimbo){
  const nm = W.nome || 'Hunter', src = (W.av === 'logo' ? LOGO : avSrc(W.av)).replace(/'/g, '%27');
  return `<div class="wz-lic${carimbo ? ' carimbo' : ''}" id="wz-lic"><span class="lic-kj" aria-hidden="true">念</span>
    <div class="lic-lt"><span>Licença Hunter</span><span>Ganbatte</span></div>
    <div class="lic-ph" style="background-image:url('${src}')"></div>
    <div class="lic-dd"><b>${esc(nm)}</b><span>@${esc(W.nick || 'nickname')}</span>
      <dl><dt>andar</dt><dd>1 de 251</dd>${carimbo ? `<dt>hábitos</dt><dd>${nHabs()}</dd>` : ''}<dt>emitida</dt><dd>${GB.brData(HOJE)}</dd></dl></div>
    <div class="lic-lb" aria-hidden="true">${esc('<<GANBATTE<<' + nm.toUpperCase().replace(/\s+/g, '<') + '<'.repeat(24))}</div>
    ${carimbo ? '<span class="lic-selo">APROVADO</span>' : ''}</div>`;
}
/* os 6 tipos na ordem do hexágono (GBx.NEN): o tipo de tarefa de cada um; Manipulação é explicada pelos hábitos marcados */
function tipoNen(i){
  if(i === 4) return {ess:'os <b>hábitos</b> que você marca na Lista (próximo passo). Cada um sobe de nível com os dias seguidos.', xp:'3 a 12', ex:['Leitura (20 min) · todo dia', 'Academia · 2× por semana'],
    no:TIPOS.find(t => t.k === 'hab').no};
  const t = TIPOS.find(t => t.c === i);
  return {ess:t.ess, xp:t.xp, ex:[t.ex.replace('{tag}', t.fixo ? '' : W.tags[t.k] || '').trim()], no:t.no};
}
function hexHTML(){
  const R = 88, pt = (i, k) => { const a = -Math.PI/2 + i*Math.PI/3; return [Math.cos(a)*R*k, Math.sin(a)*R*k]; };
  const pol = k => [0,1,2,3,4,5].map(i => pt(i, k).map(n => n.toFixed(1)).join(',')).join(' ');
  let s = `<svg viewBox="-150 -122 300 244" aria-hidden="true">`;
  for(const k of [.33,.66,1]) s += `<polygon class="g" points="${pol(k)}"/>`;
  for(let i = 0; i < 6; i++){ const p = pt(i, 1); s += `<line class="g" x1="0" y1="0" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}"${i === W.nen ? ` style="stroke:${NC(i)};stroke-width:2"` : ''}/>`; }
  NEN.forEach((x, i) => { const p = pt(i, 1), q = pt(i, 1.2), an = Math.abs(q[0]) < 4 ? 'middle' : q[0] > 0 ? 'start' : 'end', y = q[1] + (q[1] > 4 ? 10 : q[1] < -4 ? -2 : 4);
    s += `<g data-wznen="${i}"${i === W.nen ? ' class="on"' : ''}><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === W.nen ? 9 : 7}" style="fill:${NC(i)}"/>
      <text x="${q[0].toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${an}">${esc(x.c)}</text></g>`; });
  const t = tipoNen(W.nen), n = NEN[W.nen];
  return `<div class="wz-hex">${s}</svg>
    <div class="wz-tp" style="--c:${NC(W.nen)}"><header><h4>${esc(n.c[0].toUpperCase() + n.c.slice(1))}</h4><span>${n.n}</span><em>${t.xp} XP</em></header>
      <p>${t.ess[0].toUpperCase() + t.ess.slice(1)}</p>${t.ex.map(e => `<code>${esc(e)}</code>`).join('')}${t.no ? `<p class="no">${t.no}</p>` : ''}</div></div>
    <div class="wz-nens" role="group" aria-label="tipos de Nen">${NEN.map((x, i) => `<button type="button" data-wznen="${i}" aria-pressed="${i === W.nen}" style="--c:${NC(i)}" title="${x.n}">${esc(x.c)}</button>`).join('')}</div>`;
}
function passoHTML(){
  if(W.editar) return discHTML();
  const p = W.passo;
  if(p === 0) return `<h3>Bem-vindo à Associação Hunter</h3>
    <div class="wz-quem"><div class="wz-col">
      <p>Você anota e conclui tarefas; o jogo transforma isso em andares, chefões e moedas para a loja. Primeiro, a sua licença.</p>
      <div class="wz-f">
        <label>Nome<input id="wz-nome" value="${esc(W.nome)}" placeholder="ex.: Gon Freecss" maxlength="40"><small class="h">Aparece na sua licença.</small></label>
        <label>Nickname<input id="wz-nick" value="${esc(W.nick)}" placeholder="ex.: gon" maxlength="20"><small class="h">Letras, números e _. É como o grupo te vê na Torre Trick.</small></label>
      </div>
      <label>Foto de perfil</label>
      <div class="wz-av">${['logo'].concat((CTX.AVATARES||[]).filter(a => GBx.catalogo([a]).slice(-1)[0].p === 0)).map(a => `<button type="button" data-wzav="${a}" aria-pressed="${W.av === a}" style="background-image:url('${(a === 'logo' ? LOGO : avSrc(a)).replace(/'/g, '%27')}')" title="${a === 'logo' ? 'Emblema' : esc(GBx.catalogo([a]).slice(-1)[0].n)}"></button>`).join('')}</div>
      <p class="wz-sm">As outras fotos estão na Loja do jogo.</p></div>
    <div class="wz-col">${licHTML(false)}<p class="wz-sm">Ela é carimbada no último passo.</p></div></div>`;
  if(p === 1) return `<h3>Como o jogo funciona</h3>
    <div class="wz-loop">
      <div class="wz-lp"><span class="wz-k">você</span><b>Conclui uma tarefa</b><span>Na Lista, como em qualquer app de tarefas.</span></div>
      <span class="arr" aria-hidden="true">→</span>
      <div class="wz-lp"><span class="wz-k">o jogo</span><b>Dá XP</b><span>Quanto, depende do tipo da tarefa. No prazo, vale mais.</span></div>
      <span class="arr" aria-hidden="true">→</span>
      <div class="wz-lp"><span class="wz-k">o XP vira</span><ul><li><b>andares</b> na Arena Celestial</li><li><b>Jenny</b> para gastar na loja</li><li><b>Nen</b> no tipo da tarefa</li></ul></div>
    </div>
    <p class="wz-cap">e também</p>
    <div class="wz-also">
      <div style="--c:${NC(3)}"><b>Ten</b>Dias seguidos com tarefa feita. Uma folga guardada (Zetsu) segura um dia vazio.</div>
      <div style="--c:var(--red)"><b>Chefões</b>Se você estuda, cada matéria vira um chefão, e a vida dele é a sua nota.</div>
      <div style="--c:${NC(4)}"><b>Cartas</b>Conquistas viram cartas na aba Conquistas, sem você precisar marcar nada.</div>
    </div>
    <p class="wz-sm">Nada pune: XP não se perde, e nota baixa vira bônus.</p>`;
  if(p === 2) return `<h3>Os 6 tipos de Nen</h3>
    <p>Cada tarefa treina um dos 6 tipos. O hexágono da Arena mostra o seu perfil, e o tipo mais fraco vira a <b>missão da semana</b>: as tarefas dele valem ×1,5. Clique num tipo.</p>
    ${hexHTML()}
    <p class="wz-sm">Na Lista você escolhe o tipo num botão, e o jogo sugere sozinho. As tags (${['ent','est','tre','pro'].map(k => `<span class="mono">${esc(W.tags[k])}</span>`).join(', ')}) dá para mudar em <b>Configurações</b>.</p>`;
  if(p === 3) return `<h3>Tarefa, caçada ou projeto?</h3>
    <p>Tudo começa como tarefa. Quando ela cresce, você organiza assim:</p>
    <div class="wz-loop">
      <div class="wz-lp"><span class="wz-k">de uma vez</span><b>Tarefa</b><span>Uma coisa só. Ex.: <i>Entregar a lista 3</i>, <i>Pagar o boleto</i>.</span></div>
      <span class="arr" aria-hidden="true">→</span>
      <div class="wz-lp"><span class="wz-k">em etapas</span><b>Caçada</b><span>Uma tarefa grande dividida em partes, que ficam juntas na Lista. Ex.: <i>Trabalho em grupo</i>: pesquisar, escrever, montar os slides. Tecla <b>C</b>.</span></div>
      <span class="arr" aria-hidden="true">→</span>
      <div class="wz-lp"><span class="wz-k">semanas ou meses</span><b>Projeto</b><span>Várias caçadas (os <b>marcos</b>) na aba <b>Projetos</b>, com bônus por semana em que você trabalhou nele. Ex.: <i>TCC</i>, <i>meu app</i>.</span></div>
    </div>
    <p class="wz-sm">Cada etapa continua sendo uma tarefa normal, com o seu tipo e o seu XP. Não confunda com o <b>tipo</b> projeto do passo anterior: o tipo diz o que a tarefa treina; caçada e projeto só organizam.</p>`;
  if(p === 4) return `<h3>Hábitos</h3>
    <div class="wz-hb"><div class="wz-col">
      <ul class="wz-pts"><li>O que você quer fazer <b>todo dia</b> ou <b>algumas vezes por semana</b>.</li>
        <li>Aparecem sozinhos na Lista; você marca quando fizer. Cada um sobe de <b>nível</b> com os dias seguidos (falhar desce um).</li>
        <li>Tem data (aluguel todo dia 1)? Não é hábito: é uma <b>tarefa que repete</b>, em detalhes → repete.</li></ul>
      <div class="wz-disc">${W.habs.map((h,i) => `<div class="wz-row wz-hrow"><label>Hábito ${i + 1}<input id="wz-h-${i}" value="${esc(h)}" placeholder="ex.: Treino de digitação" maxlength="40"></label><label>Frequência${freqSel(`id="wz-hf-${i}"`, W.hf[i])}</label><button type="button" class="wz-x" data-wzhdel="${i}" aria-label="remover hábito">✕</button></div>`).join('')}</div>
      <div><button type="button" class="btn" data-wzhadd>+ hábito</button></div></div>
    <div class="wz-col"><p class="wz-cap">contam sozinhos</p>
      <div class="wz-ig"><label class="sw" for="wz-cf"><span><b>Codeforces</b><small>problemas aceitos no dia</small></span><input type="checkbox" id="wz-cf"${W.cfOn ? ' checked' : ''}></label>
        ${W.cfOn ? `<div class="wz-f"><label>Handle<input id="wz-cfh" value="${esc(W.cfH)}" placeholder="ex.: tourist" maxlength="24"></label><label>Meta por dia<input id="wz-cfm" inputmode="numeric" value="${W.cfM}"></label></div>
        <span>Conta os problemas <b>aceitos</b> no dia. Cada um vale pela cor dele comparada à sua (15 XP na sua faixa, mais acima, menos abaixo). Bater a meta dá +10; contest ao vivo, +20.</span>` : ''}</div>
      <div class="wz-ig"><label class="sw" for="wz-duo"><span><b>Duolingo</b><small>a ofensiva do seu perfil</small></span><input type="checkbox" id="wz-duo"${W.duoOn ? ' checked' : ''}></label>
        ${W.duoOn ? `<label>Usuário do Duolingo<input id="wz-duou" value="${esc(W.duoU)}" placeholder="o nome do seu perfil" maxlength="40"></label>
        <span>Só o usuário, <b>sem senha</b>: o jogo lê a ofensiva e marca o hábito no dia em que você faz a lição.</span>` : ''}</div>
    </div></div>`;
  if(p === 5) return `<h3>Você tem matérias neste semestre?</h3>
    <p>Se você estuda, <b>cada matéria vira um chefão</b> do Genei Ryodan, e a vida dele é a sua nota. Não precisa cadastrar nada agora.</p>
    <div class="wz-opts">${[['depois','Sim, configuro depois','Na aba <b>Chefões</b>, com calma. Com uma IA ligada, ela lê o plano de ensino e monta as avaliações.'],
      ['agora','Sim, quero fazer agora','Ao terminar, a aba Chefões abre direto no cadastro das matérias.'],
      ['nao','Não estudo agora','A aba Chefões fica lá, vazia, para quando você quiser.']].map(([k, t, d]) =>
      `<button type="button" class="wz-op" data-wzmat="${k}" aria-pressed="${W.mat === k}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>`;
  return `<h3>Licença emitida</h3>
    <div class="wz-quem wz-fim">${licHTML(true)}<div class="wz-col">
      <p>Tudo pronto, <b>${esc(W.nome.split(' ')[0] || 'Hunter')}</b>. Você começa no andar 1 da Arena Celestial, com ${nHabs()} hábito${nHabs() === 1 ? '' : 's'}.</p>
      <p>${W.mat === 'agora' ? 'Ao começar, a aba <b>Chefões</b> abre no cadastro das matérias. Depois, anote as tarefas na <b>Lista</b> e veja a torre subir.' : 'Anote a primeira tarefa na <b>Lista</b>, conclua, e veja a torre subir.'}</p>
      <p>O tutorial mostra o que cada bloco de cada aba quer dizer. Dá para rever a qualquer hora pelo botão <b>? tutorial</b>.</p></div></div>`;
}
/* editor de disciplinas (aba Chefões e Configurações; não faz mais parte da primeira entrada) */
function discHTML(){
  return `<h3>Disciplinas do semestre</h3>
    <p>Cada disciplina vira um chefão do Genei Ryodan. Adicione, renomeie ou remova disciplinas e ajuste as datas da N1 e da N2; o plano completo (provas, listas, trabalhos) fica no editor de cada chefão, à mão ou com a IA. As notas já registradas continuam valendo enquanto a sigla for a mesma.</p>
    <div class="wz-f" style="grid-template-columns:repeat(4,minmax(0,1fr))">
      <label>Início do semestre<input class="dt" inputmode="numeric" maxlength="10" placeholder="${GB.fmtTxt()}" id="wz-ini" value="${GB.brData(W.ini)}"></label>
      <label>Fim do semestre<input class="dt" inputmode="numeric" maxlength="10" placeholder="${GB.fmtTxt()}" id="wz-fim" value="${GB.brData(W.fim)}"></label>
      <label>Peso da N1<input id="wz-p1" inputmode="numeric" value="${W.p1}"></label>
      <label>Peso da N2<input id="wz-p2" inputmode="numeric" value="${W.p2}"></label>
    </div>
    <div class="wz-disc">${W.disc.map((d,i) => { const r = chefaoDe(d, i); return `<div class="wz-row">
      <label>Sigla<input id="wz-d-${i}" value="${esc(d.d)}" placeholder="CALC2" maxlength="8"${d.det ? ' readonly title="disciplina com plano detalhado: a sigla fica"' : ''}></label>
      <label>Nome<input id="wz-n-${i}" value="${esc(d.n)}" placeholder="Cálculo II" maxlength="50"></label>
      ${d.det ? `<span class="sub" style="grid-column:span 2;align-self:center">plano detalhado (${d.det} avaliações): datas e pesos ficam no <span class="mono">avaliacoes.txt</span></span>`
        : `<label>Data da N1<input class="dt" inputmode="numeric" maxlength="10" placeholder="${GB.fmtTxt()}" id="wz-n1-${i}" value="${GB.brData(d.n1)}"></label>
      <label>Data da N2<input class="dt" inputmode="numeric" maxlength="10" placeholder="${GB.fmtTxt()}" id="wz-n2-${i}" value="${GB.brData(d.n2)}"></label>`}
      <button type="button" class="wz-x" data-wzdel="${i}" title="remover" aria-label="remover disciplina">✕</button>
      <span class="boss">chefão: ${r[0] ? `${esc(r[0])}${r[2] ? ' · ' + esc(r[2]) : ''}` : 'você escolhe o personagem na aba Chefões'}${d.notas ? ` · <b style="color:var(--amb)">${d.notas} nota(s) registrada(s)</b>` : ''}</span></div>`; }).join('')}</div>
    <div><button type="button" class="btn" data-wzadd>+ disciplina</button></div>
    <p class="wz-sm">A sigla vira a tag da disciplina: <span class="mono">+fac.SIGLA</span>. Não sabe a data da prova ainda? Deixe a sugerida e ajuste quando souber.</p>`;
}
function coleta(){
  const v = id => { const e = document.getElementById(id); return e ? e.value : null; };
  if(W.editar){
    const dt = (id, antes) => { const x = v(id); if(x == null) return antes; const r = GB.isoData(x, HOJE); if(!r) W.dtRuim = x; return r || antes; };
    W.dtRuim = '';
    W.ini = dt('wz-ini', W.ini); W.fim = dt('wz-fim', W.fim); W.p1 = +v('wz-p1') || 0; W.p2 = +v('wz-p2') || 0;
    W.disc = W.disc.map((d,i) => ({...d, d:(v('wz-d-'+i)||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,''), n:(v('wz-n-'+i)||'').trim(), n1:dt('wz-n1-'+i, d.n1), n2:dt('wz-n2-'+i, d.n2)}));
    return;
  }
  if(W.passo === 0){ W.nome = (v('wz-nome')||'').trim(); W.nick = (v('wz-nick')||'').trim().toLowerCase(); }
  if(W.passo === 4){
    W.habs = W.habs.map((h,i) => (v('wz-h-' + i) || '').trim()); W.hf = W.habs.map((h,i) => +(v('wz-hf-' + i) || 0));
    const cf = document.getElementById('wz-cf'); W.cfOn = !!(cf && cf.checked);
    if(v('wz-cfh') != null){ W.cfH = v('wz-cfh').trim(); W.cfM = parseInt(v('wz-cfm')) || 0; }   // desligado, os campos somem, mas o que foi digitado fica
    const duo = document.getElementById('wz-duo'); W.duoOn = !!(duo && duo.checked);
    if(v('wz-duou') != null) W.duoU = v('wz-duou').trim().replace(/^@/, '');
  }
}
function valida(){
  if(W.editar){
    const ds = W.disc.filter(d => d.d);
    if(W.dtRuim) return GB.dataRuim(W.dtRuim);
    if(!ds.length) return 'Cadastre pelo menos uma disciplina (a sigla basta).';
    if(new Set(ds.map(d => d.d)).size !== ds.length) return 'Há duas disciplinas com a mesma sigla.';
    if(!(W.ini < W.fim)) return 'O fim do semestre precisa ser depois do início.';
    if(W.p1 + W.p2 !== 100) return `Os pesos da N1 e da N2 somam ${W.p1 + W.p2}; precisam somar 100.`;
    if(ds.some(d => !d.det && !(d.n1 < d.n2))) return 'Em cada disciplina, a N2 vem depois da N1.';
    return '';
  }
  if(W.passo === 0){
    if(!W.nome) return 'Escreva o seu nome.';
    if(!/^[a-z0-9_]{2,20}$/.test(W.nick)) return 'O nickname precisa de 2 a 20 letras, números ou _.';
  }
  if(W.passo === 4){
    const hs = W.habs.filter(Boolean);
    if(new Set(hs.map(slug)).size !== hs.length) return 'Há dois hábitos com o mesmo nome.';
    if(W.cfOn && !HANDLE.test(W.cfH)) return 'Escreva o seu handle do Codeforces (3 a 24 letras, números, _ . -).';
    if(W.cfOn && !(W.cfM >= 1 && W.cfM <= 6)) return 'A meta do Codeforces vai de 1 a 6 problemas por dia.';
    if(W.duoOn && !DUO_US.test(W.duoU)) return 'Escreva o seu usuário do Duolingo (letras, números, _ . -).';
  }
  return '';
}
/* sem disciplinas, o arquivo fica só com a linha da temporada: o semestre padrão, ajustável no cadastro da aba Chefões */
function avaliacoesTxt(){
  const volta = new Date(W.fim + 'T12:00:00Z'); volta.setUTCDate(volta.getUTCDate() + 50);
  const L = ['# Plano de avaliação de cada disciplina (Ganbatte). Gerado pelo jogo; pode editar à mão.',
    '# temporada | nome | início | fim do semestre | volta às aulas',
    '# [SIGLA] chefão | ícone | por que esse chefão',
    '# chave | nome da avaliação | peso | data | palavra-chave (opcional) | contínua (opcional)',
    '# Os pesos de cada disciplina somam 100. "?" no peso ou na data = estimado.',
    '', `temporada | ${W.ini.slice(0,4)}-${W.ini.slice(5,7) <= '06' ? 1 : 2} | ${W.ini} | ${W.fim} | ${iso(volta)}`];
  W.disc.filter(d => d.d).forEach((d,i) => { const r = chefaoDe(d, i);
    if(d.det && d.bloco) L.push('', d.bloco.trim());                // plano detalhado: o bloco do arquivo, sem mexer
    else L.push('', `# ${d.d}${d.n ? ' · ' + d.n : ''}`, `[${d.d}] ${r[0]} | ${r[1]} | ${r[2]}`, `N1 | N1 | ${W.p1} | ${d.n1}`, `N2 | N2 | ${W.p2} | ${d.n2}`); });
  return L.join('\n') + '\n';
}
function desenhaW(){
  let bg = document.getElementById('wz'); if(!bg){ bg = document.createElement('div'); bg.id = 'wz'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const ult = W.passo === PASSOS.length - 1 && !W.editar;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="wz-t">
    <div class="wz-top"><img src="${MARCA}" alt=""><div><h2 id="wz-t">Licença Hunter</h2><p>Passo ${W.passo + 1} de ${PASSOS.length} · ${PASSOS[W.passo]}</p></div>
      <div class="wz-steps" aria-hidden="true">${PASSOS.map((_,i) => `<i class="${i <= W.passo ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="wz-body">${passoHTML()}</div>
    <div class="wz-foot"><button type="button" class="btn" data-wznav="-1"${W.passo ? '' : ' hidden'}>← voltar</button><span class="err" role="alert">${esc(W.err)}</span>
      <span style="display:flex;gap:8px;margin-left:auto">${W.editar ? '<button type="button" class="btn" data-wzsair>cancelar</button><button type="button" class="btn v" data-wzdisc>salvar disciplinas</button>' : ult ? '<button type="button" class="btn" data-wzfim="0">começar sem tutorial</button><button type="button" class="btn v" data-wzfim="1">começar e ver o tutorial</button>' : '<button type="button" class="btn v" data-wznav="1">próximo →</button>'}</span></div></div>`;
  const f = bg.querySelector('.wz-body input'); if(f && (W.editar || W.passo === 0 || W.passo === 4)) f.focus();
}
function abreW(){ W.editar = false; PASSOS = PASSOS_1; iniciaW(); desenhaW(); }
function abreDisciplinas(nova){   // nova = {d, n}: disciplina sugerida (ex.: um plano de ensino lido pela IA sem chefão)
  iniciaW(); W.editar = true; PASSOS = ['Disciplinas']; W.passo = 0;
  const BL = blocos(CTX.AV_TXT), simples = a => a.length === 2 && a.some(x => x.k === 'N1') && a.some(x => x.k === 'N2');
  W.ini = TEMP.ini; W.fim = TEMP.fim;
  const s0 = BOSSES.find(b => simples(AVAL[b.d] || []));
  if(s0){ W.p1 = AVAL[s0.d].find(x => x.k === 'N1').w; W.p2 = AVAL[s0.d].find(x => x.k === 'N2').w; }
  W.disc = BOSSES.map(b => { const a = AVAL[b.d] || [], j = (CTX.JOG.disciplinas || []).find(x => x.d === b.d) || {};
    const notas = Object.keys(NOTAS).concat(Object.keys(PARC)).filter(k => k.startsWith(b.d + ':')).length;
    return simples(a) ? {d:b.d, n:j.n || '', n1:a.find(x => x.k === 'N1').dt, n2:a.find(x => x.k === 'N2').dt, notas}
      : {d:b.d, n:j.n || '', n1:'', n2:'', det:a.length, bloco:BL[b.d] || '', notas}; });
  if(nova && nova.d && !W.disc.some(x => x.d === nova.d)) W.disc.push({d:nova.d, n:nova.n || '', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)});
  if(!W.disc.length) W.disc.push({d:'', n:'', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)});
  desenhaW();
}
async function salvaW(tour){
  const jogador = {configurado:true, nome:W.nome, nick:W.nick, tags:W.tags, semestre:{ini:W.ini, fim:W.fim}, materias:W.mat,
    disciplinas:W.disc.filter(d => d.d).map(d => ({d:d.d, n:d.n, n1:d.n1, n2:d.n2})), habitos:habsJSON(W.habs, W.hf, W.hid), cf: W.cfOn ? {handle:W.cfH, meta:W.cfM} : null, duo: W.duoOn ? {usuario:W.duoU} : null};
  if(window.GB_TEMP && !(await GB_TEMP.antesDeTrocar(avaliacoesTxt()))){ W.err = 'Não salvou: a temporada atual precisa ser guardada antes de trocar.'; desenhaW(); return; }
  try { await post('/api/config', {jogador, avaliacoes: avaliacoesTxt()}); await recarrega(); }
  catch(e){ W.err = 'Não salvou: ' + e.message; desenhaW(); return; }
  UI.avatar = W.av; EST.tour = tour ? {} : Object.fromEntries(['l','b','b2','d2','bk','ms','sys','cfg','nv','x'].map(k => [k,1])); salvaUI();
  document.getElementById('wz').remove();
  if(W.mat === 'agora'){ abaReal('b2'); abreDisciplinas(); return; }   // o tutorial da Lista aparece quando ele voltar a ela
  abaReal('l');
  if(tour) setTimeout(() => tutorial('l'), 250);
}
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  const nav = q('[data-wznav]');
  if(nav){ coleta(); const d = +nav.dataset.wznav; if(d > 0){ W.err = valida(); if(W.err){ desenhaW(); return; } } W.err = ''; W.passo += d; desenhaW(); return; }
  const av = q('[data-wzav]'); if(av){ coleta(); W.av = av.dataset.wzav; desenhaW(); return; }
  const nn = q('[data-wznen]'); if(nn){ W.nen = +nn.dataset.wznen; desenhaW(); const b = document.querySelector(`.wz-nens [data-wznen="${W.nen}"]`); if(b && nn.tagName === 'BUTTON') b.focus(); return; }
  const mt = q('[data-wzmat]'); if(mt){ W.mat = mt.dataset.wzmat; desenhaW(); const b = document.querySelector(`[data-wzmat="${W.mat}"]`); if(b) b.focus(); return; }
  if(q('[data-wzadd]')){ coleta(); const n = W.disc.length; W.disc.push({d:'', n:'', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)}); desenhaW(); const i = document.getElementById('wz-d-' + n); if(i) i.focus(); return; }
  const dl = q('[data-wzdel]'); if(dl){ coleta(); W.disc.splice(+dl.dataset.wzdel, 1); if(!W.disc.length) W.disc.push({d:'', n:'', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)}); desenhaW(); return; }
  if(q('[data-wzhadd]')){ coleta(); W.habs.push(''); W.hf.push(0); W.hid.push(''); desenhaW(); const i = document.getElementById('wz-h-' + (W.habs.length - 1)); if(i) i.focus(); return; }
  const hd = q('[data-wzhdel]'); if(hd){ coleta(); W.habs.splice(+hd.dataset.wzhdel, 1); W.hf.splice(+hd.dataset.wzhdel, 1); W.hid.splice(+hd.dataset.wzhdel, 1); desenhaW(); return; }
  if(e.target.id === 'wz-cf' || e.target.id === 'wz-duo'){ const id = e.target.id; coleta(); desenhaW();
    const f = document.getElementById(id === 'wz-cf' ? 'wz-cfh' : 'wz-duou'); (f || document.getElementById(id)).focus(); return; }
  if(q('[data-wzsair]')){ document.getElementById('wz').remove(); W.editar = false; return; }
  if(q('[data-wzdisc]')){ coleta(); W.err = valida(); if(W.err){ desenhaW(); return; }
    const perdidas = BOSSES.filter(b => !W.disc.some(d => d.d === b.d) && Object.keys(NOTAS).concat(Object.keys(PARC)).some(k => k.startsWith(b.d + ':')));
    if(perdidas.length && !W.confirma){ W.confirma = 1; W.err = `${perdidas.map(b => b.d).join(', ')} tem nota registrada e vai sair do jogo. Clique em salvar de novo para confirmar.`; desenhaW(); return; }
    W.confirma = 0;
    const jogador = {...CTX.JOG, semestre:{ini:W.ini, fim:W.fim}, disciplinas:W.disc.filter(d => d.d).map(d => ({d:d.d, n:d.n}))};
    (window.GB_TEMP ? GB_TEMP.antesDeTrocar(avaliacoesTxt()) : Promise.resolve(true))
      .then(ok => { if(!ok) throw new Error('a temporada atual precisa ser guardada antes de trocar'); return post('/api/config', {jogador, avaliacoes: avaliacoesTxt()}); }).then(recarrega).then(() => { document.getElementById('wz').remove(); W.editar = false; render(); toast('Disciplinas salvas'); })
      .catch(err => { W.err = 'Não salvou: ' + err.message; desenhaW(); });
    return; }
  const fim = q('[data-wzfim]'); if(fim){ salvaW(fim.dataset.wzfim === '1'); return; }
});
document.addEventListener('keydown', e => {
  if(!document.getElementById('wz') || e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
  e.preventDefault(); const b = document.querySelector('[data-wznav="1"]'); if(b) b.click();
});
/* passo 1: a licença acompanha o que a pessoa digita */
document.addEventListener('input', e => {
  if(e.target.id !== 'wz-nome' && e.target.id !== 'wz-nick') return;
  coleta(); const l = document.getElementById('wz-lic'); if(l) l.outerHTML = licHTML(false);
});

/* ---------- tutorial: destaca cada bloco e explica o que ele quer dizer ---------- */
/* passos: [seletor, título, texto, 1 = destaca o card inteiro, antes(), se()]. antes() troca a sub-aba (Conquistas, Loja) antes do
   passo; se() = false pula o passo (ex.: chefões sem nenhuma matéria cadastrada) */
const vai = o => () => { Object.assign(UI, o); render(); };
const temChefe = () => (BOSSES || []).length > 0, iaLigada = () => !!(window.GB_IA && GB_IA.ligada());
const TOURS = {
  l:[['.gnav','Abas do jogo','A <b>Lista</b> é onde você anota e conclui. As outras abas mostram o resultado. O botão <b>? tutorial</b> repete a explicação da aba em que você estiver.'],
     ['#l-hud .nl-and','Seu andar','Cada tarefa concluída dá XP, e o XP sobe os andares da <b>Arena Celestial</b> (251, zeram no fim do semestre). O XP também vira <b>Jenny</b>, a moeda da Loja.'],
     ['#l-hud .nl-k[title^="recorde"]','Ten','Dias seguidos com pelo menos uma tarefa feita (hábito sozinho não conta). O <b>Zetsu</b> é uma folga guardada: segura um dia vazio.'],
     ['#l-hud .nl-mis','Missão da semana','O tipo que você menos treinou na semana passada. As tarefas dele valem <b>×1,5</b> até domingo.'],
     ['#l-add','Adicionar tarefa','Escreva e aperte <b>Enter</b>. O jogo adivinha o tipo e mostra quanto ela vale. Em <b>detalhes</b> ficam o prazo, a matéria e a prioridade. A tecla <b>N</b> abre isto de qualquer aba; a <b>C</b> cria uma caçada (tarefa grande dividida em etapas).'],
     ['#nl-habc','Hábitos de hoje','Aparecem sozinhos; marque quando fizer. Dias seguidos sobem o nível e o XP. O Codeforces e o Duolingo se marcam sozinhos. Para mudar a lista: <b>Configurações</b>.', 1],
     ['#nl-tb','O que mostrar','Só hoje, a semana ou tudo. O que ficou de fora aparece num link embaixo.'],
     ['#l-groups','Suas tarefas','Separadas por prazo. O quadrado conclui; o número é o XP de agora. Passe o mouse para adiar, editar ou remover. Errou? O aviso embaixo tem <b>desfazer</b>.'],
     ['#l-heatc','Constância','Um quadrado por dia da temporada: quanto mais forte, mais tarefas feitas.', 1]],
  b:[['#pn .pn-torre','A torre','Seu andar, os marcos e a <b>projeção</b> de onde você chega no fim do semestre, no ritmo de agora.', 1],
     ['#pn .pn-nen-g','Nen','Quanto você treinou cada tipo. O mais fraco vira a <b>missão da semana</b> (×1,5).', 1],
     ['#pn .pn-bs','Chefões','Vida, fúria e quanto falta de média em cada matéria. Clique para abrir na aba Chefões.', 1, null, temChefe],
     ['#pn .pn-hab','Meta do dia','Os hábitos de hoje, para marcar daqui mesmo.', 1],
     ['#pn .pn-tt','Semana','Os prazos dos próximos 7 dias e o que você fez há pouco.', 1]],
  b2:[['#cn .cn-b','Um chefão por matéria','A vida é a nota: cada avaliação tira <b>peso × nota/10</b>, e passar de 60 derruba. Nota baixa não pune: o chefão entra em <b>fúria</b> e as tarefas dele valem ×1,5.', 0, null, temChefe],
      ['#cn .cn-c','Dentro do chefão',`Quatro abas: <b>avaliações</b> (a nota depois da prova, a faixa da matéria e o botão da caçada da prova), <b>ementa</b> (os itens do plano de ensino com os estudos de cada um), <b>aulas</b> (mande a aula: a IA resume e sugere entregas e estudos, e você escolhe) e <b>tarefas</b>. Terminar a preparação antes da data dá <b>${GB.FEIT_J.toLocaleString('pt-BR')} J</b>, seja qual for a nota.`, 0, () => { if(BOSSES[0] && !document.querySelector('#cn .cn-c')){ UI.cnab.add(BOSSES[0].d); render(); } }, temChefe],
      ['#b2-inbox','Anotações do plano','A prova mudou de data ou de peso? Anote aqui e aplique depois no editor da matéria, à mão ou com a IA.', 0, null, temChefe]],
  d2:[['#cal .cl-m','O mês','Cada dia mostra as provas e os prazos pelo nome; os que passaram mostram o XP. Clique num dia para ver o que tem nele.'],
      ['#cal .cl-dia','O dia escolhido','O que tem no dia (ou o que você fez nele). Aperte <b>N</b> para criar uma tarefa já com esse prazo.', 1],
      ['#cal .cl-px','Próximos 14 dias','Um resumo por dia: as provas pelo nome e quantas tarefas vencem.', 1],
      ['#cal .cl-sem','O semestre inteiro','Uma linha por mês: a cor é o quanto você fez, o anel marca as avaliações.']],
  bk:[['#bk-tabs','Quatro tipos de carta','<b>Conquistas</b>: troféus que o jogo marca sozinho. <b>IA</b>: desafios feitos para você. <b>Narradas</b>: a história da sua semana ou mês. <b>Feitiços</b>: em pausa até o jogo crescer.', 0, vai({bk:'slot', bksel:'001'})],
      ['#bk-grid','Conquistas','Cada carta pede algo: dias seguidos, tarefas no prazo, uma matéria vencida. Clique numa para ver a regra e quanto falta; as apagadas ainda não são suas.'],
      ['#bk-grid','Desafios da IA','A IA propõe desafios pelo seu ritmo, e o jogo confere. São 10 vagas, do fácil ao lendário. Conquistou? Resgate em Jenny. Sem IA ligada, copie o pedido para uma IA de chat e cole a resposta.', 0, vai({bk:'ia', bksel:''})],
      ['#bk-grid','Feitiços',`Cartas de efeito, em pausa até o jogo passar de ${GB.ATIVOS_MAIS} jogadores ativos. Enquanto isso, a missão da semana e a preparação completa de uma prova dão <b>${GB.FEIT_J.toLocaleString('pt-BR')} J</b> cada; os feitiços que você já tem continuam guardados.`, 0, vai({bk:'feit', bksel:'F:ko'})]],
  ms:[['#ms-root .cats','Quatro seções','Aparência, mundo pixel, prêmios reais e feitiços (em pausa por enquanto). Tudo se paga com <b>Jenny</b>, e gastar não baixa o seu andar.', 0, vai({cat:'aparencia', pedit:false})],
      ['#ms-root .lay7 > div:first-child','Aparência','Fotos, paletas, fundos e molduras. Comprou, é seu: <b>equipar</b> troca o que está usando sem pagar de novo.'],
      ['#ms-root .lay7 > div:first-child','Prêmios reais','Recompensas da vida real que você se dá com Jenny: um episódio, um jogo, um lanche. Os que vêm com o jogo são exemplos: troque pelos seus.', 0, vai({cat:'premios', pedit:false})],
      ['#ms-root .side7','Carteira','Quanto você tem, de onde veio e o que já resgatou.']],
  cfg:[['#cfg','Seu jogo','Nome, nickname, <b>hábitos</b>, Codeforces, Duolingo e o nome das tags. Mude e clique em salvar.'],
       ['#cfg-ia','IA (opcional)','Tem uma IA de terminal (Claude Code, Codex, Antigravity CLI)? Ligue aqui e o jogo passa a usá-la sozinho: lê planos de ensino, escreve cartas, propõe desafios.'],
       ['#cfg-root > .card:last-child','Backup','Um ZIP com todos os seus dados, para guardar ou levar para outro computador.']],
  nv:[['#nv-hero','Sua versão','A versão instalada e se saiu uma nova. <b>Atualizar agora</b> baixa e reinicia o jogo, sem mexer nos seus dados.'],
      ['#nv-lista','O que mudou','Cada versão em poucas linhas, da mais nova para a mais antiga.']],
  /* Projetos (expedições): cada visão mostra blocos diferentes; o passo sem bloco na visão escolhida é pulado */
  x:[['#x-root .x-head','Projetos','Algo de semanas ou meses que não é de uma matéria: o TCC, um app seu, a iniciação científica. O jogo também chama de <b>expedição</b>. Cada um se divide em <b>marcos</b>, e cada marco é uma <b>caçada</b> com as suas etapas.'],
     ['#x-root .x-vis','Formas de ver','Cinco desenhos do mesmo projeto: cards, trilha, quadro, foco e cronograma. Trocar não muda nada nos dados.'],
     ['#x-root [data-xnova]','Novo projeto','Dê um nome e um ícone; depois acrescente os marcos.'],
     ['#x-root [data-xmarconovo]','Marcos','Cada etapa vale o XP normal. Fechar o marco dá +' + GB.MARCO_ETAPA + ' XP por etapa (até 12) e +' + GB.MARCO_DIA + ' por dia diferente em que você trabalhou nele (até 10). A tecla <b>C</b> cria um marco inteiro.'],
     ['#x-root .x-sem','Semanas ativas','Cada quadrado é uma semana com pelo menos uma tarefa do projeto. É isso que paga no fim: um pouco toda semana rende mais que tudo de uma vez.'],
     ['#x-root [data-xfim]','Concluir','Projeto entregue? Concluir dá <b>+' + GB.EXP_SEMANA + ' XP por semana ativa</b> (até 20) e pede pelo menos um marco fechado.', 1]],
  sys:[['#sys-root > .card:first-child','Regras','Tudo o que o jogo considera: XP, Ten, torre, chefões, Jenny. Nome, hábitos, IA e backup ficam em <b>Configurações</b>.']],
  /* tutorial da IA: aparece ao ligar uma IA (ou pelo botão "tutorial da IA" em Configurações); troca de aba a cada passo */
  ia:[['#cfg-ia','IA ligada','A partir de agora o jogo chama a IA sozinho. Ela <b>só devolve texto</b>: quem confere e grava é o jogo, e planos e lembretes você revisa antes de salvar.', 0, () => tab('cfg')],
      ['#ia-planos','Planos de ensino','Ponha os PDFs na pasta <b>planos</b> (ou use <b>enviar arquivo</b> no editor de um chefão) e clique em <b>ler todos os planos</b>: a IA liga cada arquivo à disciplina e monta as avaliações. Você revisa e salva cada uma; disciplina que ainda não existe vira o botão <b>cadastrar</b>.', 0, () => tab('b2')],
      ['#b2-inbox','Caixa de entrada','Anotou que a prova mudou de data? No editor da disciplina, <b>aplicar lembretes com IA</b> atualiza o plano e marca o lembrete como aplicado.', 0, () => tab('b2')],
      ['[data-ltipoia]','Tipo da tarefa','Ficou na dúvida se é entrega, estudo ou projeto? Escreva a tarefa e clique em <b>IA?</b>: ela responde em segundos, com o modelo mais leve.', 0, () => tab('l')],
      ['#ia-carta','Cartas do Book','As cartas da semana, do mês, do semestre e do ano que faltam são escritas <b>sozinhas quando você abre o jogo</b>. As de antes de ligar a IA saem pelo botão <b>escrever cartas antigas</b>.', 0, () => { tab('bk'); UI.bk = 'claude'; render(); }]],
};
let TR = null;
function tutorial(aba){
  const t = (TOURS[aba] || []).filter(p => !p[5] || p[5]()), troca = t.some(p => p[4]);
  const passos = troca ? t : t.filter(p => document.querySelector(p[0]));   // com troca de sub-aba, o passo sem bloco é pulado na hora
  if(!passos.length) return;
  fecha();
  TR = {aba, passos, i:0, dir:1};
  document.body.insertAdjacentHTML('beforeend', '<div class="tr-hole" id="tr-hole"></div><div class="tr-pop" id="tr-pop" role="dialog" aria-live="polite"></div>');
  passo();
}
function alvo(){ const p = TR.passos[TR.i], el = document.querySelector(p[0]);
  const d = el && el.closest('details'); if(d && !d.open && !el.closest('summary')) d.open = true;   // card fechado da lateral: abre para mostrar
  return el && p[3] ? (el.closest('.card') || el) : el; }
function posiciona(){
  if(!TR) return;
  const el = alvo(), h = document.getElementById('tr-hole'), pop = document.getElementById('tr-pop'); if(!el) return;
  const r = el.getBoundingClientRect(), m = 6, vw = innerWidth, vh = innerHeight;
  Object.assign(h.style, {left:(r.left - m) + 'px', top:(r.top - m) + 'px', width:(r.width + 2*m) + 'px', height:(r.height + 2*m) + 'px'});
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let top = r.bottom + 14, left = Math.min(Math.max(16, r.left), vw - pw - 16);
  if(top + ph > vh - 16) top = r.top - ph - 14;                       // não cabe embaixo: em cima
  if(top < 16){ top = Math.min(vh - ph - 16, Math.max(16, r.top + 16)); left = r.right + 14 + pw < vw ? r.right + 14 : Math.max(16, r.left - pw - 14); }   // bloco alto: do lado
  Object.assign(pop.style, {top: Math.max(16, top) + 'px', left: left + 'px'});
}
function passo(){
  const p = TR.passos[TR.i], ult = TR.i === TR.passos.length - 1;
  if(p[4]) p[4]();
  if(!alvo()){ TR.i += TR.dir; if(TR.i < 0 || TR.i >= TR.passos.length) fecha(); else passo(); return; }
  document.getElementById('tr-pop').innerHTML = `<span class="tr-k">${TR.i + 1} de ${TR.passos.length}</span><h4>${p[1]}</h4><p>${p[2]}</p>
    <div class="bt"><button class="btn pl" data-tr="x">pular</button>${TR.i ? '<button class="btn" data-tr="-1">← voltar</button>' : ''}<button class="btn v" data-tr="1">${ult ? 'entendi' : 'próximo →'}</button></div>`;
  const el = alvo(); const r = el.getBoundingClientRect();
  if(r.top < 70 || r.bottom > innerHeight - 40) el.scrollIntoView({block: r.height > innerHeight * .6 ? 'start' : 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  posiciona(); setTimeout(posiciona, 350);
  document.querySelector('#tr-pop [data-tr="1"]').focus({preventScroll:true});
}
function fecha(){
  if(TR){ EST.tour = Object.assign({}, EST.tour, {[TR.aba]:1}); salvaUI(); }
  TR = null; ['tr-hole','tr-pop'].forEach(id => { const e = document.getElementById(id); if(e) e.remove(); });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tr]'); if(b){ const v = b.dataset.tr; if(v === 'x' || (v === '1' && TR.i === TR.passos.length - 1)) fecha(); else { TR.dir = +v; TR.i += +v; passo(); } return; }
  if(e.target.closest('[data-trq]')) tutorial(cur);
});
document.addEventListener('keydown', e => {
  if(!TR) return;
  if(e.key === 'Escape') fecha();
  else if(e.key === 'ArrowRight') document.querySelector('#tr-pop [data-tr="1"]').click();
  else if(e.key === 'ArrowLeft' && TR.i) document.querySelector('#tr-pop [data-tr="-1"]').click();
});
addEventListener('resize', posiciona); addEventListener('scroll', posiciona, {passive:true});

/* ---------- ganchos na página ---------- */
const gnav0 = gnav;
gnav = c => gnav0(c).replace('<span class="sp"></span>', `<button class="tr-q" data-trq title="explica cada bloco desta aba">? tutorial</button><span class="sp"></span>`);
const abaReal = tab;
tab = t => {
  if(CTX && !(CTX.JOG && CTX.JOG.configurado)){ abaReal('l'); abreW(); return; }
  abaReal(t);
  if(CTX && !(EST.tour || {})[cur] && TOURS[cur]) setTimeout(() => { if(!TR) tutorial(cur); }, 300);
};
/* ---------- aba Configurações: "Seu jogo" (nome, nickname, hábitos, Codeforces, Duolingo, tags) ---------- */
let CF2 = null;   // rascunho; null = sem edição em andamento
function rascunhoCfg(){
  const j = CTX.JOG;
  return CF2 || (CF2 = {nome:j.nome || '', nick:j.nick || '', habs:(j.habitos || []).map(h => h.n), hf:(j.habitos || []).map(h => h.semana || 0), hid:(j.habitos || []).map(h => h.id), datas:j.datas === 'mdy' ? 'mdy' : 'dmy', cfOn:!!(j.cf && j.cf.handle), cfH:(j.cf && j.cf.handle) || '', cfM:(j.cf && j.cf.meta) || 3, duoOn:!!(j.duo && j.duo.usuario), duoU:(j.duo && j.duo.usuario) || '', gh:(j.github && j.github.usuario) || '',
    tags:Object.fromEntries(TIPOS.filter(t => !t.fixo).map(t => [t.k, (j.tags && j.tags[t.k]) || tagPadrao(t.k)])), err:'', novo:''});
}
/* contribuições recompensadas (#23): o servidor confere no GitHub, a cada 1 h ou pelo botão, as issues do jogador que entraram no
   beta (#96) e as tarefas de dev (#97) */
function contribHTML(){
  const c = D.contrib; if(!c) return '';
  return `<p class="sub" style="margin:-4px 0 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span>${!c.issues.length ? 'Nenhuma contribuição recompensada ainda.' : `${c.issues.length} contribuição${c.issues.length === 1 ? '' : 'ões'} recompensada${c.issues.length === 1 ? '' : 's'}: ${c.issues.map(i => `<a href="https://github.com/CaioParanaiba/ganbatte/issues/${i.n}" target="_blank" rel="noopener">#${i.n}</a> ${i.tipo}`).join(' · ')}`}</span>
    <button type="button" class="btn" data-contribagora${CONTRIB_IND ? ' disabled' : ''}>${CONTRIB_IND ? 'conferindo…' : 'conferir agora'}</button></p>`;
}
let CONTRIB_IND = false;   // o botão "conferir agora" está esperando o GitHub
/* aviso de recompensa (#146): bug corrigido e ideia feita (#23; quem joga na versão normal fica sabendo que já está no beta, #96)
   e tarefa de dev concluída (#97) num cartão no canto, que fica até o jogador fechar. Só marca como visto (estado.json → tour:
   contrib:N, dev:N) no "ok", e só aparece com a aba visível. Na primeira vez (tour.avisos146) as tarefas de dev já concluídas
   ficam vistas sem aviso: só daqui para a frente */
const AVISO_K = 'avisos146';
const issueLink = n => `<a href="https://github.com/CaioParanaiba/ganbatte/issues/${n}" target="_blank" rel="noopener">#${n}</a>`;
function avisosNovos(){
  const vistas = EST.tour || {}, c = D.contrib, main = ((CTX.SRV && CTX.SRV.canal) || 'main') === 'main', its = [];
  for(const i of (c && c.issues) || []){ if(vistas['contrib:' + i.n]) continue;
    const R = GB.CONTRIB[i.tipo] || {xp:0, j:0}, beta = i.beta && main;
    its.push({k:'contrib:' + i.n, html:(i.tipo === 'bug' ? `Seu bug ${issueLink(i.n)} ${beta ? 'já foi corrigido no beta' : 'foi corrigido'}`
      : `Sua ideia ${issueLink(i.n)} ${beta ? 'já está no beta' : 'entrou no jogo'}`) + `: <b>${R.xp ? `+${R.xp} XP e ` : ''}+${fmt(R.j)} J</b>`
      + (beta ? '<small>chega na sua versão na próxima atualização</small>' : '')}); }
  for(const {t, x} of estado().xs) if(t.gh && t.done && !vistas['dev:' + t.gh])
    its.push({k:'dev:' + t.gh, html:`A issue ${issueLink(t.gh)} que você fez entrou no beta: <b>+${x} XP e +${fmt(x*10)} J</b><small>tarefa de dev concluída</small>`});
  return its;
}
function avisaContrib(){
  if(!CTX) return;
  if(!(EST.tour || {})[AVISO_K]){
    const ja = estado().xs.filter(o => o.t.gh && o.t.done).map(o => ['dev:' + o.t.gh, 1]);
    EST.tour = Object.assign({}, EST.tour, Object.fromEntries(ja), {[AVISO_K]: 1}); salvaUI();
  }
  const its = avisosNovos(); let el = document.getElementById('av-contrib');
  if(!its.length){ if(el) el.remove(); return; }
  if(document.hidden){   // a recompensa chegou com a aba escondida: espera ela voltar
    if(!avisaContrib.espera){ avisaContrib.espera = true;
      document.addEventListener('visibilitychange', function volta(){ if(document.hidden) return;
        document.removeEventListener('visibilitychange', volta); avisaContrib.espera = false; avisaContrib(); }); }
    return;
  }
  if(!el){ el = document.createElement('div'); el.id = 'av-contrib'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.dataset.ks = its.map(i => i.k).join(' ');
  el.innerHTML = `<div class="avc-top">${ic('bug')}<span>${its.length === 1 ? 'Contribuição recompensada' : `${its.length} contribuições recompensadas`}</span></div>
    <ul>${its.map(i => `<li>${i.html}</li>`).join('')}</ul>
    <div class="avc-bt"><button type="button" class="btn" data-avcarteira>ver a carteira</button><button type="button" class="btn v" data-avok>ok</button></div>`;
}
function cfgHTML(){
  const c = rascunhoCfg();
  return `<div class="card wz" id="cfg" style="box-shadow:none;border-radius:14px"><h2><span class="c">~/</span>seu jogo · mudanças básicas</h2>
    <div class="wz-body" style="padding:4px 0 0">
      <div class="wz-f"><label>Nome<input data-cfg="nome" value="${esc(c.nome)}" maxlength="40"></label><label>Nickname<input data-cfg="nick" value="${esc(c.nick)}" maxlength="20"></label>
        <label>Datas<select data-cfg="datas"><option value="dmy"${c.datas === 'dmy' ? ' selected' : ''}>dia/mês/ano · 31/12/2026</option><option value="mdy"${c.datas === 'mdy' ? ' selected' : ''}>mês/dia/ano · 12/31/2026</option></select></label></div>
      <label>Hábitos (aparecem na Lista e você marca à mão; o semanal some quando a meta da semana é cumprida)</label>
      <div class="wz-disc">${c.habs.map((h,i) => `<div class="wz-row wz-hrow"><input data-cfgh="${i}" value="${esc(h)}" aria-label="Hábito ${i + 1}" maxlength="40">${freqSel(`data-cfghf="${i}"`, c.hf[i])}<button type="button" class="wz-x" data-cfghdel="${i}" aria-label="remover hábito">✕</button></div>`).join('')}
        <div class="wz-row" style="grid-template-columns:minmax(0,1fr) auto"><input id="cfg-novo" value="${esc(c.novo)}" placeholder="novo hábito, ex.: 30 min de exercício" maxlength="40"><button type="button" class="btn" data-cfghadd>+ adicionar</button></div></div>
      <div class="wz-f" style="grid-template-columns:auto minmax(0,1fr) 120px;align-items:end">
        <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font:14px var(--f-ui);color:var(--ink);padding-bottom:9px"><input type="checkbox" data-cfg="cfOn"${c.cfOn ? ' checked' : ''}> Codeforces</label>
        <label>Handle<input data-cfg="cfH" value="${esc(c.cfH)}" maxlength="24"${c.cfOn ? '' : ' disabled'}></label>
        <label>Meta/dia<input data-cfg="cfM" inputmode="numeric" value="${c.cfM}"${c.cfOn ? '' : ' disabled'}></label></div>
      <div class="wz-f" style="grid-template-columns:auto minmax(0,1fr);align-items:end">
        <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font:14px var(--f-ui);color:var(--ink);padding-bottom:9px"><input type="checkbox" data-cfg="duoOn"${c.duoOn ? ' checked' : ''}> Duolingo</label>
        <label>Usuário (sem senha: o jogo lê a ofensiva do perfil e marca sozinho o dia com lição)<input data-cfg="duoU" value="${esc(c.duoU)}" maxlength="40"${c.duoOn ? '' : ' disabled'}></label></div>
      <label>Usuário do GitHub (opcional: bug que você reportou vale +${GB.CONTRIB.bug.j.toLocaleString('pt-BR')} J quando a correção entra no beta; ideia, +${GB.CONTRIB.ideia.j.toLocaleString('pt-BR')} J. Quem desenvolve: a issue em que você é o responsável vira tarefa na Lista e se conclui sozinha quando entra no beta)<input data-cfg="gh" value="${esc(c.gh)}" maxlength="39" placeholder="deixe vazio se não usa"></label>
      ${contribHTML()}
      <label>Tags (o nome muda; o significado de cada tipo continua o mesmo)</label>
      <div class="wz-f" style="grid-template-columns:repeat(5,minmax(0,1fr))">${TIPOS.filter(t => !t.fixo).map(t => `<label style="color:${NC(t.c)}">${t.n}<input data-cfgt="${t.k}" value="${esc(c.tags[t.k])}" maxlength="24"></label>`).join('')}</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn v" data-cfgsave>salvar</button><button type="button" class="btn" data-cfgreset>descartar</button>
        <span class="sub" style="color:var(--red)" role="alert">${esc(c.err)}</span><button type="button" class="btn" data-wzdiscabre style="margin-left:auto">editar disciplinas e datas</button></div>
    </div></div>`;
}
const rSys0 = RENDER.cfg;
/* iniciar com o computador: só aparece com o servidor de verdade (no modo demonstração não há servidor) */
function srvHTML(){
  const s = CTX.SRV; if(!s) return '';
  const onde = {linux:'um serviço do usuário (systemd)', windows:'um atalho na pasta Inicializar do Windows', mac:'um LaunchAgent do macOS'}[s.sistema] || '';
  return `<div class="card wz" id="cfg-srv" style="box-shadow:none;border-radius:14px"><h2><span class="c">~/</span>servidor · versão ${esc(s.versao)}${s.nome ? ` · ${esc(s.nome)}` : ''}</h2>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <label class="srv-op"><input type="checkbox" data-srvauto${s.auto ? ' checked' : ''}> Iniciar com o computador</label>
      <span class="sub" style="flex:1;min-width:240px;margin:0">${s.auto
        ? `Ligado: o servidor roda em segundo plano e você só abre <b>${esc(location.origin)}</b> (vale salvar nos favoritos). Desligue quando quiser.`
        : `Desligado: é preciso rodar <code>servidor.py</code> toda vez. Ligado, ele inicia sozinho com o computador (${onde}) e gasta quase nada parado.`}</span></div>${betaHTML(s)}</div>`;
}
/* versões de teste: troca a cópia git entre os canais (POST /api/canal); instalado pelo ZIP, só a main */
const CANAIS = {
  main: {nome:'Estável', curto:'normal', entra:'voltar para a normal', sobre:'A versão normal, a mesma de todo mundo.'},
  beta: {nome:'Beta', curto:'beta', entra:'entrar na beta', sobre:'As novidades chegam aqui antes da versão normal, mas ainda em teste: às vezes vêm com erros que só são corrigidos depois.'},
};
let BETA = null;   // null | {alvo} (pergunta) | {alvo, trocando}
function betaHTML(s){
  if(s.metodo !== 'git') return '';
  const atual = CANAIS[s.canal] ? s.canal : 'main';
  const linha = `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:12px">
      <span class="srv-op">Versão:</span>${Object.entries(CANAIS).map(([c, x]) =>
        `<label class="srv-op"><input type="radio" name="srvcanal" value="${c}" data-srvcanal${c === (BETA ? BETA.alvo : atual) ? ' checked' : ''}${BETA ? ' disabled' : ''}> ${x.nome}</label>`).join('')}
      <span class="sub" style="flex:1;min-width:240px;margin:0">${CANAIS[BETA ? BETA.alvo : atual].sobre}${atual === 'main' || BETA ? '' : ' Podem ter erros; o balão de feedback no canto avisa o autor.'}</span></div>`;
  if(!BETA) return linha;
  const alvo = BETA.alvo, nome = CANAIS[alvo].curto;
  if(BETA.trocando) return linha + `<p class="sub" style="margin:10px 0 0">${ic('antenna')} Trocando para a versão ${nome} e reiniciando o jogo...</p>`;
  const texto = alvo === 'main'
    ? 'Voltar para a versão normal. Ela pode ser mais antiga que a de teste que você usa agora e não conhecer algo que a versão de teste já gravou nos seus dados.'
    : `Entrar na versão ${nome}. Os seus dados não mudam de pasta, mas uma versão de teste pode gravar coisas novas neles, e voltar depois para a normal nem sempre fica perfeito.`;
  return linha + `<div style="margin-top:10px;padding:12px 14px;border:1px solid var(--hair);border-radius:12px">
      <p style="margin:0 0 8px;font-size:14px">${texto} Baixe os seus dados antes, para poder restaurar se algo sair errado.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="/api/backup" download>baixar meus dados</a><button type="button" class="btn v" data-srvbetaok>${CANAIS[alvo].entra}</button><button type="button" class="btn" data-srvbetanao>cancelar</button></div></div>`;
}
async function trocaCanal(){
  const alvo = BETA.alvo;
  BETA = {alvo, trocando:true}; render();
  try { await post('/api/canal', {canal: alvo}); }
  catch(err){ BETA = null; render(); toast('Não trocou: ' + esc(err.message)); return; }
  for(let i = 0; i < 60; i++){
    await new Promise(r => setTimeout(r, 1500));
    try { const p = await (await fetch('/api/ping', {cache:'no-store'})).json(); if(p.canal === alvo){ location.reload(); return; } } catch(e){}
  }
  toast('O jogo está demorando para voltar. Recarregue a página em alguns segundos.');
}
document.addEventListener('change', e => { if(e.target.matches('[data-srvcanal]')){ BETA = {alvo: e.target.value}; render(); } });
document.addEventListener('click', e => {
  if(e.target.closest('[data-srvbetaok]')) trocaCanal();
  else if(e.target.closest('[data-srvbetanao]')){ BETA = null; render(); }
});
RENDER.cfg = S => { rSys0(S); document.getElementById('cfg-root').insertAdjacentHTML('afterbegin', cfgHTML() + srvHTML()); };
document.addEventListener('change', async e => {
  if(!e.target.matches('[data-srvauto]')) return;
  const ligar = e.target.checked; e.target.disabled = true;
  try {
    const r = await post('/api/autostart', {ligar});
    toast(esc(r.msg));
    if(r.recarregar){ await new Promise(ok => setTimeout(ok, 2500)); for(let i = 0; i < 10; i++){ try { await recarrega(); break; } catch(err){ await new Promise(ok => setTimeout(ok, 1000)); } } }
    else await recarrega();
  } catch(err){ toast('Não deu: ' + esc(err.message)); }
  render();
});
document.addEventListener('input', e => {
  if(!CF2) return; const t = e.target, d = t.dataset;
  if(d.cfg) CF2[d.cfg] = t.type === 'checkbox' ? t.checked : t.value;
  if(d.cfgh !== undefined) CF2.habs[+d.cfgh] = t.value;
  if(d.cfghf !== undefined) CF2.hf[+d.cfghf] = +t.value;
  if(d.cfgt) CF2.tags[d.cfgt] = t.value;
  if(t.id === 'cfg-novo') CF2.novo = t.value;
  if(d.cfg === 'cfOn' || d.cfg === 'duoOn') render();
});
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  if(q('[data-cfghadd]')){ const c = rascunhoCfg(), n = c.novo.trim(); if(n){ c.habs.push(n); c.hf.push(0); c.hid.push(''); c.novo = ''; } render(); const i = document.getElementById('cfg-novo'); if(i) i.focus(); return; }
  const hd = q('[data-cfghdel]'); if(hd){ const c = rascunhoCfg(); c.habs.splice(+hd.dataset.cfghdel, 1); c.hf.splice(+hd.dataset.cfghdel, 1); c.hid.splice(+hd.dataset.cfghdel, 1); render(); return; }
  if(q('[data-wzdiscabre]')){ abreDisciplinas(); return; }
  if(q('[data-avcarteira]')){ tab('ms'); return; }
  if(q('[data-avok]')){ const el = document.getElementById('av-contrib'); if(!el) return;
    EST.tour = Object.assign({}, EST.tour, Object.fromEntries(el.dataset.ks.split(' ').filter(Boolean).map(k => [k, 1]))); salvaUI(); el.remove(); return; }
  if(q('[data-contribagora]')){ if(CONTRIB_IND) return; CONTRIB_IND = true; render();
    try { const r = await post('/api/contrib', {}); await recarrega(); toast(r.cedo ? 'Acabei de conferir: tente de novo daqui a um minuto' : 'Conferido no GitHub'); }
    catch(err){ toast('Não conferiu: ' + esc(err.message)); }
    CONTRIB_IND = false; render(); return; }
  if(q('[data-cfgreset]')){ CF2 = null; render(); return; }
  if(!q('[data-cfgsave]')) return;
  const c = rascunhoCfg(), habs = c.habs.map(h => h.trim()).filter(Boolean), tags = {};
  for(const k in c.tags) tags[k] = limpaTag(k, c.tags[k]);
  const vs = Object.values(tags), nick = c.nick.trim().toLowerCase(), meta = parseInt(c.cfM) || 0;
  c.err = !c.nome.trim() ? 'Escreva o seu nome.' : !/^[a-z0-9_]{2,20}$/.test(nick) ? 'O nickname precisa de 2 a 20 letras, números ou _.'
    : new Set(habs.map(slug)).size !== habs.length ? 'Há dois hábitos com o mesmo nome.'
    : c.cfOn && !HANDLE.test(c.cfH.trim()) ? 'Handle do Codeforces inválido.' : c.cfOn && !(meta >= 1 && meta <= 6) ? 'A meta do Codeforces vai de 1 a 6.'
    : c.duoOn && !DUO_US.test(c.duoU.trim().replace(/^@/, '')) ? 'Usuário do Duolingo inválido.'
    : c.gh.trim() && !/^[A-Za-z0-9-]{1,39}$/.test(c.gh.trim().replace(/^@/, '')) ? 'Usuário do GitHub inválido.'
    : vs.some(x => !x) || new Set(vs).size !== vs.length ? 'Cada tag precisa de um nome diferente.' : '';
  if(c.err){ render(); return; }
  const jogador = {...CTX.JOG, nome:c.nome.trim(), nick, datas:c.datas, tags, habitos:habsJSON(c.habs, c.hf, c.hid), cf: c.cfOn ? {handle:c.cfH.trim(), meta} : null, duo: c.duoOn ? {usuario:c.duoU.trim().replace(/^@/, '')} : null, github: c.gh.trim() ? {usuario:c.gh.trim().replace(/^@/, '')} : null};
  try { await post('/api/config', {jogador}); await recarrega(); } catch(err){ c.err = 'Não salvou: ' + err.message; render(); return; }
  CF2 = null; render(); toast('Salvo <small>os hábitos novos aparecem na Lista</small>');
});

/* ---------- aba Chefões vazia (#127): as matérias saíram da primeira entrada e começam aqui, com a IA ou à mão ---------- */
function vazioB2(){
  const IA = window.GB_IA, lig = !!(IA && IA.ligada()), nao = (CTX.JOG || {}).materias === 'nao';
  return `<div class="card b2-vazio"><div>
      <p class="cap">chefões · nenhum ainda</p><h3>O Genei Ryodan está esperando</h3>
      <p>Cada matéria do semestre vira um chefão. A <b>vida dele é a sua nota</b>: cada avaliação tira pontos, e média 6 derruba. As tarefas da matéria preparam cada prova, e terminar a preparação antes da data dá <b>${GB.FEIT_J.toLocaleString('pt-BR')} J</b>.</p>
      ${nao ? '<p>Você disse que não estuda agora. Quando precisar, é só começar por aqui.</p>' : ''}
      <p class="mono" style="font-size:12.5px">semestre: ${GB.brData(TEMP.ini)} a ${GB.brData(TEMP.fim)} · ajuste no cadastro</p>
      <div class="b2-ryo" aria-hidden="true">${RYODAN.map(r => `<i title="${r[0]}">${r[0][0]}</i>`).join('')}</div></div>
    <div class="b2-cam">
      <div${lig ? ' class="rec"' : ''}><b>Com a IA</b>
        <span>${lig ? 'Envie o plano de ensino de cada matéria (ou ponha os PDFs na pasta planos) e clique em <b>ler todos os planos</b>, no card ao lado. A IA liga cada plano a uma matéria e monta as provas, datas e pesos; você confere antes de salvar.'
          : 'Com uma IA de terminal ligada (Claude Code, Codex...), o jogo manda o plano de ensino para ela e recebe as provas, datas e pesos prontos. Você confere antes de salvar.'}</span>
        <div class="bt">${lig ? '<label class="btn v" style="cursor:pointer">enviar plano<input type="file" accept=".pdf,.html,.htm,.docx,.txt,.md" data-wzplano hidden></label>' : '<button type="button" class="btn v" data-wzia>ligar a IA</button>'}</div></div>
      <div><b>À mão</b><span>Sigla, nome e as datas da N1 e da N2, com o início e o fim do semestre. Dá para detalhar as avaliações depois, no editor de cada chefão.</span>
        <div class="bt"><button type="button" class="btn${lig ? '' : ' v'}" data-wzdiscabre>+ matéria</button></div></div>
    </div></div>`;
}
document.addEventListener('click', e => {
  if(!e.target.closest('[data-wzia]')) return;
  tab('cfg'); setTimeout(() => { const c = document.getElementById('cfg-ia'); if(c) c.scrollIntoView({behavior:'smooth', block:'start'}); }, 150);
});
document.addEventListener('change', async e => {
  if(!e.target.matches('[data-wzplano]') || !e.target.files[0]) return;
  try { const nome = await window.GB_IA.enviaPlano(e.target.files[0]); toast(`${esc(nome)} guardado <small>agora clique em ler todos os planos</small>`); render(); }
  catch(err){ toast('Não enviou: ' + esc(err.message)); }
});
const rB2_0 = RENDER.b2;
RENDER.b2 = S => { rB2_0(S); if(!S.bs.length) document.getElementById('b2-cols').innerHTML = vazioB2(); const h = document.querySelector('#b2-inbox h2'); if(h) h.insertAdjacentHTML('afterend', '<p style="margin:0 0 10px"><button type="button" class="btn v" data-wzdiscabre>editar disciplinas e datas</button></p>'); };
window.GB_GUIA = {abreW, abreDisciplinas, tutorial, avisaContrib};
if(CTX){ tab(cur); avisaContrib(); }   // os dados podem ter chegado antes deste script (no modo demonstração chegam): reaplica a aba com o guia
})();
