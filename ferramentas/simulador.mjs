// Simulador de balanceamento: joga uma temporada inteira com jogadores inventados pelo motor de verdade (web/motor.js) e
// mostra quanto XP e Jenny cada um faz, em que andar chega e quanto da loja consegue comprar.
//
//   node ferramentas/simulador.mjs                              tabela com os três perfis
//   node ferramentas/simulador.mjs --comparar relatorio.json    põe ao lado o relatório de um jogador de verdade
//                                                               (Configurações → balanceamento → baixar relatório)
//   node ferramentas/simulador.mjs --json saida.json            grava os relatórios completos dos perfis
//
// Os relatórios saem do mesmo GB.relatorio() do botão do jogo, então os números se comparam direto. Para testar uma
// mudança de fórmula, mexa no motor.js e rode de novo. Os perfis ficam logo abaixo: ajuste até parecerem gente de verdade.
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

/* ---------- os jogadores inventados ----------
   ativo: chance de jogar num dia · tarefas: tarefas soltas num dia jogado (média) · habitos: dos 4 hábitos diários, quantos
   faz num dia jogado · cf: problemas do Codeforces num dia jogado (0 = sem Codeforces) · prazo: chance de fazer até o prazo
   · nota: média das notas · fds: chance de jogar no sábado e no domingo, em vez de "ativo" */
const PERFIS = {
  leve:   {ativo:.6,  fds:.3, tarefas:2, habitos:1.5, cf:0, prazo:.5, nota:6.2},
  medio:  {ativo:.85, fds:.5, tarefas:4, habitos:2.5, cf:1, prazo:.75, nota:7.2},
  pesado: {ativo:1,   fds:.9, tarefas:8, habitos:4,   cf:4, prazo:.95, nota:8.6},
};
const TIPOS = [['ent', .2], ['est', .35], ['fac', .15], ['tre', .15], ['vid', .15]];   // de que tipo são as tarefas soltas
const TEMP = {ini:'2026-08-03', fim:'2026-12-12', volta:'2027-02-22'};
const DISC = ['CALC', 'ED', 'BD', 'ARQ'];
const AVS = [['P1', 40, '2026-09-25'], ['P2', 60, '2026-11-27']];   // as mesmas avaliações em todas as disciplinas

/* ---------- o motor ---------- */
const raiz = fileURLToPath(new URL('..', import.meta.url));
const ctx = {window:{}, console}; vm.createContext(ctx);
vm.runInContext(readFileSync(raiz + 'web/motor.js', 'utf8'), ctx);
const GB = ctx.window.GB;

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const semente = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const conta = (rnd, media) => { let n = Math.floor(media); if(rnd() < media - n) n++; return n; };   // inteiro com essa média
const TXT = {ent:'Lista de exercicios @entrega', est:'Revisar materia @estudo', fac:'Falar com o professor', tre:'Treino +treino', vid:'Arrumar a casa'};

function simula(nome, P){
  const rnd = semente(nome.length * 7919 + 17), done = [], cf = {}, habitos = [1, 2, 3, 4].map(i => ({id:'h-' + i, n:'Habito ' + i}));
  for(let d = TEMP.ini; d <= TEMP.fim; d = GB.addD(d, 1)){
    if(rnd() >= (GB.dow(d) >= 5 ? P.fds : P.ativo)) continue;
    for(const h of habitos.slice(0, conta(rnd, P.habitos))) done.push(`x ${d} ${d} ${h.n} +rotina rec:${h.id}:${d}`);
    if(P.cf){ const n = conta(rnd, P.cf); if(n){ cf[d] = n; if(n >= 3) done.push(`x ${d} ${d} Codeforces 3 questoes +rotina rec:cf:${d}`); } }
    for(let i = conta(rnd, P.tarefas); i > 0; i--){
      let x = rnd(), tipo = TIPOS.find(([, p]) => (x -= p) < 0)[0];
      const disc = tipo === 'vid' || tipo === 'tre' ? '' : ' +fac.' + DISC[Math.floor(rnd() * DISC.length)];
      const due = rnd() < .6 ? ` due:${GB.addD(d, rnd() < P.prazo ? 1 : -2)}` : '';
      done.push(`x ${d} ${d} ${TXT[tipo]}${disc}${due}`);
    }
  }
  const aval = `temporada | sim | ${TEMP.ini} | ${TEMP.fim} | ${TEMP.volta}\n` + DISC.map(b => `[${b}] ${b}\n` + AVS.map(a => a.join(' | ')).join('\n')).join('\n\n');
  const nota = () => Math.max(0, Math.min(10, Math.round((P.nota + (rnd() - .5) * 3) * 10) / 10));
  const notas = [], notasJ = {};
  for(const b of DISC) for(const [k, w, dt] of AVS){ const n = nota(); notas.push(`${dt} | ${b} | ${k} | ${n}`); notasJ[b + ':' + k] = {nota:n, w, j: n >= GB.MEDIA ? Math.round(n*w*5) : 0, em:dt}; }
  const api = {hoje:TEMP.fim, todo:[], done, avaliacoes:aval, notas:notas.join('\n'), estado:{notasJ},
    jogador:{nome:nome, habitos, cf: P.cf ? {handle:'sim', meta:3} : null}, cf:{por_dia:cf}};
  // 1ª passada: quanto entra por dia; 2ª: o jogador compra a loja do mais barato ao mais caro, sempre que dá
  const C0 = GB.carregar(api), R0 = GB.relatorio(C0, GB.estado(C0));
  const loja = GB.COS.filter(it => it.p > 0 && !it.lend && !it.excl).sort((a, b) => a.p - b.p), compras = [];
  let saldo = 0, k = 0, esvaziou = null;
  for(const l of R0.dias){ saldo += l.jGanha; while(k < loja.length && saldo >= loja[k].p){ saldo -= loja[k].p; compras.push({d:l.dia, h:'', tipo:'cos', id:loja[k].id, j:loja[k].p}); k++; }
    if(k === loja.length && !esvaziou) esvaziou = l.dia; }
  api.estado = {notasJ, compras, spent: compras.reduce((s, c) => s + c.j, 0)};
  const C = GB.carregar(api), R = GB.relatorio(C, GB.estado(C));
  R.sim = {perfil:P, lojaComprada: Math.round(k / loja.length * 100), lojaEsvaziouEm: esvaziou ? GB.dias(TEMP.ini, esvaziou) + 1 : null};
  return R;
}

/* ---------- a tabela ---------- */
const R = Object.fromEntries(Object.entries(PERFIS).map(([n, P]) => [n, simula(n, P)]));
const real = opt('--comparar') ? JSON.parse(readFileSync(opt('--comparar'), 'utf8')) : null;
const cols = Object.keys(R).concat(real ? ['real'] : []), todos = {...R, ...(real ? {real} : {})};
const jDia = r => r.resumo.jenny.ganha / Math.max(1, r.resumo.diasAtivos);
const linhas = [
  ['dias jogados (%)', r => r.resumo.pctDiasAtivos],
  ['XP por dia jogado', r => r.resumo.xp.porDiaAtivo],
  ['XP por semana', r => r.resumo.xp.porSemana],
  ['melhor semana (XP)', r => r.resumo.xp.melhorSemana],
  ['andar (fim / projeção)', r => r === real ? `${r.resumo.torre.andar} / ${r.resumo.torre.projecaoFimDasAulas}` : r.resumo.torre.andar],
  ['andares por semana', r => r.resumo.torre.andaresPorSemana],
  ['Jenny ganha', r => r.resumo.jenny.ganha],
  ['Jenny por dia jogado', r => Math.round(jDia(r))],
  ['régua: dia / semana', r => `${r.resumo.regua.dia} / ${r.resumo.regua.semana}`],
  ...Object.keys(GB.FONTES).map(k => ['XP de ' + GB.FONTES[k] + ' (%)', r => r.resumo.origemXP[k] || 0]),
  ['loja comprável na temporada (%)', r => r.resumo.loja.pctCompravelNaTemporada],
  ['itens da loja comprados (%)', r => r.sim ? r.sim.lojaComprada : '—'],
  ['dia em que comprou a loja toda', r => r.sim ? (r.sim.lojaEsvaziouEm ?? 'não deu') : '—'],
  ['saldo parado (dias produtivos)', r => r.sim ? '—' : r.resumo.jenny.saldoEmDiasProdutivos],
  ['uma compra a cada (dias)', r => r.resumo.compras.diasEntreCompras ?? '—'],
  ...[...new Set(GB.PREMIOS_PADRAO.map(x => x.p))].map(p => [`prêmio de ${p} J (dias jogados)`, r => Math.round(p / jDia(r) * 10) / 10]),
];
const larg = Math.max(...linhas.map(l => l[0].length)), fmt = v => String(typeof v === 'number' ? Math.round(v * 10) / 10 : v).replace('.', ',');
console.log(`temporada simulada: ${TEMP.ini} a ${TEMP.fim} (${GB.dias(TEMP.ini, TEMP.fim) + 1} dias), loja: ${GB.lojaTotal()} J`);
console.log(''.padEnd(larg) + cols.map(c => c.padStart(14)).join(''));
for(const [n, f] of linhas){ const vs = cols.map(c => fmt(f(todos[c]))); if(vs.every(v => v === '0' || v === '—')) continue; console.log(n.padEnd(larg) + vs.map(v => v.padStart(14)).join('')); }
if(opt('--json')){ writeFileSync(opt('--json'), JSON.stringify(R, null, 1)); console.log('relatórios em', opt('--json')); }
