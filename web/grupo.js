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
const G = {lista:null, res:{}, sel:'', aba:'placar', adm:null, admErr:'', convite:'', link:'', host:null, hostAberto:false, funnel:null, nome:'', endereco:'', ocupado:false, ultima:0, entrarAberto:false, mudaEnd:''};
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
  if(G.lista && !G.lista.some(g => g.chave === G.sel)){ const mesmo = G.lista.find(g => G.sel && g.id === G.sel.split('|').pop());   // mudou de endereço (#91): a chave é outra
    G.sel = mesmo ? mesmo.chave : G.lista.length ? G.lista[0].chave : ''; }
}
async function sincroniza(){
  if(!CTX || !G.lista || !G.lista.length || G.ocupado) return;
  G.ocupado = true;
  try { const j = await post('/api/grupo/sincronizar', {resumo: GBx.resumoGrupo(CTX, estado(), true), avatar: avatar()}); G.res = j.grupos; G.ultima = Date.now();
    if(Object.values(j.grupos).some(x => x.mudou)){ await carrega(); toast('O servidor do grupo mudou de computador <small>o seu jogo já passou para o endereço novo</small>'); } }
  catch(e){ /* o servidor do jogo caiu: a próxima tentativa resolve */ }
  G.ocupado = false; reRender();
}
async function inicia(){ await carrega(); await sincroniza(); reRender(); setInterval(sincroniza, SINC_MIN * 60000); lacoCaixa(); }

/* a caixa de convites e o duelo 1×1 do Codeforces (#171): pede a caixa a cada 30 s; com duelo ou convite enviado em aberto,
   a cada 4 s (a tela do duelo mostra quem resolveu cada problema quase na hora) */
G.caixa = {}; G.caixaK = {}; G.off = 0; G.vistos = new Set();
const CAIXA_S = 30, CAIXA_RAPIDO = 4;
const caixaDe = g => G.caixa[g.chave] || ((placarDe(g) || {}).torre || {}).caixa || null;
const duVivo = du => !!du && (du.estado === 'aceito' || du.estado === 'andamento');
const rapido = C => !!C && (duVivo(C.duelo) || C.convites.some(c => c.de === C.eu));
const agoraS = () => Date.now() / 1000 + G.off;
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const relo = ts => `<span class="mono" data-tnate="${ts}">${mmss(ts - agoraS())}</span>`;
function guardaCaixa(g, j){
  const antes = G.caixa[g.chave], P = placarDe(g), nome = id => P ? esc(nomeDe(P, id)) : 'alguém';
  G.off = j.agora - Date.now() / 1000;
  G.caixa[g.chave] = j;
  for(const c of j.convites) if(c.para === j.eu && !G.vistos.has(c.id)){ G.vistos.add(c.id);
    toast(`Convite de duelo · CF: ${nome(c.de)} te desafiou <small>aceite em ${esc(ABA.tt.n)} → desafios: o convite vale ${Math.round(j.regras.convite / 60)} minutos</small>`, 8000); }
  // quem convidou: o outro aceitou
  if(duVivo(j.duelo) && j.duelo.de === j.eu && !(antes && antes.duelo && antes.duelo.id === j.duelo.id)){
    toast(`${nome(j.duelo.para)} aceitou o duelo <small>os problemas saem em instantes</small>`, 6000);
    if(cur === 'tt' && G.aba === 'placar'){ TT.sub = 'duelo'; }
  }
  const k = JSON.stringify(Object.assign({}, j, {agora: 0}));
  if(G.caixaK[g.chave] !== k){ G.caixaK[g.chave] = k; if(cur === 'tt') render(); }
}
async function buscaCaixa(){
  for(const g of G.lista || []){
    try { guardaCaixa(g, await post('/api/grupo/duelo', {chave: g.chave, acao: 'caixa'})); }
    catch(e){ /* servidor do grupo fora do ar ou de antes do duelo: fica a caixa do último placar */ }
  }
}
let caixaT = 0;
async function lacoCaixa(){
  clearTimeout(caixaT);
  await buscaCaixa();
  const g = grupoSel();
  caixaT = setTimeout(lacoCaixa, (rapido(g && caixaDe(g)) ? CAIXA_RAPIDO : CAIXA_S) * 1000);
}
setInterval(() => document.querySelectorAll('[data-tnate]').forEach(el => { el.textContent = mmss(+el.dataset.tnate - agoraS()); }), 1000);
const espera = setInterval(() => { if(CTX){ clearInterval(espera); inicia(); } }, 300);

/* ---------- administrar ---------- */
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
/* ---------- aba Torre Trick: as peças em comum (o ícone, a licença e a frase do líder) ----------
   O servidor do grupo manda os fatos e, em P.torre, o Geral da semana, o chefão, a tabela do dia, a carteira e a frase
   do líder (grupo/torre.py). Clicar num nome abre a licença do jogador na sub-aba hunters. */
const TT = {sub:'placar', jog:null, plac:'geral', esp:(() => { try { return localStorage.getItem('gb-tt-esp') || 'campeoes'; } catch(e){ return 'campeoes'; } })()};
const SEMANA_EVO = n => n ? 's' + n.split('-W')[1] : '';
const vde = x => `${x.v}V ${x.d}D${x.e ? ` ${x.e}E` : ''}`;
const duelosTxt = m => m.duelos && m.duelos.v + m.duelos.d + m.duelos.e ? [`duelos: ${vde(m.duelos)}`] : [];   // o retrospecto no verso da licença
const membroDe = (P, id) => P.membros.find(m => m.id === +id) || {id, nome:'?', avatar:''};
const nomeDe = (P, id) => membroDe(P, id).nome;
const andaresTxt = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');
const temporadaDe = P => { const d = P.grupo.ini || P.hoje; return `${d.slice(0, 4)}.${+d.slice(5, 7) >= 7 ? 2 : 1}`; };
const geralDe = P => P.torre.geral;
const posGeral = (P, id) => geralDe(P).findIndex(x => x.membro === +id) + 1;
const titulosDe = (P, id) => (P.torre.titulos[id] || []).map(pid => P.torre.placares.find(p => p.id === pid)).filter(Boolean);
const pl = (id, txt) => `<button type="button" class="tt-lk" data-ttplac="${esc(id)}">${esc(txt)}</button>`;
const nm = (P, id) => `<button type="button" class="tt-lk" data-ttjog="${+id}">${esc(nomeDe(P, id))}</button>`;
const medalha = k => `<span class="tt-md${k && k <= 3 ? ' m' + k : ''}">${k || '—'}</span>`;
/* ícone: a foto (banco de avatares) com o aro simples e o nickname embaixo (molduras e animações chegam com a loja, #43) */
function ico(P, id, s, pos, opt){
  opt = opt || {};
  const m = membroDe(P, id), eu = +id === P.voce.membro;
  const foto = m.avatar ? `<span class="tt-ph" style="background-image:url(${avSrc(m.avatar)})"></span>` : `<span class="tt-ph tt-logo"><img src="${LOGO}" alt=""></span>`;
  const link = opt.nolink ? '' : ` data-ttjog="${+id}" role="button" tabindex="0" aria-label="ver a licença de ${esc(m.nome)}"`;
  return `<figure class="tt-ico${eu ? ' eu' : ''}" style="--s:${s}px"${link}><span class="tt-fr">${foto}${pos ? `<b class="tt-pos${pos <= 3 ? ' p' + pos : ''}">${pos}</b>` : ''}</span>${opt.semNome ? '' : `<figcaption>${esc(m.nome)}</figcaption>`}</figure>`;
}
const legenda = P => `<div class="tt-leg"><span><i class="t"></i>XP com teto</span><span><i class="h"></i>hábitos</span><span><i class="s"></i>superação</span>${P.fechado_ate ? `<span class="tt-prov">os dias depois de ${ddmm(P.fechado_ate)} ainda podem mudar</span>` : '<span class="tt-prov">nenhum dia fechado ainda: tudo é provisório</span>'}</div>`;
/* ---------- licença hunter (horizontal): frente com o principal, verso com o resto ---------- */
const EMBLEMA = '<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M60 10 L84 35 L60 60 L36 35 Z" fill="#C8102E"/><path d="M12 10 L60 60 M60 10 L12 60 M60 10 L108 60 M108 10 L60 60" stroke="#141418" stroke-width="7" fill="none"/><path d="M3 10 H23 M50 10 H70 M97 10 H117 M3 60 H23 M50 60 H70 M97 60 H117" stroke="#141418" stroke-width="3.5"/></svg>';
function glifos(txt){   // a "escrita hunter" é só enfeite: cada letra vira três traços numa caixinha
  const segs = [[0,0,6,0],[0,0,0,8],[6,0,6,8],[0,8,6,8],[0,4,6,4],[3,0,3,8],[0,0,6,8],[6,0,0,8],[0,4,3,8],[3,0,6,4]];
  let x = 0, d = '';
  for(const ch of txt.toLowerCase()){ if(ch === ' '){ x += 7; continue; } const c = ch.charCodeAt(0);
    for(let j = 0; j < 3; j++){ const s = segs[(c * (j + 3) + j * 7) % segs.length]; d += `M${x + s[0]} ${s[1]}L${x + s[2]} ${s[3]}`; } x += 10; }
  return `<svg class="tt-glifo" viewBox="-1 -1 ${x + 1} 10" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>`;
}
const numeroDe = (P, id, pv) => { if(pv && pv.no) return [pv.no, P.grupo.ini ? P.grupo.ini.slice(0, 4) : P.hoje.slice(0, 4), pv.no]; return [String(id).padStart(4, '0'), P.grupo.ini ? P.grupo.ini.slice(0, 4) : P.hoje.slice(0, 4), String(1000 + (id * 2731) % 9000)]; };
function frente(P, id, grande, pv){   // pv: os itens da loja aplicados (provador, #136)
  pv = pv || {};
  const m = membroDe(P, id), k = posGeral(P, id), g = geralDe(P)[k - 1] || {andares:0}, tit = titulosDe(P, id), emb = pv.emb === 'aranha' ? TRUPE(id) : pv.emb === 'rei' ? COROA : EMBLEMA;
  return `<div class="tt-lf"><div class="in"><div class="topo"><div class="emb${pv.emb === 'rei' ? ' rei' : ''}">${emb}</div>${ico(P, id, grande ? 150 : 128, 0, {nolink:true, semNome:true})}${pv.st ? `<span class="estr">${pv.st}</span>` : ''}</div>
    <div class="azul"><div class="faixa">${esc(P.grupo.nome.toUpperCase())} · ${temporadaDe(P)}</div><div class="nomebox"><span>${esc(m.nome.toUpperCase())}</span></div>
      <div class="lls"><span>Nº <b>${numeroDe(P, id, pv).join(' ')}</b></span><span><b>${k}º</b> NO GERAL · <b>${andaresTxt(g.andares)}</b> ANDARES</span>
        <span>SEQ. <b>${m.sequencia || 0}</b> · <b>${tit.length} ${tit.length === 1 ? 'TÍTULO' : 'TÍTULOS'}</b></span><span>${tit[0] ? `LÍDER EM <b>${esc(tit[0].nome.toUpperCase())}</b>` : 'SEM TÍTULO AGORA'}</span></div>
      ${glifos('hunter ' + m.nome + ' torre trick')}</div></div>${pv.car ? `<span class="car${pv.car.startsWith('CHEF') ? ' az' : ''}">${esc(pv.car)}</span>` : ''}${pv.bd ? '<i class="chain"></i>' : ''}</div>`;
}
function verso(P, id, pv){
  const m = membroDe(P, id), g = geralDe(P).find(x => x.membro === +id) || {projecao:0};
  const pos = P.torre.placares.map(p => [p, p.linhas.findIndex(l => l.membro === +id) + 1]).filter(x => x[1]).sort((a, b) => a[1] - b[1]);
  const q = k => `<span class="q${k <= 3 ? ' m' + k : ''}">${k}º</span>`;
  return `<div class="tt-lv"><div class="in"><div class="tarja"></div><div class="numq">${numeroDe(P, id, pv).map((n, i) => [...n].map(c => `<i>${c}</i>`).join('') + (i < 2 ? '<span class="esp"></span>' : '')).join('')}</div>
    <div class="vinfo"><div><h5>PLACARES</h5><ul>${pos.slice(0, 6).map(([p, k]) => `<li>${q(k)}${pl(p.id, p.nome)}</li>`).join('') || '<li>nenhum ainda</li>'}</ul></div>
      <div><h5>EM CURSO</h5><ul><li>superação: +${andaresTxt(g.projecao)} andares</li><li>(entra quando o período fechar)</li></ul><h5 style="margin-top:2cqw">REGISTRO</h5><ul><li>${m.dias_com_xp || 0} dias com XP</li>${duelosTxt(m).map(x => `<li>${x}</li>`).join('')}${m.admin ? '<li>admin do grupo</li>' : ''}</ul></div></div></div>${pv && pv.bd ? '<i class="chain"></i>' : ''}</div>`;
}
/* ---------- sub-aba loja: a Loja da Associação como vitrine com provador (#136) ----------
   Sem Trick Coin e sem compra: cada item mostra a faixa, o 念 HxH e como vai ser liberado (#43). O provador aplica os itens
   na sua licença de verdade (frente e verso), só nesta tela: nada vai para o servidor e ninguém mais vê. As imagens da
   aranha da Trupe e da coroa do Rei são provisórias (#137) */
const TRUPE = n => { const L = [[54,28,38,14,26,5],[53,31,33,22,16,17],[52,34,30,32,10,33],[52,37,30,43,13,51],[53,40,35,53,23,65],[56,43,45,58,40,69]];
  const p = L.map(([a,b,c,d,e,f]) => `M${a} ${b}L${c} ${d}L${e} ${f}M${120-a} ${b}L${120-c} ${d}L${120-e} ${f}`).join('');
  return `<svg viewBox="8 1 104 70" aria-hidden="true"><path d="${p}" stroke="#141418" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="60" cy="22" r="7.5" fill="#141418"/><ellipse cx="60" cy="44" rx="13" ry="17" fill="#141418"/><text x="60" y="52" text-anchor="middle" font-size="21" font-weight="800" fill="#FF3347" font-family="sans-serif">${n % 100}</text></svg>`; };
const COROA = '<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M28 54 L22 18 L42 36 L60 10 L78 36 L98 18 L92 54 Z" fill="#E8C35A" stroke="#6E5418" stroke-width="2"/><rect x="27" y="54" width="66" height="8" rx="2" fill="#E8C35A" stroke="#6E5418" stroke-width="2"/><circle cx="60" cy="40" r="5" fill="#C8102E"/><circle cx="42" cy="44" r="3.4" fill="#2F6FD0"/><circle cx="78" cy="44" r="3.4" fill="#2F6FD0"/></svg>';
const FAIXA_TT = {comum:'Comum', raro:'Raro', epico:'Épico', lenda:'Lendário'};
const LIB_TT = {tc:'Trick Coin', ind:'desafio individual', col:'desafio coletivo', lim:'limitado'};
const CAT_TT = {lic:'Licença hunter', mold:'Molduras', aura:'Em volta do perfil', fundo:'Fundo do perfil', emb:'Emblema no placar', nome:'Nome no placar', tit:'Títulos de grupo'};
/* [id, nome, categoria, faixa, HxH, liberação, descrição, o que aplica na licença (provador), de onde veio] */
const LOJA_TT = [
  ['lic-verde','Licença verde-caçador','lic','comum',0,'tc','Troca o azul-claro da licença por verde. O padrão (preto, branco e azul-claro) continua grátis.',{cor:'verde'}],
  ['lic-escarlate','Licença escarlate','lic','comum',1,'tc','Rosa-escarlate no lugar do azul, e o painel da foto em vinho, como os olhos do clã Kurta.',{cor:'escarlate'}],
  ['lic-estojo','Estojo preto','lic','comum',0,'tc','O estojo cinza em volta da licença vira preto.',{est:'preto'}],
  ['lic-ouro','Estojo dourado','lic','raro',0,'tc','Estojo e borda dourados.',{est:'ouro'}],
  ['lic-corrente','Borda de corrente','lic','raro',1,'tc','A borda vira a corrente do Kurapika.',{bd:'corrente'}],
  ['lic-brilho','Brilho','lic','raro',0,'tc','Um reflexo passa pela licença.',{fx:'brilho'}],
  ['lic-verso','Verso roxo','lic','raro',0,'tc','O verso (a tarja e o fundo) em roxo. A frente continua igual.',{vs:'roxo'}],
  ['lic-exame','Carimbo: Exame aprovado','lic','raro',1,'ind','Desafio: completar a primeira semana inteira do grupo sem atraso.',{car:'APROVADO'}],
  ['lic-1estrela','Estrela ★','lic','raro',1,'ind','Desafio: liderar o placar do grupo numa semana.',{st:'★'}],
  ['lic-1999','Licença Nº 1999','lic','raro',1,'lim','Só 1 dono. Vai para o 1º a cumprir o desafio da temporada.',{no:'1999'}],
  ['lic-emb-aranha','Emblema da Aranha','lic','raro',1,'ind','A aranha de doze patas da Trupe no lugar do emblema hunter da licença, com o seu número. Desafio: derrotar 3 chefões do Genei Ryodan.',{emb:'aranha'}],
  ['lic-holo','Licença holográfica','lic','epico',0,'ind','Desafio: Ten de 30 dias dentro do grupo.',{fx:'holo'}],
  ['lic-2estrelas','Estrelas ★★','lic','epico',1,'ind','Desafio: liderar o placar em 4 semanas da temporada.',{st:'★★'}],
  ['lic-chefao','Selo: chefão do grupo','lic','epico',1,'col','Todos que participaram ganham quando o grupo derrota o chefão (#44).',{car:'CHEFÃO ✓'}],
  ['mold-hunter','Moldura Hunter ★','mold','comum',1,'tc','Aro dourado de quem tem licença.',null,'veio da Masadora'],
  ['mold-carta','Carta de Greed Island','mold','raro',1,'tc','O avatar vira uma carta.',null,'veio da Masadora'],
  ['mold-escarlate','Olhos escarlates','mold','raro',1,'tc','Brilho vermelho que pulsa.',null,'veio da Masadora'],
  ['mold-aranha','Moldura da Aranha','mold','raro',1,'ind','Doze patas em volta do avatar e o número de membro. Desafio: derrotar um chefão do Genei Ryodan.',null,'veio da Masadora, com desenho novo'],
  ['mold-giro','Anel de aura','mold','epico',0,'tc','Anel com as cores da paleta girando em volta do avatar.',null,'veio da Masadora'],
  ['pf-aura','Aura do avatar','aura','raro',0,'tc','O avatar pulsa com aura no placar e na licença.',null,'veio da Masadora'],
  ['pf-part','Partículas de Nen','aura','epico',0,'tc','Partículas sobem em volta do perfil.'],
  ['pf-ren','Ren no pódio','aura','epico',1,'ind','A aura explode em volta do avatar quando você sobe no pódio. Desafio: subir 3 posições numa semana.'],
  ['fd-liso','Fundo de cor','fundo','comum',0,'tc','Fundo do perfil na cor da sua aura.'],
  ['fd-arena','Fundo da Arena','fundo','raro',1,'tc','O piso da Arena Celestial atrás do perfil.'],
  ['fd-cena','Fundo vivo','fundo','epico',0,'tc','Manchas de aura que se movem devagar atrás do perfil.'],
  ['emb-nen','Emblema 念','emb','comum',1,'tc','Um símbolo pequeno que aparece ao lado do seu nome em todos os placares do grupo.'],
  ['emb-naipe','Emblema de naipe','emb','comum',1,'tc','Um naipe (♠ ♥ ♦ ♣, à escolha) ao lado do seu nome nos placares.'],
  ['emb-aura','Emblema de aura','emb','raro',0,'tc','O 念 ao lado do seu nome pulsa com aura nos placares.'],
  ['nm-cor','Cor do nome','nome','comum',0,'tc','Seu nome no placar na cor que escolher.'],
  ['nm-brilho','Nome com brilho','nome','raro',0,'tc','Um brilho corre pelo seu nome.'],
  ['nm-podio','Entrada no pódio','nome','epico',0,'ind','Sua linha sobe com destaque quando você passa alguém. Desafio: ficar no pódio 3 semanas seguidas.'],
  ['tt-membro','Membro da Associação','tit','comum',1,'tc','O primeiro título de grupo.'],
  ['tt-7em1','7 dias em 1','tit','raro',0,'ind','Desafio: fazer mais da metade dos pontos da semana no último dia.'],
  ['tt-ultimo','Rei do último minuto','tit','raro',0,'ind','Desafio: 5 entregas no próprio dia do prazo.'],
  ['tt-1999','Top 1 desde 1999','tit','epico',0,'ind','Desafio: liderar o placar 3 semanas seguidas.'],
  ['tt-costas','Carregou o grupo nas costas','tit','epico',0,'lim','Só 1 por desafio coletivo: quem mais pontuou nele.'],
  ['tt-presidente','Presidente da Associação','tit','epico',1,'lim','Só 1 por temporada: o 1º do geral no fim.'],
  ['lg-3estrelas','Hunter Três Estrelas','lic','lenda',1,'ind','Título, moldura e as três estrelas na licença. Desafio: todos os chefões da temporada derrotados e o pódio do geral.',{est:'ouro',st:'★★★'}],
  ['lg-exame','Licença do Exame Hunter','lic','lenda',1,'col','Licença holográfica com o carimbo da temporada. O grupo inteiro precisa vencer o Exame Hunter de fim de temporada.',{fx:'holo',car:'EXAME · T1'}],
  ['lg-0001','Licença Nº 0001','lic','lenda',1,'lim','Só 1 dono por grupo, para sempre. Sai no Leilão de Yorknew entre quem cumpriu o desafio da temporada.',{est:'ouro',fx:'brilho',no:'0001'}],
  ['lg-rei','Emblema do Rei','lic','lenda',1,'col','A coroa do Rei em ouro no lugar do emblema hunter, e a mesma coroa ao lado do seu nome em todos os placares. O grupo derrota o chefão do grupo na dificuldade máxima; todos os participantes ganham.',{emb:'rei'}],
];
const TTPV = {};   // provador: o que está aplicado na licença agora (só na memória desta tela)
const provando = it => it[7] && Object.entries(it[7]).every(([k, v]) => TTPV[k] === v);
/* arte nova em teste (#134, web/arte.js): TT.nova troca a licença inteira (o cartão novo, os estojos em SVG, os carimbos e
   o emblema desenhados) e TT.ouro escolhe um dos três dourados. Só nesta tela, como o resto do provador */
TT.nova = true; TT.ouro = 'ouro';
const ARTE = () => window.GB_ARTE && window.GB_LIC;
const comArte = id => ARTE() && GB_ARTE.tem(id) && !GB_ARTE.ARTE[id].sem;
const OUROS = [['ouro', 'filete'], ['ouro-chanfro', 'chanfro'], ['ouro-losangos', 'losangos']];
function licNova(P, id, pv, or, face, larg){
  const m = membroDe(P, id), k = posGeral(P, id), g = geralDe(P)[k - 1] || {andares:0, projecao:0}, tit = titulosDe(P, id);
  const pos = P.torre.placares.map(p => [p, p.linhas.findIndex(l => l.membro === +id) + 1]).filter(x => x[1]).sort((a, b) => a[1] - b[1]);
  const d = {foto: m.avatar ? avSrc(m.avatar) : LOGO, nome: esc(m.nome.toUpperCase()), faixa: `${esc(P.grupo.nome.toUpperCase())} · ${temporadaDe(P)}`, num: numeroDe(P, id, pv),
    linhas: [`Nº <b>${numeroDe(P, id, pv).join(' ')}</b>`, `<b>${k}º</b> NO GERAL · <b>${andaresTxt(g.andares)}</b> ANDARES`, `SEQ. <b>${m.sequencia || 0}</b> · <b>${tit.length} ${tit.length === 1 ? 'TÍTULO' : 'TÍTULOS'}</b>`,
      tit[0] ? `LÍDER EM <b>${esc(tit[0].nome.toUpperCase())}</b>` : 'SEM TÍTULO AGORA'],
    glifo: glifos('hunter ' + m.nome + ' torre trick'), placares: pos.slice(0, 6).map(([p, k]) => [k, pl(p.id, p.nome)]),
    curso: [`superação: +${andaresTxt((geralDe(P).find(x => x.membro === +id) || {projecao:0}).projecao)} andares`, '(entra quando o período fechar)'],
    registro: [`${m.dias_com_xp || 0} dias com XP`].concat(duelosTxt(m), m.admin ? ['admin do grupo'] : [])};
  const est = pv.bd === 'corrente' ? 'corrente' : pv.est === 'preto' ? 'preto' : pv.est === 'ouro' ? TT.ouro : 'padrao';
  const car = {'APROVADO':'lic-exame', 'CHEFÃO ✓':'lic-chefao', 'EXAME · T1':'lg-exame'}[pv.car] || '';
  return GB_LIC.peca(or, face, {est, cor: pv.cor || 'azul', emb: pv.emb || 'hunter', car, st: (pv.st || '').length, fx: pv.fx || '', d}, larg);
}
const licClasses = pv => ['cor','est','bd','fx','vs'].filter(k => pv[k]).map(k => 'tl-' + k + '-' + pv[k]).join(' ');
function cardLoja(P, it){
  const [id, n, cat, fa, hx, lib, d, ap, de] = it, me = P.voce.membro, ph = avMe(56), nv = TT.nova && ARTE();
  const pv = ap && nv && !ap.vs ? licNova(P, me, ap, 'h', 'frente', 520)
    : ap ? `<div class="tt-lic ${licClasses(ap)}">${ap.vs ? verso(P, me, ap) : frente(P, me, false, ap)}</div>`
    : cat === 'mold' ? `<div class="tl-av ${{'mold-hunter':'fr-hunter','mold-carta':'fr-carta','mold-escarlate':'fr-escarlate','mold-aranha':'fr-aranha','mold-giro':'fr-giro'}[id]}">${ph}</div>`
    : cat === 'aura' ? `<div class="tl-av ${id === 'pf-aura' ? 'fxd aura' : 'tl-' + id}">${ph}</div>`
    : cat === 'fundo' ? `<div class="tl-av tl-${id}${id === 'fd-arena' ? ' tex-arena' : ''}">${ph}</div>`
    : cat === 'emb' || cat === 'nome' ? `<div class="tl-pod"><div><em>1</em><span>Gon</span><b>1.920</b></div><div class="eu tl-${id}"><em>2</em>${cat === 'emb' ? `<i class="tl-emb">${id === 'emb-naipe' ? (nv && comArte(id) ? GB_ARTE.naipe('espadas') : '♠') : '<span class="nen7">念</span>'}</i>` : ''}<span class="tl-nm">${esc(nomeDe(P, me))}</span><b>1.840</b></div><div><em>3</em><span>Leorio</span><b>1.205</b></div></div>`
    : `<div class="tl-tit"><b>${esc(nomeDe(P, me))}</b><span>${esc(n)}</span></div>`;
  const naipes = id === 'emb-naipe' && nv && comArte(id) ? `<div class="tl-naipes">${['espadas', 'copas', 'ouros', 'paus', 'coringa'].map(GB_ARTE.naipe).join('')}</div>` : '';
  return `<div class="tl-it${ap ? ' prov' : ''}${ap && provando(it) ? ' on' : ''}"${ap ? ` data-ttprova="${id}" role="button" tabindex="0" title="provar na sua licença"` : ''}>
    <div class="tl-pv">${pv}${naipes}</div><div class="tl-info"><div class="tl-sl"><span class="tl-fa tl-${fa}">${FAIXA_TT[fa]}</span>${hx ? '<span class="tl-hx"><i class="nen7">念</i> HxH</span>' : ''}</div>
    <b>${esc(n).replace('念', '<i class="nen7">念</i>')}</b><p>${esc(d)}</p>${de ? `<p class="tl-de">${esc(de)}; quem já tem continua com ele.</p>` : ''}${ARTE() ? GB_ARTE.aviso(id, true) : ''}
    <div class="tl-lib"><span>${lib === 'col' ? 'grátis para quem participar' : lib === 'tc' ? 'compra direta' : 'compra depois do desafio'}</span><span class="tl-l-${lib}">${LIB_TT[lib]}</span></div>
    ${ap ? `<span class="tl-prov">${provando(it) ? '✓ na sua licença' : 'clique para provar'}</span>` : ''}</div></div>`;
}
function subLoja(P){
  const me = P.voce.membro, on = LOJA_TT.filter(provando);
  const filtro = it => (!TT.llib || it[5] === TT.llib) && (!TT.lcat || it[2] === TT.lcat) && (!TT.larte || (ARTE() && GB_ARTE.tem(it[0])));
  const bt = (k, v, t) => `<button type="button" data-ttlf="${k}:${v}" aria-pressed="${(TT[k] || '') === v}">${t}</button>`;
  const fil = `<div class="tl-fil"><span>liberação</span>${bt('llib', '', 'todas')}${Object.entries(LIB_TT).map(([k, t]) => bt('llib', k, t)).join('')}<span>categoria</span>${bt('lcat', '', 'todas')}${Object.entries(CAT_TT).map(([k, t]) => bt('lcat', k, t.toLowerCase())).join('')}${ARTE() ? `<span>arte</span>${bt('larte', '', 'todos')}${bt('larte', '1', 'só com arte nova')}` : ''}</div>`;
  const prats = Object.keys(FAIXA_TT).map(fa => { const l = LOJA_TT.filter(it => it[3] === fa && filtro(it)); return l.length ? `<div class="tl-prat"><h3>${FAIXA_TT[fa]} <small>${l.length} ${l.length === 1 ? 'item' : 'itens'}</small></h3><div class="tl-grade">${l.map(it => cardLoja(P, it)).join('')}</div></div>` : ''; }).join('');
  return `<div class="tt-stack">
    <section class="card"><h2><span class="c">~/</span>provador da licença <span class="r">só na sua tela: nada vai para o servidor e ninguém mais vê</span></h2>
      <p class="sub" style="margin:0 0 12px">${on.length ? 'Provando: ' + on.map(it => esc(it[1])).join(' · ') : 'Licença padrão, que é grátis: preto, branco e azul-claro. Clique num item da licença, aqui embaixo, para provar.'}${on.length ? ' <button type="button" class="btn" data-ttlimpa style="margin-left:6px">tirar tudo</button>' : ''}</p>
      ${ARTE() ? provaArte() : ''}
      ${TT.nova && ARTE() ? `<div class="tt-duas"><div><span class="rot">frente</span>${licNova(P, me, TTPV, 'h', 'frente', 600)}</div><div><span class="rot">verso</span>${licNova(P, me, TTPV, 'h', 'verso', 600)}</div></div>
        <div class="tt-duas" style="margin-top:14px"><div><span class="rot">em pé (a ideia para o placar)</span><div style="display:flex;gap:18px;flex-wrap:wrap">${licNova(P, me, TTPV, 'v', 'frente', 230)}${licNova(P, me, TTPV, 'v', 'verso', 230)}</div></div></div>`
      : `<div class="tt-duas"><div><span class="rot">frente</span><div class="tt-lic grande ${licClasses(TTPV)}">${frente(P, me, true, TTPV)}</div></div><div><span class="rot">verso</span><div class="tt-lic grande ${licClasses(TTPV)}">${verso(P, me, TTPV)}</div></div></div>`}</section>
    <section class="card"><h2><span class="c">~/</span>loja da associação <span class="r">vitrine: a compra chega com a Trick Coin (#43)</span></h2>
      <p style="margin:0 0 10px;font-size:14px">O que os outros veem de você: licença, molduras, o que fica em volta do perfil, emblema e nome no placar, títulos de grupo. Os itens de desafio levam a marca da temporada e ficam só para quem participou.</p>
      ${fil}${prats || '<p class="sub">Nenhum item com esses filtros.</p>'}</section></div>`;
}
/* a troca antiga | nova do provador, o status do cartão e a escolha do dourado */
function provaArte(){
  const c = GB_ARTE.CARTAO, bt = (v, t) => `<button type="button" data-ttnova="${v}" aria-pressed="${TT.nova === !!v}">${t}</button>`;
  return `<div class="ar7" style="margin:0 0 12px"><span class="ar-l"><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="color:var(--ink)">Licença</b><span class="ar-tg" role="group" aria-label="versão">${bt('', 'antiga')}${bt('1', 'nova')}</span>
    ${TT.nova && TTPV.est === 'ouro' ? `<span class="ar-tg" role="group" aria-label="dourado">${OUROS.map(([k, t]) => `<button type="button" data-ttouro="${k}" aria-pressed="${TT.ouro === k}">${t}</button>`).join('')}</span>` : ''}</span>
    <span class="ar-st ${c.st}">cartão novo: ${GB_ARTE.ST[c.st]}</span></span><span>${TT.nova ? esc(c.tx) + ' A troca vale para tudo o que você provar aqui: na nova, os carimbos, o emblema da Aranha, os estojos e os naipes já são os desenhos da fila de arte.' : 'A licença de hoje, como está no jogo. A nova mostra o cartão redesenhado e os desenhos da fila de arte.'}</span></div>`;
}
const licenca = (P, id) => `<div class="tt-lic tt-flip" data-ttvirar title="clique para virar"><div class="flip-in"><div class="face">${frente(P, id)}</div><div class="face tras">${verso(P, id)}</div></div></div>`;

/* ---------- frase do líder da semana (#76) ---------- */
function fraseCard(P){
  const f = P.torre.frase || {}, sem = f.semana ? `semana ${f.semana.split('-W')[1]}` : '';
  const cab = `<h2><span class="c">~/</span>frase da semana <span class="r">${f.lider ? `líder da ${sem}` : ''}</span></h2>`;
  let corpo;
  if(!f.lider) corpo = '<p class="sub tt-frase-vazia">A primeira frase sai quando a primeira semana fechar: o 1º do Geral dela escreve.</p>';
  else if(f.texto) corpo = `<figure class="tt-frase"><blockquote>${esc(f.texto)}</blockquote><figcaption>${nm(P, f.lider)}</figcaption></figure>`;
  else if(f.pode_escrever) corpo = `<div class="tt-frase-ed"><p class="sub" style="margin:0">Você foi o líder da ${sem}. Escreva uma frase para o grupo: <b>dá para publicar uma vez só</b>, e ela fica aqui até a próxima semana fechar.</p>
      <label class="tt-sr" for="tt-frase-txt">sua frase</label><textarea id="tt-frase-txt" maxlength="${f.limite || 80}" rows="2" placeholder="ex.: quem me alcança essa semana?"></textarea>
      <div class="pe"><span class="sub" id="tt-frase-n">0/${f.limite || 80}</span><button type="button" class="btn v" data-ttfrase disabled>publicar (não dá para mudar depois)</button></div></div>`;
  else corpo = `<p class="sub tt-frase-vazia">${f.apagada ? 'A frase desta semana foi apagada por um admin.' : `O líder da semana, ${nm(P, f.lider)}, ainda não escreveu.`}</p>`;
  return `<section class="card tt-frase-c">${cab}${corpo}</section>`;
}

/* administrar: os números da Torre Trick, os placares e as frases (#42, #67, #76) */
const CALIB_NOMES = {sup_xp:['superação do XP (mês)', 'tetos'], sup_hab:['superação dos hábitos (mês)', 'tetos'], sup_cf:['superação do Codeforces (semana)', 'tetos'],
  hab:['cada hábito cumprido', 'andar'], sup_max:['superação que leva o prêmio inteiro', '(0,5 = +50%)'], cf_min:['base mínima do Codeforces', 'problemas/semana'], frase_max:['limite da frase do líder', 'letras'],
  cf_tabela:['tabela do dia do Codeforces', '1 ligada, 0 desligada'], cf_valor:['tabela: valor da faixa A', 'pontos'], cf_passo:['tabela: a mais por faixa', 'pontos'],
  cf_bonus:['tabela: bônus do 1º', 'pontos (metade se passar)'], cf_teto:['tabela: problemas que pontuam', 'por pessoa por dia'], cf_piso:['tabela: faixas abaixo da sua que pontuam', 'faixas'],
  tc_marca:['Trick Coin da marca da semana', 'TC'], tc_chefao:['Trick Coin do chefão (base)', 'TC, até +50%']};
function torreAdminHTML(A){
  if(!A.calibracao) return '';
  const c = A.calibracao, PER = {semana:'semana', mes:'mês', temporada:'temporada', sequencia:'sequência'};
  return `<div class="card"><h2><span class="c">~/</span>torre trick: números</h2>
      <p style="margin:0 0 10px;font-size:14px">Tudo em tetos (1 andar = 1 dia com o XP no teto do grupo), então acompanha o XP de vocês sozinho. Mudar um número recalcula o que ainda está aberto; o que já fechou fica como estava.</p>
      <div class="gp-f">${Object.keys(CALIB_NOMES).map(k => `<label>${CALIB_NOMES[k][0]}<input id="tt-cal-${k}" type="number" step="${k === 'frase_max' || /^(cf|tc)_/.test(k) ? 1 : 0.1}" min="${c.limites[k][0]}" max="${c.limites[k][1]}" value="${c.valores[k]}" class="mono"><span class="sub" style="text-transform:none;letter-spacing:0;font-weight:400">${CALIB_NOMES[k][1]} · padrão ${String(c.padrao[k]).replace('.', ',')}</span></label>`).join('')}</div>
      <button type="button" class="btn v" data-ttcal>salvar os números</button></div>
    <div class="card"><h2><span class="c">~/</span>relatório para calibrar</h2>
      <p style="margin:0 0 10px;font-size:14px">Tudo da temporada num arquivo: cada semana com os blocos e todas as modalidades, as marcas, os chefões, a tabela do dia por faixa, a Trick Coin e os dias de cada um (em andares, sem o XP). Serve para ajustar os números com dado real.</p>
      <button type="button" class="btn" data-ttrel>baixar o relatório (JSON)</button></div>
    <div class="card"><h2><span class="c">~/</span>placares específicos</h2>
      <p style="margin:0 0 10px;font-size:14px">Os placares saem dos hábitos do grupo. Desligue os que ninguém quer ver e escolha o período de cada um.</p>
      ${A.placares.map(p => `<div class="gp-lin"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ttplon="${esc(p.id)}"${p.on ? ' checked' : ''}> <b>${esc(p.nome)}</b></label>
        ${p.pers.length > 1 ? `<select data-ttplper="${esc(p.id)}">${p.pers.map(x => `<option value="${x}"${x === p.per ? ' selected' : ''}>${PER[x]}</option>`).join('')}</select>` : `<span class="sub">${PER[p.per]}</span>`}</div>`).join('')}</div>
    <div class="card"><h2><span class="c">~/</span>frases do líder</h2>
      ${(A.frases || []).length ? A.frases.map(f => `<div class="gp-lin"><span><span class="sub">semana ${esc(f.semana.split('-W')[1] || '')} · ${esc(f.nome)}:</span> ${f.apagada ? '<i class="sub">apagada</i>' : esc(f.texto)}</span>${f.apagada ? '' : `<button type="button" class="btn" data-ttfraseapaga="${esc(f.semana)}">apagar</button>`}</div>`).join('') : '<p class="sub" style="margin:0">Nenhuma frase ainda.</p>'}</div>`;
}

/* ---------- as sub-abas (redesenho de 21/10, docs/COLETIVO-REDESENHO.md, #170–#173) ----------
   semana (a licença, o card da semana e o Geral ou a Superação da semana) · desafios (tabela do dia do CF, chefão do mês,
   convites) · temporada (rodadas ganhas e medalhas) · hunters (a licença de cada um, com o detalhe por hábito) · loja.
   O Geral, a Superação, a marca e o chefão vêm do servidor do grupo (P.torre.semanal e P.torre.chefao). O que ainda não
   existe (o duelo e o pacto) aparece como prévia. */
TT.pod = 'geral';
const NOVAS = ['semana', 'desafios', 'temporada', 'hunters', 'loja', 'duelo'];
const MOD = {ritmo:['Ritmo', 'XP com teto', 'Jogue todo dia até o teto do grupo.', 'O XP de cada dia, até o teto do grupo. 100 = bateu o teto em todos os dias da semana; o que passa do teto não conta, então jogar todo dia vale mais que um dia enorme.'],
  prazos:['Prazos', 'entregas no prazo', 'Entregue as tarefas com prazo até o dia.', 'As tarefas com prazo que venceram na semana. 100 = todas entregues até o dia.'],
  habitos:['Hábitos', 'constância', 'Cumpra os hábitos do grupo que você ligou.', 'Os hábitos do grupo que você ligou, dia a dia. 100 = todos, todos os dias; o Codeforces conta só como fez ou não fez.'],
  superacao:['Superação', 'contra a sua média', 'Faça mais do que a sua própria média.', 'Você contra você: o XP, os hábitos e o Codeforces da semana comparados com a sua média. Quem joga pouco e melhora pontua tanto quanto quem joga muito.']};
MOD.constancia = ['Constância', 'dias jogados', 'Jogue nos 7 dias da semana.', 'Quantos dias da semana você fez algum XP. 100 = os 7 dias, não importa quanto.'];
MOD.cf = ['Codeforces', 'dias com problema', 'Resolva problema no Codeforces todo dia.', 'Os dias da semana com pelo menos um problema resolvido no Codeforces. 100 = todos os dias.'];
MOD.missao = ['Missão', 'missão da semana', 'Cumpra a missão Nen da semana.', 'A missão Nen da sua semana: 3 dias com tarefa da missão. 100 = missão cumprida.'];
/* a modalidade "hab:<id>" é um hábito do grupo (o nome vem do placar) */
const md = k => MOD[k] || (n => [n, 'hábito do grupo', `Cumpra ${n} todo dia.`, `Os dias da semana em que você cumpriu ${n}, o hábito do grupo que você ligou. 100 = todos os dias.`])((TT.habNomes || {})[String(k).slice(4)] || 'o hábito');
const dobra = k => BLOCOS.includes(k);
const tcV = P => (P.torre.trick || {}).valores || {marca:50, chefao:80};
const TC = v => `<b class="tn-tc">${v} <small>TC</small></b>`;
/* o "?" de cada card: a explicação fica escondida até a pessoa pedir */
TT.aj = {};
const ajBt = (id, t) => `<button type="button" class="tn-aj" data-tnaj="${id}" aria-expanded="${!!TT.aj[id]}" title="${t || 'como funciona'}">?</button>`;
const ajTx = (id, html) => TT.aj[id] ? `<div class="tn-ajuda">${html}</div>` : '';
/* os três sistemas (e a tabela do dia), no "?" do card da semana */
function sistemasHTML(P){
  const v = tcV(P), s = semAtual(P);
  return `<p><b>Placar da semana</b> contra o grupo. Os 4 blocos e a modalidade; zera na segunda. Dá medalha, título e a escolha da próxima modalidade, nunca moeda.</p>
    <p><b>Marca da semana</b> contra você. ${Math.round((P.torre.semanal.marca || .15) * 100)}% acima da sua média em ${md(s.modalidade)[0]}. Bateu: ${v.marca} TC.</p>
    <p><b>Chefão do mês</b> todos juntos. O XP do mês contra a sua meta do chefão, que não é a marca. Se ele cair: ${v.chefao} a ${Math.round(v.chefao * 1.5)} TC.</p>
    <p><b>Tabela do dia</b> Codeforces. Um problema por faixa, às 6h; cada um vale de ${Math.min(...(P.torre.cf_dia || {valores:[2]}).valores)} a ${Math.max(...(P.torre.cf_dia || {valores:[8]}).valores)} TC.</p>`;
}
const BLOCOS = ['ritmo', 'prazos', 'habitos', 'superacao'];
const prev = (t = 'prévia') => `<span class="tn-prev" title="ainda não existe no servidor do grupo: mostra como vai ser">${t}</span>`;
const temSemanal = P => P.torre.semanal && P.torre.semanal.semanas.length;
const semAtual = P => P.torre.semanal.semanas[P.torre.semanal.semanas.length - 1];
const temp = (P, id) => (P.torre.semanal.temporada || {})[id] || {rodadas:0, medalhas:[0, 0, 0], superacao:0, marcas:0};
const linhaDe = (s, id) => s.geral.find(x => x.membro === +id);
const estrelas = t => t.rodadas >= 4 ? 2 : t.rodadas >= 1 ? 1 : 0;   // prestígio grátis: ★ na 1ª rodada ganha, ★★ na 4ª (★★★ é o lendário)

/* os 4 blocos numa barra, de 0 a 100 cada (o da modalidade ×2) e, embaixo, as outras modalidades em números pequenos; a da
   semana, quando não é um dos 4, fica destacada (ela entra no Geral como 5º bloco) */
function blocosHTML(x, mod){
  const b = (k, v) => `<span class="b${k === mod ? ' x2' : ''}${v == null ? ' nd' : ''}" title="${md(k)[0]}: ${v == null ? (k === 'prazos' ? 'sem tarefa com prazo nesta semana' : 'sem dado') : v + ' de 100'}${k === mod ? ' · modalidade da semana' : ''}"><i style="--v:${v || 0}%"></i><small>${md(k)[0].slice(0, 3)}${k === mod ? ' ×2' : ''}</small></span>`;
  const mods = Object.entries(x.mods || {}).map(([k, v]) => `<span class="${k === mod ? 'on' : ''}" title="${md(k)[0]}${k === mod ? ': modalidade da semana, entra como 5º bloco' : ': conta só na semana em que for a modalidade'}">${esc(md(k)[0])} <b>${v == null ? '—' : v}</b></span>`).join('');
  return `<span class="tn-bl">${BLOCOS.map(k => b(k, x.blocos[k])).join('')}</span>${mods ? `<span class="tn-mods">${mods}</span>` : ''}`;
}
function cardSemana(P){
  const S = P.torre.semanal, s = semAtual(P), eu = P.voce.membro, x = linhaDe(s, eu), m = md(s.modalidade), tc = (P.torre.trick ? '' : prev());
  const resta = GBx.dias(P.hoje, s.fim);
  const pc = Math.round((S.marca || .15) * 100), tcM = tcV(P).marca;
  const marca = x && x.marca != null ? `<div class="tn-marca"><div class="tn-mt"><span><b>marca da semana</b> ${ajBt('marca')}</span><span><b>${x.mod || 0}</b> / ${x.marca}${x.bateu ? ' <b class="ok">✓</b>' : ''} · ${TC(tcM)}</span></div>
      <div class="tn-pb"><i style="width:${Math.min(100, (x.mod || 0) / x.marca * 100)}%"></i></div>
      ${ajTx('marca', `<p>Você contra você: ${pc}% acima da sua média em ${m[0]} nas últimas semanas. Bateu, ganha ${tcM} Trick Coin quando a semana fecha. ${tc}</p>`)}</div>`
    : x && x.mod == null ? `<p class="sub">Você não tem dado em ${m[0]} (não ligou esse hábito do grupo): nesta semana não há marca para você.</p>` : '<p class="sub">Sua marca aparece quando você tiver uma semana de base.</p>';
  const ops = S.opcoes.map(k => `<button type="button" class="btn" data-tnmod="${k}" aria-pressed="${S.escolha === k}">${md(k)[0]}</button>`).join('');
  const prox = S.escolhe === eu ? `<div class="tn-esc"><span>${S.escolha ? 'Você escolheu a próxima:' : 'Você escolhe a próxima:'}</span><span class="tn-ops">${ops}</span></div>`
    : S.escolhe ? `<div class="tn-esc sub"><span>Próxima: ${nm(P, S.escolhe)} ${S.escolha ? `escolheu ${md(S.escolha)[0]}` : `escolhe entre ${S.opcoes.map(k => md(k)[0]).join(', ')}`}.</span></div>` : '';
  return `<section class="card tn-sem"><h2><span class="c">~/</span>semana ${s.semana.split('-W')[1]} <span class="r">${ddmm(s.ini)} a ${ddmm(s.fim)} · ${resta > 0 ? `faltam ${resta} ${resta === 1 ? 'dia' : 'dias'}` : 'último dia'} ${ajBt('sis', 'os três sistemas')}</span></h2>
    ${ajTx('sis', sistemasHTML(P))}
    <div class="tn-mod"><div><span class="tn-k">modalidade ${ajBt('mod', 'o que cada modalidade mede')}</span><b>${m[0]}${dobra(s.modalidade) ? ' <small class="tn-x2">×2</small>' : ''}</b><p class="sub">${m[2]}</p>
      ${ajTx('mod', `<p>A modalidade muda toda semana: o 1º da semana escolhe a da seguinte entre 3 opções (se não escolher, o sistema sorteia uma). Se é um dos 4 blocos do Geral, ele conta em dobro; se não, entra como 5º bloco. ${s.escolhida_por ? `Esta foi escolhida por ${esc(nomeDe(P, s.escolhida_por))}.` : ''}</p>
        ${S.modalidades.map(k => `<p${k === s.modalidade ? ' class="on"' : ''}><b>${md(k)[0]}</b> ${md(k)[3]}</p>`).join('')}`)}</div>${marca}</div>${prox}</section>`;
}
function placarSemana(P){
  const s = semAtual(P), eu = P.voce.membro, sup = TT.pod === 'superacao';
  const linhas = sup ? s.superacao.map(id => linhaDe(s, id)) : s.geral, val = x => sup ? x.blocos.superacao : x.total;
  const uni = sup ? 'de superação' : 'pontos';
  const [a, b, c] = linhas;
  const tg = `<span class="tt-esp" role="group" aria-label="pódio">${[['geral', 'Geral'], ['superacao', 'Superação']].map(([v, n]) => `<button type="button" data-tnpod="${v}" aria-pressed="${TT.pod === v}">${n}</button>`).join('')}</span>`;
  const como = (sup ? '<p>Quem mais evoluiu contra a própria média nesta semana. Desempata o Geral.</p>'
    : `<p>Ritmo, Prazos, Hábitos e Superação, de 0 a 100 cada; ${md(s.modalidade)[0]}, a modalidade, ${dobra(s.modalidade) ? 'conta em dobro' : 'entra como 5º bloco'}. Zera toda segunda; a posição dá medalha, não moeda.</p>`)
    + `<p>${P.fechado_ate ? `Dias fechados até ${ddmm(P.fechado_ate)}; os seguintes ainda podem mudar.` : 'Nenhum dia fechado ainda.'} Prazos conta as tarefas com prazo; quem ainda está numa versão antiga do jogo fica sem esse bloco.</p>`;
  const pod = a ? `<div class="tt-pod"><div class="tt-heroi">${ico(P, a.membro, 84, 1)}<div class="txt"><div class="tt-k">1º da semana</div><div class="val">${val(a)}<small>${uni}</small></div>
      <div class="dif">${!b ? '' : val(a) > val(b) ? `${val(a) - val(b)} à frente de ${esc(nomeDe(P, b.membro))}` : `empatado com ${esc(nomeDe(P, b.membro))}: desempata ${sup ? 'o Geral' : 'a Superação'}`}</div>${sup ? '' : `<div style="margin-top:8px">${blocosHTML(a, s.modalidade)}</div>`}</div></div>
    <div class="tt-lado">${[b, c].filter(Boolean).map((x, i) => `<div class="l">${ico(P, x.membro, 52, i + 2)}<div class="val">${val(x)}<small>${uni}</small></div></div>`).join('')}</div></div>` : '<p class="sub">Ninguém jogou nesta semana ainda.</p>';
  const rows = linhas.slice(3).map((x, i) => `<div class="tt-row${x.membro === eu ? ' eu' : ''}"><span class="p">${i + 4}º</span>${ico(P, x.membro, 40)}
      <div class="mid">${sup ? '' : blocosHTML(x, s.modalidade)}</div><div class="v">${val(x)}<small>${uni}</small></div></div>`).join('');
  return `<section class="card"><h2><span class="c">~/</span>${sup ? 'superação' : 'geral'} da semana <span class="r">${tg} ${ajBt('placar')}</span></h2>${ajTx('placar', como)}
    ${pod}${rows ? `<div class="tt-rows" style="margin-top:10px">${rows}</div>` : ''}
    <div class="tn-frase">${fraseCard(P).replace('<section class="card tt-frase-c">', '<div>').replace(/<\/section>$/, '</div>')}</div></section>`;
}
/* a licença com os números do desenho novo: posição na semana, rodadas ganhas, medalhas e as estrelas de prestígio */
function dadosLic(P, id){
  const m = membroDe(P, id), s = semAtual(P), k = s.geral.findIndex(x => x.membro === +id) + 1, t = temp(P, id), md = t.medalhas;
  const habs = P.torre.placares.filter(p => p.habito && p.linhas.some(l => l.membro === +id)).map(p => `${esc(p.nome.replace('Codeforces', 'CF'))}: <b>${esc(p.linhas.find(l => l.membro === +id).txt)}</b>`);
  return {foto: m.avatar ? avSrc(m.avatar) : LOGO, nome: esc(m.nome.toUpperCase()), faixa: `${esc(P.grupo.nome.toUpperCase())} · ${temporadaDe(P)}`, num: numeroDe(P, id),
    linhas: [`Nº <b>${numeroDe(P, id).join(' ')}</b>`, `<b>${k ? k + 'º' : '—'}</b> NA SEMANA · <b>${t.rodadas}</b> ${t.rodadas === 1 ? 'RODADA' : 'RODADAS'}`,
      `MEDALHAS <b>${md[0]}</b>·<b>${md[1]}</b>·<b>${md[2]}</b> · SEQ. <b>${m.sequencia || 0}</b>`, t.marcas ? `<b>${t.marcas}</b> ${t.marcas === 1 ? 'MARCA BATIDA' : 'MARCAS BATIDAS'}` : 'NENHUMA MARCA AINDA'],
    glifo: glifos('hunter ' + m.nome + ' torre trick'),
    placares: [[1, `${md[0]} ${md[0] === 1 ? 'semana' : 'semanas'} em 1º`], [2, `${md[1]} em 2º`], [3, `${md[2]} em 3º`]],
    curso: habs.slice(0, 3).concat(t.superacao ? [`${t.superacao}× 1º na superação`] : []), registro: [`${m.dias_com_xp || 0} dias com XP`].concat(duelosTxt(m), m.admin ? ['admin do grupo'] : [])};
}
const licPeca = (P, id, face, larg) => GB_LIC.peca('v', face, {est:'padrao', cor:'azul', emb:'hunter', car:'', st:estrelas(temp(P, id)), fx:'', d:dadosLic(P, id)}, larg);
const licVira = (P, id) => ARTE() ? `<div class="tt-flip tn-lic" data-ttvirar title="clique para virar"><div class="flip-in"><div class="face">${licPeca(P, id, 'frente', 300)}</div><div class="face tras">${licPeca(P, id, 'verso', 300)}</div></div></div>` : licenca(P, id);

function subSemana(P){
  const eu = P.voce.membro, t = temp(P, eu), k = semAtual(P).geral.findIndex(x => x.membro === eu) + 1;
  return `<div class="tt-lt tn-lt"><div class="tt-lcol">${licVira(P, eu)}<span class="tt-dica">clique para virar</span>
      <div class="tn-eu"><div><b>${k ? k + 'º' : '—'}</b><small>na semana</small></div><div><b>${t.rodadas}</b><small>${t.rodadas === 1 ? 'rodada ganha' : 'rodadas ganhas'}</small></div><div><b>${P.torre.trick ? P.torre.trick.saldo : '—'}</b><small>Trick Coin</small></div></div>
      <div class="tt-bt"><button type="button" class="btn" data-ttsub="hunters">minha licença</button><button type="button" class="btn" data-ttsub="desafios">desafios</button></div></div>
    <div class="tt-stack">${cardSemana(P)}${placarSemana(P)}</div></div>`;
}

/* ---------- desafios: o que é de hoje, o chefão do mês e os convites ---------- */
function chefaoHTML(P){
  const C = P.torre.chefao, eu = P.voce.membro;
  if(!C) return '';
  const vivo = C.vida - C.dano, resta = GBx.dias(P.hoje, C.fim), morto = vivo <= 0.05;
  const mes = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][+C.mes.slice(5) - 1];
  const rows = [...C.membros].sort((a, b) => b.conta / b.meta - a.conta / a.meta).map(x => { const p = x.conta / x.meta;
    return `<div class="tn-ch${x.membro === eu ? ' eu' : ''}">${ico(P, x.membro, 30, 0, {semNome:true})}<span class="n">${esc(nomeDe(P, x.membro))}</span>
      <span class="tn-cb" title="tirou ${andaresTxt(x.conta)} de uma meta de ${andaresTxt(x.meta)} (teto ${Math.round(C.teto * 100)}%)"><i style="width:${Math.min(100, p / C.teto * 100)}%"></i><em style="left:${C.minimo / C.teto * 100}%"></em><em class="m" style="left:${100 / C.teto}%"></em></span>
      <span class="v">${Math.round(p * 100)}%${p >= C.minimo ? ' <b class="ok">✓</b>' : ''}</span></div>`; }).join('');
  return `<section class="card"><h2><span class="c">~/</span>chefão de ${mes} <span class="r">${morto ? 'derrotado' : `faltam ${resta} dias`} · ${TC(tcV(P).chefao)} ${ajBt('chefao')}</span></h2>
    ${ajTx('chefao', `<p>Todos juntos: o XP do mês tira a vida dele. A vida é ${Math.round((C.fator || .8) * 100)}% do que o grupo faz num mês normal.</p>
      <p>A <b>meta do chefão</b> é sua e não é a marca da semana: o XP com teto de um mês normal seu (1 = um dia no teto do grupo). Cada um tira até ${Math.round(C.teto * 100)}% dela.</p>
      <p>Se ele cair até o fim do mês, quem passou de ${Math.round(C.minimo * 100)}% da meta ganha ${tcV(P).chefao} TC, até ${Math.round(tcV(P).chefao * 1.5)} TC quem chegou a ${Math.round(C.teto * 100)}%.</p>`)}
    <div class="tn-hp"><div class="tn-hpt"><b>${morto ? 'Derrotado pelo grupo' : `${andaresTxt(vivo)} de ${andaresTxt(C.vida)} de vida`}</b></div>
      <div class="tn-hpb"><i style="width:${Math.max(0, vivo / C.vida * 100)}%"></i></div></div>
    <div class="tn-chs" style="margin-top:12px">${rows}</div><p class="sub tn-leg"><em></em> mínimo · <em class="m"></em> meta do chefão</p></section>`;
}
/* a tabela do dia do Codeforces (#171): 7 faixas de rating, um problema sorteado em cada uma às 6h (P.torre.cf_dia) */
const CF_FX = [800, 1100, 1400, 1700, 2000, 2300, 2700].map((lo, i) => [lo, [1000, 1300, 1600, 1900, 2200, 2600, 3000][i]]);
const corCF = r => [['cinza', '#9AA0B0'], ['verde', '#4CAF50'], ['ciano', '#03A89E'], ['azul', '#3B6FE0'], ['roxo', '#AA00AA'], ['laranja', '#FF8C00'], ['vermelho', '#E0301E']][GB.CF_CORES.filter(c => r >= c).length];
const MOTIVO = {primeiro:'1º a resolver', normal:'', piso:'abaixo do seu piso: não pontua', teto:'passou do teto do dia: não pontua'};
function tabelaCF(P){
  const T = P.torre.cf_dia, eu = P.voce.membro, L = 'ABCDEFG';
  const fx = (i, txt) => { const [lo, hi] = CF_FX[i], [n, c] = corCF(lo); return `<span class="tn-fx" style="--c:${c}" title="${n}: qualquer problema de ${lo} a ${hi}">${txt || `${lo}–${hi}`}</span>`; };
  const h2 = r => `<h2><span class="c">~/</span>tabela do dia · Codeforces <span class="r">${r} ${ajBt('cf')}</span></h2>`;
  if(!T) return `<section class="card">${h2(prev('o servidor do grupo precisa atualizar'))}
      ${ajTx('cf', '<p>7 faixas de rating, de 800 a 3000. Às 6h sai um problema de cada faixa, sorteado entre os que ninguém do grupo resolveu.</p>')}
      <div class="tn-cf">${CF_FX.map((_, i) => `<div class="tn-cfp"><b class="l">${L[i]}</b>${fx(i)}<span class="sub">um problema qualquer da faixa</span><span></span></div>`).join('')}</div></section>`;
  const R = T.regras, mf = T.faixa[eu], meus = T.feitos.filter(x => x.membro === eu && x.pts > 0).length;
  const como = ajTx('cf', `<p>Às 6h sai um problema de cada faixa (qualquer rating dentro dela), sorteado entre os que ninguém do grupo resolveu. Quem resolve ganha o valor da faixa em Trick Coin quando o dia fecha; o 1º a resolver cada um leva +${R.bonus}.</p>
    <p>Até ${R.teto} por pessoa por dia${mf != null ? `; você pontua da faixa <b>${L[Math.max(0, mf - R.piso)]}</b> para cima` : ''}. O servidor do grupo confere a cada 10 minutos.</p>`);
  if(!T.tabela) return `<section class="card">${h2('desligada')}<p class="sub" style="margin:0">Um admin desligou a tabela do dia em administrar.</p></section>`;
  if(!T.problemas.length) return `<section class="card">${h2('ainda não saiu')}${como}
      <p class="sub" style="margin:0">${T.ligado ? 'A tabela de hoje sai na próxima conferência do servidor do grupo (a cada 10 minutos, quando ele está ligado).' : 'Ligue o Codeforces em Configurações (o seu handle) para a tabela aparecer: o servidor do grupo precisa do handle de alguém para sortear.'}</p></section>`;
  const linhas = T.problemas.map(p => { const fs = T.feitos.filter(x => x.id === p.id), meu = fs.find(x => x.membro === eu);
    const quem = fs.map(x => `<span class="tn-qm${x.pts ? '' : ' zero'}" title="${esc(nomeDe(P, x.membro))}: ${x.pts ? '+' + x.pts : '0'}${MOTIVO[x.motivo] ? ' · ' + MOTIVO[x.motivo] : ''}">${ico(P, x.membro, 22, 0, {semNome:true, nolink:true})}</span>`).join('');
    const vale = mf != null && p.faixa < mf - R.piso ? '<span class="sub" title="abaixo do seu piso: não pontua para você">—</span>' : `+${T.valores[p.faixa]}`;
    return `<div class="tn-cfp${meu ? ' feito' : ''}"><b class="l">${p.letra}</b>${fx(p.faixa, p.rating)}<a href="https://codeforces.com/problemset/problem/${p.contest}/${encodeURIComponent(p.index)}" target="_blank" rel="noopener" class="tn-cfn">${esc(p.nome)}<small>${p.contest}${esc(p.index)}</small></a><span class="tn-qs">${quem}</span><span class="tn-cfv">${meu ? `<b class="ok">${meu.pts ? '+' + meu.pts : '✓'}</b>` : vale}</span></div>`; }).join('');
  return `<section class="card">${h2(`hoje ${meus}/${R.teto} · ${T.pontos[eu] || 0} TC`)}${como}
      <div class="tn-cf">${linhas}</div></section>`;
}
/* a caixa de convites: só entra o que a pessoa aceita (o duelo agora; o pacto na fase 3) */
const PACTO = `<div><b>Pacto de hábito ${prev('fase 3')}</b><span class="sub">Você propõe um hábito e os dias; se os dois cumprirem, os dois ganham em dobro.</span><button type="button" class="btn" disabled>propor um pacto</button></div>`;
function convitesHTML(P, C){
  const eu = P.voce.membro;
  const h2 = r => `<h2><span class="c">~/</span>convites <span class="r">${r} ${ajBt('cv')}</span></h2>`;
  if(!C) return `<section class="card">${h2(prev('o servidor do grupo precisa atualizar'))}
      <div class="tn-cv"><div><b>Duelo de Codeforces</b><span class="sub">1×1, 3 problemas na faixa do mais fraco dos dois.</span><button type="button" class="btn" disabled>desafiar alguém</button></div>${PACTO}</div></section>`;
  const R = C.regras, du = C.duelo, H = C.historico, vivo = duVivo(du), meuCf = membroDe(P, eu).cf;
  const como = ajTx('cv', `<p><b>Duelo:</b> desafie alguém do grupo que ligou o Codeforces. O convite vale ${Math.round(R.convite / 60)} minutos; depois some e é preciso mandar outro.</p>
    <p>Aceito, saem 3 problemas que nenhum dos dois resolveu, em volta da faixa do mais fraco (uma abaixo, a dele e uma acima), e o duelo começa ${R.conta} s depois. Dura ${R.minutos} minutos ou até alguém resolver os 3.</p>
    <p>Cada problema resolvido paga o mesmo que na tabela do dia, sem piso. Vence quem resolver mais; no empate, quem chegou antes.</p>`);
  // cada convite diz o tipo na frente (o pacto entra com a mesma linha na fase 3)
  const linha = (id, txt, bts, tipo = 'duelo · CF') => `<div class="tn-cvl">${ico(P, id, 26, 0, {semNome:true, nolink:true})}<span><span class="tn-cvtp">${tipo}</span>${txt}</span><span class="tn-cvb">${bts}</span></div>`;
  const sobre = `3 problemas, ${R.minutos} min`;
  const outro = du ? (du.de === eu ? du.para : du.de) : 0;
  const ativo = vivo ? linha(outro, `Duelo com <b>${esc(nomeDe(P, outro))}</b> · ${du.estado === 'aceito' ? 'sorteando os problemas' : agoraS() < du.ini ? 'vai começar' : 'em andamento'}`, '<button type="button" class="btn v" data-ttsub="duelo">abrir o duelo</button>') : '';
  const rec = C.convites.filter(c => c.para === eu).map(c => linha(c.de, `<b>${esc(nomeDe(P, c.de))}</b> te desafiou · ${sobre} · some em ${relo(c.vence)}`,
    `<button type="button" class="btn v" data-tndu="aceitar" data-id="${c.id}">aceitar</button><button type="button" class="btn" data-tndu="recusar" data-id="${c.id}">recusar</button>`)).join('');
  const env = C.convites.filter(c => c.de === eu).map(c => linha(c.para, `Você desafiou <b>${esc(nomeDe(P, c.para))}</b> · esperando · some em ${relo(c.vence)}`,
    `<button type="button" class="btn" data-ttsub="duelo">abrir</button><button type="button" class="btn" data-tndu="cancelar" data-id="${c.id}">cancelar</button>`)).join('');
  const pode = meuCf && !vivo && !C.convites.some(c => c.de === eu);
  const outros = P.membros.filter(m => m.id !== eu);
  const lista = TT.desafiar && pode ? `<div class="tn-cvop">${outros.map(m => `<button type="button" class="btn" data-tndu="convidar" data-para="${m.id}"${m.cf ? '' : ' disabled title="ainda não ligou o Codeforces"'}>${esc(m.nome)}</button>`).join('')}</div>` : '';
  const duelo = `<div><b>Duelo de Codeforces</b><span class="sub">1×1, 3 problemas na faixa do mais fraco, ${R.minutos} minutos.</span>
    ${meuCf ? `<button type="button" class="btn" data-tndesafiar${pode ? '' : ' disabled'}>${TT.desafiar && pode ? 'fechar' : 'desafiar alguém'}</button>${lista}` : '<span class="sub">Ligue o Codeforces em Configurações (o seu handle) para duelar.</span>'}</div>`;
  return `<section class="card">${h2(H.duelos ? `<button type="button" class="tt-lk" data-ttsub="duelo">${vde({v:H.vitorias, d:H.derrotas || 0, e:H.empates})} · ver histórico</button>` : '')}${como}
    ${ativo || rec || env ? `<div class="tn-cvs">${ativo}${rec}${env}</div>` : '<p class="sub" style="margin:0 0 10px">Nenhum convite aberto.</p>'}
    <div class="tn-cv">${duelo}${PACTO}</div></section>`;
}

/* ---------- duelo: você × o outro, o relógio e quem resolveu cada um dos 3 problemas ----------
   Duas versões em teste, trocadas no próprio card (gb-tt-dv): "espelhada" (os dois lados em volta dos problemas, como uma
   chave de luta) e "enxuta" (o placar grande e a lista dos problemas embaixo). Cada fase tem a sua tela: esperando o aceite,
   sorteio, contagem, em andamento, fim. */
TT.dv = (() => { try { return localStorage.getItem('gb-tt-dv') || 'espelhada'; } catch(e){ return 'espelhada'; } })();
const meuConvite = C => C ? C.convites.find(c => c.de === C.eu) : null;
const faseDu = du => du.estado === 'convite' ? 'espera' : du.estado === 'aceito' ? 'sorteio' : du.estado === 'andamento' ? (agoraS() < du.ini ? 'conta' : 'vivo') : du.estado;
const pips = n => `<span class="tn-pips">${[0, 1, 2].map(i => `<i${i < n ? ' class="ok"' : ''}></i>`).join('')}</span>`;
/* a aba duelo: o duelo em curso (ou o convite que você mandou) no alto e o histórico embaixo; um duelo antigo aberto pelo
   histórico usa a mesma tela do fim */
TT.dvDet = null;
function subDuelo(P, C){
  if(!C) return `<section class="card"><h2><span class="c">~/</span>duelo</h2><p class="sub" style="margin:0">O servidor do grupo precisa atualizar para ter o duelo.</p></section>`;
  if(TT.dvDet) return cardDuelo(P, C, TT.dvDet, true);
  const du = C.duelo || meuConvite(C);
  return (du ? cardDuelo(P, C, du) : `<section class="card"><h2><span class="c">~/</span>duelo</h2><p class="sub" style="margin:0">Nenhum duelo agora. <button type="button" class="tt-lk" data-ttsub="desafios">desafiar alguém</button></p></section>`) + historicoHTML(P, C);
}

const diaDe = ts => new Date(ts * 1000).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
function historicoHTML(P, C){
  const H = C.historico, eu = P.voce.membro;
  if(!H.duelos) return `<section class="card"><h2><span class="c">~/</span>histórico</h2><p class="sub" style="margin:0">Os seus duelos terminados aparecem aqui.</p></section>`;
  const contra = Object.entries(H.contra || {}).sort((a, b) => (b[1].v + b[1].d + b[1].e) - (a[1].v + a[1].d + a[1].e))
    .map(([id, x]) => `<span class="tn-dhc">${ico(P, +id, 22, 0, {semNome:true, nolink:true})}<span>vs <b>${esc(nomeDe(P, id))}</b></span><b class="mono">${vde(x)}</b></span>`).join('');
  const linhas = (H.lista || []).map(d => { const o = d.de === eu ? d.para : d.de, J = id => d.jogadores.find(j => j.membro === id) || {n:0, pts:0};
    const k = d.venceu == null ? 'e' : d.venceu === eu ? 'v' : 'd';
    return `<button type="button" class="tn-dhl" data-tndver="${d.id}"><span class="tn-dhr ${k}">${k.toUpperCase()}</span>${ico(P, o, 26, 0, {semNome:true, nolink:true})}<span>vs <b>${esc(nomeDe(P, o))}</b></span>
      <b class="tn-dhp">${J(eu).n} × ${J(o).n}</b><span class="tn-dhd">${diaDe(d.fim)}</span>${TC(J(eu).pts)}</button>`; }).join('');
  return `<section class="card"><h2><span class="c">~/</span>histórico <span class="r">${vde({v:H.vitorias, d:H.derrotas || 0, e:H.empates})} em ${H.duelos} ${H.duelos === 1 ? 'duelo' : 'duelos'}</span></h2>
    <div class="tn-dw"><div class="tn-dhcs">${contra}</div><div class="tn-dhls">${linhas}</div></div></section>`;
}
function cardDuelo(P, C, du, antigo){
  const eu = P.voce.membro;
  const fase = faseDu(du), outro = du.de === eu ? du.para : du.de;
  const J = id => (du.jogadores || []).find(j => j.membro === id) || {n:0, t:0, pts:0, feitos:{}};
  const vals = (P.torre.cf_dia || {}).valores || [];
  const res = du.venceu == null ? 'empate' : du.venceu === eu ? 'você venceu' : esc(nomeDe(P, du.venceu)) + ' venceu';
  const relogio = fase === 'espera' ? ['o convite some em', relo(du.vence)] : fase === 'sorteio' ? ['sorteando', '…']
    : fase === 'conta' ? ['duração', `${C.regras.minutos}:00`] : fase === 'vivo' ? ['restam', relo(du.ate)] : fase === 'falhou' ? ['não saiu', '—'] : ['acabou', res];
  const troca = `<span class="tn-dvsw" role="group" aria-label="versão da tela">${['espelhada', 'enxuta'].map(v => `<button type="button" data-tndv="${v}"${TT.dv === v ? ' aria-pressed="true"' : ''}>${v}</button>`).join('')}</span>`;
  const link = p => `<a href="https://codeforces.com/problemset/problem/${p.contest}/${encodeURIComponent(p.index)}" target="_blank" rel="noopener" class="tn-dvpn">${esc(p.nome)}</a>`;
  const chip = p => { const [n, c] = corCF(p.rating); return `<span class="tn-fx" style="--c:${c}" title="${n}">${p.rating}</span>`; };
  const tc = p => `<span class="tn-dvtc">+${vals[p.faixa] != null ? vals[p.faixa] : '?'} TC</span>`;
  const tempo = (id, p) => { const t = J(id).feitos[p.id]; return t != null ? `<span class="tn-dvt ok">✓ ${mmss(t)}</span>` : '<span class="tn-dvt">—</span>'; };
  // antes dos problemas existirem, o meio da tela diz o que está acontecendo
  const espera = fase === 'espera' ? `<div class="tn-dvx"><p>O convite foi para <b>${esc(nomeDe(P, outro))}</b>. Quando aceitar, saem os 3 problemas e o duelo começa ${C.regras.conta} s depois.</p><button type="button" class="btn" data-tndu="cancelar" data-id="${du.id}">cancelar o convite</button></div>`
    : fase === 'sorteio' ? '<div class="tn-dvx"><p>Sorteando 3 problemas que nenhum dos dois resolveu…</p></div>'
    : fase === 'conta' ? `<div class="tn-dvx"><b class="tn-dvbig">${relo(du.ini)}</b><p>Os problemas aparecem quando a contagem acabar: ninguém sai na frente.</p></div>`
    : fase === 'falhou' ? '<div class="tn-dvx"><p>A API do Codeforces não respondeu e o sorteio desistiu. Ninguém perde nada: desafie de novo.</p></div>' : '';
  const fim = fase === 'fim' ? `<div class="tn-dvfim${du.venceu === eu ? ' ok' : du.venceu == null ? '' : ' perdeu'}"><b>${res}</b><span>Você ganhou ${TC(J(eu).pts)} pelos problemas que resolveu${antigo ? '' : ' (já na carteira)'}.</span></div>` : '';
  const pe = antigo ? `<p class="tn-dvpe"><button type="button" class="tt-lk" data-tndvvolta>voltar ao histórico</button></p>`
    : fase === 'vivo' ? '<p class="tn-dvpe">Resolva no Codeforces: o servidor do grupo confere os envios dos dois a cada 15 s.</p>'
    : fase === 'fim' || fase === 'falhou' ? '<p class="tn-dvpe"><button type="button" class="tt-lk" data-ttsub="desafios">voltar aos desafios</button></p>' : '';
  const comProbs = du.problemas && (fase === 'vivo' || fase === 'fim');
  let corpo;
  if(TT.dv === 'enxuta'){
    const placar = `<div class="tn-dex"><span class="tn-dexn e">${esc(nomeDe(P, eu))}</span><b class="tn-dexp${du.venceu === eu ? ' ok' : ''}">${J(eu).n}</b><span class="tn-dexx">×</span><b class="tn-dexp${du.venceu === outro ? ' ok' : ''}">${J(outro).n}</b><span class="tn-dexn">${esc(nomeDe(P, outro))}</span></div>
      <div class="tn-dvr">${fase === 'fim' ? '' : `<small>${relogio[0]}</small><b>${relogio[1]}</b>`}</div>`;
    const lista = comProbs ? `<div class="tn-dels">${du.problemas.map(p => `<div class="tn-del">
        <div class="tn-delt">${chip(p)}${link(p)}${tc(p)}</div>
        <div class="tn-delq"><span>você ${tempo(eu, p)}</span><small>${p.contest}${esc(p.index)}</small><span>${esc(nomeDe(P, outro))} ${tempo(outro, p)}</span></div></div>`).join('')}</div>` : espera;
    corpo = `<div class="tn-dw">${placar}${fim}${lista}${pe}</div>`;
  } else {
    const lado = (id, dir) => `<div class="tn-dvj ${dir}${du.venceu === id ? ' venceu' : ''}${fase === 'espera' && id !== eu ? ' longe' : ''}">${ico(P, id, 58, 0, {nolink:true})}${pips(J(id).n)}<b class="tn-dvn">${J(id).n}<small>/3</small></b></div>`;
    const meio = `<div class="tn-dvr">${fase === 'fim' ? '<b>×</b>' : `<small>${relogio[0]}</small><b>${relogio[1]}</b>`}</div>`;
    const probs = comProbs ? `<div class="tn-dvps">${du.problemas.map(p => `<div class="tn-dvp">${tempo(eu, p)}
        <div class="tn-dvm">${chip(p)}${link(p)}<small>${p.contest}${esc(p.index)} · ${tc(p)}</small></div>${tempo(outro, p)}</div>`).join('')}</div>` : espera;
    corpo = `<div class="tn-dw"><div class="tn-dvc">${lado(eu, 'e')}${meio}${lado(outro, 'd')}</div>${fim}${probs}${pe}</div>`;
  }
  return `<section class="card"><h2><span class="c">~/</span>duelo · Codeforces${antigo ? ` · ${diaDe(du.fim)}` : ''} <span class="r">${troca}</span></h2>${corpo}</section>`;
}
function subDesafios(P){
  const S = P.torre.semanal, eu = P.voce.membro;
  const tabela = tabelaCF(P);
  const conv = convitesHTML(P, TT.C);
  const marcas = S.semanas.filter(s => linhaDe(s, eu)).map(s => { const x = linhaDe(s, eu);
    return `<div class="tn-mk${x.bateu ? ' ok' : ''}${s.fechada ? '' : ' agora'}"><small>s${s.semana.split('-W')[1]}</small><b>${md(s.modalidade)[0].slice(0, 3)}</b><span>${x.marca == null ? '—' : x.bateu ? '✓' : `${x.mod || 0}/${x.marca}`}</span></div>`; }).join('');
  return `<div class="tn-ds"><div class="tt-stack">${tabela}${conv}</div><div class="tt-stack">${chefaoHTML(P)}
    <section class="card"><h2><span class="c">~/</span>suas marcas <span class="r">uma por semana, na modalidade · ${tcV(P).marca} TC cada</span></h2><div class="tn-mks">${marcas}</div></section></div></div>`;
}

/* ---------- temporada: rodadas ganhas e medalhas (uma semana ruim não condena ninguém) ---------- */
function subTemporada(P){
  const S = P.torre.semanal, eu = P.voce.membro;
  const ids = P.membros.map(m => m.id).sort((a, b) => { const x = temp(P, a), y = temp(P, b); return y.rodadas - x.rodadas || y.medalhas[1] - x.medalhas[1] || y.medalhas[2] - x.medalhas[2] || y.marcas - x.marcas; });
  const md = (k, v) => `<span class="tt-md m${k}">${v}</span>`;
  const tab = ids.map((id, i) => { const t = temp(P, id);
    return `<tr${id === eu ? ' class="eu"' : ''}><td class="p">${i + 1}º</td><td><span class="tn-q">${ico(P, id, 28, 0, {semNome:true})}${nm(P, id)}</span></td><td class="n"><b>${t.rodadas}</b></td><td class="n"><span class="tn-mm">${t.medalhas.map((v, k) => md(k + 1, v)).join('')}</span></td><td class="n">${t.superacao}</td><td class="n">${t.marcas}</td><td class="n">${'★'.repeat(estrelas(t)) || '—'}</td></tr>`; }).join('');
  const grade = `<div class="tbl-wrap"><table class="tn-gr"><thead><tr><th></th>${S.semanas.map(s => `<th>s${s.semana.split('-W')[1]}<small>${md(s.modalidade)[0].slice(0, 3)}${s.fechada ? '' : ' · agora'}</small></th>`).join('')}</tr></thead>
    <tbody>${ids.map(id => `<tr${id === eu ? ' class="eu"' : ''}><td>${esc(nomeDe(P, id))}</td>${S.semanas.map(s => { const k = s.geral.findIndex(x => x.membro === id) + 1; return `<td>${k ? `<span class="tt-md${k <= 3 ? ' m' + k : ''}">${k}º</span>` : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<div class="tt-stack"><section class="card"><h2><span class="c">~/</span>temporada ${temporadaDe(P)} <span class="r">${ajBt('temp')}</span></h2>
      ${ajTx('temp', '<p>Cada semana é uma rodada: o 1º do Geral ganha a rodada. A temporada soma rodadas e medalhas, não pontos.</p><p>As estrelas da licença vêm das rodadas ganhas, de graça: ★ na primeira, ★★ na quarta.</p>')}
      <div class="tbl-wrap"><table class="tn-tp"><thead><tr><th></th><th>hunter</th><th>rodadas</th><th>medalhas</th><th title="semanas em 1º na superação">superação</th><th>marcas</th><th>licença</th></tr></thead><tbody>${tab}</tbody></table></div></section>
    <section class="card"><h2><span class="c">~/</span>semana a semana <span class="r">posição no Geral e a modalidade de cada semana</span></h2>${grade}</section></div>`;
}

/* ---------- hunters: a licença de cada um e o detalhe por hábito (os antigos placares por hábito) ---------- */
function subHunters(P){
  const id = P.membros.some(m => m.id === TT.jog) ? TT.jog : P.voce.membro, m = membroDe(P, id), s = semAtual(P), x = linhaDe(s, id);
  const menu = P.membros.map(mm => { const t = temp(P, mm.id);
    return `<button type="button" class="tt-jm" data-ttjog="${mm.id}" aria-pressed="${mm.id === id}">${ico(P, mm.id, 36, 0, {semNome:true, nolink:true})}<span class="n">${esc(mm.nome)}${mm.id === P.voce.membro ? ' (você)' : ''}<small>${t.rodadas} ${t.rodadas === 1 ? 'rodada' : 'rodadas'} · ${'★'.repeat(estrelas(t)) || 'sem estrela'}</small></span></button>`; }).join('');
  const habs = P.torre.placares.filter(p => p.habito).map(p => [p, p.linhas.find(l => l.membro === id)]).filter(z => z[1]);
  const lic = ARTE() ? `<div class="tt-duas"><div><span class="rot">frente</span>${licPeca(P, id, 'frente', 270)}</div><div><span class="rot">verso</span>${licPeca(P, id, 'verso', 270)}</div></div>`
    : `<div class="tt-duas"><div><span class="rot">frente</span><div class="tt-lic grande">${frente(P, id, true)}</div></div><div><span class="rot">verso</span><div class="tt-lic grande">${verso(P, id)}</div></div></div>`;
  // ao lado da licença: os 4 blocos e as outras modalidades da semana, a marca e os números por hábito, tudo numa tela
  const lin = (k, v) => `<div class="tn-ml${k === s.modalidade ? ' on' : ''}"><span>${esc(md(k)[0])}${k === s.modalidade ? (dobra(k) ? ' ×2' : ' ★') : ''}</span><i style="--v:${v || 0}%"></i><b>${v == null ? '—' : v}</b></div>`;
  const lado = x ? `<div class="tn-lado"><span class="tn-k">semana ${s.semana.split('-W')[1]} · ${x.total} pontos</span>
      ${BLOCOS.map(k => lin(k, x.blocos[k])).join('')}
      ${Object.keys(x.mods || {}).length ? `<span class="tn-k t">outras modalidades</span>${Object.entries(x.mods).map(([k, v]) => lin(k, v)).join('')}` : ''}
      <div class="tn-ml marca"><span>marca da semana</span><b>${x.marca == null ? '—' : `${x.mod || 0} / ${x.marca}${x.bateu ? ' ✓' : ''}`}</b></div>
      ${habs.length ? `<span class="tn-k t">por hábito</span>${habs.map(([p, l]) => `<div class="tn-ml hab" title="${esc(l.det)}"><span>${esc(p.nome)}</span><b>${esc(l.txt)}</b></div>`).join('')}` : ''}</div>`
    : '<div class="tn-lado"><p class="sub">Ainda sem dias nesta semana.</p></div>';
  return `<div class="tt-jg"><nav class="tt-jmenu" aria-label="hunters">${menu}</nav><div class="tt-stack">
    <section class="card"><h2><span class="c">~/</span>licença de ${esc(m.nome)} <span class="r">personalize na <button type="button" class="tt-lk" data-ttsub="loja">loja</button></span></h2>
      <div class="tn-hl">${lic}${lado}</div></section>
  </div></div>`;
}

/* a carteira de Trick Coin (#43): o saldo e o extrato; ganha-se com a marca da semana, o chefão e a tabela do dia */
function carteiraHTML(P){
  const T = P.torre.trick;
  if(!T) return '';
  const ext = T.extrato.map(e => `<div class="tn-ex"><span>${esc(e.motivo)} <small>${esc(e.chave.split(':').slice(1).join(':'))}</small></span><b class="ok">+${e.valor}</b></div>`).join('');
  return `<section class="card" style="margin-bottom:16px"><h2><span class="c">~/</span>carteira <span class="r">os preços da loja saem depois</span></h2>
    <div class="tn-cart"><div class="tn-saldo">${T.saldo}<small>Trick Coin</small></div><div class="tn-exs">${ext || '<p class="sub" style="margin:0">Nada ainda: entra quando a semana, o dia ou o mês fecham.</p>'}</div></div></section>`;
}

/* a loja abre quando o grupo derrota o 1º chefão; até lá, só o aviso (as compras chegam depois da 1.0) */
function lojaFechada(P){
  const C = P.torre.chefao, vivo = C ? Math.max(0, C.vida - C.dano) : null;
  return `<section class="card tn-fechada"><div class="tn-cad" aria-hidden="true">🔒</div><h3>A loja abre quando o grupo derrotar o primeiro chefão</h3>
    <p>Juntem forças contra o chefão do mês: quando ele cair, a Loja da Associação abre para todos, e a Trick Coin que vocês estão juntando passa a ter onde ser gasta.</p>
    ${C ? `<div class="tn-hpb"><i style="width:${vivo / C.vida * 100}%"></i></div><p class="sub">faltam ${andaresTxt(vivo)} de ${andaresTxt(C.vida)} de vida · <button type="button" class="tt-lk" data-ttsub="desafios">ver o chefão</button></p>` : ''}</section>`;
}

function torreNova(g){
  const P = placarDe(g), r = G.res[g.chave] || {};
  if(!P) return `<div class="card"><p style="margin:0;font-size:14px">${r.erro ? esc(r.erro) : 'Buscando o placar no servidor do grupo...'}</p></div>`;
  if(!P.torre || !temSemanal(P)) return `<div class="card"><p style="margin:0;font-size:14px">O servidor do grupo ainda não calcula o placar desta versão: quem hospeda o grupo precisa atualizar o jogo.</p></div>`;
  const aviso = r.offline ? `<p class="gp-aviso">O servidor do grupo está fora do ar. Mostrando o placar de ${esc(quando(P.recebido))}.</p>` : r.sem_acesso ? `<p class="gp-aviso">${esc(r.erro)}</p>` : '';
  const sub = NOVAS.includes(TT.sub) ? TT.sub : 'semana';
  TT.habNomes = P.torre.semanal.habitos || {};
  TT.C = caixaDe(g);
  const corpo = sub === 'duelo' ? subDuelo(P, TT.C) : sub === 'desafios' ? subDesafios(P) : sub === 'temporada' ? subTemporada(P) : sub === 'hunters' ? subHunters(P) : sub === 'loja' ? carteiraHTML(P) + ((P.torre.loja || {}).aberta ? subLoja(P) : lojaFechada(P)) : subSemana(P);
  return `${aviso}<div class="tt">${corpo}</div>
    <p class="sub" style="margin:4px 0 0">O seu XP e as suas tarefas não aparecem aqui: o grupo vê só os blocos, de 0 a 100. Última sincronização: ${G.ultima ? esc(quando(G.ultima / 1000)) : 'ainda não'} <button type="button" class="btn" data-gpsinc style="margin-left:6px">sincronizar agora</button></p>`;
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
  const admBt = adm ? `<button type="button" class="adm" data-gpaba="admin"${G.aba === 'admin' ? ' aria-current="page"' : ''}>administrar</button>` : '';
  if(!NOVAS.includes(TT.sub)) TT.sub = 'semana';
  const C = caixaDe(g), nConv = C ? C.convites.filter(c => c.para === C.eu).length : 0;
  if(TT.sub === 'duelo' && !C) TT.sub = 'desafios';
  const nav = `<nav class="tt-sub" aria-label="Torre Trick">${ab('semana', 'semana')}${ab('desafios', nConv ? `desafios <b class="tn-bdg">${nConv}</b>` : 'desafios')}${C ? ab('duelo', duVivo(C.duelo) ? '<i class="dot"></i>duelo' : 'duelo') : ''}${ab('temporada', 'temporada')}${ab('hunters', 'hunters')}${ab('loja', 'loja')}${admBt}</nav>`;
  document.getElementById('tt-root').innerHTML = cab + outro + nav + (G.aba === 'admin' ? adminHTML(g) : torreNova(g));
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
    ${(h.grupos || []).length ? `<p class="sub" style="margin:10px 0 0">Grupos neste servidor: ${h.grupos.map(x => `${esc(x.nome)} (${x.membros})`).join(' · ')}</p>` : ''}
    ${h.dono ? mudaHTML(h) : ''}</div>`;
}
/* levar o servidor do grupo para outro computador (#91) */
function mudaHTML(h){
  if(h.mudou) return `<div class="gp-muda"><b>Este servidor está avisando os membros: o grupo agora fica em ${esc(h.mudou)}.</b>
    <p class="sub" style="margin:6px 0 10px">O jogo de cada um passa para lá na próxima sincronização. Deixe este computador ligado até todos aparecerem no placar do servidor novo; depois pode desligar.</p>
    <button type="button" class="btn" data-gpmuda="">cancelar o aviso</button></div>`;
  return `<div class="gp-muda"><b>Mudar o grupo de computador</b>
    <ol class="sub"><li>Neste computador: <i>baixar cópia do servidor</i>.</li><li>No computador novo: ligue o Funnel aqui em cima e restaure a cópia em <i>restaurar uma cópia</i>.</li><li>De volta a este: cole o endereço do computador novo e avise os membros. O jogo de cada um troca de endereço sozinho, e ninguém perde nada.</li></ol>
    <div class="gp-f"><label>Restaurar uma cópia (.db)<input type="file" id="gp-rest-arq" accept=".db,application/vnd.sqlite3"></label>
      <label>Endereço do computador novo<input id="gp-muda-end" value="${esc(G.mudaEnd)}" placeholder="https://novo.tailXXXX.ts.net" class="mono"></label></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn" data-gprestaura>restaurar a cópia aqui</button><button type="button" class="btn" data-gpmuda="1">avisar os membros</button></div></div>`;
}
const leBase64 = f => new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => erro(new Error('não deu para ler o arquivo')); r.readAsDataURL(f); });
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
    ${l.length ? '<p class="sub" style="margin:6px 0 0">O servidor do grupo mudou de computador e o seu jogo não acompanhou? Cole aqui o link novo do grupo, sem o código.</p>' : ''}
    <p class="sub" style="margin:8px 0 0">Vão para o grupo só o seu nickname, a foto de perfil, o handle do Codeforces (se ligado, para a tabela do dia) e, por dia, o XP (para as contas; ninguém vê o número), o Codeforces e, dos hábitos do grupo, só se você cumpriu no dia o hábito pessoal que ligou a cada um. Suas tarefas, os nomes dos seus hábitos e os que você não ligou ficam aqui.</p>
    ${hostHTML()}</div>`;
}
RENDER.cfg = S => { RENDER0.cfg(S); const a = document.getElementById('cfg-srv') || document.getElementById('cfg'); if(a) a.insertAdjacentHTML('afterend', cardGrupo()); else document.getElementById('cfg-root').insertAdjacentHTML('afterbegin', cardGrupo()); };

async function admin(acao, corpo){ return post('/api/grupo/admin', Object.assign({chave: grupoSel().chave, acao}, corpo || {})); }
async function abreAdmin(){ G.adm = null; G.admErr = ''; render(); try { G.adm = await admin('ver'); } catch(e){ G.admErr = e.message; } render(); }
async function hostEstado(){ try { G.hostEstado = await post('/api/grupo/host', {acao:'estado'}); } catch(e){ G.hostEstado = {}; toast('Não deu: ' + esc(e.message)); } render(); }
const guarda = () => { const n = document.getElementById('gp-h-nome'), e = document.getElementById('gp-h-end'), m = document.getElementById('gp-muda-end');
  if(n) G.nome = n.value; if(e) G.endereco = e.value; if(m) G.mudaEnd = m.value; };

const vaiPara = mudar => { Object.assign(TT, mudar); G.aba = 'placar'; render(); const r = document.getElementById('tt-root'); if(r && r.getBoundingClientRect().top < 0) r.scrollIntoView({behavior:'smooth', block:'start'}); };
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  let b;
  if((b = q('[data-ttsub]'))){ TT.dvDet = null; vaiPara({sub: b.dataset.ttsub}); return; }
  if((b = q('[data-ttjog]'))){ vaiPara({sub: 'hunters', jog: +b.dataset.ttjog}); return; }
  if((b = q('[data-tndver]'))){ try { TT.dvDet = (await post('/api/grupo/duelo', {chave: grupoSel().chave, acao: 'ver', id: +b.dataset.tndver})).duelo; vaiPara({sub: 'duelo'}); } catch(err){ toast('Não deu: ' + esc(err.message)); } return; }
  if(q('[data-tndvvolta]')){ TT.dvDet = null; render(); return; }
  if((b = q('[data-tndv]'))){ TT.dv = b.dataset.tndv; try { localStorage.setItem('gb-tt-dv', TT.dv); } catch(err){} render(); return; }
  if(q('[data-tndesafiar]')){ TT.desafiar = !TT.desafiar; render(); return; }
  if((b = q('[data-tndu]'))){ const g = grupoSel(), acao = b.dataset.tndu; b.disabled = true;
    try { const r = await post('/api/grupo/duelo', {chave: g.chave, acao, id: +b.dataset.id || undefined, para: +b.dataset.para || undefined});
      TT.desafiar = false; guardaCaixa(g, r);
      if(acao === 'aceitar' || acao === 'convidar') vaiPara({sub: 'duelo'}); else render();
      if(acao === 'convidar') toast(`Convite mandado <small>some em ${Math.round(r.regras.convite / 60)} minutos se ninguém aceitar</small>`);
      lacoCaixa(); }
    catch(err){ toast('Não deu: ' + esc(err.message)); lacoCaixa(); }
    return; }
  if((b = q('[data-tnaj]'))){ TT.aj[b.dataset.tnaj] = !TT.aj[b.dataset.tnaj]; render(); return; }
  if((b = q('[data-tnpod]'))){ TT.pod = b.dataset.tnpod; render(); return; }
  if((b = q('[data-tnmod]'))){ try { await post('/api/grupo/modalidade', {chave: grupoSel().chave, mod: b.dataset.tnmod}); await sincroniza(); toast(`${md(b.dataset.tnmod)[0]} <small>vale se você fechar a semana em 1º</small>`); } catch(err){ toast('Não deu: ' + esc(err.message)); } return; }
  if(q('[data-ttrel]')){ try { const j = await admin('relatorio'), a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(j, null, 1)], {type:'application/json'})); a.download = `relatorio-${j.grupo.id}-${(placarDe(grupoSel()) || {}).hoje || 'hoje'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch(err){ toast('Não deu: ' + esc(err.message)); } return; }
  if((b = q('[data-ttesp]'))){ TT.esp = b.dataset.ttesp; try { localStorage.setItem('gb-tt-esp', TT.esp); } catch(err){} render(); return; }
  if((b = q('[data-ttvirar]'))){ b.classList.toggle('virada'); return; }
  if((b = q('[data-ttprova]'))){ const it = LOJA_TT.find(x => x[0] === b.dataset.ttprova);
    if(it && provando(it)) Object.keys(it[7]).forEach(k => delete TTPV[k]); else if(it) Object.assign(TTPV, it[7]); render(); return; }
  if(q('[data-ttlimpa]')){ Object.keys(TTPV).forEach(k => delete TTPV[k]); render(); return; }
  if((b = q('[data-ttlf]'))){ const [k, v] = b.dataset.ttlf.split(':'); TT[k] = v; render(); return; }
  if((b = q('[data-ttnova]'))){ TT.nova = !!b.dataset.ttnova; render(); return; }
  if((b = q('[data-ttouro]'))){ TT.ouro = b.dataset.ttouro; render(); return; }
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
      await carrega(); render(); toast(r.mudou ? `Endereço de ${esc(r.nome)} atualizado <small>o seu jogo manda a temporada para o servidor novo</small>` : `Você entrou em ${esc(r.nome)}${cur === 'tt' ? '' : ` <small>o placar fica na aba ${esc(ABA.tt.n)}</small>`}`); sincroniza(); return; }
    if((b = q('[data-gpsai]'))){ if(!confirm(`Sair de ${b.dataset.n}? Para voltar, só com um convite novo.`)) return;
      await post('/api/grupo/sair', {chave: b.dataset.gpsai}); await carrega(); render(); toast('Você saiu do grupo'); return; }
    if(q('[data-gphost]')){ G.hostAberto = true; render(); hostEstado(); return; }
    if(q('[data-gphostfecha]')){ guarda(); G.hostAberto = false; render(); return; }
    if((b = q('[data-gpfunnel]'))){ guarda(); b.disabled = true; b.textContent = 'ligando...'; G.funnel = await post('/api/grupo/host', {acao:'funnel'}); await hostEstado(); return; }
    if((b = q('[data-gprestaura]'))){ guarda(); const f = (document.getElementById('gp-rest-arq').files || [])[0];
      if(!f){ toast('Escolha o arquivo .db baixado no computador antigo'); return; }
      if(!confirm('Trocar o banco deste servidor do grupo pela cópia? Os grupos daqui passam a ser os da cópia (o banco atual fica guardado em copias/).')) return;
      b.disabled = true; b.textContent = 'restaurando...';
      const r = await post('/api/grupo/host', {acao:'restaurar', banco: await leBase64(f), endereco: G.endereco || (G.funnel && G.funnel.endereco) || (G.hostEstado || {}).endereco || ''});
      await carrega(); await hostEstado(); toast(`Cópia restaurada <small>${r.grupos.length ? esc(r.grupos.map(x => x.nome).join(', ')) : 'sem grupos'}. Agora avise os membros no computador antigo</small>`); sincroniza(); return; }
    if((b = q('[data-gpmuda]'))){ guarda(); const end = b.dataset.gpmuda ? G.mudaEnd.trim() : '';
      if(b.dataset.gpmuda && !confirm(`Avisar os membros que o grupo agora fica em ${end}? O jogo de cada um passa para lá na próxima sincronização.`)) return;
      b.disabled = true; await post('/api/grupo/host', {acao:'mudar', endereco: end}); await hostEstado(); toast(end ? 'Membros avisados <small>deixe este computador ligado até todos passarem</small>' : 'Aviso cancelado'); return; }
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
document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target.matches('[data-gpconvite]')){ e.preventDefault(); e.target.closest('.gp-entra').querySelector('[data-gpentra]').click(); return; } if((e.key === 'Enter' || e.key === ' ') && e.target.matches('figure[data-ttjog],[data-ttprova]')){ e.preventDefault(); e.target.click(); } });

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
.gp-muda{margin-top:14px;padding-top:12px;border-top:1px solid var(--hair);font-size:14px} .gp-muda ol{margin:6px 0 10px;padding-left:18px} .gp-muda li{margin:2px 0}
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
/* loja da Associação (#136): itens aplicados na licença (tl-*), vitrine e provador */
.tt-lf,.tt-lv{position:relative}
.tt-lf .estr{color:#E8C35A;font-size:5cqw;letter-spacing:1cqw;line-height:1;margin-top:-1cqw}
.tt-lf .car{position:absolute;right:5cqw;bottom:6cqw;font:800 3.4cqw var(--f-hud);color:#C8102E;border:.7cqw solid #C8102E;padding:.6cqw 2cqw;border-radius:1cqw;transform:rotate(-12deg);opacity:.85;letter-spacing:.06em;z-index:2;mix-blend-mode:multiply}
.tt-lf .car.az{color:#1F5FA8;border-color:#1F5FA8}
.tt-lf .emb.rei{background:linear-gradient(160deg,#2A2140,#141418);box-shadow:0 0 0 .5cqw #E8C35A}
.tt-lic.tl-cor-verde{--lb:#BFE8CF;--lb2:#EEFBF2} .tt-lic.tl-cor-escarlate{--lb:#F5C2C8;--lb2:#FDF0F2;--lk:#2A0A10}
.tt-lic.tl-est-preto{--lcas:#2A2B31;--lbor:#4A4D58} .tt-lic.tl-est-ouro{--lcas:#E9D9A6;--lbor:#B8902F}
.tt-lic.tl-est-ouro :is(.tt-lf,.tt-lv){box-shadow:0 0 0 1px #E8C35A,0 10px 30px -14px #000}
.tt-lic .chain{position:absolute;inset:0;pointer-events:none;z-index:3;border-radius:4cqw;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='12'%3E%3Cellipse cx='7' cy='6' rx='6' ry='3.8' fill='none' stroke='%23454B55' stroke-width='3'/%3E%3Cellipse cx='7' cy='6' rx='6' ry='3.8' fill='none' stroke='%23C9CED6' stroke-width='1.5'/%3E%3Crect x='11.5' y='4.4' width='11' height='3.2' rx='1.6' fill='%23DDE1E7' stroke='%23454B55' stroke-width='1'/%3E%3C/svg%3E") repeat-x 0 0/4.2cqw 2.3cqw,url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='12'%3E%3Cellipse cx='7' cy='6' rx='6' ry='3.8' fill='none' stroke='%23454B55' stroke-width='3'/%3E%3Cellipse cx='7' cy='6' rx='6' ry='3.8' fill='none' stroke='%23C9CED6' stroke-width='1.5'/%3E%3Crect x='11.5' y='4.4' width='11' height='3.2' rx='1.6' fill='%23DDE1E7' stroke='%23454B55' stroke-width='1'/%3E%3C/svg%3E") repeat-x 0 100%/4.2cqw 2.3cqw,url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='22'%3E%3Cellipse cx='6' cy='7' rx='3.8' ry='6' fill='none' stroke='%23454B55' stroke-width='3'/%3E%3Cellipse cx='6' cy='7' rx='3.8' ry='6' fill='none' stroke='%23C9CED6' stroke-width='1.5'/%3E%3Crect x='4.4' y='11.5' width='3.2' height='11' rx='1.6' fill='%23DDE1E7' stroke='%23454B55' stroke-width='1'/%3E%3C/svg%3E") repeat-y 0 0/2.3cqw 4.2cqw,url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='22'%3E%3Cellipse cx='6' cy='7' rx='3.8' ry='6' fill='none' stroke='%23454B55' stroke-width='3'/%3E%3Cellipse cx='6' cy='7' rx='3.8' ry='6' fill='none' stroke='%23C9CED6' stroke-width='1.5'/%3E%3Crect x='4.4' y='11.5' width='3.2' height='11' rx='1.6' fill='%23DDE1E7' stroke='%23454B55' stroke-width='1'/%3E%3C/svg%3E") repeat-y 100% 0/2.3cqw 4.2cqw}
.tt-lic.tl-bd-corrente :is(.tt-lf,.tt-lv){padding:2.6cqw}
.tt-lic.tl-vs-roxo .tt-lv .in{background:linear-gradient(180deg,#F2EEFD,#C9B8F0)} .tt-lic.tl-vs-roxo .tt-lv .tarja{background:#2A1E44}
.tt-lic.tl-fx-holo .tt-lf .azul,.tt-lic.tl-fx-holo .tt-lv .in{background:linear-gradient(115deg,#BFE8FF,#E4D2FF,#FFD2E6,#FFF1BF,#D2F5C4,#BFE8FF);background-size:300% 100%}
.tt-lic.tl-fx-holo .tt-lf .topo{background:linear-gradient(160deg,#17171B,#2A2140,#17171B)}
@media (prefers-reduced-motion:no-preference){
  .tt-lic.tl-fx-brilho :is(.tt-lf,.tt-lv)::after{content:"";position:absolute;inset:0;border-radius:4cqw;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 45%,transparent 60%);background-size:250% 100%;animation:tlBrilho 2.8s ease-in-out infinite;pointer-events:none}
  .tt-lic.tl-fx-holo .tt-lf .azul,.tt-lic.tl-fx-holo .tt-lv .in{animation:tlHolo 6s linear infinite}
  .tl-pf-part .av.me{box-shadow:0 -6px 0 -3px var(--aura),8px -2px 0 -4px var(--volt),-8px 2px 0 -4px var(--aura);animation:tlPart 2.4s ease-in-out infinite}
  .tl-pf-ren .av.me{animation:tlRen 2.4s ease-out infinite}
  .tl-fd-cena{background-size:200% 200%;animation:tlFundo 8s linear infinite alternate}
  .tl-nm-brilho .tl-nm{background:linear-gradient(110deg,var(--ink) 35%,#fff 50%,var(--ink) 65%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:tlBrilho 2.8s linear infinite}
  .tl-nm-podio{animation:tlSobe 3s ease-in-out infinite}
  .tl-emb-aura .tl-emb{animation:tlEmb 2.4s ease-in-out infinite}
}
@keyframes tlBrilho{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes tlHolo{to{background-position:300% 0}}
@keyframes tlPart{50%{box-shadow:0 -12px 0 -3px transparent,10px -10px 0 -4px var(--volt),-10px -6px 0 -4px var(--aura)}}
@keyframes tlRen{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--aura) 70%,transparent)}70%,100%{box-shadow:0 0 0 18px transparent}}
@keyframes tlFundo{to{background-position:100% 100%}}
@keyframes tlSobe{0%,30%{transform:translateY(26px)}50%,100%{transform:none}}
@keyframes tlEmb{50%{color:var(--aura);text-shadow:0 0 8px var(--aura)}}
.tt .nen7{font:700 1.1em/1 "Noto Serif JP",serif;font-style:normal}
.tl-fil{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 14px}
.tl-fil span{font:600 11px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.06em;margin:0 2px 0 8px} .tl-fil span:first-child{margin-left:0}
.tl-fil button{border:1px solid var(--hair);background:var(--panel);border-radius:3px;padding:3px 10px;cursor:pointer;font:600 11.5px var(--f-mono);color:var(--soft)}
.tl-fil button[aria-pressed="true"]{color:var(--ink);border-color:var(--volt)}
.tl-prat{margin-bottom:18px} .tl-prat h3{margin:0 0 8px;font:700 15px var(--f-hud)} .tl-prat h3 small{font:500 11px var(--f-mono);color:var(--faint);margin-left:6px}
.tl-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.tl-it{border:1px solid var(--hair);border-radius:var(--tt-r) 3px 3px 3px;background:var(--panel2);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.tl-it.prov{cursor:pointer} .tl-it.prov:hover{border-color:color-mix(in srgb,var(--volt) 50%,var(--hair))} .tl-it.on{border-color:var(--volt);box-shadow:0 0 0 1px var(--volt)}
.tl-pv{min-height:130px;display:grid;place-items:center;padding:12px;background:var(--bg);border-bottom:1px solid var(--hair)}
.tl-pv .tt-lic{width:100%} .tl-pv .tt-lf{box-shadow:none} .tl-pv .tt-lic .tt-ico{--s:24cqw !important}
.tl-av{display:grid;place-items:center;width:100%;height:110px;border-radius:3px} .tl-av .av.me{--s:56px;position:relative}
.tl-fd-liso{background:color-mix(in srgb,var(--aura) 22%,var(--panel))} .tl-fd-cena{background-image:radial-gradient(circle at 20% 30%,color-mix(in srgb,var(--aura) 30%,transparent),transparent 40%),radial-gradient(circle at 80% 70%,color-mix(in srgb,var(--volt) 25%,transparent),transparent 45%)}
.tl-pod{display:grid;gap:4px;width:100%;font:600 12.5px var(--f-mono)} .tl-pod > div{display:grid;grid-template-columns:20px auto minmax(0,1fr) auto;gap:6px;align-items:center;padding:4px 8px;border-radius:3px;color:var(--soft)}
.tl-pod > div > span{grid-column:3} .tl-pod > div:not(.eu) > span{grid-column:2/4} .tl-pod em{font-style:normal;color:var(--faint)} .tl-pod b{font-weight:600}
.tl-naipes{display:flex;gap:10px;justify-content:center;padding:8px 0 0;font-size:20px;color:var(--ink)}
.tl-pv .lic2{width:100%!important}
.tl-pod .eu{background:color-mix(in srgb,var(--volt) 9%,transparent);color:var(--ink)} .tl-pod .tl-emb{font-style:normal;color:var(--amb)} .tl-nm-cor .tl-nm{color:var(--grn)}
.tl-tit{display:grid;gap:2px;text-align:center} .tl-tit b{font:700 15px var(--f-hud)} .tl-tit span{font:600 12px var(--f-mono);color:var(--amb)}
.tl-info{padding:10px 12px;display:grid;gap:6px;flex:1;align-content:start} .tl-info b{font-size:14px} .tl-info p{margin:0;font-size:12.5px;color:var(--soft)} .tl-info .tl-de{color:var(--faint)}
.tl-sl{display:flex;gap:5px;flex-wrap:wrap} .tl-sl span{font:600 10px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;border:1px solid var(--hair);border-radius:3px;padding:1px 6px;color:var(--soft)}
.tl-sl .tl-raro{color:var(--volt)} .tl-sl .tl-epico{color:var(--aura)} .tl-sl .tl-lenda{color:var(--amb)} .tl-sl .tl-hx{color:var(--red);text-transform:none}
.tl-lib{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font:600 11px var(--f-mono);color:var(--faint);margin-top:auto}
.tl-lib span:last-child{color:var(--soft);border:1px dashed var(--hair);border-radius:3px;padding:0 6px}
.tl-prov{font:600 11px var(--f-mono);color:var(--volt)}
/* sub-abas do redesenho de 21/10 */
.tt-heroi .txt:has(.tn-bl){flex:1} .tt-heroi .tn-bl{min-width:200px}
.tn-prev{display:inline-block;font:600 10px var(--f-mono);color:var(--amb);border:1px dashed color-mix(in srgb,var(--amb) 60%,transparent);border-radius:3px;padding:0 6px;vertical-align:1px;white-space:nowrap;text-transform:none;letter-spacing:0}
.tn-lic{width:min(300px,100%)} .tn-lic .lic2{width:100%!important} .tt-lcol:has(.tn-lic){width:min(300px,100%)}
@container (min-width:860px){.tt-lt.tn-lt{grid-template-columns:300px minmax(0,1fr)}}
.tn-aj{width:17px;height:17px;border-radius:50%;border:1px solid var(--volt);background:none;color:var(--volt);font:700 10.5px var(--f-mono);padding:0;margin-left:4px;cursor:pointer;vertical-align:1px}
.tn-aj[aria-expanded="true"]{background:var(--volt);color:var(--bg)}
.tn-ajuda{display:grid;gap:6px;border:1px solid var(--hair);border-radius:3px;padding:10px 12px;margin:6px 0} .tn-ajuda p{margin:0;font-size:12.5px;color:var(--soft);text-transform:none;letter-spacing:0}
.tn-x2{font:700 13px var(--f-mono);color:var(--aura);vertical-align:3px}
.tn-ajuda p b{color:var(--ink);margin-right:4px} .tn-ajuda p.on b{color:var(--aura)} .tn-ajuda p.t{font:700 10px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-top:4px}
.tn-eu{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}
.tn-eu div{border:1px solid var(--hair);border-radius:3px;padding:8px 10px;display:grid} .tn-eu b{font:700 20px var(--f-hud)} .tn-eu small{font:500 10.5px var(--f-mono);color:var(--soft)}
.tn-mod{display:grid;gap:16px;align-items:start}
@container (min-width:640px){.tn-mod{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.tn-mod > div:first-child{display:grid;gap:4px} .tn-mod > div:first-child > b{font:700 24px/1.1 var(--f-hud)} .tn-mod p{margin:0;font-size:14px}
.tn-k{font:700 10.5px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--volt)}
.tn-marca{display:grid;gap:6px;border:1px solid var(--hair);border-radius:3px;padding:10px 12px} .tn-marca p{margin:0;font-size:12px}
.tn-mt{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font:13px var(--f-mono)} .tn-mt b{color:var(--ink)} .ok{color:var(--grn)!important}
.tn-pb{height:8px;background:var(--track)} .tn-pb i{display:block;height:100%;background:var(--volt)}
.tn-ops .btn[aria-pressed="true"]{background:var(--volt);color:var(--bg);border-color:var(--volt)}
.tn-esc{display:flex;gap:8px 12px;align-items:center;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid var(--hair);font-size:13.5px} .tn-ops{display:flex;gap:6px;flex-wrap:wrap}
.tn-fechada{text-align:center;padding:40px 24px;display:grid;gap:12px;justify-items:center} .tn-fechada h3{margin:0;font:700 26px/1.2 var(--f-hud)}
.tn-fechada p{margin:0;max-width:560px;font-size:14px} .tn-fechada .tn-hpb{width:min(420px,100%)} .tn-cad{font-size:44px;line-height:1}
.tn-mods{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:5px;font:500 10.5px var(--f-mono);color:var(--faint)} .tn-mods b{color:var(--soft);font-weight:700}
.tn-mods .on{color:var(--aura)} .tn-mods .on b{color:var(--aura)}
.tn-bl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;min-width:180px}
.tn-bl .b{display:grid;gap:2px} .tn-bl i{display:block;height:6px;background:linear-gradient(90deg,var(--volt) var(--v),var(--track) var(--v))}
.tn-bl .x2 i{height:9px;background:linear-gradient(90deg,var(--aura) var(--v),var(--track) var(--v))} .tn-bl .nd i{background:none;border:1px dashed var(--hair);box-sizing:border-box}
.tn-bl small{font:600 9.5px var(--f-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.04em} .tn-bl .x2 small{color:var(--aura)}
.tn-prov{margin:12px 0 0;font-size:12px}
.tn-frase{margin-top:14px;padding-top:12px;border-top:1px solid var(--hair)} .tn-frase h2{font-size:12px;margin-bottom:6px}
.tn-ds{display:grid;gap:16px;align-items:start}
@container (min-width:900px){.tn-ds{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.tn-tc{color:var(--amb)} .tn-tc small{font-size:.75em}
.tn-cart{display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:start} .tn-saldo{font:700 36px/1 var(--f-hud);color:var(--amb);display:grid} .tn-saldo small{font:500 11px var(--f-mono);color:var(--soft)}
.tn-exs{display:grid;gap:4px} .tn-ex{display:flex;justify-content:space-between;gap:8px;font:13px var(--f-mono);border-bottom:1px dashed var(--hair);padding:3px 0} .tn-ex small{color:var(--faint)}
.tn-cf{display:grid;border:1px dashed var(--hair);border-radius:3px}
.tn-cfp{display:grid;grid-template-columns:18px 84px minmax(0,1fr) auto auto;column-gap:12px;align-items:center;padding:6px 12px} .tn-cfp + .tn-cfp{border-top:1px dashed var(--hair)}
.tn-cfp .l{font:700 14px var(--f-hud)} .tn-cfp .sub{font-size:12px} .tn-cfp .tn-cfv{font:600 12px var(--f-mono);color:var(--amb);text-align:right;min-width:64px} .tn-cfv small{display:block;color:var(--faint);font-weight:500}
.tn-cfp.feito{background:color-mix(in srgb,var(--grn) 7%,transparent)} .tn-cfn{font-size:13.5px;color:var(--ink);text-decoration:none;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .tn-cfn:hover{color:var(--volt)}
.tn-cfn small{font:500 11px var(--f-mono);color:var(--faint);margin-left:8px} .tn-qs{display:flex;gap:2px} .tn-qm.zero{opacity:.4}
.tn-fx{font:700 11px var(--f-mono);color:var(--c);border:1px solid var(--c);border-radius:3px;padding:2px 6px;text-align:center}
.tn-cvs{display:grid;gap:6px;margin-bottom:12px}
.tn-cvl{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;font-size:13.5px;border:1px solid var(--hair);border-radius:3px;padding:8px 10px}
.tn-cvb{display:flex;gap:6px;flex-wrap:wrap} .tn-cvop{display:flex;gap:6px;flex-wrap:wrap}
.tn-bdg{font:700 10px var(--f-mono);background:var(--volt);color:var(--bg);border-radius:8px;padding:1px 5px;margin-left:4px}
.tn-cvtp{display:inline-block;font:700 10px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;color:var(--volt);border:1px solid color-mix(in srgb,var(--volt) 50%,transparent);border-radius:3px;padding:1px 6px;margin-right:8px;vertical-align:1px}
.tn-dvsw{display:inline-flex;border:1px solid var(--hair);border-radius:3px;overflow:hidden;text-transform:none;letter-spacing:0}
.tn-dvsw button{font:500 11px var(--f-mono);padding:3px 8px;border:0;background:none;color:var(--faint);cursor:pointer} .tn-dvsw button[aria-pressed]{background:var(--hair);color:var(--ink)}
.tn-dw{max-width:720px;margin:0 auto}
.tn-dvc{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;justify-items:center;margin:6px 0 16px}
.tn-dvj{display:grid;justify-items:center;gap:6px} .tn-dvj.longe{opacity:.4} .tn-dvj.venceu .tn-dvn{color:var(--grn)}
.tn-dvn{font:700 28px/1 var(--f-hud)} .tn-dvn small{font-size:.5em;color:var(--faint)}
.tn-pips{display:flex;gap:5px} .tn-pips i{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--hair)} .tn-pips i.ok{background:var(--grn);border-color:var(--grn)}
.tn-dvr{display:grid;justify-items:center;gap:2px;text-align:center;min-width:120px} .tn-dvr small{font:500 11px var(--f-mono);color:var(--soft)} .tn-dvr b{font:700 24px/1.1 var(--f-hud)}
.tn-dvps{display:grid;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.tn-dvp{display:grid;grid-template-columns:1fr minmax(0,2.4fr) 1fr;gap:12px;align-items:center;padding:12px 4px} .tn-dvp + .tn-dvp{border-top:1px dashed var(--hair)}
.tn-dvp > .tn-dvt:first-child{justify-self:end} .tn-dvp > .tn-dvt:last-child{justify-self:start}
.tn-dvm{display:grid;justify-items:center;gap:4px;text-align:center;min-width:0;padding:0 12px;border-left:1px solid var(--hair);border-right:1px solid var(--hair)}
.tn-dvm small{font:500 11px var(--f-mono);color:var(--faint)}
.tn-dvpn{font-size:14px;color:var(--ink);text-decoration:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .tn-dvpn:hover{color:var(--volt)}
.tn-dvtc{font:600 11px var(--f-mono);color:var(--amb)}
.tn-dvt{font:600 13px var(--f-mono);color:var(--faint)} .tn-dvt.ok{color:var(--grn)}
.tn-dvx{display:grid;justify-items:center;gap:10px;text-align:center;padding:22px 12px;border:1px dashed var(--hair);border-radius:3px} .tn-dvx p{margin:0;max-width:46ch;color:var(--soft);font-size:13.5px}
.tn-dvbig{font:700 44px/1 var(--f-hud)}
.tn-dvfim{display:grid;justify-items:center;gap:4px;text-align:center;padding:12px;margin-bottom:14px;border:1px solid var(--hair);border-radius:3px} .tn-dvfim b{font:700 20px var(--f-hud)}
.tn-dvfim.ok{border-color:var(--grn)} .tn-dvfim.ok b{color:var(--grn)} .tn-dvfim span{font-size:13px;color:var(--soft)}
.tn-dvpe{text-align:center;margin:12px 0 0;font-size:12.5px;color:var(--soft)}
.tn-dhcs{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:12px}
.tn-dhc{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;border:1px solid var(--hair);border-radius:3px;padding:4px 10px 4px 4px} .tn-dhc .mono{font:600 12px var(--f-mono)}
.tn-dhls{display:grid}
.tn-dhl{display:grid;grid-template-columns:auto auto minmax(0,1fr) auto auto auto;gap:12px;align-items:center;font:inherit;font-size:13.5px;color:inherit;text-align:left;background:none;border:0;border-top:1px dashed var(--hair);padding:8px 6px;cursor:pointer}
.tn-dhl:first-child{border-top:0} .tn-dhl:hover{background:color-mix(in srgb,var(--volt) 5%,transparent)}
.tn-dhr{font:700 11px var(--f-mono);width:20px;text-align:center;border:1px solid var(--hair);border-radius:3px;padding:1px 0;color:var(--faint)} .tn-dhr.v{color:var(--grn);border-color:var(--grn)} .tn-dhr.d{color:var(--red);border-color:color-mix(in srgb,var(--red) 60%,transparent)}
.tn-dhp{font:700 15px var(--f-hud)} .tn-dhd{font:500 11px var(--f-mono);color:var(--faint)}
@media (max-width:560px){.tn-dhl{grid-template-columns:auto auto minmax(0,1fr) auto;gap:8px} .tn-dhl .tn-dhd,.tn-dhl .tn-tc{display:none}}
.tn-dex{display:grid;grid-template-columns:1fr auto auto auto 1fr;gap:14px;align-items:center;margin:4px 0 2px}
.tn-dexn{font:600 14px var(--f-hud)} .tn-dexn.e{justify-self:end} .tn-dexp{font:700 52px/1 var(--f-hud)} .tn-dexp.ok{color:var(--grn)} .tn-dexx{font:500 20px var(--f-hud);color:var(--faint)}
.tn-dex + .tn-dvr{margin:0 auto 14px}
.tn-dels{display:grid;gap:8px;max-width:560px;margin:0 auto}
.tn-del{display:grid;gap:6px;border:1px solid var(--hair);border-radius:3px;padding:10px 12px}
.tn-delt{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}
.tn-delq{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;font-size:12px;color:var(--soft)} .tn-delq > span:last-child{justify-self:end} .tn-delq small{font:500 11px var(--f-mono);color:var(--faint)}
@media (max-width:560px){.tn-dvc{gap:8px} .tn-dvr{min-width:0} .tn-dvp{grid-template-columns:52px minmax(0,1fr) 52px;gap:6px;padding:10px 0} .tn-dvm{padding:0 8px} .tn-dexp{font-size:40px} .tn-dex{gap:8px}}
.tn-cv{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.tn-cv > div{display:grid;gap:6px;align-content:start;border:1px solid var(--hair);border-radius:3px;padding:12px} .tn-cv .btn{justify-self:start}
.tn-hp{display:grid;gap:6px} .tn-hpt{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline} .tn-hpt b{font:700 18px var(--f-hud)}
.tn-hpb{height:14px;background:var(--track);border:1px solid var(--hair)} .tn-hpb i{display:block;height:100%;background:var(--red,#D9534F)}
.tn-chs{display:grid;gap:6px}
.tn-ch{display:grid;grid-template-columns:auto 92px minmax(0,1fr) 54px;gap:10px;align-items:center;font:13px var(--f-mono)} .tn-ch.eu .n{color:var(--volt)}
.tn-ch .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .tn-ch .v{text-align:right}
.tn-cb{position:relative;height:8px;background:var(--track)} .tn-cb i{display:block;height:100%;background:var(--grn)}
.tn-cb em,.tn-leg em{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--soft)} .tn-cb em.m,.tn-leg em.m{background:var(--ink)}
.tn-leg{margin:8px 0 0;font-size:11.5px} .tn-leg em{position:relative;display:inline-block;height:11px;top:1px}
.tn-mks{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px}
.tn-mk{display:grid;justify-items:center;gap:2px;border:1px solid var(--hair);border-radius:3px;padding:6px;font:12px var(--f-mono)} .tn-mk small{color:var(--faint)} .tn-mk.ok{border-color:var(--grn)} .tn-mk.ok span{color:var(--grn)} .tn-mk.agora{border-style:dashed}
.tn-tp,.tn-gr{width:100%;border-collapse:collapse;font:13px var(--f-mono)}
.tn-tp th,.tn-gr th{font:600 10.5px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--faint);text-align:left;padding:6px 8px;border-bottom:1px solid var(--hair)}
.tn-tp td,.tn-gr td{padding:6px 8px;border-bottom:1px solid var(--hair)} .tn-tp .n,.tn-tp th:nth-child(n+3){text-align:center} .tn-tp .p{color:var(--faint);width:28px}
.tn-tp tr.eu td,.tn-gr tr.eu td{background:color-mix(in srgb,var(--volt) 7%,transparent)}
.tn-q{display:inline-flex;gap:8px;align-items:center} .tn-mm{display:inline-flex;gap:4px}
.tn-gr th small{display:block;font-weight:500;letter-spacing:0;text-transform:none} .tn-gr td{text-align:center} .tn-gr td:first-child{text-align:left;white-space:nowrap}
.tn-gr .tt-md{width:auto;min-width:18px;padding:0 4px}
.tn-hl{display:grid;gap:22px;align-items:start} @container (min-width:900px){.tn-hl{grid-template-columns:auto minmax(240px,1fr)}}
.tn-lado{display:grid;gap:5px;align-content:start} .tn-lado .tn-k.t{margin-top:10px}
.tn-ml{display:grid;grid-template-columns:minmax(0,1fr) 90px 34px;gap:10px;align-items:center;font:13px var(--f-mono);padding:3px 0;border-bottom:1px dashed var(--hair)}
.tn-ml i{height:6px;background:linear-gradient(90deg,var(--volt) var(--v),var(--track) var(--v))} .tn-ml b{text-align:right;font:700 14px var(--f-hud)}
.tn-ml.on span,.tn-ml.on b{color:var(--aura)} .tn-ml.on i{background:linear-gradient(90deg,var(--aura) var(--v),var(--track) var(--v))}
.tn-ml.marca,.tn-ml.hab{grid-template-columns:minmax(0,1fr) auto} .tn-ml.marca{margin-top:8px;border:1px solid var(--hair);border-radius:3px;padding:6px 10px}
.tn-ml.hab span{color:var(--soft)} .tn-ml.hab b{font:600 12.5px var(--f-mono)}
.tn-det{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.tn-det > div{border:1px solid var(--hair);border-radius:3px;padding:8px 10px;display:grid;gap:2px} .tn-det small{font:600 10px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--faint)} .tn-det b{font:700 18px var(--f-hud)}
</style>`);
})();
