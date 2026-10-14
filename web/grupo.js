/* ---------- modo em grupo (0.9, #38–#40): a aba Torre Trick com o placar do grupo e o card "grupo" em Configurações ----------
   A página calcula o resumo dos dias (GBx.resumoGrupo: só números e os hábitos do grupo) e o servidor do jogo manda ao
   servidor do grupo o que mudou (POST /api/grupo/sincronizar). O placar da 0.9.0 mostra só fatos, sem pontos (#42): quem
   jogou em cada dia, Codeforces, Duolingo e a sequência. Fora do ar, a aba mostra o último placar recebido.
   No modo demonstração não há servidor: a aba continua só explicando o que vem. */
(() => {
if(window.GB_DEMO) return;
const G = {lista:null, res:{}, sel:'', aba:'placar', adm:null, admErr:'', convite:'', link:'', host:null, hostAberto:false, funnel:null, nome:'', endereco:'', ocupado:false, ultima:0};
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
const reRender = () => { if(cur === 'tt' || cur === 'cfg') render(); };

async function carrega(){
  try { const j = await (await fetch('/api/grupo', {cache:'no-store'})).json(); if(j.ok){ G.lista = j.grupos; G.host = j.host; } }
  catch(e){ G.lista = G.lista || []; }
  if(G.lista && !G.lista.some(g => g.chave === G.sel)) G.sel = G.lista.length ? G.lista[0].chave : '';
}
async function sincroniza(){
  if(!CTX || !G.lista || !G.lista.length || G.ocupado) return;
  G.ocupado = true;
  try { const j = await post('/api/grupo/sincronizar', {resumo: GBx.resumoGrupo(CTX, estado())}); G.res = j.grupos; G.ultima = Date.now(); }
  catch(e){ /* o servidor do jogo caiu: a próxima tentativa resolve */ }
  G.ocupado = false; reRender();
}
async function inicia(){ await carrega(); await sincroniza(); reRender(); setInterval(sincroniza, SINC_MIN * 60000); }
const espera = setInterval(() => { if(CTX){ clearInterval(espera); inicia(); } }, 300);

/* ---------- aba Torre Trick ---------- */
function heat(m, P){
  const cel = [];
  for(let d = P.janela; d <= P.hoje; d = GBx.addD(d, 1)){
    const f = m.dias[d] || {}, aberto = !P.fechado_ate || d > P.fechado_ate;
    const tit = [ddmm(d), f.a ? 'com XP' : 'sem XP', f.cf ? `Codeforces ${f.cf}` : '', f.duo ? 'Duolingo' : '', f.m ? 'missão' : '', aberto ? 'provisório' : ''].filter(Boolean).join(' · ');
    cel.push(`<i class="gp-c${f.a ? ' a' : ''}${f.cf ? ' cf' : ''}${aberto ? ' p' : ''}" title="${tit}"></i>`);
  }
  return `<span class="gp-heat" aria-hidden="true">${cel.join('')}</span>`;
}
function placarHTML(g){
  const P = placarDe(g), r = G.res[g.chave] || {};
  if(!P) return `<div class="card"><p style="margin:0;font-size:14px">${r.erro ? esc(r.erro) : 'Buscando o placar no servidor do grupo...'}</p></div>`;
  const aviso = r.offline ? `<p class="gp-aviso">O servidor do grupo está fora do ar. Mostrando o placar de ${esc(quando(P.recebido))}; o que você fizer até lá vai junto na próxima vez.</p>`
    : r.sem_acesso ? `<p class="gp-aviso">${esc(r.erro)}</p>` : '';
  const soma = (m, k) => Object.values(m.dias).reduce((s, f) => s + (f[k] || 0), 0);
  const linhas = P.membros.map(m => `<tr${m.id === P.voce.membro ? ' class="gp-eu"' : ''}>
      <td><span class="gp-quem">${m.avatar ? `<span class="av pic" style="--s:26px;background-image:url(${avSrc(m.avatar)})"></span>` : `<span class="av logo" style="--s:26px"><img src="${LOGO}" alt=""></span>`}<b>${esc(m.nome)}</b>${m.admin ? '<small>admin</small>' : ''}</span></td>
      <td class="mono">${m.sequencia}</td><td class="mono">${soma(m, 'a')}</td><td class="mono">${soma(m, 'cf')}</td><td class="mono">${soma(m, 'duo')}</td>
      <td>${heat(m, P)}</td><td class="sub">${esc(quando(m.envio))}</td></tr>`).join('');
  return `${aviso}<div class="card"><h2><span class="c">~/</span>${esc(P.grupo.nome)} · ${P.membros.length} ${P.membros.length === 1 ? 'membro' : 'membros'}</h2>
    <p class="sub" style="margin:0 0 12px">Só fatos por enquanto: quem jogou em cada dia, Codeforces e Duolingo nos últimos ${GBx.dias(P.janela, P.hoje) + 1} dias. Os pontos da Torre Trick entram quando o grupo tiver algumas semanas de uso.${P.fechado_ate ? ` Dias fechados até ${ddmm(P.fechado_ate)}; os mais recentes ainda podem mudar.` : ' Nenhum dia fechado ainda: tudo é provisório.'}</p>
    <div class="tbl-wrap"><table class="rg-t gp-t"><thead><tr><th>jogador</th><th title="dias seguidos com XP">seq.</th><th title="dias com XP na janela">dias</th><th>CF</th><th title="dias com lição">duo</th><th>últimos dias</th><th>sincronizou</th></tr></thead><tbody>${linhas}</tbody></table></div>
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
    <div class="card"><h2><span class="c">~/</span>configuração do grupo</h2>
      <div class="gp-f"><label>Nome<input id="gp-c-nome" value="${esc(A.grupo.nome)}" maxlength="40"></label>
        <label>Fuso (fechamento às 6h)<input id="gp-c-fuso" value="${esc(A.grupo.fuso)}" maxlength="6" class="mono"></label>
        <label>Início da temporada<input id="gp-c-ini" type="date" value="${esc(A.grupo.ini)}"></label><label>Fim da temporada<input id="gp-c-fim" type="date" value="${esc(A.grupo.fim)}"></label></div>
      <p class="sub" style="margin:0 0 10px">Sem datas, o grupo aceita os dias que cada um mandar. O fuso só decide quando um dia fecha (às 6h do dia seguinte); o dia de cada coisa é o do relógio de quem fez.</p>
      <button type="button" class="btn v" data-gpcfg>salvar</button></div>`;
}
function rTT2(S){
  const g = grupoSel();
  if(!g){ RENDER0.tt(S); document.getElementById('tt-root').insertAdjacentHTML('afterbegin', `<div class="card"><h2><span class="c">~/</span>entrar num grupo</h2><p style="margin:0;font-size:14px">Recebeu um convite de um amigo? Cole o link em <b>Configurações → grupo</b>. Quer criar um grupo e ser o servidor? Também é por lá.</p><p style="margin:10px 0 0"><button type="button" class="btn v" data-go="cfg">abrir Configurações</button></p></div>`); return; }
  const P = placarDe(g), adm = P ? P.voce.admin : g.admin;
  if(!adm && G.aba === 'admin') G.aba = 'placar';
  const sel = G.lista.length > 1 ? `<div class="togg">${G.lista.map(x => `<button data-gpsel="${esc(x.chave)}" aria-pressed="${x.chave === g.chave}">${esc(x.nome)}</button>`).join('')}</div>` : '';
  const abas = adm ? `<div class="togg"><button data-gpaba="placar" aria-pressed="${G.aba === 'placar'}">placar</button><button data-gpaba="admin" aria-pressed="${G.aba === 'admin'}">administrar</button></div>` : '';
  document.getElementById('tt-root').innerHTML = sel + abas + (G.aba === 'admin' ? adminHTML(g) : placarHTML(g));
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
function cardGrupo(){
  const l = G.lista || [];
  return `<div class="card" id="cfg-grupo"><h2><span class="c">~/</span>grupo</h2>
    ${l.length ? l.map(g => `<div class="gp-lin"><span><b>${esc(g.nome)}</b>${g.admin ? ' <small class="sub">admin</small>' : ''} <span class="sub mono">${esc(g.convite)}</span></span><button type="button" class="btn" data-gpsai="${esc(g.chave)}" data-n="${esc(g.nome)}">sair</button></div>`).join('') : '<p style="margin:0 0 10px;font-size:14px">Você não está em nenhum grupo.</p>'}
    <label class="sub" for="gp-convite" style="display:block;margin:10px 0 4px">Link do convite (o amigo que é admin do grupo manda)</label>
    <div style="display:flex;gap:8px"><input id="gp-convite" class="mono" value="${esc(G.convite)}" placeholder="https://.../g/grupo#CODIGO" style="flex:1;min-width:0"><button type="button" class="btn v" data-gpentra>entrar</button></div>
    <p class="sub" style="margin:8px 0 0">Vão para o grupo só o seu nickname, a foto de perfil e, por dia, o XP (para as contas; ninguém vê o número), o Codeforces e o Duolingo. Suas tarefas e os outros hábitos ficam aqui.</p>
    ${hostHTML()}</div>`;
}
RENDER.cfg = S => { RENDER0.cfg(S); const a = document.getElementById('cfg-srv') || document.getElementById('cfg'); if(a) a.insertAdjacentHTML('afterend', cardGrupo()); else document.getElementById('cfg-root').insertAdjacentHTML('afterbegin', cardGrupo()); };

async function admin(acao, corpo){ return post('/api/grupo/admin', Object.assign({chave: grupoSel().chave, acao}, corpo || {})); }
async function abreAdmin(){ G.adm = null; G.admErr = ''; render(); try { G.adm = await admin('ver'); } catch(e){ G.admErr = e.message; } render(); }
async function hostEstado(){ try { G.hostEstado = await post('/api/grupo/host', {acao:'estado'}); } catch(e){ G.hostEstado = {}; toast('Não deu: ' + esc(e.message)); } render(); }
const guarda = () => { const n = document.getElementById('gp-h-nome'), e = document.getElementById('gp-h-end'), c = document.getElementById('gp-convite');
  if(n) G.nome = n.value; if(e) G.endereco = e.value; if(c) G.convite = c.value; };

document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  let b;
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
    if(q('[data-gpcfg]')){ const v = id => document.getElementById(id).value.trim();
      G.adm = await admin('config', {nome: v('gp-c-nome'), fuso: v('gp-c-fuso'), ini: v('gp-c-ini'), fim: v('gp-c-fim')}); await carrega(); await sincroniza(); toast('Grupo salvo'); return; }
    if(q('[data-gpentra]')){ guarda(); const r = await post('/api/grupo/entrar', {link: G.convite, avatar: avatar()}); G.convite = ''; G.sel = r.chave;
      await carrega(); render(); toast(`Você entrou em ${esc(r.nome)} <small>o placar fica na aba ${esc(ABA.tt.n)}</small>`); sincroniza(); return; }
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
.gp-host{margin-top:14px;padding:14px;border:1px solid var(--hair);border-radius:12px}
</style>`);
})();
