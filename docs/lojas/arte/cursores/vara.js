// Cursor com física da vara de pescar do Gon (cr-vara), desenhada em código, sem imagem.
// O ponteiro é a ponta da vara (o anel de onde sai a linha); a vara vai para baixo e para a direita, como a seta do mouse,
// com o molinete embaixo e o cabo verde. Ela é de bambu e verga de verdade: a tensão da linha curva a vara para o lado
// do puxão, a mão segura o cabo com uma mola (a vara balança atrasada quando o mouse corre) e, quando a carga some de uma
// vez, a vara vibra até parar. Da ponta pende a linha (corda de Verlet, passo fixo de 1/240 s) com a boia vermelha e
// branca, a chumbada e o anzol.
// Clicar lança: a linha corre do molinete e o anzol voa na direção em que a mão ia (parada, lança para a frente, por
// cima); clicar com a linha no ar trava a linha. O anzol que entra num card fisga na borda (a ponta some dentro do card,
// com um furinho). Com a linha fora, um clique é o tranco: o anzol pula para perto, e se o card está fisgado o anzol
// crava (aguenta bem mais) e o card leva o tranco. Segurar recolhe a linha; puxando o card (recolhendo ou indo para
// longe), ele vem junto como mola, com massa pelo tamanho (o painel grande mal mexe), até o anzol arrancar: o card
// volta balançando, solta lasquinhas e fica com a marca na borda, e o anzol volta voando pela linha.
// Parado uns segundos com o anzol solto no ar, um peixe pula de baixo e morde o anzol: a vara enverga e ele se debate;
// clicando enquanto ele morde, o Gon fisga o peixe (ele sai voando por cima da vara); senão ele solta e cai.
//   const v = CURSORES.vara.liga(elemento, {vara: 50, linha: 420, seletor: '.card'})   v.ajusta({linha: 300})   v.estado()   v.desliga()
//   (elemento = document.body no jogo, com os cards de verdade; ou a tela preta da bancada, que ganha uma página de mentira)
//   CURSORES.vara.desenha(ctx, x, y, vara)                     a vara parada com a linha pendurada, para as prévias
//   titulo, dica, controles, previas(el, cfg) e v.legenda(): o que a bancada mostra
(() => {
const TINTA = '#11131A', LINHA = '#E8ECF4';
const BAMBU = '#D2AC62', GOMO = '#7A5A2E', CABO = '#2F8F4E', CABO_ESC = '#1F6236', MOLINETE = '#C7CCD6';
const BOIA = '#E5534B', BOIA_BR = '#F4F1EA', ACO = '#D9DEE8', CHUMBO = '#5A6070';
const PEIXE = '#3E9C8F', PEIXE_COSTA = '#2C6F6A', PEIXE_BARRIGA = '#BFE3D0';
const PASSO = 1 / 240, N = 18, LID = 3, M = N + LID, VOLTAS = 10;   // nós da linha até a boia (N), da boia ao anzol (LID)
const G = 2600;                  // gravidade (px/s²)
const LRESTO = 22, LIDER = 20;   // recolhida: da ponta à boia; e o pedaço fixo da boia ao anzol (px, na vara de 50 px)
const ANG = Math.atan2(.78, .62);// a vara, da ponta ao cabo: para baixo e para a direita, como a seta do mouse
const LANCA = 1050, LANCA_MAX = 2300; // velocidade do anzol no lançamento: parado, e o teto com a mão jogando
const RECOLHE = 560, BRIGA = 120;// o molinete recolhendo (px/s): solto, e com o card fisgado (a fricção do molinete)
const TRANCO = 24, TRANCO_T = .07; // o tranco encurta a linha isso (px) nesse tempo (s)
const K = 160;                   // a linha esticada: tensão por px que passa do comprimento (o náilon cede)
const ARRANCA = 5200;            // tensão em que o anzol arranca do card; cravado (depois do tranco), aguenta CRAVA vezes
const CRAVA = 1.7;
const OMEGA = 2 * Math.PI * 2.6, ZETA = .14, MASSA = 26000;   // a mola do card (como no Bungee): balança e para; massa pela área
const ESPERA = 3500;             // parado isso (ms), o peixe vem
const VOLTA = 2;                 // a mão segura o cabo: mola de ~2 balanços por segundo

// ---- desenho ----
const lerp = (a, b, t) => a + (b - a) * t;
// a vara de (tx, ty) (a ponta) a (hx, hy) (o fim do cabo), curvada b px no meio; giro = o ângulo do molinete; s = escala
function vara(ctx, tx, ty, hx, hy, b, giro, s, pulso = 0){
  const L = Math.hypot(hx - tx, hy - ty) || 1, cx = (hx - tx) / L, cy = (hy - ty) / L, nx = -cy, ny = cx;
  const kx = (tx + hx) / 2 + nx * 2 * b, ky = (ty + hy) / 2 + ny * 2 * b;
  const pt = t => [(1 - t) * (1 - t) * tx + 2 * (1 - t) * t * kx + t * t * hx, (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * ky + t * t * hy];
  const tg = t => { const dx = 2 * (1 - t) * (kx - tx) + 2 * t * (hx - kx), dy = 2 * (1 - t) * (ky - ty) + 2 * t * (hy - ky), d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  const larg = t => s * (1.4 + 2.4 * t);
  const tira = (t0, t1, cor, extra) => {
    const n = Math.max(2, Math.ceil((t1 - t0) * 16));
    for(let i = 0; i < n; i++){
      const a = t0 + (t1 - t0) * i / n, c = t0 + (t1 - t0) * (i + 1) / n, [x0, y0] = pt(a), [x1, y1] = pt(c);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = cor; ctx.lineWidth = larg((a + c) / 2) + extra; ctx.stroke();
    }
  };
  ctx.lineCap = ctx.lineJoin = 'round';
  // o molinete, embaixo do cabo (do lado de n), com a haste
  const [rx0, ry0] = pt(.8), [qx, qy] = tg(.8), sx = -qy, sy = qx, mx = rx0 + sx * 5.6 * s, my = ry0 + sy * 5.6 * s, mr = 3.9 * s;
  ctx.beginPath(); ctx.moveTo(rx0, ry0); ctx.lineTo(mx, my); ctx.strokeStyle = TINTA; ctx.lineWidth = 2.6 * s; ctx.stroke();
  // a linha sai do molinete, passa pelos passadores e chega no anel da ponta
  const pass = [.55, .3].map(t => { const [x, y] = pt(t), [ux, uy] = tg(t); return [x - uy * larg(t) * .9, y + ux * larg(t) * .9, t]; });
  // o corpo: contorno escuro, depois o bambu; o cabo verde por cima, com a ponteira
  tira(0, 1, TINTA, 2.2 * Math.max(1, s * .8));
  tira(0, .74, BAMBU, 0);
  tira(.74, 1, TINTA, 3.4 * s); tira(.75, 1, CABO, 1.6 * s);
  // a fita do cabo: listras finas atravessadas
  for(const t of [.8, .86, .92]){ const [x, y] = pt(t), [ux, uy] = tg(t), w = larg(t) * .5 + .9 * s;
    ctx.beginPath(); ctx.moveTo(x - uy * w - ux * s, y + ux * w - uy * s); ctx.lineTo(x + uy * w + ux * s, y - ux * w + uy * s); ctx.strokeStyle = CABO_ESC; ctx.lineWidth = .9 * s; ctx.stroke(); }
  // os gomos do bambu
  for(const t of [.2, .4, .58]){ const [x, y] = pt(t), [ux, uy] = tg(t), w = larg(t) * .5 + .3 * s;
    ctx.beginPath(); ctx.moveTo(x - uy * w, y + ux * w); ctx.lineTo(x + uy * w, y - ux * w); ctx.strokeStyle = GOMO; ctx.lineWidth = 1.1 * s; ctx.stroke(); }
  // passadores e a linha até a ponta
  ctx.beginPath(); ctx.moveTo(mx, my); for(const [x, y] of pass) ctx.lineTo(x, y); ctx.lineTo(tx, ty);
  ctx.strokeStyle = 'rgba(232,236,244,.75)'; ctx.lineWidth = .8; ctx.stroke();
  for(const [x, y] of pass){ ctx.beginPath(); ctx.arc(x, y, 1.05 * s, 0, 2 * Math.PI); ctx.strokeStyle = TINTA; ctx.lineWidth = 1; ctx.stroke(); }
  // o molinete: disco, carretel e a manivela que gira
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, 2 * Math.PI); ctx.fillStyle = MOLINETE; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.beginPath(); ctx.arc(mx, my, mr * .55, 0, 2 * Math.PI); ctx.fillStyle = LINHA; ctx.fill(); ctx.strokeStyle = 'rgba(17,19,26,.5)'; ctx.lineWidth = .8; ctx.stroke();
  const ex = mx + Math.cos(giro) * mr * 1.05, ey = my + Math.sin(giro) * mr * 1.05;
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.4 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(ex, ey, 1.3 * s, 0, 2 * Math.PI); ctx.fillStyle = CABO_ESC; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = .9; ctx.stroke();
  // a ponteira do cabo
  ctx.beginPath(); ctx.arc(hx, hy, 2.2 * s, 0, 2 * Math.PI); ctx.fillStyle = TINTA; ctx.fill();
  // o anel da ponta é o ponteiro; pulsa quando a linha volta toda
  const ra = 1.9 * s * (1 + .6 * pulso * pulso);
  ctx.beginPath(); ctx.arc(tx, ty, ra, 0, 2 * Math.PI); ctx.strokeStyle = 'rgba(8,10,16,.7)'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.strokeStyle = LINHA; ctx.lineWidth = 1.2; ctx.stroke();
}
// a boia em (x, y), com o eixo (ux, uy) apontando para o anzol: metade de cima vermelha, a de baixo branca, a antena
function boia(ctx, x, y, ux, uy, s){
  const a = Math.atan2(uy, ux) - Math.PI / 2, rx = 2.8 * s, ry = 4.6 * s;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, -ry); ctx.lineTo(0, -ry - 3.6 * s); ctx.strokeStyle = TINTA; ctx.lineWidth = 2.4 * s; ctx.lineCap = 'round'; ctx.stroke();
  ctx.strokeStyle = BOIA; ctx.lineWidth = 1.1 * s; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI); ctx.fillStyle = BOIA_BR; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = BOIA; ctx.fillRect(-rx, -ry, 2 * rx, ry + .3 * s);
  ctx.fillStyle = 'rgba(17,19,26,.75)'; ctx.fillRect(-rx, -.25 * s, 2 * rx, .8 * s);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-rx * .55, -ry * .7, rx * .35, ry * .5);
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
function chumbada(ctx, x, y, ux, uy, s){
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux) - Math.PI / 2);
  ctx.beginPath(); ctx.ellipse(0, 0, 1.7 * s, 2.5 * s, 0, 0, 2 * Math.PI); ctx.fillStyle = CHUMBO; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}
// o anzol: o olho em (x, y), a haste segue (ux, uy); a curva e a farpa voltam para o lado
const CURVA = [-2.6, 10.6];   // onde fica o fundo da curva, nas coordenadas do anzol (×s)
function anzol(ctx, x, y, ux, uy, s){
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux) - Math.PI / 2);
  const tr = () => { ctx.beginPath(); ctx.moveTo(0, 1.2 * s); ctx.lineTo(0, 8 * s); ctx.arc(-2.6 * s, 8 * s, 2.6 * s, 0, Math.PI); ctx.lineTo(-5.2 * s, 4.6 * s); ctx.lineTo(-3.9 * s, 6.1 * s); };
  ctx.lineCap = ctx.lineJoin = 'round';
  tr(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5 * s + 1.6; ctx.stroke();
  tr(); ctx.strokeStyle = ACO; ctx.lineWidth = 1.5 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 1.3 * s, 0, 2 * Math.PI); ctx.strokeStyle = TINTA; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = ACO; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.restore();
}
// o peixe com o centro em (x, y), olhando para ang; r = meio comprimento; rabo = o abano (rad)
function peixe(ctx, x, y, ang, r, rabo = 0){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineJoin = ctx.lineCap = 'round';
  // o rabo, abanando
  ctx.save(); ctx.translate(-r * .78, 0); ctx.rotate(rabo);
  ctx.beginPath(); ctx.moveTo(.1 * r, 0); ctx.lineTo(-.62 * r, -.5 * r); ctx.quadraticCurveTo(-.44 * r, 0, -.62 * r, .5 * r); ctx.closePath();
  ctx.fillStyle = PEIXE_COSTA; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
  // a barbatana de cima
  ctx.beginPath(); ctx.moveTo(-.25 * r, -.36 * r); ctx.quadraticCurveTo(-.05 * r, -.78 * r, .3 * r, -.4 * r); ctx.closePath();
  ctx.fillStyle = PEIXE_COSTA; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.2; ctx.stroke();
  // o corpo: costas escuras, barriga clara
  ctx.beginPath(); ctx.ellipse(0, 0, r, .44 * r, 0, 0, 2 * Math.PI); ctx.fillStyle = PEIXE; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = PEIXE_BARRIGA; ctx.beginPath(); ctx.ellipse(.1 * r, .3 * r, r, .28 * r, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = PEIXE_COSTA; ctx.beginPath(); ctx.ellipse(0, -.4 * r, r, .2 * r, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(17,19,26,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(.35 * r, 0, .3 * r, -1.1, 1.1); ctx.stroke();   // a guelra
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, r, .44 * r, 0, 0, 2 * Math.PI); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.beginPath(); ctx.arc(.6 * r, -.1 * r, .12 * r, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.arc(.63 * r, -.1 * r, .055 * r, 0, 2 * Math.PI); ctx.fillStyle = TINTA; ctx.fill();
  ctx.restore();
}
// a linha passando lisa pelos pontos, com contorno escuro para o tema claro
function fio(ctx, xs, ys, i0, i1){
  ctx.beginPath(); ctx.moveTo(xs[i0], ys[i0]);
  for(let i = i0 + 1; i < i1; i++) ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
  ctx.lineTo(xs[i1], ys[i1]);
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(8,10,16,.55)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.strokeStyle = LINHA; ctx.lineWidth = 1; ctx.stroke();
}
// a vara parada, com a linha pendurada reta: para as prévias e a vitrine
function desenha(ctx, x, y, Lr = 50, op = {}){
  const s = Lr / 50, b = op.curva || 0, hx = x + Math.cos(ANG) * Lr, hy = y + Math.sin(ANG) * Lr;
  if(op.linha !== false){
    const [dx, dy] = op.puxa || [0, 1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const l = (op.comprimento || LRESTO) * s, bx = x + ux * l, by = y + uy * l, ax = bx + ux * LIDER * s, ay = by + uy * LIDER * s;
    fio(ctx, [x, bx], [y, by], 0, 1); fio(ctx, [bx, ax], [by, ay], 0, 1);
    boia(ctx, bx, by, ux, uy, s); chumbada(ctx, bx + ux * LIDER * s * .66, by + uy * LIDER * s * .66, ux, uy, s); anzol(ctx, ax, ay, ux, uy, s);
  }
  vara(ctx, x, y, hx, hy, b, op.giro || 0, s);
}

// ---- a página de mentira da bancada: um pedaço do jogo com cards de tamanhos bem diferentes ----
const TAREFAS = [['A', 'Perguntar ao professor de Redes se o trabalho vale nota', '+23'], ['A', 'Mandar mensagem da caixa', '+23'], ['C', 'Lavar o carro', '+15'], ['B', 'Ler 20 páginas', '+12']];
function pagina(palco, cfg){
  const pag = document.createElement('div');
  pag.className = 'vr-pag';
  const hm = Array.from({length: 84}, (_, i) => `<i style="opacity:${[.15, .4, .7, 1][(i * 7 + (i >> 2)) % 4]}"></i>`).join('');
  pag.innerHTML = `<style>
    .vr-pag{position:absolute;inset:0;overflow:hidden;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-content:start;font:14px var(--f-ui);user-select:none}
    .vr-pag .vr-col{display:grid;gap:10px;align-content:start;min-width:0}
    .vr-pag .vr-card{background:var(--b-card);border:1px solid var(--b-borda);border-radius:12px;padding:12px 14px;color:var(--b-tinta);min-width:0}
    .vr-pag .vr-me{grid-column:1/-1;display:flex;gap:14px;align-items:center}
    .vr-pag .vr-av{width:44px;height:44px;border-radius:50%;background:url('../../../web/a/killua-3.png') center/cover;flex:none;border:2px solid var(--b-borda)}
    .vr-pag .vr-xp{height:6px;border-radius:9px;background:var(--b-trilho);margin-top:6px} .vr-pag .vr-xp b{display:block;height:100%;width:62%;background:var(--b-tinta);border-radius:9px}
    .vr-pag small{display:block;color:var(--b-suave);font-size:12px}
    .vr-pag .vr-in{display:flex;gap:10px;align-items:center;color:var(--b-suave)} .vr-pag .vr-in span:first-child{flex:1;border:1px solid var(--b-borda);border-radius:8px;padding:8px 10px}
    .vr-pag .vr-tf{display:flex;gap:10px;align-items:center;padding:10px 14px} .vr-pag .vr-tf span{flex:1;min-width:0}
    .vr-pag .vr-tf i{width:18px;height:18px;flex:none;clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%);background:#E0AF68}
    .vr-pag .vr-tf em{font:600 11px var(--f-mono);font-style:normal;color:#9BE15D;border:1px solid currentColor;border-radius:5px;padding:1px 6px}
    .vr-pag .vr-pr{font:600 10px var(--f-mono);color:#0B0C10;background:#8A96AB;border-radius:3px;padding:0 4px;margin-right:6px}
    .vr-pag .vr-hm{display:grid;grid-template-columns:repeat(21,1fr);gap:3px;margin-top:8px} .vr-pag .vr-hm i{aspect-ratio:1;border-radius:2px;background:#9BE15D}
    .vr-pag h4{margin:0 0 6px;font:600 11px var(--f-mono);letter-spacing:.06em;color:var(--b-suave)}
    .vr-pag .vr-ln{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--b-borda);font-size:13px}
  </style>
  <div class="vr-card vr-me"><span class="vr-av"></span><div style="flex:1;min-width:0"><b>Caio</b> · andar 204<div class="vr-xp"><b></b></div><small>hoje +0 XP · meta 65</small></div></div>
  <div class="vr-col">
    <div class="vr-card vr-in"><span>Nova tarefa: ex. Lista 3 de derivadas</span><span>+ adicionar</span></div>
    ${TAREFAS.map(([p, n, x]) => `<div class="vr-card vr-tf"><i></i><span><span class="vr-pr">${p}</span>${n}</span><em>${x}</em></div>`).join('')}
    <div class="vr-card"><h4>CONSTÂNCIA</h4><small>um painel grande: pesado, mal mexe</small><div class="vr-hm">${hm}</div></div>
  </div>
  <div class="vr-col">
    <div class="vr-card"><h4>QUANTO VALE</h4></div>
    <div class="vr-card"><h4>RENDE MAIS AGORA</h4><div class="vr-ln"><span>Mandar mensagem</span><b>+23</b></div><div class="vr-ln"><span>Lavar o carro</span><b>+15</b></div></div>
    <div class="vr-card"><h4>MISSÃO DA SEMANA</h4><b style="color:#E0AF68">Especialização</b><small>vida ×1,5 · 1/3 dias</small></div>
  </div>`;
  const antes = palco.style.background;
  const pinta = () => {
    const c = cfg.claro ? {bg: '#F2F3F7', card: '#FFFFFF', borda: '#D9DCE5', tinta: '#1B1D28', suave: '#6B7088', trilho: '#E4E6EE'}
      : {bg: '#0B1120', card: '#121A2A', borda: '#243049', tinta: '#E6EDF7', suave: '#8A96AB', trilho: '#1C2538'};
    palco.style.background = c.bg; for(const [k, v] of Object.entries(c)) pag.style.setProperty('--b-' + k, v);
  };
  palco.prepend(pag); pinta();
  return {pinta, tira(){ pag.remove(); palco.style.background = antes; }};
}

function liga(alvo, op = {}){
  const tela = alvo === document.body || alvo === document.documentElement;
  const cfg = {vara: 50, linha: 420, lento: 1, claro: 0, ...op};
  const pag = tela ? null : pagina(alvo, cfg);
  const SEL = tela ? (cfg.seletor || '.card') : '.vr-card';
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:${tela ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483000;opacity:0;transition:opacity .15s`;
  (tela ? document.body : alvo).append(cv);
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // a linha: nó 0 (a ponta da vara, segue o mouse) até N (a boia) e M (o olho do anzol); (ox, oy) = o passo anterior
  const px = new Float64Array(M + 1), py = new Float64Array(M + 1), ox = new Float64Array(M + 1), oy = new Float64Array(M + 1);
  const w = new Float64Array(M + 1).fill(1); w[0] = 0; w[N] = .4; w[M] = .06;   // a boia é leve; anzol e chumbada pesam
  let s = 1, Lr = 50, Lresto = LRESTO, Lider = LIDER, Lmax = 420;
  let fase = 'mao', L = LRESTO, tVoo = 0, tranco = 0, preso = false, tPreso = 0, vRec = 0, giro = 0, pulso = 0;
  let hx = 0, hy = 0, hox = 0, hoy = 0, b = 0, vb = 0;            // o cabo (onde a mão segura) e a curva da vara
  let vmx = 0, vmy = 0, T = 0, sobre = null, fisga = null;          // a mão, a tensão e o card fisgado
  let mx = 0, my = 0, dentro = false, larg = 0, alt = 0, dpr = 1, bx0 = 0, by0 = 0, antes = 0, sobra = 0, pedido = 0, parado = 0;
  let ocioso = 0, fezPeixe = false, peixes = 0, peixe = null, x0voo = 0, y0voo = 0, folga = 0;   // folga: sem fisgar logo depois de arrancar
  const cards = new Map(), marcas = [];

  function medidas(){
    s = cfg.vara / 50; Lr = cfg.vara; Lresto = LRESTO * s; Lider = LIDER * s; Lmax = Math.max(120, cfg.linha);
    if(fase === 'mao') L = Lresto;
  }
  function mede(){
    const r = tela ? {width: innerWidth, height: innerHeight} : alvo.getBoundingClientRect();
    larg = r.width; alt = r.height; dpr = devicePixelRatio || 1;
    cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr); acorda();
  }
  const comp = i => i <= N ? L * i / N : L + Lider * (i - N) / LID;   // o tanto de linha da ponta até o nó i
  // recomeça recolhida, pendurada reta embaixo da ponta
  function poe(x, y){
    if(fisga) solta(false);
    fase = 'mao'; L = Lresto; tranco = 0; vRec = 0; b = vb = 0;
    for(let i = 0; i <= M; i++){ px[i] = ox[i] = x; py[i] = oy[i] = y + comp(i); }
    hx = hox = x + Math.cos(ANG) * Lr; hy = hoy = y + Math.sin(ANG) * Lr;
  }

  // ---- os cards: cada um que a linha mexe é uma mola (translate e rotate do estilo, que somam com o transform do jogo) ----
  const base = () => tela ? {left: 0, top: 0} : alvo.getBoundingClientRect();
  function card(el){
    let c = cards.get(el);
    if(c) return c;
    const r = el.getBoundingClientRect(), o = base();
    c = {el, w: r.width, h: r.height, cx: r.left - o.left + r.width / 2, cy: r.top - o.top + r.height / 2,
      x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, m: Math.max(1, r.width * r.height / MASSA), est: [el.style.translate, el.style.rotate],
      fundo: getComputedStyle(el).backgroundColor};
    if(/rgba\(.*,\s*0\)|transparent/.test(c.fundo)) c.fundo = '#8A96AB';
    c.I = c.m * (c.w * c.w + c.h * c.h) / 12;
    cards.set(el, c); return c;
  }
  // um ponto (u, v) do card, nas coordenadas dele, levado para a tela
  const mundo = (c, u, v) => { const co = Math.cos(c.a), si = Math.sin(c.a); return [c.cx + c.x + u * co - v * si, c.cy + c.y + u * si + v * co]; };
  const giraV = (c, u, v) => { const co = Math.cos(c.a), si = Math.sin(c.a); return [u * co - v * si, u * si + v * co]; };
  // o card embaixo de um ponto (o canvas não pega o mouse, então elementFromPoint acha o que está por baixo)
  function cardEm(x, y){
    const o = base(), el = document.elementFromPoint(x + o.left, y + o.top), c = el && el.closest && el.closest(SEL);
    return c && (tela || alvo.contains(c)) ? c : null;
  }
  // o anzol entrou no card el indo de (x0, y0) para (x1, y1): fisga na borda por onde entrou
  function fisgaEm(el, x0, y0, x1, y1){
    const c = card(el), hw = c.w / 2, hh = c.h / 2;
    // para as coordenadas do card (o card pode estar girado de uma batida anterior)
    const loc = (x, y) => { const dx = x - c.cx - c.x, dy = y - c.cy - c.y, co = Math.cos(-c.a), si = Math.sin(-c.a); return [dx * co - dy * si, dx * si + dy * co]; };
    const [u0, v0] = loc(x0, y0), [u1, v1] = loc(x1, y1), du = u1 - u0, dv = v1 - v0;
    const eu = du > 0 ? (-hw - u0) / du : du < 0 ? (hw - u0) / du : -Infinity, ev = dv > 0 ? (-hh - v0) / dv : dv < 0 ? (hh - v0) / dv : -Infinity;
    let t = Math.max(eu, ev), nu, nv;
    if(t >= 0 && t <= 1){ if(eu > ev){ nu = du > 0 ? -1 : 1; nv = 0; } else { nu = 0; nv = dv > 0 ? -1 : 1; } }
    else {
      // já estava dentro: a borda mais perto de onde ele está
      t = 1; const d = [hw + u1, hw - u1, hh + v1, hh - v1], k = d.indexOf(Math.min(...d));
      [nu, nv] = [[-1, 0], [1, 0], [0, -1], [0, 1]][k];
    }
    let eu0 = u0 + du * t, ev0 = v0 + dv * t;
    if(nu) eu0 = nu * hw; else ev0 = nv * hh;
    eu0 = Math.max(-hw + 6, Math.min(hw - 6, eu0)); ev0 = Math.max(-hh + 6, Math.min(hh - 6, ev0));
    if(nu) eu0 = nu * hw; else ev0 = nv * hh;
    fisga = {c, u: eu0, v: ev0, nu, nv, cravado: false};
    fase = 'fisgado'; w[M] = 0;
    // o anzol bate no card: um empurrão pequeno, do jeito que ele vinha
    const vx = (px[M] - ox[M]) / PASSO, vy = (py[M] - oy[M]) / PASSO, k = .04 / c.m;
    c.vx += Math.max(-160, Math.min(160, vx * k)); c.vy += Math.max(-160, Math.min(160, vy * k));
    const [ex, ey] = mundo(c, eu0, ev0);
    if(!calmo) marcas.push({tipo: 'toc', x: ex, y: ey, nx: nu, ny: nv, t: 0});
    pino(); ox[M] = px[M]; oy[M] = py[M];
  }
  // o olho do anzol fisgado: fora do card, um pouco para fora da borda; a haste entra no card
  function pino(){
    const f = fisga, c = f.c, [ex, ey] = mundo(c, f.u, f.v), [nx, ny] = giraV(c, f.nu, f.nv);
    px[M] = ex + nx * 7 * s; py[M] = ey + ny * 7 * s;
  }
  // o anzol sai do card: arrancando (com lasquinhas, a marca e o anzol voltando pela linha) ou só soltando
  function solta(arranca){
    const f = fisga; if(!f) return;
    fisga = null; w[M] = .06; fase = 'fora'; sobre = f.c.el;
    if(!arranca) return;
    folga = .4;
    const c = f.c, [ex, ey] = mundo(c, f.u, f.v), [nx, ny] = giraV(c, f.nu, f.nv);
    const dx = px[0] - px[M], dy = py[0] - py[M], d = Math.hypot(dx, dy) || 1, v = Math.min(1500, 250 + T * .13);
    for(let i = N; i <= M; i++){ const k = (i - N + 1) / (LID + 1); ox[i] = px[i] - dx / d * v * PASSO * k; oy[i] = py[i] - dy / d * v * PASSO * k; }
    if(calmo) return;
    for(let i = marcas.length - 1; i >= 0; i--) if(marcas[i].tipo === 'rasgo' && marcas[i].c === c) marcas.splice(i, 1);
    marcas.push({tipo: 'rasgo', c, u: f.u, v: f.v, nu: f.nu, nv: f.nv, t: 0});
    marcas.push({tipo: 'lascas', t: 0, cor: c.fundo, p: Array.from({length: 5}, () => {
      const a = Math.atan2(dy, dx) + (Math.random() - .5) * 1.8, sp = 120 + Math.random() * 260;
      return {x: ex + nx * 2, y: ey + ny * 2, vx: Math.cos(a) * sp + nx * 60, vy: Math.sin(a) * sp + ny * 60 - 80, a: Math.random() * 6, va: (Math.random() - .5) * 30, l: 2 + Math.random() * 2.5};
    })});
  }

  // ---- o que acontece com o comprimento da linha ----
  function linha(h){
    if(tranco > 0){ tranco -= h; L = Math.max(Lresto, L - TRANCO * s / TRANCO_T * h); giro -= TRANCO * s / TRANCO_T * h / (3 * s); }
    if(preso && fase !== 'mao' && fase !== 'voa' && (tPreso += h) > .16){
      // com o card fisgado, recolhe devagar e vai até a boia encostar na ponta (aí a tensão arranca o anzol)
      const teto = fisga ? BRIGA : RECOLHE;
      vRec = Math.min(teto, vRec + RECOLHE * h / .25); L = Math.max(fisga ? 3 * s : Lresto, L - vRec * h); giro -= vRec * h / (3 * s);
    } else vRec = 0;
    if(fase === 'voa'){
      // a linha corre do molinete conforme o anzol puxa, até acabar
      tVoo += h;
      const d = Math.hypot(px[N] - px[0], py[N] - py[0]);
      if(d > L * .96){ const n = Math.min(Lmax, d / .96); giro += (n - L) / (3 * s); L = n; }
      const vr = ((px[N] - ox[N]) * (px[N] - px[0]) + (py[N] - oy[N]) * (py[N] - py[0])) / (d || 1) / h;
      if(tVoo > .12 && (L >= Lmax || py[M] >= alt - 4 || vr < 40)) fase = 'fora';
    }
    if(fase === 'fora' && L <= Lresto + .01){ fase = 'mao'; pulso = 1; L = Lresto; }
  }

  function passo(h, ax, ay){
    // a mão, suavizada (~0,08 s): é ela que mira o lançamento
    const k = 1 - Math.exp(-h / .08); vmx += ((ax - px[0]) / h - vmx) * k; vmy += ((ay - py[0]) / h - vmy) * k;
    linha(h);
    const g = G * h * h, amL = Math.exp(-h * 3), amB = Math.exp(-h * 2);
    const amA = Math.exp(-h * (calmo ? 8 : fase === 'mao' ? 2.4 : fase === 'voa' ? .3 : 1));
    for(let i = 1; i <= M; i++){
      if(i === M && fisga) continue;
      const am = i === M ? amA : i >= N ? amB : amL, vx = (px[i] - ox[i]) * am, vy = (py[i] - oy[i]) * am;
      ox[i] = px[i]; oy[i] = py[i]; px[i] += vx; py[i] += vy + g * (i === M && peixe && peixe.fase === 'morde' ? 3.2 : 1);
    }
    ox[0] = px[0]; oy[0] = py[0]; px[0] = ax; py[0] = ay;
    if(fisga) pino();
    const sL = L / N, sD = Lider / LID;
    for(let v = 0; v < VOLTAS; v++){
      for(let i = 0; i < M; i++){
        const dx = px[i + 1] - px[i], dy = py[i + 1] - py[i], d = Math.hypot(dx, dy) || 1e-6, ws = w[i] + w[i + 1];
        if(!ws) continue;
        const c = (d - (i < N ? sL : sD)) / (d * ws);
        px[i] += dx * c * w[i]; py[i] += dy * c * w[i]; px[i + 1] -= dx * c * w[i + 1]; py[i + 1] -= dy * c * w[i + 1];
      }
      // nenhum nó fica mais longe da ponta do que a linha até ele deixa (o anzol pesado não estica a linha)
      for(let i = 2; i <= M; i++){
        if(i === M && fisga) continue;
        const dx = px[i] - px[0], dy = py[i] - py[0], d = Math.hypot(dx, dy), lim = comp(i);
        if(d > lim){ const c = (d - lim) / d; px[i] -= dx * c; py[i] -= dy * c; }
      }
      for(let i = 1; i <= M; i++){
        if(i === M && fisga) continue;
        const r = i === M ? 3 : i === N ? 4 * s : 1;
        px[i] = Math.min(larg - r, Math.max(r, px[i])); py[i] = Math.min(alt - r, Math.max(r, py[i]));
      }
    }
    // no chão, o anzol e a boia arrastam (atrito forte); na parede, o anzol volta com pouco
    for(const i of [N, N + 1, N + 2, M]){
      if(i === M && fisga) continue;
      const r = i === M ? 3 : i === N ? 4 * s : 1;
      if(py[i] >= alt - r - .3){ ox[i] = px[i] - (px[i] - ox[i]) * Math.exp(-h * 14); if(py[i] > oy[i]) oy[i] = py[i]; }
      if(i === M && (px[i] <= r + .01 || px[i] >= larg - r - .01)) ox[i] = px[i] + (px[i] - ox[i]) * .3;
    }
    // a tensão: o que a linha esticada passa do comprimento (só quando o anzol está preso em algo)
    if(fisga){
      const d = Math.hypot(px[M] - px[0], py[M] - py[0]);
      T = K * Math.max(0, d - L - Lider);
      if(T > ARRANCA * (fisga.cravado ? CRAVA : 1)) solta(true);
    } else T = 0;
    molas(h);
    maoVara(h);
  }
  // os cards fisgados ou balançando: mola com pouco amortecimento; a linha puxa pelo ponto do anzol (força e giro)
  function molas(h){
    for(const c of cards.values()){
      let fx = 0, fy = 0, tq = 0;
      if(fisga && fisga.c === c && T){
        const dx = px[M - 1] - px[M], dy = py[M - 1] - py[M], d = Math.hypot(dx, dy) || 1;
        fx = T * dx / d; fy = T * dy / d;
        const [rx, ry] = giraV(c, fisga.u, fisga.v); tq = rx * fy - ry * fx;
      }
      c.vx += (fx / c.m - OMEGA * OMEGA * c.x - 2 * ZETA * OMEGA * c.vx) * h; c.x += c.vx * h;
      c.vy += (fy / c.m - OMEGA * OMEGA * c.y - 2 * ZETA * OMEGA * c.vy) * h; c.y += c.vy * h;
      c.va += (tq / c.I - OMEGA * OMEGA * c.a - 2 * ZETA * OMEGA * c.va) * h; c.a = Math.max(-.14, Math.min(.14, c.a + c.va * h));
    }
  }
  // a mão segura o cabo com uma mola (a vara balança atrasada); a curva segue a tensão e vibra quando ela some
  function maoVara(h){
    const alvoX = px[0] + Math.cos(ANG) * Lr, alvoY = py[0] + Math.sin(ANG) * Lr, W = 2 * Math.PI * VOLTA;
    // puxando, a vara aponta um pouco mais para o lado da linha (o cabo vai para o outro lado)
    const dx = px[1] - px[0], dy = py[1] - py[0], d = Math.hypot(dx, dy) || 1, carga = Math.min(1.3, tensao() / ARRANCA);
    const vx = (hx - hox) * Math.exp(-h * 7), vy = (hy - hoy) * Math.exp(-h * 7);
    hox = hx; hoy = hy;
    hx += vx + (W * W * (alvoX - hx) - dx / d * carga * 900) * h * h; hy += vy + (W * W * (alvoY - hy) - dy / d * carga * 900) * h * h;
    let cx = hx - px[0], cy = hy - py[0], dc = Math.hypot(cx, cy) || 1;
    // até ~50° para cada lado do jeito de segurar
    let a = Math.atan2(cy, cx), da = a - ANG; da -= 2 * Math.PI * Math.round(da / (2 * Math.PI));
    if(Math.abs(da) > .9) a = ANG + Math.sign(da) * .9;
    else a = Math.atan2(cy, cx);
    hx = px[0] + Math.cos(a) * Lr; hy = py[0] + Math.sin(a) * Lr;
    // a curva: para o lado em que a linha puxa, perpendicular à vara
    cx = Math.cos(a); cy = Math.sin(a); dc = (cx * dy - cy * dx) / d;   // o seno do ângulo entre a vara e a linha
    const alvoB = -Lr * .3 * carga * (.35 + .65 * Math.abs(dc)) * Math.sign(dc || 1), Wb = 2 * Math.PI * 4;
    vb += (Wb * Wb * (alvoB - b) - 2 * .16 * Wb * vb) * h; b += vb * h;
  }
  // a carga na ponta: a tensão do card, o peixe se debatendo, ou o peso da boia e do anzol pendurados
  function tensao(){
    if(fisga) return T;
    if(peixe && peixe.fase === 'morde') return ARRANCA * (.42 + .12 * Math.sin(peixe.t * 23));
    return fase === 'voa' ? ARRANCA * .02 : ARRANCA * .05;
  }

  // ---- o peixe: pula de baixo até o anzol, morde e se debate; com um clique, o Gon fisga ----
  function chamaPeixe(){
    const dx = px[M] - px[M - 1], dy = py[M] - py[M - 1], d = Math.hypot(dx, dy) || 1;
    const alvoX = px[M] + (dx * CURVA[1] + dy * CURVA[0]) / d * s, alvoY = py[M] + (dy * CURVA[1] - dx * CURVA[0]) / d * s;   // o fundo da curva
    if(fisga || fase === 'voa' || alvoY > alt - 70 || calmo) return;
    const x0 = Math.max(30, Math.min(larg - 30, alvoX + (alvoX > larg / 2 ? -1 : 1) * (60 + Math.random() * 80))), y0 = alt + 24;
    const hgt = y0 - alvoY, vy = -Math.sqrt(2 * G * (hgt + 16)), t = (-vy - Math.sqrt(vy * vy - 2 * G * hgt)) / G;
    peixe = {fase: 'pula', x: x0, y: y0, vx: (alvoX - x0) / t, vy, t: 0, chega: t, ang: Math.atan2(vy, (alvoX - x0) / t), r: 11 * s, rabo: 0, va: 0};
    acorda();
  }
  function mexePeixe(dt){
    const p = peixe; p.t += dt;
    if(p.fase === 'pula' || p.fase === 'cai' || p.fase === 'pescado'){
      p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rabo = Math.sin(p.t * 30) * .5;
      if(p.fase === 'pula'){ p.ang = Math.atan2(p.vy, p.vx); if(p.t >= p.chega){ p.fase = 'morde'; p.t = 0; p.tug = 0; } }
      else p.ang += p.va * dt;
      if(p.y > alt + 60 && p.vy > 0) peixe = null;
    } else if(p.fase === 'morde'){
      // pendurado pela boca no anzol, se debatendo: puxões para os lados e para baixo
      p.tug -= dt;
      if(p.tug <= 0){ p.tug = .07 + Math.random() * .07; const lado = (Math.random() - .5) * 2;
        ox[M] -= lado * 140 * PASSO; oy[M] -= (60 + Math.random() * 60) * PASSO; }
      const dx = px[M] - px[M - 1], dy = py[M] - py[M - 1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const bx = px[M] + (ux * CURVA[1] + uy * CURVA[0]) * s, by = py[M] + (uy * CURVA[1] - ux * CURVA[0]) * s;   // o fundo da curva
      p.rabo = Math.sin(p.t * 26) * .7; p.ang = Math.atan2(-uy, -ux) + Math.sin(p.t * 19) * .4;
      p.x = bx - Math.cos(p.ang) * p.r * .95; p.y = by - Math.sin(p.ang) * p.r * .95;
      if(p.t > 1.15){ p.fase = 'cai'; p.vx = (px[M] - ox[M]) / PASSO * .5 + (Math.random() - .5) * 120; p.vy = -180; p.va = (Math.random() - .5) * 14; }
    }
  }
  // o clique com o peixe mordendo: ele sai voando por cima da vara, girando, e cai do outro lado
  function pesca(){
    const p = peixe; p.fase = 'pescado'; peixes++;
    const dx = px[0] - p.x, dy = py[0] - p.y, d = Math.hypot(dx, dy) || 1;
    p.vx = dx / d * 420 + (px[0] > larg / 2 ? -1 : 1) * 60; p.vy = Math.min(-900, -Math.sqrt(2 * G * Math.max(40, p.y - py[0] + 90))); p.va = 16;
    ox[M] = px[M] + dx / d * 500 * PASSO; oy[M] = py[M] + 700 * PASSO;
    marcas.push({tipo: 'pegou', x: px[0], y: py[0], t: 0});
  }

  // ---- lançar, travar, dar o tranco ----
  function lanca(){
    const v = Math.hypot(vmx, vmy);
    // jogando o mouse, a linha vai para onde a mão ia; parada, para a frente (o lado da ponta), por cima
    let ux = -.6, uy = -.8, sp = LANCA;
    if(v > 260){ ux = vmx / v; uy = vmy / v; sp = Math.min(LANCA_MAX, Math.max(LANCA, v * 1.15)); }
    fase = 'voa'; tVoo = 0; sobre = cardEm(px[M], py[M]); x0voo = px[M]; y0voo = py[M];
    for(let i = 1; i <= M; i++){ const k = i >= N ? 1 : i / N; ox[i] = px[i] - ux * sp * k * PASSO; oy[i] = py[i] - uy * sp * k * PASSO; }
    vb -= Lr * 4; pulso = .6;   // a vara chicoteia
  }
  function daTranco(){
    tranco = TRANCO_T; vb += Lr * 14 * Math.sign(b || 1);
    if(fisga && !fisga.cravado){ fisga.cravado = true; if(!calmo){ const [ex, ey] = mundo(fisga.c, fisga.u, fisga.v); marcas.push({tipo: 'crava', x: ex, y: ey, t: 0}); } }
  }

  // ---- pintura ----
  function pintaMarcas(){
    for(const m of marcas){
      if(m.tipo === 'toc' || m.tipo === 'crava'){
        // o anzol entrando (e cravando): risquinhos em leque saindo do ponto
        const dur = m.tipo === 'crava' ? .22 : .16, k = m.t / dur, n = m.tipo === 'crava' ? 7 : 4;
        ctx.beginPath();
        for(let i = 0; i < n; i++){ const a = (m.tipo === 'crava' ? 0 : Math.atan2(m.ny, m.nx) - 1.1) + i * (m.tipo === 'crava' ? 2 * Math.PI / n : 2.2 / (n - 1));
          const d0 = 3 + 9 * k, d1 = d0 + (m.tipo === 'crava' ? 7 : 5) * (1 - k * .6);
          ctx.moveTo(m.x + Math.cos(a) * d0, m.y + Math.sin(a) * d0); ctx.lineTo(m.x + Math.cos(a) * d1, m.y + Math.sin(a) * d1); }
        ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(8,10,16,.6)'; ctx.lineWidth = 2.8; ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 1.3; ctx.stroke();
      } else if(m.tipo === 'rasgo'){
        // a marca do anzol na borda: um V rasgado que some
        const a = Math.max(0, 1 - m.t / 1.4), [ex, ey] = mundo(m.c, m.u, m.v), [nx, ny] = giraV(m.c, m.nu, m.nv), tx = -ny, ty = nx;
        ctx.beginPath(); ctx.moveTo(ex + tx * 3.5, ey + ty * 3.5); ctx.lineTo(ex - nx * 4, ey - ny * 4); ctx.lineTo(ex - tx * 2.5, ey - ty * 2.5);
        ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(8,10,16,${.75 * a})`; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.strokeStyle = `rgba(232,236,244,${.5 * a})`; ctx.lineWidth = .8; ctx.stroke();
      } else if(m.tipo === 'lascas'){
        const a = Math.max(0, 1 - m.t / .8);
        for(const q of m.p){ ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.globalAlpha = a;
          ctx.fillStyle = m.cor; ctx.fillRect(-q.l, -q.l * .6, q.l * 2, q.l * 1.2); ctx.strokeStyle = 'rgba(8,10,16,.6)'; ctx.lineWidth = .8; ctx.strokeRect(-q.l, -q.l * .6, q.l * 2, q.l * 1.2); ctx.restore(); }
      } else if(m.tipo === 'pegou'){
        // pescou: a ponta da vara brilha num estalo
        const k = m.t / .35, d0 = 5 + 14 * k, d1 = d0 + 7 * (1 - k);
        ctx.beginPath();
        for(let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + .2; ctx.moveTo(m.x + Math.cos(a) * d0, m.y + Math.sin(a) * d0); ctx.lineTo(m.x + Math.cos(a) * d1, m.y + Math.sin(a) * d1); }
        ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(8,10,16,.55)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = `rgba(255,224,140,${1 - k})`; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  }
  const DURA = {toc: .16, crava: .22, rasgo: 1.4, lascas: .8, pegou: .35};
  function pintaAnzol(){
    const dx = px[M] - px[M - 1], dy = py[M] - py[M - 1], d = Math.hypot(dx, dy) || 1;
    if(!fisga){ anzol(ctx, px[M], py[M], dx / d, dy / d, s); return; }
    // fisgado: a haste entra no card pela borda (o resto fica escondido dentro dele) e a borda ganha o furinho
    const f = fisga, c = f.c, [nx, ny] = giraV(c, f.nu, f.nv), [ex, ey] = mundo(c, f.u, f.v);
    let ux = -nx * .7 + dx / d * .3, uy = -ny * .7 + dy / d * .3; const du = Math.hypot(ux, uy) || 1; ux /= du; uy /= du;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, larg, alt);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, bb]) => mundo(c, a * c.w / 2, bb * c.h / 2));
    ctx.moveTo(...cs[0]); for(const p of cs.slice(1)) ctx.lineTo(...p); ctx.closePath();
    ctx.clip('evenodd');
    anzol(ctx, px[M], py[M], ux, uy, s);
    ctx.restore();
    ctx.beginPath(); ctx.arc(ex - nx * 1.2, ey - ny * 1.2, 1.6 * s, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(8,10,16,.75)'; ctx.fill();
    const tx = -ny, ty = nx;
    ctx.beginPath(); ctx.moveTo(ex + tx * 3.2 * s, ey + ty * 3.2 * s); ctx.lineTo(ex - tx * 3.2 * s, ey - ty * 3.2 * s);
    ctx.strokeStyle = 'rgba(8,10,16,.45)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function pinta(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, larg, alt);
    pintaMarcas();
    fio(ctx, px, py, 0, N); fio(ctx, px, py, N, M);
    const bx = px[N + 1] - px[N - 1], by = py[N + 1] - py[N - 1], bd = Math.hypot(bx, by) || 1;
    boia(ctx, px[N], py[N], bx / bd, by / bd, s);
    const cx = px[M - 1] - px[M - 2], cy = py[M - 1] - py[M - 2], cd = Math.hypot(cx, cy) || 1;
    chumbada(ctx, px[M - 1], py[M - 1], cx / cd, cy / cd, s);
    pintaAnzol();
    if(peixe) desenhaPeixe(ctx, peixe);
    vara(ctx, px[0], py[0], hx, hy, b, giro, s, pulso);
  }

  function quadro(agora){
    pedido = 0;
    const dt = Math.min(.05, antes ? (agora - antes) / 1000 : 1 / 60) / Math.max(1, cfg.lento); antes = agora;
    sobra += dt; let n = Math.floor(sobra / PASSO); sobra -= n * PASSO;
    if(n > 12){ n = 12; sobra = 0; }
    const bx = px[0], by = py[0], ax0 = px[M], ay0 = py[M];
    for(let i = 1; i <= n; i++) passo(PASSO, i < n ? bx + (mx - bx) * i / n : mx, i < n ? by + (my - by) * i / n : my);
    // o anzol solto passou por um card? fisga na borda por onde entrou (o card em que ele começou não conta até sair).
    // Voando, só depois de longe da mão e já caindo: ele cai no card, e não pega o vizinho logo de saída
    if(!fisga && (fase === 'voa' || fase === 'fora') && n){
      const dx = px[M] - ax0, dy = py[M] - ay0, d = Math.hypot(dx, dy);
      const pega = !folga && d / dt > 70 && (fase !== 'voa' || (dy > 0 && Math.hypot(px[M] - x0voo, py[M] - y0voo) > 80));
      let x0 = ax0, y0 = ay0;
      for(let k = 1, ks = Math.max(1, Math.ceil(d / 6)); k <= ks; k++){
        const x1 = ax0 + dx * k / ks, y1 = ay0 + dy * k / ks, el = cardEm(x1, y1);
        if(pega && el && el !== sobre && !(sobre && el.contains(sobre))){ fisgaEm(el, x0, y0, x1, y1); break; }
        sobre = el; x0 = x1; y0 = y1;
      }
    } else if(!fisga && fase === 'mao') sobre = null;
    pulso = Math.max(0, pulso - dt / .2); folga = Math.max(0, folga - dt);
    if(peixe) mexePeixe(dt);
    for(let i = marcas.length - 1; i >= 0; i--){
      const m = marcas[i]; m.t += dt;
      if(m.p) for(const q of m.p){ q.x += q.vx * dt; q.y += q.vy * dt; q.vy += G * .45 * dt; q.vx *= Math.exp(-dt * 2.5); q.a += q.va * dt; }
      if(m.t > DURA[m.tipo]) marcas.splice(i, 1);
    }
    // os cards: o estilo uma vez por quadro; parado de novo, devolve o estilo de antes
    for(const c of cards.values()){
      if(!(fisga && fisga.c === c) && Math.abs(c.x) + Math.abs(c.y) < .05 && Math.abs(c.vx) + Math.abs(c.vy) < .5 && Math.abs(c.a) < 3e-4 && Math.abs(c.va) < .01
        && !marcas.some(m => m.c === c)){
        c.el.style.translate = c.est[0]; c.el.style.rotate = c.est[1]; cards.delete(c.el); continue;
      }
      c.el.style.translate = `${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`; c.el.style.rotate = `${c.a.toFixed(4)}rad`;
    }
    pinta();
    // tudo parado e o mouse quieto: o laço para até o próximo evento (e o peixe é chamado)
    let mov = Math.hypot(hx - hox, hy - hoy) / PASSO + Math.abs(vb);
    for(let i = 1; i <= M; i++) mov = Math.max(mov, Math.hypot(px[i] - ox[i], py[i] - oy[i]) / PASSO);
    const quieto = mov < 3 && fase !== 'voa' && !tranco && !vRec && !peixe && !marcas.length && ![...cards.values()].some(c => !(fisga && fisga.c === c));
    parado = quieto && Math.abs(mx - bx) + Math.abs(my - by) < .01 ? parado + 1 : 0;
    if(parado < 30) pedido = requestAnimationFrame(quadro);
    else {
      antes = 0; clearTimeout(ocioso);
      if(dentro && !calmo && !fezPeixe && !preso) ocioso = setTimeout(() => { fezPeixe = true; chamaPeixe(); }, ESPERA);
    }
  }
  function acorda(){ parado = 0; if(!pedido) pedido = requestAnimationFrame(quadro); }

  const pos = e => { if(tela) return [e.clientX, e.clientY]; const r = alvo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e){
    if(e.pointerType === 'touch') return;
    [mx, my] = pos(e); clearTimeout(ocioso); fezPeixe = false;
    if(!dentro){ dentro = true; poe(mx, my); cv.style.opacity = 1; }
    acorda();
  }
  // segurar não pode marcar texto (como nos outros cursores); num campo de texto o clique é do campo
  const campo = e => !!(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'));
  const semSel = e => e.preventDefault();
  const trava = on => {
    document.documentElement.style.userSelect = on ? 'none' : '';
    document.removeEventListener('selectstart', semSel); if(on) document.addEventListener('selectstart', semSel);
  };
  // apertar: recolhida, lança; voando, trava a linha; com a linha fora, o tranco (e segurando, recolhe)
  function aperta(e){
    if(e.pointerType === 'touch' || e.button !== 0 || campo(e)) return;
    move(e); preso = true; tPreso = 0; trava(true);
    if(peixe && peixe.fase === 'morde') pesca();
    else if(fase === 'mao') lanca();
    else if(fase === 'voa'){ fase = 'fora'; daTranco(); }
    else daTranco();
    if(!tela) try { alvo.setPointerCapture(e.pointerId); } catch {}
    acorda();
  }
  function soltaBotao(){ if(!preso) return; preso = false; trava(false); acorda(); }
  function sai(){ if(preso) return; dentro = false; clearTimeout(ocioso); peixe = null; if(fisga) solta(false); cv.style.opacity = 0; acorda(); }
  const ev = tela ? document.documentElement : alvo;
  const ouvintes = [['pointermove', move], ['pointerdown', aperta], ['pointerup', soltaBotao], ['pointercancel', soltaBotao], ['pointerleave', sai]];
  ouvintes.forEach(([n, f]) => ev.addEventListener(n, f));
  const obs = tela ? null : new ResizeObserver(mede);
  if(obs) obs.observe(alvo); else addEventListener('resize', mede);
  mede(); medidas(); poe(larg / 2, alt / 3);

  return {
    ajusta(o){ Object.assign(cfg, o); medidas(); if(pag) pag.pinta(); acorda(); },
    estado: () => ({fase, linha: L + Lider, tensao: T, cravado: !!(fisga && fisga.cravado), card: fisga ? fisga.c.el : null,
      x: px[M], y: py[M], peixe: peixe ? peixe.fase : null, peixes, curva: b, preso, laco: !!pedido}),
    legenda(){
      const lim = fisga ? ARRANCA * (fisga.cravado ? CRAVA : 1) : 1;
      return FASES[fase] + (fase !== 'mao' ? ` · ${Math.round(L + Lider)} px de linha` : '')
        + (fisga ? (fisga.cravado ? ' · anzol cravado' : ' · fisgada leve (clique: tranco)') + ` · tensão ${Math.round(100 * T / lim)}%` : '')
        + (vRec ? ' · recolhendo' : '')
        + (peixe ? {pula: ' · um peixe pulou!', morde: ' · o peixe mordeu: clique!', cai: ' · o peixe escapou', pescado: ' · pescou!'}[peixe.fase] : '')
        + (peixes ? ` · peixes: ${peixes}` : '');
    },
    desliga(){
      ouvintes.forEach(([n, f]) => ev.removeEventListener(n, f));
      if(obs) obs.disconnect(); else removeEventListener('resize', mede);
      for(const c of cards.values()){ c.el.style.translate = c.est[0]; c.el.style.rotate = c.est[1]; }
      cards.clear(); trava(false); cancelAnimationFrame(pedido); clearTimeout(ocioso); cv.remove(); if(pag) pag.tira();
    },
  };
}
function desenhaPeixe(ctx, p){ peixe(ctx, p.x, p.y, p.ang, p.r, p.rabo); }

// o que a bancada mostra: legenda das fases, controles e prévias paradas (com as classes da bancada)
const FASES = {mao: 'linha recolhida', voa: 'lançando', fora: 'linha fora', fisgado: 'fisgado'};
function previas(el, cfg){
  const tela = (lw, lh, f) => { const c = document.createElement('canvas'), d = devicePixelRatio || 1;
    c.className = 'prev'; c.width = Math.ceil(lw * d); c.height = Math.ceil(lh * d); c.style.width = lw + 'px'; c.style.height = lh + 'px';
    const x = c.getContext('2d'); x.scale(d, d); f(x); return c; };
  el.innerHTML = '<section><h2>parada, com a vara de 80 a 36 px, no escuro e no claro</h2><div class="linha"></div><div class="linha claro" style="margin-top:12px"></div></section>'
    + '<section><h2>a vara envergando: solta, fisgada leve, anzol cravado, no limite</h2><div class="linha"></div></section>'
    + '<section><h2>de perto (3×): a boia, a chumbada e o anzol · o peixe</h2><div class="linha"></div></section>';
  const [e, c, v, p] = el.querySelectorAll('.linha');
  [e, c].forEach(l => l.append(...[80, 64, cfg.vara, 36].map(t => tela(t * 1.1 + 12, t * 1.6 + 16, x => desenha(x, 8, 10, t)))));
  v.append(...[0, .35, .7, 1].map(k => tela(110, 110, x => desenha(x, 40, 22, 56, {curva: -56 * .3 * k * .9, puxa: [-1, .25 + k * .5], comprimento: 34}))));
  p.append(tela(120, 170, x => { x.scale(3, 3); desenha(x, 10, 6, 50, {comprimento: 14}); }),
    tela(130, 90, x => peixe(x, 65, 45, -.2, 38, .3)), tela(130, 90, x => peixe(x, 65, 45, -Math.PI / 2 - .3, 30, -.5)));
}
(window.CURSORES = window.CURSORES || {}).vara = {liga, desenha, previas,
  titulo: 'mexa o mouse · clique para lançar · clique de novo para o tranco · segure para recolher',
  dica: 'clique: lança (jogue o mouse junto para mirar: a linha vai para onde a mão ia) · com a linha voando, um clique trava a linha · o anzol que entra num card fisga na borda<br>com a linha fora, clique: tranco (no card fisgado, crava o anzol) · segurar: recolhe; puxando o card, ele vem como mola até o anzol arrancar e o card voltar balançando · parado uns segundos: um peixe pula para morder o anzol (clique enquanto ele morde para pescar)',
  controles: [{k: 'vara', rot: 'vara', min: 36, max: 80, un: 'px', padrao: 50}, {k: 'linha', rot: 'linha até', min: 200, max: 640, un: 'px', padrao: 420},
    {k: 'lento', rot: 'câmera lenta', min: 1, max: 6, un: '×', padrao: 1}, {k: 'claro', rot: 'fundo claro', min: 0, max: 1, un: '', padrao: 0}]};
})();
