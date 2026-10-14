/* ---------- modo em grupo (0.9, #38–#42, #67, #76): a aba Torre Trick e o card "grupo" em Configurações ----------
   A página calcula o resumo dos dias (GBx.resumoGrupo: só números e os hábitos do grupo) e o servidor do jogo manda ao
   servidor do grupo o que mudou (POST /api/grupo/sincronizar). O servidor do grupo devolve os fatos e a Torre Trick
   calculada (grupo/torre.py): os andares, os placares específicos, os títulos, a evolução e a frase do líder. A aba tem as
   sub-abas placar, placares e jogadores (o perfil é a licença hunter) e, para os admins, administrar. Os hábitos do
   catálogo (#41: o Codeforces e os de vínculo) cada um liga a um hábito pessoal no card "grupo" de Configurações.
   Fora do ar, a aba mostra o último placar recebido.
   No modo demonstração não há servidor: a aba continua só explicando o que vem. */
(() => {
if(window.GB_DEMO) return;
const G = {lista:null, res:{}, sel:'', aba:'placar', adm:null, admErr:'', convite:'', link:'', host:null, hostAberto:false, funnel:null, nome:'', endereco:'', ocupado:false, ultima:0, entrarAberto:false};
const SINC_MIN = 10;   // minutos entre sincronizações com a página aberta

const quando = ts => {
  if(!ts) return 'nunca';
  const s = (Date.now() / 1000) - ts;
  if(s < 90) return 'agora';
  if(s < 3600) return `há ${Math.round(s / 60)} min`;
  const d = new Date(ts * 1000), hm = d.toTimeString().slice(0, 5), dia = d.toISOString().slice(0, 10);
  return s < 86400 * 2 ? `${s < 86400 && new Date().getDate() === d.getDate() ? 'hoje' : 'ontem'} ${hm}` : `${ddmm(dia)} ${hm}`;
};
const avatar = () => (UI.avatar && UI.avatar !== 'logo' && CTX.AVATARES.includes(UI.avatar)) ? UI.avatar : '';
const grupoSel = () => (G.lista || []).find(g => g.chave === G.sel) || (G.lista || [])[0];
const placarDe = g => (G.res[g.chave] && G.res[g.chave].placar) || g.placar;
const HAB_CF = {id:'cf', nome:'Codeforces', fonte:'automatico', desde:''};
const habsDe = P => (P && P.habitos) || [HAB_CF];   // placar de antes do catálogo (0.9.0-beta1): só o Codeforces
const curto = h => h.id === 'cf' ? 'CF' : h.nome;
/* hábitos pessoais que dá para ligar a um hábito do grupo: os da Configuração e o Duolingo, se ligado */
const pessoais = () => { const J = (CTX && CTX.JOG) || {}; return (J.habitos || []).map(h => ({id:h.id, n:h.n})).concat(J.duo && J.duo.usuario ? [{id:'duo', n:'Duolingo'}] : []); };
const reRender = () => { if(cur === 'tt' || cur === 'cfg') render(); };

async function carrega(){
  try { const j = await (await fetch('/api/grupo', {cache:'no-store'})).json(); if(j.ok){ G.lista = j.grupos; G.host = j.host; } }
  catch(e){ G.lista = G.lista || []; }
  if(G.lista && !G.lista.some(g => g.chave === G.sel)) G.sel = G.lista.length ? G.lista[0].chave : '';
}
async function sincroniza(){
  if(!CTX || !G.lista || !G.lista.length || G.ocupado) return;
  G.ocupado = true;
  try { const j = await post('/api/grupo/sincronizar', {resumo: GBx.resumoGrupo(CTX, estado(), true)}); G.res = j.grupos; G.ultima = Date.now(); }
  catch(e){ /* o servidor do jogo caiu: a próxima tentativa resolve */ }
  G.ocupado = false; reRender();
}
async function inicia(){ await carrega(); await sincroniza(); reRender(); setInterval(sincroniza, SINC_MIN * 60000); }
const espera = setInterval(() => { if(CTX){ clearInterval(espera); inicia(); } }, 300);

/* ---------- aba Torre Trick ---------- */
function heat(m, P){
  const cel = [], hs = habsDe(P).filter(h => h.id !== 'cf');
  for(let d = P.janela; d <= P.hoje; d = GBx.addD(d, 1)){
    const f = m.dias[d] || {}, aberto = !P.fechado_ate || d > P.fechado_ate;
    const tit = [ddmm(d), f.a ? 'com XP' : 'sem XP', f.cf ? `Codeforces ${f.cf}` : '', ...hs.filter(h => f[h.id]).map(h => h.nome), f.m ? 'missão' : '', aberto ? 'provisório' : ''].filter(Boolean).join(' · ');
    cel.push(`<i class="gp-c${f.a ? ' a' : ''}${f.cf ? ' cf' : ''}${aberto ? ' p' : ''}" title="${tit}"></i>`);
  }
  return `<span class="gp-heat" aria-hidden="true">${cel.join('')}</span>`;
}
function placarHTML(g){
  const P = placarDe(g), r = G.res[g.chave] || {};
  if(!P) return `<div class="card"><p style="margin:0;font-size:14px">${r.erro ? esc(r.erro) : 'Buscando o placar no servidor do grupo...'}</p></div>`;
  const aviso = r.offline ? `<p class="gp-aviso">O servidor do grupo está fora do ar. Mostrando o placar de ${esc(quando(P.recebido))}; o que você fizer até lá vai junto na próxima vez.</p>`
    : r.sem_acesso ? `<p class="gp-aviso">${esc(r.erro)}</p>` : '';
  const soma = (m, k) => Object.values(m.dias).reduce((s, f) => s + (f[k] || 0), 0), hs = habsDe(P);
  const linhas = P.membros.map(m => `<tr${m.id === P.voce.membro ? ' class="gp-eu"' : ''}>
      <td><span class="gp-quem">${m.avatar ? `<span class="av pic" style="--s:26px;background-image:url(${avSrc(m.avatar)})"></span>` : `<span class="av logo" style="--s:26px"><img src="${LOGO}" alt=""></span>`}<b>${esc(m.nome)}</b>${m.admin ? '<small>admin</small>' : ''}</span></td>
      <td class="mono">${m.sequencia}</td><td class="mono">${soma(m, 'a')}</td>${hs.map(h => `<td class="mono">${soma(m, h.id)}</td>`).join('')}
      <td>${heat(m, P)}</td><td class="sub">${esc(quando(m.envio))}</td></tr>`).join('');
  return `${aviso}<div class="card"><h2><span class="c">~/</span>${esc(P.grupo.nome)} · ${P.membros.length} ${P.membros.length === 1 ? 'membro' : 'membros'}</h2>
    <p class="sub" style="margin:0 0 12px">Só fatos por enquanto: quem jogou em cada dia e os hábitos do grupo nos últimos ${GBx.dias(P.janela, P.hoje) + 1} dias. Os pontos da Torre Trick entram quando o grupo tiver algumas semanas de uso.${P.fechado_ate ? ` Dias fechados até ${ddmm(P.fechado_ate)}; os mais recentes ainda podem mudar.` : ' Nenhum dia fechado ainda: tudo é provisório.'}</p>
    <div class="tbl-wrap"><table class="rg-t gp-t"><thead><tr><th>jogador</th><th title="dias seguidos com XP">seq.</th><th title="dias com XP na janela">dias</th>${hs.map(h => `<th title="${h.id === 'cf' ? 'problemas aceitos' : esc(h.nome) + ': dias cumpridos'}">${esc(curto(h))}</th>`).join('')}<th>últimos dias</th><th>sincronizou</th></tr></thead><tbody>${linhas}</tbody></table></div>
    <p class="sub" style="margin:10px 0 0">O seu XP e as suas tarefas não aparecem aqui: o grupo vê só se você jogou no dia. Última sincronização: ${G.ultima ? esc(quando(G.ultima / 1000)) : 'ainda não'} <button type="button" class="btn" data-gpsinc style="margin-left:6px">sincronizar agora</button></p></div>`;
}
function adminHTML(g){
  const A = G.adm;
  if(G.admErr) return `<div class="card"><p class="gp-aviso" style="margin:0">${esc(G.admErr)}</p></div>`;
  if(!A) return `<div class="card"><p style="margin:0;font-size:14px">Carregando...</p></div>`;
  const nomeDe = id => (A.membros.find(m => m.id === id) || {}).nome || '?';
  const ativos = A.membros.filter(m => !m.saiu);
  return `<div class="card"><h2><span class="c">~/</span>convidar</h2>
      <p style="margin:0 0 10px;font-size:14px">O convite é um link de uso único que vence em 7 dias. Mande para a pessoa: ela cola em Configurações → grupo.</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn v" data-gpconv>gerar convite</button><label class="sub"><input type="checkbox" id="gp-conv-adm"> como admin</label></div>
      ${G.link ? `<div style="display:flex;gap:8px;margin-top:10px"><input class="mono" readonly value="${esc(G.link)}" id="gp-link" style="flex:1;min-width:0"><button type="button" class="btn" data-gpcopia>copiar</button></div>` : ''}
      ${A.convites.length ? `<p class="sub" style="margin:12px 0 4px">Convites abertos</p>${A.convites.map(c => `<div class="gp-lin"><span>${c.membro ? `reconvite de <b>${esc(nomeDe(c.membro))}</b>` : c.admin ? 'convite de admin' : 'convite'} · vence ${ddmm(new Date(c.vence * 1000).toISOString().slice(0, 10))}</span><button type="button" class="btn" data-gpcancela="${c.id}">cancelar</button></div>`).join('')}` : ''}</div>
    <div class="card"><h2><span class="c">~/</span>membros</h2>
      ${ativos.map(m => `<div class="gp-lin"><span><b>${esc(m.nome)}</b>${m.admin ? ' <small class="sub">admin</small>' : ''} <span class="sub">· sincronizou ${esc(quando(m.envio))}</span></span>
        <span style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" data-gpadm="${m.id}" data-v="${m.admin ? 0 : 1}">${m.admin ? 'tirar admin' : 'tornar admin'}</button><button type="button" class="btn" data-gpreconv="${m.id}" title="token perdido (reinstalou, trocou de computador): liga ao mesmo perfil, com o histórico">reconvite</button><button type="button" class="btn" data-gptira="${m.id}" data-n="${esc(m.nome)}">remover</button></span></div>`).join('')}</div>
    <div class="card"><h2><span class="c">~/</span>hábitos do grupo</h2>
      <p style="margin:0 0 10px;font-size:14px">O Codeforces o jogo mede sozinho. Os outros são sim/não por dia: cada um liga um hábito pessoal ao do grupo em Configurações → grupo (o nome do hábito pessoal não sai do computador dele). Um hábito novo conta a partir de hoje; remover só esconde, e o histórico fica.</p>
      ${(A.habitos || []).map(h => `<div class="gp-lin"><span${h.removido ? ' class="sub"' : ''}><b>${esc(h.nome)}</b> <span class="sub">· ${h.fonte === 'automatico' ? 'automático' : 'vínculo'}${h.desde ? ` · desde ${ddmm(h.desde)}` : ''}${h.removido ? ' · removido' : ''}</span></span>
        <button type="button" class="btn" data-gphab="${esc(h.id)}" data-v="${h.removido ? 0 : 1}" data-n="${esc(h.nome)}">${h.removido ? 'trazer de volta' : 'remover'}</button></div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:10px"><input id="gp-hab-nome" maxlength="40" placeholder="ex.: Digitação" style="flex:1;min-width:0"><button type="button" class="btn v" data-gphabnovo>criar hábito</button></div></div>
    <div class="card"><h2><span class="c">~/</span>configuração do grupo</h2>
      <div class="gp-f"><label>Nome<input id="gp-c-nome" value="${esc(A.grupo.nome)}" maxlength="40"></label>
        <label>Fuso (fechamento às 6h)<input id="gp-c-fuso" value="${esc(A.grupo.fuso)}" maxlength="6" class="mono"></label>
        <label>Início da temporada<input id="gp-c-ini" type="date" value="${esc(A.grupo.ini)}"></label><label>Fim da temporada<input id="gp-c-fim" type="date" value="${esc(A.grupo.fim)}"></label></div>
      <p class="sub" style="margin:0 0 10px">Sem datas, o grupo aceita os dias que cada um mandar. O fuso só decide quando um dia fecha (às 6h do dia seguinte); o dia de cada coisa é o do relógio de quem fez.</p>
      <button type="button" class="btn v" data-gpcfg>salvar</button></div>
    ${torreAdminHTML(A)}`;
}
/* ---------- aba Torre Trick (#67, desenho aprovado em 14/10): sub-abas placar · placares · jogadores · administrar ----------
   O servidor do grupo manda os fatos e, em P.torre, os andares, os placares específicos, os títulos, a evolução e a frase
   do líder (grupo/torre.py). Clicar num nome abre a licença do jogador; clicar num placar abre a sub-aba placares. */
const TT = {sub:'placar', jog:null, plac:'geral', esp:(() => { try { return localStorage.getItem('gb-tt-esp') || 'campeoes'; } catch(e){ return 'campeoes'; } })()};
const SEMANA_EVO = n => n ? 's' + n.split('-W')[1] : '';
const membroDe = (P, id) => P.membros.find(m => m.id === +id) || {id, nome:'?', avatar:''};
const nomeDe = (P, id) => membroDe(P, id).nome;
const andaresTxt = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');
const temporadaDe = P => { const d = P.grupo.ini || P.hoje; return `${d.slice(0, 4)}.${+d.slice(5, 7) >= 7 ? 2 : 1}`; };
const geralDe = P => P.torre.geral;
const posGeral = (P, id) => geralDe(P).findIndex(x => x.membro === +id) + 1;
const titulosDe = (P, id) => (P.torre.titulos[id] || []).map(pid => P.torre.placares.find(p => p.id === pid)).filter(Boolean);
const placarDeId = (P, id) => P.torre.placares.find(p => p.id === id);
const pl = (id, txt) => `<button type="button" class="tt-lk" data-ttplac="${esc(id)}">${esc(txt)}</button>`;
const nm = (P, id) => `<button type="button" class="tt-lk" data-ttjog="${+id}">${esc(nomeDe(P, id))}</button>`;
const medalha = k => `<span class="tt-md${k && k <= 3 ? ' m' + k : ''}">${k || '—'}</span>`;
const COMO = {geral:'O XP do dia até o teto do grupo (1 andar por dia cheio), os hábitos do grupo (0,2 por dia cumprido) e a superação contra a sua própria média, somados na temporada.',
  volume:'A soma no período.', sequencia:'A soma dos problemas dentro da sequência atual. Um dia sem resolver zera, com 1 folga por semana; as férias não quebram.',
  superacao:'O período contra a sua média dos anteriores. Quem mantém um hábito em 100% conta como superação máxima.',
  constancia:'A parte dos dias com o hábito ligado em que ele foi cumprido.', habitos:'A soma da constância de cada hábito: mais hábitos ajudam, desde que mantidos.',
  total:'A média das superações de cada coisa de que você participa (XP e cada hábito).'};
const PERIODO = {semana:'esta semana', mes:'este mês', temporada:'temporada', sequencia:'sequência atual'};

/* ícone: a foto (banco de avatares) com o aro simples e o nickname embaixo (molduras e animações chegam com a loja, #43) */
function ico(P, id, s, pos, opt){
  opt = opt || {};
  const m = membroDe(P, id), eu = +id === P.voce.membro;
  const foto = m.avatar ? `<span class="tt-ph" style="background-image:url(${avSrc(m.avatar)})"></span>` : `<span class="tt-ph tt-logo"><img src="${LOGO}" alt=""></span>`;
  const link = opt.nolink ? '' : ` data-ttjog="${+id}" role="button" tabindex="0" aria-label="ver a licença de ${esc(m.nome)}"`;
  return `<figure class="tt-ico${eu ? ' eu' : ''}" style="--s:${s}px"${link}><span class="tt-fr">${foto}${pos ? `<b class="tt-pos${pos <= 3 ? ' p' + pos : ''}">${pos}</b>` : ''}</span>${opt.semNome ? '' : `<figcaption>${esc(m.nome)}</figcaption>`}</figure>`;
}
const mix = x => { const t = x.teto + x.habitos + x.superacao || 1;
  return `<span class="tt-mix" title="XP com teto ${andaresTxt(x.teto)} · hábitos ${andaresTxt(x.habitos)} · superação ${andaresTxt(x.superacao)}"><i class="t" style="width:${x.teto / t * 100}%"></i><i class="h" style="width:${x.habitos / t * 100}%"></i><i class="s" style="width:${x.superacao / t * 100}%"></i></span>`; };
const legenda = P => `<div class="tt-leg"><span><i class="t"></i>XP com teto</span><span><i class="h"></i>hábitos</span><span><i class="s"></i>superação</span>${P.fechado_ate ? `<span class="tt-prov">os dias depois de ${ddmm(P.fechado_ate)} ainda podem mudar</span>` : '<span class="tt-prov">nenhum dia fechado ainda: tudo é provisório</span>'}</div>`;
function ultimos(P, m, n){
  const cel = [];
  for(let i = n - 1; i >= 0; i--){ const d = GBx.addD(P.hoje, -i), f = m.dias[d] || {}, aberto = !P.fechado_ate || d > P.fechado_ate;
    cel.push(`<i class="${f.a ? 'a' : ''}${aberto ? ' p' : ''}" title="${ddmm(d)} · ${f.a ? 'com XP' : 'sem XP'}"></i>`); }
  return `<span class="tt-heat" aria-hidden="true">${cel.join('')}</span>`;
}

/* ---------- licença hunter (horizontal): frente com o principal, verso com o resto ---------- */
const EMBLEMA = '<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M60 10 L84 35 L60 60 L36 35 Z" fill="#C8102E"/><path d="M12 10 L60 60 M60 10 L12 60 M60 10 L108 60 M108 10 L60 60" stroke="#141418" stroke-width="7" fill="none"/><path d="M3 10 H23 M50 10 H70 M97 10 H117 M3 60 H23 M50 60 H70 M97 60 H117" stroke="#141418" stroke-width="3.5"/></svg>';
function glifos(txt){   // a "escrita hunter" é só enfeite: cada letra vira três traços numa caixinha
  const segs = [[0,0,6,0],[0,0,0,8],[6,0,6,8],[0,8,6,8],[0,4,6,4],[3,0,3,8],[0,0,6,8],[6,0,0,8],[0,4,3,8],[3,0,6,4]];
  let x = 0, d = '';
  for(const ch of txt.toLowerCase()){ if(ch === ' '){ x += 7; continue; } const c = ch.charCodeAt(0);
    for(let j = 0; j < 3; j++){ const s = segs[(c * (j + 3) + j * 7) % segs.length]; d += `M${x + s[0]} ${s[1]}L${x + s[2]} ${s[3]}`; } x += 10; }
  return `<svg class="tt-glifo" viewBox="-1 -1 ${x + 1} 10" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>`;
}
const numeroDe = (P, id) => { const g = geralDe(P).find(x => x.membro === +id) || {andares:0}; return [String(id).padStart(4, '0'), P.grupo.ini ? P.grupo.ini.slice(0, 4) : P.hoje.slice(0, 4), String(1000 + (id * 2731) % 9000)]; };
function frente(P, id, grande){
  const m = membroDe(P, id), k = posGeral(P, id), g = geralDe(P)[k - 1] || {andares:0}, tit = titulosDe(P, id);
  return `<div class="tt-lf"><div class="in"><div class="topo"><div class="emb">${EMBLEMA}</div>${ico(P, id, grande ? 150 : 128, 0, {nolink:true, semNome:true})}</div>
    <div class="azul"><div class="faixa">${esc(P.grupo.nome.toUpperCase())} · ${temporadaDe(P)}</div><div class="nomebox"><span>${esc(m.nome.toUpperCase())}</span></div>
      <div class="lls"><span>Nº <b>${numeroDe(P, id).join(' ')}</b></span><span><b>${k}º</b> NO GERAL · <b>${andaresTxt(g.andares)}</b> ANDARES</span>
        <span>SEQ. <b>${m.sequencia || 0}</b> · <b>${tit.length} ${tit.length === 1 ? 'TÍTULO' : 'TÍTULOS'}</b></span><span>${tit[0] ? `LÍDER EM <b>${esc(tit[0].nome.toUpperCase())}</b>` : 'SEM TÍTULO AGORA'}</span></div>
      ${glifos('hunter ' + m.nome + ' torre trick')}</div></div></div>`;
}
function verso(P, id){
  const m = membroDe(P, id), g = geralDe(P).find(x => x.membro === +id) || {projecao:0};
  const pos = P.torre.placares.map(p => [p, p.linhas.findIndex(l => l.membro === +id) + 1]).filter(x => x[1]).sort((a, b) => a[1] - b[1]);
  const q = k => `<span class="q${k <= 3 ? ' m' + k : ''}">${k}º</span>`;
  return `<div class="tt-lv"><div class="in"><div class="tarja"></div><div class="numq">${numeroDe(P, id).map((n, i) => [...n].map(c => `<i>${c}</i>`).join('') + (i < 2 ? '<span class="esp"></span>' : '')).join('')}</div>
    <div class="vinfo"><div><h5>PLACARES</h5><ul>${pos.slice(0, 6).map(([p, k]) => `<li>${q(k)}${pl(p.id, p.nome)}</li>`).join('') || '<li>nenhum ainda</li>'}</ul></div>
      <div><h5>EM CURSO</h5><ul><li>superação: +${andaresTxt(g.projecao)} andares</li><li>(entra quando o período fechar)</li></ul><h5 style="margin-top:2cqw">REGISTRO</h5><ul><li>${m.dias_com_xp || 0} dias com XP</li>${m.admin ? '<li>admin do grupo</li>' : ''}</ul></div></div></div></div>`;
}
const licenca = (P, id) => `<div class="tt-lic tt-flip" data-ttvirar title="clique para virar"><div class="flip-in"><div class="face">${frente(P, id)}</div><div class="face tras">${verso(P, id)}</div></div></div>`;

function alvo(P, id){
  const k = posGeral(P, id), g = geralDe(P), eu = g[k - 1], acima = g[k - 2];
  if(!eu) return '';
  if(!acima) return `<div class="tt-alvo"><div class="sub"><b>${+id === P.voce.membro ? 'você lidera' : 'lidera'}</b> o geral</div></div>`;
  const base = g[g.length - 1].andares, falta = Math.max(0.1, acima.andares - eu.andares + 0.1);
  return `<div class="tt-alvo"><div class="sub">faltam <b>${andaresTxt(falta)} andares</b> para passar ${nm(P, acima.membro)}</div><div class="barra"><i style="width:${acima.andares > base ? Math.round((eu.andares - base) / (acima.andares - base) * 100) : 0}%"></i></div></div>`;
}

/* ---------- pódio herói: o 1º com a vantagem sobre o 2º, e o 2º e o 3º ao lado ---------- */
function podio(P, linhas, geral){
  const [a, b, c] = linhas;
  if(!a) return '<p class="sub" style="margin:0">Ninguém aqui ainda.</p>';
  const val = x => geral ? `${andaresTxt(x.andares)}<small>andares</small>` : `${esc(x.txt)}<small>${esc(x.det)}</small>`;
  const dif = b ? (geral ? `${andaresTxt(a.andares - b.andares)} andares à frente de ${esc(nomeDe(P, b.membro))}` : `à frente de ${esc(nomeDe(P, b.membro))} (${esc(b.txt)})`) : '';
  return `<div class="tt-pod"><div class="tt-heroi">${ico(P, a.membro, 84, 1)}<div class="txt"><div class="tt-k">1º</div><div class="val">${val(a)}</div><div class="dif">${dif}</div>${geral ? `<div style="margin-top:8px">${mix(a)}</div>` : ''}</div></div>
    <div class="tt-lado">${[b, c].filter(Boolean).map((x, i) => `<div class="l">${ico(P, x.membro, 52, i + 2)}<div class="val">${val(x)}</div></div>`).join('')}</div></div>`;
}
function listaGeral(P, de){
  return `<div class="tt-rows">${geralDe(P).slice(de).map((x, i) => { const m = membroDe(P, x.membro);
    return `<div class="tt-row${x.membro === P.voce.membro ? ' eu' : ''}"><span class="p">${i + de + 1}º</span>${ico(P, x.membro, 40)}
      <div class="mid">${mix(x)}<div class="info"><span>seq. ${m.sequencia || 0}</span><span class="det">teto ${andaresTxt(x.teto)} · hábitos ${andaresTxt(x.habitos)} · superação ${andaresTxt(x.superacao)}</span>${ultimos(P, m, 14)}</div></div>
      <div class="v">${andaresTxt(x.andares)}<small>andares</small></div></div>`; }).join('') || '<p class="sub" style="margin:0">Só o pódio por enquanto.</p>'}</div>`;
}
function listaEsp(P, p, de){
  return `<div class="tt-rows">${p.linhas.slice(de).map((x, i) => `<div class="tt-row${x.membro === P.voce.membro ? ' eu' : ''}"><span class="p">${i + de + 1}º</span>${ico(P, x.membro, 40)}
      <div class="mid"><span class="sub">${esc(x.det)}</span></div><div class="v">${esc(x.txt)}</div></div>`).join('') || '<p class="sub" style="margin:0">Só estes participam deste placar.</p>'}</div>`;
}

/* ---------- frase do líder da semana (#76) ---------- */
function fraseCard(P){
  const f = P.torre.frase || {}, sem = f.semana ? `semana ${f.semana.split('-W')[1]}` : '';
  const cab = `<h2><span class="c">~/</span>frase da semana <span class="r">${f.lider ? `líder da ${sem}` : ''}</span></h2>`;
  let corpo;
  if(!f.lider) corpo = '<p class="sub tt-frase-vazia">A primeira frase sai quando a primeira semana fechar: quem mais descer nela escreve.</p>';
  else if(f.texto) corpo = `<figure class="tt-frase"><blockquote>${esc(f.texto)}</blockquote><figcaption>${nm(P, f.lider)}</figcaption></figure>`;
  else if(f.pode_escrever) corpo = `<div class="tt-frase-ed"><p class="sub" style="margin:0">Você foi o líder da ${sem}. Escreva uma frase para o grupo: <b>dá para publicar uma vez só</b>, e ela fica aqui até a próxima semana fechar.</p>
      <label class="tt-sr" for="tt-frase-txt">sua frase</label><textarea id="tt-frase-txt" maxlength="${f.limite || 80}" rows="2" placeholder="ex.: quem me alcança essa semana?"></textarea>
      <div class="pe"><span class="sub" id="tt-frase-n">0/${f.limite || 80}</span><button type="button" class="btn v" data-ttfrase disabled>publicar (não dá para mudar depois)</button></div></div>`;
  else corpo = `<p class="sub tt-frase-vazia">${f.apagada ? 'A frase desta semana foi apagada por um admin.' : `O líder da semana, ${nm(P, f.lider)}, ainda não escreveu.`}</p>`;
  return `<section class="card tt-frase-c">${cab}${corpo}</section>`;
}

/* ---------- placares específicos: o jogador escolhe ver campeões ou quem lidera ---------- */
function especificos(P){
  const ps = P.torre.placares, eu = P.voce.membro;
  const voceEm = p => { const k = p.linhas.findIndex(l => l.membro === eu) + 1; return k ? `você: <b>${k}º</b> · ${esc(p.linhas[k - 1].txt)}` : 'você não participa'; };
  if(!ps.length) return '<p class="sub" style="margin:0">Os placares específicos aparecem quando 2 ou mais pessoas participam de um hábito do grupo.</p>';
  if(TT.esp === 'campeoes') return `<div class="tt-camps">${ps.map(p => { const x = p.linhas[0];
    return `<div class="tt-camp${x.membro === eu ? ' eu' : ''}"><div class="t">${pl(p.id, p.nome)}<br><span>${esc(PERIODO[p.per] || '')}</span></div>${ico(P, x.membro, 60, 1)}<div class="v">${esc(x.txt)}<small>${esc(x.det)}</small></div><div class="vc">${voceEm(p)}</div></div>`; }).join('')}</div>`;
  const tit = P.torre.titulos, ids = P.membros.map(m => m.id).sort((a, b) => (tit[b] || []).length - (tit[a] || []).length);
  return `<div class="tt-quem">${ids.map(id => { const l = titulosDe(P, id);
    return `<div class="tt-qc${id === eu ? ' eu' : ''}">${ico(P, id, 64)}<div class="qt"><b>${l.length} ${l.length === 1 ? 'título' : 'títulos'}</b>
      <ul>${l.map(p => `<li>${medalha(1)}${pl(p.id, p.nome)} <span class="sub">· ${esc(p.linhas[0].txt)}</span></li>`).join('') || '<li class="sub">nenhum ainda</li>'}</ul></div></div>`; }).join('')}</div>`;
}

/* ---------- sub-aba placar ---------- */
function subPlacar(P){
  const eu = P.voce.membro, g = geralDe(P);
  return `<div class="tt-lt"><div class="tt-lcol">${licenca(P, eu)}<span class="tt-dica">clique na licença para virar</span>${alvo(P, eu)}
      <div class="tt-bt"><button type="button" class="btn" data-ttjog="${eu}">meu perfil</button><button type="button" class="btn" data-ttplac="geral">minha evolução</button></div></div>
    <div class="tt-dir"><section class="card"><h2><span class="c">~/</span>${pl('geral', 'pódio')} <span class="r">temporada · andares descidos</span></h2>${podio(P, g, true)}<div style="margin-top:12px">${legenda(P)}</div></section>${fraseCard(P)}</div></div>
    <section class="card"><h2><span class="c">~/</span>do 4º em diante <span class="r">teto de ${(P.torre.teto.mes || '').slice(5)}/${(P.torre.teto.mes || '').slice(0, 4)}: ${andaresTxt(P.torre.teto.xp)} XP${P.torre.teto.provisorio ? ' (provisório)' : ''}</span></h2>${listaGeral(P, 3)}</section>
    <section class="card"><h2><span class="c">~/</span>placares específicos <span class="r"><span class="tt-esp" role="group" aria-label="ver como">${[['campeoes', 'campeões'], ['lidera', 'quem lidera']].map(([v, n]) => `<button type="button" data-ttesp="${v}" aria-pressed="${TT.esp === v}">${n}</button>`).join('')}</span></span></h2>
      <p class="sub" style="margin:-4px 0 12px">Clique num placar para ver todos; num nome para ver a licença do jogador.</p>${especificos(P)}</section>`;
}

/* ---------- sub-aba placares: o placar em foco e a evolução ---------- */
function bump(P, pid, linhas){
  const pos = (P.torre.evolucao.pos || {})[pid] || {}, sem = P.torre.evolucao.semanas || [], ids = Object.keys(pos).map(Number);
  if(sem.length < 2 || !ids.length) return '<p class="sub" style="margin:0">A evolução aparece a partir da segunda semana do grupo.</p>';
  const n = Math.max(...ids.map(id => Math.max(...pos[id].filter(Boolean)))), lid = linhas[0] && linhas[0].membro, eu = P.voce.membro;
  const W = 900, pl0 = 44, pr = 150, pt = 16, row = 38, H = pt * 2 + (n - 1) * row + 24;
  const x = w => pl0 + w * (W - pl0 - pr) / (sem.length - 1), y = k => pt + (k - 1) * row;
  const cls = id => id === eu ? 'eu' : id === lid ? 'lid' : '';
  const ordem = [...ids.filter(id => !cls(id)), ...ids.filter(id => cls(id) === 'lid'), ...ids.filter(id => cls(id) === 'eu')];
  const rot = (s, w) => w === sem.length - 1 ? 'agora' : SEMANA_EVO(s);
  let s = `<svg class="tt-bump" viewBox="0 0 ${W} ${H}" role="img" aria-label="posição de cada jogador nas últimas semanas">`;
  for(let k = 1; k <= n; k++) s += `<line class="grade" x1="${pl0}" x2="${W - pr}" y1="${y(k)}" y2="${y(k)}"/><text x="${pl0 - 10}" y="${y(k) + 4}" text-anchor="end">${k}º</text>`;
  sem.forEach((sm, w) => s += `<text x="${x(w)}" y="${H - 4}" text-anchor="middle">${rot(sm, w)}</text>`);
  for(const id of ordem){
    const c = cls(id), pts = pos[id].map((k, w) => k ? [x(w), y(k), k, w] : null).filter(Boolean);
    if(!pts.length) continue;
    s += `<polyline class="ln ${c}" points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}"/>`;
    pts.forEach(p => s += `<circle class="pt ${c}" cx="${p[0]}" cy="${p[1]}" r="${c ? 5 : 4}"/><circle class="hit" cx="${p[0]}" cy="${p[1]}" r="12"><title>${esc(nomeDe(P, id))} · ${p[2]}º · ${rot(sem[p[3]], p[3])}</title></circle>`);
    const u = pts[pts.length - 1];
    s += `<text class="nm ${c}" x="${x(sem.length - 1) + 14}" y="${u[1] + 4}">${esc(nomeDe(P, id))}${id === lid ? ' · líder' : ''}</text>`;
  }
  s += '</svg>';
  const tabela = `<details class="tt-tabv"><summary>ver como tabela</summary><div class="tbl-wrap"><table><thead><tr><th>jogador</th>${sem.map((sm, w) => `<th>${rot(sm, w)}</th>`).join('')}</tr></thead><tbody>${ids.map(id => `<tr><td>${esc(nomeDe(P, id))}</td>${pos[id].map(k => `<td>${k ? k + 'º' : '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  const meu = pos[eu] && pos[eu].filter(Boolean);
  let resumo = '<div class="tt-resumo"><div><b>—</b><small>você não participa deste placar</small></div></div>';
  if(meu && meu.length){ const ini = meu[0], fim = meu[meu.length - 1];
    resumo = `<div class="tt-resumo"><div><b>${ini}º → ${fim}º</b><small>sua posição nessas semanas</small></div><div><b>${Math.min(...meu)}º</b><small>sua melhor posição</small></div><div><b>${fim < ini ? '▲ ' + (ini - fim) : fim > ini ? '▼ ' + (fim - ini) : '='}</b><small>${fim < ini ? 'posições que você subiu' : fim > ini ? 'posições que você caiu' : 'você se manteve'}</small></div></div>`; }
  return `${resumo}<div class="tt-bleg"><span><i class="eu"></i>você</span><span><i class="lid"></i>líder</span><span><i></i>os outros</span></div><div class="tbl-wrap">${s}</div>${tabela}`;
}
function subPlacares(P){
  const ps = [{id:'geral', nome:'Torre Trick (geral)', per:'temporada', tipo:'geral', linhas:geralDe(P).map(x => ({membro:x.membro, txt:andaresTxt(x.andares), det:'andares'}))}, ...P.torre.placares];
  const p = ps.find(x => x.id === TT.plac) || ps[0], eu = P.voce.membro;
  const menu = ps.map(x => { const k = x.linhas.findIndex(l => l.membro === eu) + 1;
    return `<button type="button" class="tt-pm" data-ttplac="${esc(x.id)}" aria-pressed="${x.id === p.id}"><span class="t">${esc(x.nome)}<small>${esc(PERIODO[x.per] || '')}</small></span>
      <span class="mini">${x.linhas.slice(0, 3).map((l, i) => ico(P, l.membro, 26, i + 1, {semNome:true, nolink:true})).join('')}</span><span class="vc">${k ? `você: <b>${k}º</b> · ${esc(x.linhas[k - 1].txt)}` : 'você não participa'}</span></button>`; }).join('');
  const geral = p.id === 'geral';
  return `<div class="tt-pl"><nav class="tt-pmenu" aria-label="placares">${menu}</nav><div class="tt-stack">
    <section class="card"><h2><span class="c">~/</span>${esc(p.nome)} <span class="r">${esc(PERIODO[p.per] || '')}</span></h2><p class="sub" style="margin:0 0 14px">${esc(COMO[p.tipo] || '')}</p>
      <div class="tt-ga"><div>${podio(P, geral ? geralDe(P) : p.linhas, geral)}${geral ? `<div style="margin-top:12px">${legenda(P)}</div>` : ''}</div><div class="tt-ga-l">${geral ? listaGeral(P, 3) : listaEsp(P, p, 3)}</div></div></section>
    <section class="card"><h2><span class="c">~/</span>evolução <span class="r">posição de cada um no fim de cada semana</span></h2>${bump(P, p.id, p.linhas)}</section></div></div>`;
}

/* ---------- sub-aba jogadores: o perfil é a licença, frente e verso ---------- */
function subJogadores(P){
  const id = P.membros.some(m => m.id === TT.jog) ? TT.jog : P.voce.membro, m = membroDe(P, id);
  const menu = geralDe(P).map((x, i) => `<button type="button" class="tt-jm" data-ttjog="${x.membro}" aria-pressed="${x.membro === id}">${ico(P, x.membro, 36, 0, {semNome:true, nolink:true})}<span class="n">${esc(nomeDe(P, x.membro))}${x.membro === P.voce.membro ? ' (você)' : ''}<small>${i + 1}º · ${andaresTxt(x.andares)} andares</small></span></button>`).join('');
  return `<div class="tt-jg"><nav class="tt-jmenu" aria-label="jogadores">${menu}</nav><div class="tt-stack">
    <section class="card"><h2><span class="c">~/</span>licença de ${esc(m.nome)} <span class="r">frente: o principal · verso: o resto</span></h2>
      <div class="tt-duas"><div><span class="rot">frente</span><div class="tt-lic grande">${frente(P, id, true)}</div></div><div><span class="rot">verso</span><div class="tt-lic grande">${verso(P, id)}</div></div></div>
      ${id === P.voce.membro ? `<div style="margin-top:14px;max-width:600px">${alvo(P, id)}</div>` : ''}</section>
    <section class="card"><h2><span class="c">~/</span>em breve</h2><div class="tt-futuro"><div><b>personalizar a licença</b>cor, holográfico, brilho e borda, pela loja do grupo (#43)</div><div><b>moldura e animação do ícone</b>também pela loja do grupo</div><div><b>avatar</b>o corpo inteiro, com as peças da loja (#70)</div><div><b>medalhas e conquistas</b>dos períodos fechados (#69)</div></div></section>
  </div></div>`;
}

function torreHTML(g){
  const P = placarDe(g), r = G.res[g.chave] || {};
  if(!P) return `<div class="card"><p style="margin:0;font-size:14px">${r.erro ? esc(r.erro) : 'Buscando o placar no servidor do grupo...'}</p></div>`;
  if(!P.torre) return placarHTML(g);   // placar guardado de antes da Torre Trick (servidor do grupo antigo): a tabela de fatos
  const aviso = r.offline ? `<p class="gp-aviso">O servidor do grupo está fora do ar. Mostrando o placar de ${esc(quando(P.recebido))}; o que você fizer até lá vai junto na próxima vez.</p>`
    : r.sem_acesso ? `<p class="gp-aviso">${esc(r.erro)}</p>` : '';
  const corpo = TT.sub === 'placares' ? subPlacares(P) : TT.sub === 'jogadores' ? subJogadores(P) : subPlacar(P);
  return `${aviso}<div class="tt">${corpo}</div>
    <p class="sub" style="margin:4px 0 0">O seu XP e as suas tarefas não aparecem aqui: o grupo vê os seus andares, calculados com o teto. Última sincronização: ${G.ultima ? esc(quando(G.ultima / 1000)) : 'ainda não'} <button type="button" class="btn" data-gpsinc style="margin-left:6px">sincronizar agora</button></p>`;
}

/* administrar: os números da Torre Trick, os placares e as frases (#42, #67, #76) */
const CALIB_NOMES = {sup_xp:['superação do XP (mês)', 'tetos'], sup_hab:['superação dos hábitos (mês)', 'tetos'], sup_cf:['superação do Codeforces (semana)', 'tetos'],
  hab:['cada hábito cumprido', 'andar'], sup_max:['superação que leva o prêmio inteiro', '(0,5 = +50%)'], cf_min:['base mínima do Codeforces', 'problemas/semana'], frase_max:['limite da frase do líder', 'letras']};
function torreAdminHTML(A){
  if(!A.calibracao) return '';
  const c = A.calibracao, PER = {semana:'semana', mes:'mês', temporada:'temporada', sequencia:'sequência'};
  return `<div class="card"><h2><span class="c">~/</span>torre trick: números</h2>
      <p style="margin:0 0 10px;font-size:14px">Tudo em tetos (1 andar = 1 dia com o XP no teto do grupo), então acompanha o XP de vocês sozinho. Mudar um número recalcula o que ainda está aberto; o que já fechou fica como estava.</p>
      <div class="gp-f">${Object.keys(CALIB_NOMES).map(k => `<label>${CALIB_NOMES[k][0]}<input id="tt-cal-${k}" type="number" step="${k === 'frase_max' || k === 'cf_min' ? 1 : 0.1}" min="${c.limites[k][0]}" max="${c.limites[k][1]}" value="${c.valores[k]}" class="mono"><span class="sub" style="text-transform:none;letter-spacing:0;font-weight:400">${CALIB_NOMES[k][1]} · padrão ${String(c.padrao[k]).replace('.', ',')}</span></label>`).join('')}</div>
      <button type="button" class="btn v" data-ttcal>salvar os números</button></div>
    <div class="card"><h2><span class="c">~/</span>placares específicos</h2>
      <p style="margin:0 0 10px;font-size:14px">Os placares saem dos hábitos do grupo. Desligue os que ninguém quer ver e escolha o período de cada um.</p>
      ${A.placares.map(p => `<div class="gp-lin"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ttplon="${esc(p.id)}"${p.on ? ' checked' : ''}> <b>${esc(p.nome)}</b></label>
        ${p.pers.length > 1 ? `<select data-ttplper="${esc(p.id)}">${p.pers.map(x => `<option value="${x}"${x === p.per ? ' selected' : ''}>${PER[x]}</option>`).join('')}</select>` : `<span class="sub">${PER[p.per]}</span>`}</div>`).join('')}</div>
    <div class="card"><h2><span class="c">~/</span>frases do líder</h2>
      ${(A.frases || []).length ? A.frases.map(f => `<div class="gp-lin"><span><span class="sub">semana ${esc(f.semana.split('-W')[1] || '')} · ${esc(f.nome)}:</span> ${f.apagada ? '<i class="sub">apagada</i>' : esc(f.texto)}</span>${f.apagada ? '' : `<button type="button" class="btn" data-ttfraseapaga="${esc(f.semana)}">apagar</button>`}</div>`).join('') : '<p class="sub" style="margin:0">Nenhuma frase ainda.</p>'}</div>`;
}

function rTT2(S){
  const g = grupoSel();
  if(!g){ RENDER0.tt(S); document.getElementById('tt-root').insertAdjacentHTML('afterbegin', `<div class="card"><h2><span class="c">~/</span>entrar num grupo</h2><p style="margin:0 0 4px;font-size:14px">Recebeu um convite de um amigo? Cole o link aqui.</p>${entrarHTML()}<p class="sub" style="margin:10px 0 0">Quer criar um grupo e ser o servidor? É em <a href="#" data-go="cfg">Configurações → grupo</a>.</p></div>`); return; }
  const P = placarDe(g), adm = P ? P.voce.admin : g.admin;
  if(!adm && G.aba === 'admin') G.aba = 'placar';
  const sel = `<div class="togg">${G.lista.length > 1 ? G.lista.map(x => `<button data-gpsel="${esc(x.chave)}" aria-pressed="${x.chave === g.chave}">${esc(x.nome)}</button>`).join('') : ''}<button data-gpoutro aria-pressed="${G.entrarAberto}">+ entrar em outro grupo</button></div>`;
  const outro = G.entrarAberto ? `<div class="card"><h2><span class="c">~/</span>entrar em outro grupo</h2><p style="margin:0 0 4px;font-size:14px">Cole o link do convite que o admin do outro grupo mandou. Você continua neste também.</p>${entrarHTML()}</div>` : '';
  const ab = (id, t) => `<button type="button" data-ttsub="${id}"${G.aba === 'placar' && TT.sub === id ? ' aria-current="page"' : ''}>${t}</button>`;
  const fim = P && P.grupo.fim ? GBx.dias(P.hoje, P.grupo.fim) : null;
  const cab = P ? `<div class="tt-gh"><div><h3>${esc(P.grupo.nome)}</h3><div class="meta"><span><b>${temporadaDe(P)}</b>${fim != null && fim >= 0 ? ` · faltam ${fim} dias` : ''}</span><span>${P.membros.length} ${P.membros.length === 1 ? 'membro' : 'membros'}</span><span><i class="dot"></i>sincronizou ${esc(G.ultima ? quando(G.ultima / 1000) : quando(P.recebido))}</span></div></div>${sel}</div>` : sel;
  const nav = `<nav class="tt-sub" aria-label="Torre Trick">${ab('placar', 'placar')}${ab('placares', 'placares')}${ab('jogadores', 'jogadores')}<button type="button" disabled>loja<small>em breve</small></button><button type="button" disabled>desafios<small>depois da 1.0</small></button>${adm ? `<button type="button" class="adm" data-gpaba="admin"${G.aba === 'admin' ? ' aria-current="page"' : ''}>administrar</button>` : ''}</nav>`;
  document.getElementById('tt-root').innerHTML = cab + outro + nav + (G.aba === 'admin' ? adminHTML(g) : torreHTML(g));
}
const RENDER0 = {tt: RENDER.tt, cfg: RENDER.cfg};
RENDER.tt = rTT2;

/* ---------- card "grupo" em Configurações: entrar, sair e (host) criar um grupo ---------- */
function funnelHTML(){
  const f = G.funnel; if(!f) return '';
  if(f.estado === 'ok') return `<p class="sub" style="margin:8px 0 0;color:var(--grn)">Funnel ligado: ${esc(f.endereco)}</p>`;
  if(f.estado === 'sem') return `<p class="sub" style="margin:8px 0 0">O Tailscale não está instalado. Instale em <a href="https://tailscale.com/download" target="_blank" rel="noopener">tailscale.com/download</a>, entre na conta e clique em <i>tentar de novo</i>. Ou cole abaixo o endereço de outro túnel.</p>`;
  if(f.estado === 'login') return `<p class="sub" style="margin:8px 0 0">O Tailscale está instalado mas sem conta. Rode no terminal: <code>${esc(f.comando)}</code> e clique em <i>tentar de novo</i>.</p>`;
  if(f.estado === 'autorizar') return `<p class="sub" style="margin:8px 0 0">Na primeira vez o Tailscale pede para autorizar o Funnel na sua conta: <a href="${esc(f.link)}" target="_blank" rel="noopener">abrir a autorização</a>. Depois, clique em <i>tentar de novo</i>.</p>`;
  if(f.estado === 'sudo') return `<p class="sub" style="margin:8px 0 0">No Linux o Tailscale pede permissão de administrador. Rode uma vez no terminal: <code>${esc(f.comando)}</code> e clique em <i>tentar de novo</i>.</p>`;
  return `<p class="sub" style="margin:8px 0 0;color:var(--red)">O Funnel não ligou: ${esc(f.msg || '')}</p>`;
}
function hostHTML(){
  if(!G.hostAberto) return `<p style="margin:14px 0 0"><button type="button" class="btn" data-gphost>${G.host ? 'servidor do grupo deste computador' : 'criar um grupo (este computador vira o servidor)'}</button></p>`;
  const h = G.hostEstado || {};
  return `<div class="gp-host"><p style="margin:0 0 8px;font-size:14px"><b>Este computador como servidor do grupo.</b> O servidor roda à parte do jogo e liga junto com o computador; os amigos chegam a ele pela internet, pelo <b>Tailscale Funnel</b> (grátis, só você instala). Enquanto ele estiver desligado, o grupo fica offline, e ninguém perde nada.</p>
    <p class="sub" style="margin:0">Servidor do grupo: <b>${h.servidor ? 'ligado' : 'desligado'}</b> · Tailscale: <b>${h.tailscale ? 'instalado' : 'não encontrado'}</b>${h.endereco ? ` · ${esc(h.endereco)}` : ''}</p>
    <p style="margin:10px 0 0"><button type="button" class="btn" data-gpfunnel>${G.funnel ? 'tentar de novo' : 'ligar o Funnel'}</button></p>${funnelHTML()}
    <div class="gp-f" style="margin-top:12px"><label>Nome do grupo<input id="gp-h-nome" value="${esc(G.nome)}" maxlength="40" placeholder="ex.: Amigos da facul"></label>
      <label>Endereço público<input id="gp-h-end" value="${esc(G.endereco || (G.funnel && G.funnel.endereco) || h.endereco || '')}" placeholder="https://notebook.tailXXXX.ts.net" class="mono"></label></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn v" data-gpcria>criar grupo</button>${h.dono ? '<a class="btn" href="/api/grupo/copia" download>baixar cópia do servidor</a>' : ''}<button type="button" class="btn" data-gphostfecha>fechar</button></div>
    ${(h.grupos || []).length ? `<p class="sub" style="margin:10px 0 0">Grupos neste servidor: ${h.grupos.map(x => `${esc(x.nome)} (${x.membros})`).join(' · ')}</p>` : ''}</div>`;
}
function vinculosHTML(g){
  const hs = habsDe(placarDe(g)).filter(h => h.fonte === 'vinculo');
  if(!hs.length) return '';
  const ps = pessoais(), v = g.vinculos || {};
  return `<div class="gp-vinc">${hs.map(h => `<label><span>${esc(h.nome)}</span><select data-gpvinc="${esc(h.id)}" data-chave="${esc(g.chave)}">
      <option value="">não ligado</option>${ps.map(p => `<option value="${esc(p.id)}"${v[h.id] === p.id ? ' selected' : ''}>${esc(p.n)}</option>`).join('')}</select></label>`).join('')}</div>`;
}
/* entrar num grupo (#84): o mesmo campo na aba Torre Trick e em Configurações → grupo */
const entrarHTML = () => `<div class="gp-entra"><p class="sub" style="margin:10px 0 4px">Link do convite (o amigo que é admin do grupo manda)</p>
  <div style="display:flex;gap:8px"><input class="mono" data-gpconvite aria-label="Link do convite" value="${esc(G.convite)}" placeholder="https://.../g/grupo#CODIGO" style="flex:1;min-width:0"><button type="button" class="btn v" data-gpentra>entrar</button></div></div>`;
function cardGrupo(){
  const l = G.lista || [];
  return `<div class="card" id="cfg-grupo"><h2><span class="c">~/</span>grupo</h2>
    ${l.length ? l.map(g => `<div class="gp-lin"><span><b>${esc(g.nome)}</b>${g.admin ? ' <small class="sub">admin</small>' : ''} <span class="sub mono">${esc(g.convite)}</span></span><button type="button" class="btn" data-gpsai="${esc(g.chave)}" data-n="${esc(g.nome)}">sair</button></div>${vinculosHTML(g)}`).join('') : '<p style="margin:0 0 10px;font-size:14px">Você não está em nenhum grupo.</p>'}
    ${entrarHTML()}
    <p class="sub" style="margin:8px 0 0">Vão para o grupo só o seu nickname, a foto de perfil e, por dia, o XP (para as contas; ninguém vê o número), o Codeforces e, dos hábitos do grupo, só se você cumpriu no dia o hábito pessoal que ligou a cada um. Suas tarefas, os nomes dos seus hábitos e os que você não ligou ficam aqui.</p>
    ${hostHTML()}</div>`;
}
RENDER.cfg = S => { RENDER0.cfg(S); const a = document.getElementById('cfg-srv') || document.getElementById('cfg'); if(a) a.insertAdjacentHTML('afterend', cardGrupo()); else document.getElementById('cfg-root').insertAdjacentHTML('afterbegin', cardGrupo()); };

async function admin(acao, corpo){ return post('/api/grupo/admin', Object.assign({chave: grupoSel().chave, acao}, corpo || {})); }
async function abreAdmin(){ G.adm = null; G.admErr = ''; render(); try { G.adm = await admin('ver'); } catch(e){ G.admErr = e.message; } render(); }
async function hostEstado(){ try { G.hostEstado = await post('/api/grupo/host', {acao:'estado'}); } catch(e){ G.hostEstado = {}; toast('Não deu: ' + esc(e.message)); } render(); }
const guarda = () => { const n = document.getElementById('gp-h-nome'), e = document.getElementById('gp-h-end');
  if(n) G.nome = n.value; if(e) G.endereco = e.value; };

const vaiPara = mudar => { Object.assign(TT, mudar); G.aba = 'placar'; render(); const r = document.getElementById('tt-root'); if(r && r.getBoundingClientRect().top < 0) r.scrollIntoView({behavior:'smooth', block:'start'}); };
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  let b;
  if((b = q('[data-ttsub]'))){ vaiPara({sub: b.dataset.ttsub}); return; }
  if((b = q('[data-ttplac]'))){ vaiPara({sub:'placares', plac: b.dataset.ttplac}); return; }
  if((b = q('[data-ttjog]'))){ vaiPara({sub:'jogadores', jog: +b.dataset.ttjog}); return; }
  if((b = q('[data-ttesp]'))){ TT.esp = b.dataset.ttesp; try { localStorage.setItem('gb-tt-esp', TT.esp); } catch(err){} render(); return; }
  if((b = q('[data-ttvirar]'))){ b.classList.toggle('virada'); return; }
  if(q('[data-gpoutro]')){ G.entrarAberto = !G.entrarAberto; render(); if(G.entrarAberto){ const i = document.querySelector('#tt-root [data-gpconvite]'); if(i) i.focus(); } return; }
  if((b = q('[data-gpsel]'))){ G.sel = b.dataset.gpsel; G.adm = null; G.link = ''; if(G.aba === 'admin') abreAdmin(); else render(); return; }
  if((b = q('[data-gpaba]'))){ G.aba = b.dataset.gpaba; G.link = ''; if(G.aba === 'admin') abreAdmin(); else render(); return; }
  if(q('[data-gpsinc]')){ await sincroniza(); toast(G.res[grupoSel().chave] && G.res[grupoSel().chave].offline ? 'O servidor do grupo está fora do ar' : 'Sincronizado'); return; }
  if(q('[data-gpcopia]')){ const i = document.getElementById('gp-link'); try { await navigator.clipboard.writeText(i.value); toast('Link copiado'); } catch(err){ i.select(); } return; }
  try {
    if(q('[data-gpconv]')){ const r = await admin('convite', {admin: document.getElementById('gp-conv-adm').checked}); G.link = r.link; G.adm = await admin('ver'); render(); return; }
    if((b = q('[data-gpreconv]'))){ const r = await admin('convite', {membro: +b.dataset.gpreconv}); G.link = r.link; G.adm = await admin('ver'); render(); toast('Reconvite gerado <small>mande o link para a pessoa</small>'); return; }
    if((b = q('[data-gpcancela]'))){ await admin('cancelar', {convite: +b.dataset.gpcancela}); G.adm = await admin('ver'); render(); return; }
    if((b = q('[data-gpadm]'))){ await admin('membro', {membro: +b.dataset.gpadm, admin: b.dataset.v === '1'}); G.adm = await admin('ver'); render(); return; }
    if((b = q('[data-gptira]'))){ if(!confirm(`Remover ${b.dataset.n} do grupo? O histórico fica; para voltar, só com um reconvite.`)) return;
      await admin('membro', {membro: +b.dataset.gptira, remover: true}); G.adm = await admin('ver'); render(); return; }
    if((b = q('[data-gphab]'))){ if(b.dataset.v === '1' && !confirm(`Remover ${b.dataset.n} do placar do grupo? O histórico fica, e dá para trazer de volta.`)) return;
      G.adm = await admin('habito', {id: b.dataset.gphab, remover: b.dataset.v === '1'}); render(); sincroniza(); return; }
    if(q('[data-gphabnovo]')){ const i = document.getElementById('gp-hab-nome');
      G.adm = await admin('habito', {nome: i.value.trim()}); render(); await sincroniza(); await carrega(); render(); toast('Hábito criado <small>cada um liga o seu em Configurações → grupo</small>'); return; }
    if((b = q('[data-ttfrase]'))){ const txt = document.getElementById('tt-frase-txt').value.trim();
      if(!txt || !confirm('Publicar a frase? Não dá para mudar depois.')) return;
      b.disabled = true; await post('/api/grupo/frase', {chave: grupoSel().chave, texto: txt}); await sincroniza(); toast('Frase publicada'); return; }
    if(q('[data-ttcal]')){ const v = {};
      for(const k of Object.keys(CALIB_NOMES)){ const i = document.getElementById('tt-cal-' + k); if(i && i.value !== '') v[k] = +i.value; }
      G.adm = await admin('calibracao', {valores: v}); render(); await sincroniza(); toast('Números salvos <small>o que está aberto foi recalculado</small>'); return; }
    if((b = q('[data-ttfraseapaga]'))){ if(!confirm('Apagar esta frase? O líder não escreve outra nesta semana.')) return;
      G.adm = await admin('frase', {semana: b.dataset.ttfraseapaga}); render(); sincroniza(); return; }
    if(q('[data-gpcfg]')){ const v = id => document.getElementById(id).value.trim();
      G.adm = await admin('config', {nome: v('gp-c-nome'), fuso: v('gp-c-fuso'), ini: v('gp-c-ini'), fim: v('gp-c-fim')}); await carrega(); await sincroniza(); toast('Grupo salvo'); return; }
    if((b = q('[data-gpentra]'))){ guarda(); G.convite = b.closest('.gp-entra').querySelector('[data-gpconvite]').value.trim();
      const r = await post('/api/grupo/entrar', {link: G.convite, avatar: avatar()}); G.convite = ''; G.sel = r.chave; G.entrarAberto = false; G.aba = 'placar';
      await carrega(); render(); toast(`Você entrou em ${esc(r.nome)}${cur === 'tt' ? '' : ` <small>o placar fica na aba ${esc(ABA.tt.n)}</small>`}`); sincroniza(); return; }
    if((b = q('[data-gpsai]'))){ if(!confirm(`Sair de ${b.dataset.n}? Para voltar, só com um convite novo.`)) return;
      await post('/api/grupo/sair', {chave: b.dataset.gpsai}); await carrega(); render(); toast('Você saiu do grupo'); return; }
    if(q('[data-gphost]')){ G.hostAberto = true; render(); hostEstado(); return; }
    if(q('[data-gphostfecha]')){ guarda(); G.hostAberto = false; render(); return; }
    if((b = q('[data-gpfunnel]'))){ guarda(); b.disabled = true; b.textContent = 'ligando...'; G.funnel = await post('/api/grupo/host', {acao:'funnel'}); await hostEstado(); return; }
    if((b = q('[data-gpcria]'))){ guarda(); b.disabled = true;
      const r = await post('/api/grupo/host', {acao:'criar', nome: G.nome, endereco: G.endereco || (G.funnel && G.funnel.endereco) || (G.hostEstado || {}).endereco || '', avatar: avatar()});
      G.sel = r.chave; G.nome = ''; await carrega(); await hostEstado(); toast(`Grupo ${esc(r.nome)} criado <small>convide os amigos na aba ${esc(ABA.tt.n)} → administrar</small>`); sincroniza(); return; }
  } catch(err){ toast('Não deu: ' + esc(err.message)); render(); }
});

document.addEventListener('change', async e => {
  const pl = e.target.closest('[data-ttplon],[data-ttplper]');
  if(pl){ try { G.adm = await admin('placar', pl.dataset.ttplon ? {id: pl.dataset.ttplon, on: pl.checked} : {id: pl.dataset.ttplper, per: pl.value}); render(); sincroniza(); }
    catch(err){ toast('Não deu: ' + esc(err.message)); render(); } return; }
  const s = e.target.closest('[data-gpvinc]');
  if(!s) return;
  try { await post('/api/grupo/vinculo', {chave: s.dataset.chave, habito: s.dataset.gpvinc, pessoal: s.value}); await carrega(); render();
    toast(s.value ? 'Hábito ligado <small>os dias desde o início do hábito no grupo vão na próxima sincronização</small>' : 'Hábito desligado'); sincroniza(); }
  catch(err){ toast('Não deu: ' + esc(err.message)); render(); }
});

document.addEventListener('input', e => {
  if(e.target.matches('[data-gpconvite]')){ G.convite = e.target.value; return; }
  if(e.target.id !== 'tt-frase-txt') return;
  document.getElementById('tt-frase-n').textContent = `${e.target.value.length}/${e.target.maxLength}`;
  document.querySelector('[data-ttfrase]').disabled = !e.target.value.trim();
});
document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target.matches('[data-gpconvite]')){ e.preventDefault(); e.target.closest('.gp-entra').querySelector('[data-gpentra]').click(); return; } if((e.key === 'Enter' || e.key === ' ') && e.target.matches('figure[data-ttjog]')){ e.preventDefault(); e.target.click(); } });

document.head.insertAdjacentHTML('beforeend', `<style>
.gp-heat{display:inline-flex;gap:2px;vertical-align:middle}
.gp-c{display:inline-block;width:8px;height:14px;border-radius:2px;background:var(--hair)}
.gp-c.a{background:var(--volt)}
.gp-c.cf{box-shadow:inset 0 -4px 0 var(--grn)}
.gp-c.p{opacity:.55}
.gp-t td{vertical-align:middle}
.gp-t tr.gp-eu td{background:color-mix(in srgb,var(--volt) 8%,transparent)}
.gp-quem{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.gp-quem small{font:600 10.5px var(--f-mono);color:var(--soft)}
.gp-lin{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--hair);font-size:14px}
.gp-aviso{margin:0 0 12px;padding:10px 14px;border:1px solid var(--amb);border-radius:12px;font-size:14px}
.gp-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:10px}
.gp-f label{display:flex;flex-direction:column;gap:4px;font:600 11px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--soft)}
.gp-f input{font:14px var(--f-ui);text-transform:none;letter-spacing:0}
.gp-vinc{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;padding:0 0 10px}
.gp-vinc label{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px}
.gp-vinc select{max-width:60%}
.gp-host{margin-top:14px;padding:14px;border:1px solid var(--hair);border-radius:12px}
/* aba Torre Trick (#67): tudo com o prefixo tt- (o jogo já usa .lic, .shaft, .row...). Visual Nen: cantos retos */
.tt{--tt-r:12px;display:grid;gap:16px;container-type:inline-size}
:where(.vis-nen) .tt{--tt-r:3px}
.tt-stack{display:grid;gap:16px;min-width:0}
.tt .card h2{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tt .card h2 .r{margin-left:auto;font:500 11px var(--f-mono);color:var(--faint);text-transform:none;letter-spacing:.02em}
.tt-gh{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;margin-bottom:4px}
.tt-gh h3{margin:0;font:700 22px/1.15 var(--f-hud)}
.tt-gh .meta{font:12px var(--f-mono);color:var(--soft);display:flex;gap:6px 12px;flex-wrap:wrap;margin-top:4px} .tt-gh .meta b{color:var(--ink);font-weight:600}
.tt-gh .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--grn);margin-right:5px;vertical-align:middle}
.tt-sub{display:flex;gap:2px;border-bottom:1px solid var(--hair);overflow-x:auto;margin:6px 0 16px}
.tt-sub button{flex:none;padding:10px 12px 8px;font:500 12.5px var(--f-hud);letter-spacing:.03em;color:var(--faint);border:0;border-bottom:1.5px solid transparent;margin-bottom:-1px;white-space:nowrap;background:none;cursor:pointer}
.tt-sub button[aria-current="page"]{color:var(--ink);border-color:var(--ink)}
.tt-sub button:not(:disabled):hover{color:var(--ink)} .tt-sub button:disabled{cursor:default}
.tt-sub small{font:500 9.5px var(--f-mono);margin-left:4px} .tt-sub .adm{margin-left:auto}
.tt-lk{border:0;background:none;padding:0;cursor:pointer;font:inherit;color:inherit;text-align:left;text-transform:inherit;letter-spacing:inherit}
.tt-lk:hover,.tt-lk:focus-visible{color:var(--volt);text-decoration:underline;text-underline-offset:3px}
.card h2 .tt-lk::after{content:" ›";color:var(--faint)}
.tt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
/* ícone: foto, aro simples, nickname embaixo */
.tt-ico{--s:56px;display:inline-flex;flex-direction:column;align-items:center;gap:5px;min-width:0;max-width:calc(var(--s) + 34px);margin:0;vertical-align:top}
.tt-ico[data-ttjog]{cursor:pointer} .tt-ico[data-ttjog]:hover figcaption{text-decoration:underline;text-underline-offset:3px}
.tt-fr{position:relative;width:var(--s);height:var(--s);flex:none;border-radius:50%;box-shadow:0 0 0 2px var(--faint);padding:calc(var(--s)*.07)}
.tt-ph{display:block;width:100%;height:100%;border-radius:50%;background:var(--panel2) center 18%/cover no-repeat}
.tt-logo{display:grid;place-items:center} .tt-logo img{width:62%}
.tt-ico figcaption{font:600 calc(9px + var(--s)*.05)/1.15 var(--f-mono);color:var(--ink);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.tt-ico.eu figcaption{color:var(--volt)} .tt-ico.eu .tt-fr{box-shadow:0 0 0 2px var(--volt)}
.tt-pos{position:absolute;right:-3px;bottom:-2px;min-width:calc(var(--s)*.34);height:calc(var(--s)*.34);max-height:26px;min-height:16px;display:grid;place-items:center;border-radius:99px;padding:0 4px;font:800 clamp(9px,calc(var(--s)*.17),13px)/1 var(--f-mono);background:var(--track);color:var(--ink);border:2px solid var(--panel)}
.tt-pos.p1,.tt-md.m1,.tt-lv .q.m1{background:#E0AF68;color:#1B1D28} .tt-pos.p2,.tt-md.m2,.tt-lv .q.m2{background:#B9BFD3;color:#1B1D28} .tt-pos.p3,.tt-md.m3,.tt-lv .q.m3{background:#D98B5F;color:#1B1D28}
.tt-md{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:2px;font:800 10px var(--f-mono);background:var(--track);color:var(--soft);flex:none}
/* barras, últimos dias, legenda */
.tt-mix{display:flex;height:6px;overflow:hidden;background:var(--track);min-width:60px}
.tt-mix i,.tt-leg i{display:block;height:100%} .tt-mix .t,.tt-leg .t{background:var(--volt)} .tt-mix .h,.tt-leg .h{background:var(--grn)} .tt-mix .s,.tt-leg .s{background:var(--aura)}
.tt-leg{display:flex;gap:12px;flex-wrap:wrap;font:11px var(--f-mono);color:var(--soft)} .tt-leg i{display:inline-block;width:9px;height:9px;margin-right:5px;vertical-align:-1px}
.tt-prov{color:var(--amb)}
.tt-heat{display:inline-flex;gap:2px} .tt-heat i{width:6px;height:13px;border-radius:2px;background:var(--hair)} .tt-heat i.a{background:var(--volt)} .tt-heat i.p{opacity:.5}
.tt-alvo{display:grid;gap:4px;width:100%} .tt-alvo .barra{height:6px;background:var(--track)} .tt-alvo .barra i{display:block;height:100%;background:var(--ink)} .tt-alvo b{color:var(--ink)}
/* sub-aba placar: licença ao lado do pódio, frase embaixo do pódio */
.tt-lt{display:grid;gap:18px;align-items:stretch}
@container (min-width:860px){.tt-lt{grid-template-columns:auto minmax(0,1fr)}}
.tt-lcol{display:grid;gap:12px;justify-items:start;align-content:start;width:min(520px,100%)}
.tt-dica{font:500 10.5px var(--f-mono);color:var(--faint)}
.tt-bt{display:flex;gap:6px;flex-wrap:wrap}
.tt-dir{display:grid;grid-template-rows:auto 1fr;gap:16px;min-width:0}
.tt-dir > .card,.tt-stack > .card,.tt > .card{margin:0}
.tt-pod{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:10px}
@container (max-width:560px){.tt-pod{grid-template-columns:1fr}}
.tt-heroi{display:flex;gap:14px;align-items:center;padding:10px 14px;border-radius:var(--tt-r) 3px 3px 3px;background:var(--panel2);border:1px solid color-mix(in srgb,#E0AF68 45%,var(--hair));min-width:0}
.tt-heroi .txt{min-width:0} .tt-heroi .tt-k{font:700 10.5px var(--f-mono);letter-spacing:.12em;color:#E0AF68}
.tt-heroi .val{font:700 28px/1.05 var(--f-hud)} .tt-heroi .val small{font:500 12px var(--f-mono);color:var(--soft);margin-left:6px}
.tt-heroi .dif{font-size:12.5px;color:var(--soft);margin-top:2px}
.tt-lado{display:grid;gap:8px;align-content:center}
.tt-lado .l{display:flex;gap:12px;align-items:center;padding:6px 12px;border-radius:3px;border:1px solid var(--hair)}
.tt-lado .val{font:700 17px var(--f-hud);margin-left:auto;text-align:right} .tt-lado .val small{display:block;font:500 10.5px var(--f-mono);color:var(--soft)}
.tt-frase-c{display:flex;flex-direction:column}
.tt-frase{margin:0;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:2px 16px 0}
.tt-frase blockquote{margin:0;font:600 20px/1.3 var(--f-hud);text-wrap:balance;max-width:40ch} .tt-frase blockquote::before{content:"“"} .tt-frase blockquote::after{content:"”"}
.tt-frase figcaption{font:600 13px var(--f-mono);color:var(--soft)} .tt-frase figcaption::before{content:"— ";color:var(--faint)}
.tt-frase-vazia{margin:auto 0;text-align:center}
.tt-frase-ed{display:grid;gap:10px}
.tt-frase-ed textarea{width:100%;resize:none;font:600 18px/1.35 var(--f-hud);color:var(--ink);background:var(--panel2);border:1px solid var(--hair);border-radius:3px;padding:10px 12px;box-sizing:border-box}
.tt-frase-ed .pe{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
/* listas */
.tt-rows{display:grid}
.tt-row{display:grid;grid-template-columns:30px auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 6px;border-top:1px solid var(--hair)}
.tt-row .p{font:700 13px var(--f-mono);color:var(--faint);text-align:right}
.tt-row .mid{display:grid;gap:6px;min-width:0}
.tt-row .info{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font:11px var(--f-mono);color:var(--soft)}
.tt-row .v{font:700 15px var(--f-hud);text-align:right;white-space:nowrap} .tt-row .v small{display:block;font:500 10.5px var(--f-mono);color:var(--soft)}
.tt-row.eu{background:color-mix(in srgb,var(--volt) 9%,transparent);border-radius:3px;border-top-color:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--volt) 35%,transparent)}
.tt-row.eu + .tt-row{border-top-color:transparent}
@container (max-width:700px){.tt-row .det{display:none}} @container (max-width:520px){.tt-row .tt-heat{display:none}}
/* específicos */
.tt-esp{display:inline-flex;gap:4px} .tt-esp button{border:1px solid var(--hair);background:none;border-radius:3px;padding:3px 12px;cursor:pointer;font:600 11.5px var(--f-mono);color:var(--soft);text-transform:none;letter-spacing:0}
.tt-esp button[aria-pressed="true"]{color:var(--ink);border-color:var(--volt)}
.card h2 .r .tt-esp{margin-left:auto}
.tt-camps{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
.tt-camp{flex:none;width:156px;border:1px solid var(--hair);border-radius:var(--tt-r) 3px 3px 3px;padding:12px 10px;background:var(--panel2);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.tt-camp .t{font:600 11px var(--f-mono);color:var(--soft);min-height:2.6em;line-height:1.3} .tt-camp .t span{color:var(--faint)}
.tt-camp .v{font:700 16px var(--f-hud)} .tt-camp .v small{display:block;font:500 10px var(--f-mono);color:var(--soft)}
.tt-camp .vc{font:10.5px var(--f-mono);color:var(--faint)} .tt-camp .vc b{color:var(--volt)} .tt-camp.eu{border-color:color-mix(in srgb,var(--volt) 55%,var(--hair))}
.tt-quem{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px}
.tt-qc{display:flex;gap:14px;align-items:flex-start;border:1px solid var(--hair);border-radius:var(--tt-r) 3px 3px 3px;padding:12px;background:var(--panel2);min-width:0}
.tt-qc.eu{border-color:color-mix(in srgb,var(--volt) 55%,var(--hair))}
.tt-qc .qt{min-width:0;display:grid;gap:2px} .tt-qc .qt > b{font:700 15px var(--f-hud)}
.tt-qc ul{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:4px;font-size:12.5px} .tt-qc li{display:flex;gap:7px;align-items:center;min-width:0}
/* sub-aba placares */
.tt-pl,.tt-jg{display:grid;gap:18px;align-items:start}
@container (min-width:900px){.tt-pl{grid-template-columns:300px minmax(0,1fr)}.tt-jg{grid-template-columns:240px minmax(0,1fr)}}
.tt-pmenu,.tt-jmenu{display:grid;gap:6px;position:sticky;top:12px}
.tt-pm{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;border:1px solid var(--hair);background:var(--panel);border-radius:var(--tt-r) 3px 3px 3px;padding:9px 11px;cursor:pointer;text-align:left;color:var(--ink)}
.tt-pm .t{font:600 12.5px var(--f-mono);min-width:0} .tt-pm .t small{display:block;font:500 10.5px var(--f-mono);color:var(--faint)}
.tt-pm .mini{display:flex;gap:4px} .tt-pm .vc{grid-column:1/-1;font:10.5px var(--f-mono);color:var(--faint)} .tt-pm .vc b{color:var(--volt)}
.tt-pm[aria-pressed="true"],.tt-jm[aria-pressed="true"]{border-color:var(--volt);background:color-mix(in srgb,var(--volt) 7%,var(--panel))}
.tt-jm{display:flex;gap:10px;align-items:center;border:1px solid transparent;background:none;border-radius:3px;padding:6px 10px;cursor:pointer;text-align:left;color:var(--ink)}
.tt-jm .n{display:grid;font:600 13px var(--f-mono);min-width:0} .tt-jm .n small{font:500 10.5px var(--f-mono);color:var(--faint)}
@container (max-width:899px){.tt-pmenu,.tt-jmenu{position:static;grid-auto-flow:column;grid-auto-columns:max-content;overflow-x:auto;padding-bottom:4px}.tt-pm{width:220px}}
.tt-ga{display:grid;gap:16px;align-items:start}
@container (min-width:1100px){.tt-ga{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:28px}.tt-ga-l{border-left:1px solid var(--hair);padding-left:24px}}
.tt-resumo{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px} .tt-resumo div{border:1px solid var(--hair);border-radius:3px;padding:8px 12px;min-width:140px;background:var(--panel2)}
.tt-resumo b{display:block;font:700 18px var(--f-hud)} .tt-resumo small{font:500 10.5px var(--f-mono);color:var(--faint)}
.tt-bleg{display:flex;gap:14px;flex-wrap:wrap;font:11px var(--f-mono);color:var(--soft);margin-bottom:6px}
.tt-bleg i{display:inline-block;width:16px;height:3px;margin-right:6px;vertical-align:3px;background:var(--faint)} .tt-bleg i.eu{background:var(--volt)} .tt-bleg i.lid{background:#E0AF68}
.tt-bump{width:100%;max-width:900px;height:auto;display:block}
.tt-bump .grade{stroke:var(--hair);stroke-width:1} .tt-bump text{font:600 11px var(--f-mono);fill:var(--soft)} .tt-bump text.nm{font-size:11.5px;fill:var(--ink)} .tt-bump text.nm.eu{fill:var(--volt)}
.tt-bump .ln{fill:none;stroke:var(--faint);stroke-width:1.6;stroke-linejoin:round} .tt-bump .ln.lid{stroke:#E0AF68;stroke-width:2.2} .tt-bump .ln.eu{stroke:var(--volt);stroke-width:3}
.tt-bump .pt{fill:var(--faint);stroke:var(--panel);stroke-width:2} .tt-bump .pt.lid{fill:#E0AF68} .tt-bump .pt.eu{fill:var(--volt)} .tt-bump .hit{fill:transparent}
.tt-tabv summary{cursor:pointer;font:600 11.5px var(--f-mono);color:var(--soft)} .tt-tabv table{border-collapse:collapse;font:12px var(--f-mono);margin-top:8px}
.tt-tabv th,.tt-tabv td{padding:4px 10px;border-bottom:1px solid var(--hair);text-align:center} .tt-tabv th:first-child,.tt-tabv td:first-child{text-align:left}
/* sub-aba jogadores */
.tt-duas{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start} .tt-duas > div{display:grid;gap:8px;justify-items:center}
.tt-duas .rot{font:600 10.5px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
.tt-futuro{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.tt-futuro div{border:1px dashed var(--hair);border-radius:3px;padding:14px;color:var(--faint);font:12px var(--f-mono);display:grid;gap:4px} .tt-futuro b{color:var(--soft);font-weight:600}
/* licença hunter: um objeto com cores próprias (preto, branco e azul-claro), igual nos dois temas e nos dois visuais */
.tt-lic{container-type:inline-size;width:520px;max-width:100%;--lk:#17171B;--lb:#BBDDF5;--lb2:#EEF7FD;--lcas:#E2E4EA;--lbor:#9AA0B0;--lt:#141418;color:var(--lt)}
.tt-lic.grande{width:600px}
.tt-lf,.tt-lv{aspect-ratio:1.56;background:var(--lcas);border:1px solid var(--lbor);border-radius:4cqw;padding:2cqw;font-family:var(--f-mono);box-shadow:0 10px 30px -14px #000;box-sizing:border-box}
.tt-lf .in,.tt-lv .in{height:100%;border:1px solid var(--lbor);border-radius:2.6cqw;overflow:hidden}
.tt-lf .in{display:grid;grid-template-columns:40% 1fr}
.tt-lf .topo{background:var(--lk);padding:3.4cqw 3cqw;display:grid;gap:2.6cqw;align-content:center;justify-items:center}
.tt-lf .emb{background:#FFFFFF;display:grid;place-items:center;padding:1.2cqw 2.4cqw;width:58%} .tt-lf .emb svg{width:100%;height:auto;display:block}
.tt-lic .tt-fr{box-shadow:0 0 0 2px #C9CCD6}
.tt-lf .azul{background:linear-gradient(180deg,#FFFFFF 0%,var(--lb) 100%);padding:3.6cqw 4cqw;display:grid;gap:2cqw;align-content:start;min-width:0}
.tt-lf .faixa{background:repeating-linear-gradient(90deg,#666 0 .35cqw,transparent .35cqw 1.3cqw) left/11% 100% no-repeat,repeating-linear-gradient(90deg,transparent 0 .9cqw,#666 .9cqw 1.25cqw) right/11% 100% no-repeat,#F2F2F2;
  color:#222;text-align:center;font-weight:700;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:1.9cqw;padding:1.6cqw 6.5cqw}
.tt-lf .nomebox{border:.7cqw solid var(--lt);background:#FFFFFF;display:flex;align-items:center;font:700 5cqw/1.2 var(--f-hud);letter-spacing:.06em;padding:1cqw 2.2cqw;min-width:0}
.tt-lf .nomebox span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tt-lf .lls{display:grid;font-weight:600;color:#222;font-size:2.2cqw;gap:.8cqw} .tt-lf .lls b{font-weight:800;color:var(--lt)}
.tt-glifo{display:block;max-width:100%;height:1.9cqw;width:auto;color:#2A2A30}
.tt-lv .in{background:linear-gradient(180deg,var(--lb2),var(--lb));display:grid;grid-template-rows:17% auto 1fr;padding:0 0 3cqw}
.tt-lv .tarja{background:#1A0B0B;margin-top:5cqw}
.tt-lv .numq{display:grid;grid-auto-flow:column;justify-content:start;gap:.8cqw;padding:3cqw 4cqw 2cqw}
.tt-lv .numq i{font-style:normal;display:grid;place-items:center;border:.5cqw solid var(--lt);border-radius:1.2cqw;font-weight:800;width:4.4cqw;height:4.4cqw;font-size:2.4cqw}
.tt-lv .numq .esp{width:2.4cqw}
.tt-lv .vinfo{display:grid;grid-template-columns:1fr 1fr;gap:2cqw 4cqw;padding:0 4cqw;font-size:2.1cqw;align-content:start;min-width:0}
.tt-lv h5{margin:0 0 .8cqw;font-size:.85em;letter-spacing:.14em;color:#3A3D4A}
.tt-lv ul{list-style:none;margin:0;padding:0;display:grid;gap:.6cqw} .tt-lv li{display:flex;gap:1.6cqw;align-items:baseline;min-width:0;white-space:nowrap;overflow:hidden}
.tt-lv .tt-lk{color:var(--lt);font-weight:600;overflow:hidden;text-overflow:ellipsis} .tt-lv .tt-lk:hover{color:#1F5FA8}
.tt-lv .q{display:inline-grid;place-items:center;min-width:1.9em;height:1.5em;border-radius:99px;font-weight:800;background:#FFFFFFAA;font-size:.9em}
.tt-flip{perspective:1400px;cursor:pointer} .tt-flip .flip-in{position:relative;transition:transform .6s cubic-bezier(.3,.7,.2,1);transform-style:preserve-3d}
.tt-flip.virada .flip-in{transform:rotateY(180deg)} .tt-flip .face{backface-visibility:hidden;-webkit-backface-visibility:hidden} .tt-flip .face.tras{position:absolute;inset:0;transform:rotateY(180deg)}
@media (prefers-reduced-motion:reduce){.tt-flip .flip-in{transition:none}}
</style>`);
})();
