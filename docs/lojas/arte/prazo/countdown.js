// Countdown do Genthru (at-countdown, raro, EM TESTE com a categoria Marca de prazo): a bomba do Countdown parada na
// linha da tarefa com prazo, em SVG, sem imagem. Raro = desenho, não movimento: nada se mexe.
//   com prazo      a bomba com os dias que faltam no visor; o pavio encurta conforme o prazo chega (7+ dias inteiro)
//   amanhã, hoje   o número fica vermelho; hoje o pavio está no fim, com a faísca encostando na bomba
//   atrasada       a bomba estourou: a explosão chapada com os dias de atraso (+2)
// Estilo dos carimbos: chapado, contorno de tinta, um tom de sombra, nada de brilho ou degradê.
//   CURSORES.countdown.marca(k, px)   o SVG da marca para k = dias até o prazo (0 hoje, negativo atrasada)
//   CURSORES.countdown.css(sel)       o CSS da marca na linha da Lista; no jogo: ':root[data-prazo="countdown"]'
//   titulo, dica, controles e previas(el, cfg): o que a bancada mostra
(() => {
const TINTA = '#0B0C10', CORPO = '#4A4F65', SOMBRA = '#363A4C', LUZ = '#8A90AE', LATAO = '#C9A253', VISOR = '#ECE6D2',
  PAVIO = '#CDB98C', VERM = '#E23B4E', AMAR = '#FFD23F';
const P = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// a explosão: estrela de pontas irregulares (sempre a mesma), raio maior r1 e menor r0
function estouro(cx, cy, r1, r0, n, fase){
  let d = '';
  for(let i = 0; i < n * 2; i++){
    const a = (i / (n * 2)) * Math.PI * 2 + fase, r = i % 2 ? r0 : r1 * (.82 + .18 * Math.abs(Math.sin(i * 2.7)));
    d += (i ? ' L' : 'M') + P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return d + ' Z';
}

function marca(k, px = 32){
  const num = k < 0 ? `+${Math.min(-k, 99)}` : String(Math.min(k, 99));
  const tit = k < 0 ? `atrasada ${-k} ${k === -1 ? 'dia' : 'dias'}: a bomba estourou` : k === 0 ? 'o prazo é hoje' : `faltam ${k} ${k === 1 ? 'dia' : 'dias'}`;
  const svg = c => `<svg class="at-cd" width="${px}" height="${px}" viewBox="0 0 40 40" role="img" aria-label="${tit}"><title>${tit}</title>${c}</svg>`;
  if(k < 0){
    // estourou: a explosão vermelha, o miolo amarelo e dois cacos da bomba voando
    return svg(`<path d="${estouro(20, 21, 18.5, 11, 9, .2)}" fill="${VERM}" stroke="${TINTA}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="${estouro(20, 21, 13.5, 10, 7, .6)}" fill="${AMAR}" stroke="${TINTA}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M3 6 L8 4.5 L7 9 Z M33 4 L38 7 L34 9.5 Z" fill="${CORPO}" stroke="${TINTA}" stroke-width="1.2" stroke-linejoin="round"/>
      <text x="20" y="25.8" text-anchor="middle" font-family="JetBrains Mono,ui-monospace,monospace" font-weight="800" font-size="${num.length > 2 ? 10.5 : 13}" fill="${TINTA}" letter-spacing="-.8">${num}</text>`);
  }
  // o pavio sai do bico e faz um S; o que já queimou some (7+ dias = inteiro, hoje = só a pontinha)
  const resta = k >= 7 ? 1 : [.1, .3, .42, .54, .66, .78, .9][k];
  const fio = 'M27.5 9.5 C30 5.5 33 7.5 34 4.5 C34.8 2.2 37 2 38.5 1.5';
  // onde a faísca fica: na ponta do que resta (aproximado pelo ponto do S, de 0 a 1)
  const ponta = t => { const a = [27.5, 9.5], b = [30, 5.5], c = [33, 7.5], d = [34, 4.5], e = [34.8, 2.2], f = [37, 2], g = [38.5, 1.5];
    const bz = (p0, p1, p2, p3, u) => [0, 1].map(i => (1-u)**3*p0[i] + 3*(1-u)**2*u*p1[i] + 3*(1-u)*u*u*p2[i] + u**3*p3[i]);
    return t <= .5 ? bz(a, b, c, d, t * 2) : bz(d, e, f, g, (t - .5) * 2); };
  const [fx, fy] = ponta(resta), vermelho = k <= 1, fs = vermelho ? 4.4 : 3.4;
  const faisca = `<path d="M${P(fx, fy - fs)} L${P(fx + fs * .3, fy - fs * .3)} L${P(fx + fs, fy)} L${P(fx + fs * .3, fy + fs * .3)} L${P(fx, fy + fs)} L${P(fx - fs * .3, fy + fs * .3)} L${P(fx - fs, fy)} L${P(fx - fs * .3, fy - fs * .3)} Z" fill="${AMAR}" stroke="${TINTA}" stroke-width=".9" stroke-linejoin="round"/><circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(fs * .3).toFixed(1)}" fill="${VERM}"/>`;
  return svg(`<path d="${fio}" pathLength="100" stroke-dasharray="${(resta * 100).toFixed(0)} 200" fill="none" stroke="${TINTA}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="${fio}" pathLength="100" stroke-dasharray="${(resta * 100).toFixed(0)} 200" fill="none" stroke="${PAVIO}" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="21.5" y="7.5" width="8" height="7" rx="1.2" transform="rotate(40 25.5 11)" fill="${LATAO}" stroke="${TINTA}" stroke-width="1.5"/>
    <circle cx="18" cy="24" r="14" fill="${CORPO}" stroke="${TINTA}" stroke-width="1.8"/>
    <path d="M7.2 31.5 A14 14 0 0 0 31.6 27.3 A13 13 0 0 1 7.2 31.5 Z" fill="${SOMBRA}"/>
    <path d="M8.5 13.5 A11 11 0 0 1 14.5 10.8" fill="none" stroke="${LUZ}" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="4.5" y="16.5" width="27" height="16" rx="2.6" fill="${VISOR}" stroke="${TINTA}" stroke-width="1.6"/>
    <text x="18" y="29.6" text-anchor="middle" font-family="JetBrains Mono,ui-monospace,monospace" font-weight="800" font-size="${num.length > 1 ? 13 : 15}" fill="${vermelho ? VERM : TINTA}" letter-spacing="-.6">${num}</text>
    ${faisca}`);
}

// na linha da Lista (.l-task): a marca entra numa coluna entre o texto e o XP; a etiqueta do prazo continua (é a data)
const css = sel => `${sel} .l-task:has(.at-cd){grid-template-columns:auto minmax(0,1fr) auto auto}
${sel} .at-cd{display:block;flex:none;margin:-6px 0}`;

// ---------- bancada: a Lista de mentira, com as cores do jogo ----------
const LISTA = `.lst{--panel:#1B1D28;--panel2:#222536;--ink:#E6E8F0;--soft:#9197AD;--faint:#5A6078;--hair:#2A2D3C;--track:#252838;--red:#F7768E;--amb:#E0AF68;--grn:#9ECE6A;
  display:grid;gap:14px;width:min(640px,100%);color:var(--ink);font:14px/1.45 var(--f-ui)}
.lst.cl{--panel:#FFFFFF;--panel2:#F5F6FB;--ink:#1D2030;--soft:#5E6480;--faint:#9AA0B8;--hair:#E3E5EE;--track:#E9EBF2;--red:#D6455D;--amb:#B7791F;background:#F1F2F7;padding:14px;border-radius:10px}
.lst h3{display:flex;align-items:baseline;gap:10px;margin:0 0 6px;padding:0 4px;font:700 13px var(--f-hud);letter-spacing:.04em;text-transform:uppercase}
.lst h3.late{color:var(--red)}
.lst ul{list-style:none;margin:0;padding:0;background:var(--panel);border:1px solid var(--hair);border-radius:14px;overflow:hidden}
.lst .l-task{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 12px;border-top:1px solid var(--hair)}
.lst .l-task:first-child{border-top:0}
.lst .l-task:hover{background:var(--panel2)}
.lst .l-ck{width:22px;height:22px;border-radius:7px;border:1.8px solid var(--c);background:none;padding:0}
.lst .l-body{min-width:0;display:flex;flex-direction:column;gap:3px}
.lst .l-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font:11.5px var(--f-mono);color:var(--soft)}
.lst .l-tag{border-radius:6px;padding:0 6px;background:var(--track)}
.lst .l-tag.nen{color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent)}
.lst .l-tag.l-late{color:var(--red)} .lst .l-tag.l-hoje{color:var(--amb)}
.lst .l-pri{font:700 11px var(--f-mono);color:var(--bg,#13141B);background:var(--red);border-radius:4px;padding:0 4px;margin-right:6px}
.lst .l-xp{font:700 13px var(--f-mono);color:var(--amb)}`;
const SEM3 = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const TAREFAS = [
  ['Atrasadas', 'late', [['Lista 3 de Cálculo II', -3, 'Ka', '#F7768E', 'CAL2', 'A', 18], ['Mandar o relatório do estágio', -1, 'Eh', '#7DCFFF', '', '', 12]]],
  ['Hoje', '', [['Entregar o trabalho de Redes', 0, 'Ka', '#F7768E', 'RED', 'A', 23]]],
  ['Próximos 7 dias', '', [['Estudar para a P2 de Banco de Dados', 1, 'Ma', '#9ECE6A', 'BD', 'B', 15], ['Revisar o artigo do TCC', 3, 'Ho', '#BB9AF7', 'TCC', '', 14], ['Pagar a conta de luz', 6, 'Eh', '#7DCFFF', '', '', 6]]],
  ['Sem prazo e depois', '', [['Ler o que são X.25, Frame Relay e ATM', 12, 'Ma', '#9ECE6A', 'RED', '', 9], ['Arrumar o quarto', null, 'Eh', '#7DCFFF', '', '', 5]]],
];
const NOMES = {Ka: 'Intensificação', Ma: 'Manipulação', Eh: 'Emissão', Ho: 'Transmutação'};
function dueTxt(k){
  if(k < 0) return `atrasada ${-k}d`;
  if(k === 0) return 'hoje';
  if(k === 1) return 'amanhã';
  const d = new Date(); d.setDate(d.getDate() + k);
  const dm = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return k < 7 ? `${SEM3[d.getDay()]} ${dm}` : dm;
}
function lista(cl, com, px){
  return `<div class="lst at-countdown${cl ? ' cl' : ''}">` + TAREFAS.map(([g, c, ts]) => `<div><h3 class="${c}">${g}</h3><ul>` + ts.map(([txt, k, n, cor, disc, pri, xp]) =>
    `<li class="l-task" style="--c:${cor}"><button class="l-ck" aria-label="concluir"></button><div class="l-body"><span class="l-txt">${pri ? `<span class="l-pri">${pri}</span>` : ''}${txt}</span>`
    + `<span class="l-tags"><span class="l-tag nen">${NOMES[n]}</span>${disc ? `<span class="l-tag">${disc}</span>` : ''}${k != null ? `<span class="l-tag${k < 0 ? ' l-late' : k === 0 ? ' l-hoje' : ''}">${dueTxt(k)}</span>` : ''}</span></div>`
    + `${com && k != null ? marca(k, px) : ''}<span class="l-xp">+${xp}</span></li>`).join('') + '</ul></div>').join('') + '</div>';
}

function previas(el, cfg){
  let st = document.getElementById('at-countdown-css');
  if(!st){ st = document.createElement('style'); st.id = 'at-countdown-css'; document.head.append(st); }
  st.textContent = LISTA + css('.at-countdown');
  const px = +cfg.tam;
  const todos = [9, 7, 5, 3, 2, 1, 0, -1, -3, -12];
  const rot = k => k < 0 ? `atrasada ${-k}d` : k === 0 ? 'hoje' : k === 1 ? 'amanhã' : `${k} dias`;
  const est = (cl, s) => `<div class="linha${cl ? ' claro' : ''}" style="gap:18px;align-items:flex-end">` + todos.map(k =>
    `<span style="display:grid;justify-items:center;gap:4px;font:11px var(--f-mono);color:${cl ? '#5E6480' : 'var(--dim)'}">${marca(k, s)}${rot(k)}</span>`).join('') + '</div>';
  el.innerHTML = `<section><h2>na Lista, com a marca a ${px} px (o pavio encurta até o prazo; amanhã e hoje em vermelho; atrasada = estourou), no escuro e no claro</h2><div class="linha" style="align-items:flex-start">${lista(false, true, px)}${lista(true, true, px)}</div></section>`
    + `<section><h2>cada estado, ampliado (64 px) e no tamanho da linha (${px} px)</h2>${est(false, 64)}<div style="height:12px"></div>${est(false, px)}<div style="height:12px"></div>${est(true, px)}</section>`
    + `<section><h2>como é hoje (a mesma Lista sem o item), para comparar</h2>${lista(false, false, px)}</section>`;
}

(window.CURSORES = window.CURSORES || {}).countdown = {marca, css, previas,
  titulo: 'Countdown do Genthru',
  dica: 'marca de prazo (categoria em teste): a bomba do Countdown parada na linha da tarefa com prazo, com os dias que faltam no visor<br>o pavio encurta conforme o prazo chega (7 dias ou mais = inteiro) · amanhã e hoje o número fica vermelho · atrasada = a bomba estourou, com os dias de atraso',
  controles: [{k: 'tam', rot: 'tamanho', min: 24, max: 40, un: 'px', padrao: 32}]};
})();
