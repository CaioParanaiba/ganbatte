// Codeforces pela cor do problema e contribuições só em Jenny (#180): node tests/test_codeforces.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB, HOJE = '2026-10-15';
const aval = 'temporada | Teste | 2026-08-10 | 2026-12-18 | 2027-02-08';
const roda = (op = {}) => GB.estado(GB.carregar({hoje:HOJE, todo:[], avaliacoes:aval, notas:'', jogador:op.jogador || {habitos:[], cf:{handle:'x', meta:3}},
  estado:op.estado || {}, done:op.done || [], cf:op.cf || null, contrib:op.contrib || null}));
const ok = (nome, f) => { f(); console.log('OK', nome); };
const dia = (cf, d) => GB.cfDias(cf, HOJE).dias[d];

ok('na faixa 15, acima 25 e 35, abaixo 8 e 3', () => {
  const cf = {por_dia:{'2026-10-01':5}, probs:{'2026-10-01':[1400, 1600, 1900, 1200, 800]}, ratings:[['2026-09-01', 1450]]};
  const f = dia(cf, '2026-10-01');   // ciano, sem nível prático ainda (menos de 5 problemas antes)
  assert.equal(f.chao, 2); assert.equal(f.teto, 2);
  assert.equal(f.xp, 15 + 25 + 35 + 8 + 3);
});

ok('sem rating oficial a cor é cinza; problema sem rating e à mão valem como na faixa', () => {
  const cf = {por_dia:{'2026-10-01':3}, probs:{'2026-10-01':[800, 0]}, ratings:[]};
  assert.equal(dia(cf, '2026-10-01').xp, 15 + 15 + 15);
});

ok('o rating de um contest vale do dia seguinte em diante', () => {
  const cf = {por_dia:{'2026-10-01':1, '2026-10-02':1}, probs:{'2026-10-01':[1400], '2026-10-02':[1400]}, ratings:[['2026-10-01', 1250]]};
  assert.equal(dia(cf, '2026-10-01').xp, 35);   // ainda cinza: ciano é 2 cores acima
  assert.equal(dia(cf, '2026-10-02').xp, 25);   // verde
});

ok('nível prático: a faixa vai da cor oficial à prática, no máximo duas cores', () => {
  const probs = {'2026-09-01':[1600, 1600, 1700, 1650, 1800]};
  const cf = {por_dia:{'2026-09-01':5, '2026-10-01':3}, probs:{...probs, '2026-10-01':[800, 1400, 1600]}, ratings:[]};
  const f = dia(cf, '2026-10-01');   // oficial cinza, prático azul: a faixa fica ciano a azul
  assert.equal(f.of, 0); assert.equal(f.pr, 3); assert.equal(f.chao, 2); assert.equal(f.teto, 3);
  assert.equal(f.xp, 3 + 15 + 15);
});

ok('contest ao vivo: +20 mesmo sem problema aceito', () => {
  const S = roda({cf:{por_dia:{}, probs:{}, contests:{'2026-10-01':1}, ratings:[]}});
  assert.equal(S.xpDia['2026-10-01'], GB.CF_CONTEST);
});

ok('sem teto no dia; cf.json de antes (sem probs) fica na regra antiga', () => {
  const novo = roda({cf:{por_dia:{'2026-10-01':10}, probs:{'2026-10-01':Array(10).fill(0)}}});
  assert.equal(novo.xpDia['2026-10-01'], 150);
  const velho = roda({cf:{por_dia:{'2026-10-07':10}}});
  assert.equal(velho.xpDia['2026-10-07'], GB.cfExtra(10, '2026-10-07'));
});

ok('dia fechado não perde XP com a regra nova', () => {
  const S = roda({cf:{por_dia:{'2026-10-07':6}, probs:{'2026-10-07':Array(6).fill(800)}, ratings:[['2026-01-01', 1700]]},
    estado:{xpDias:{'2026-10-07':30}, migra:{recalculo:{ini:'2026-08-10'}}}});
  assert.equal(S.xpDia['2026-10-07'], 30);   // 6 problemas 800 para um azul valem 18; o gravado (30) segura
});

ok('contribuições: só Jenny; o acerto tira o XP antigo dos dias fechados e a carteira fica igual', () => {
  const contrib = {issues:[{n:1, tipo:'bug', dia:'2026-10-01'}, {n:2, tipo:'ideia', dia:'2026-10-02'}]};
  const antigo = {xpDias:{'2026-10-01':15, '2026-10-02':10}, migra:{recalculo:{ini:'2026-08-10'}, '0.6.4':{}}};
  const S = roda({contrib, estado:antigo});
  assert.equal(S.total, 0);
  assert.equal(S.rec.migra['contrib-xp'].xp, 25);
  assert.equal(S.jenny, (15 + 10)*10 + 150 + 50);   // a mesma Jenny de antes: 300 J o bug, 150 J a ideia
  const N = roda({contrib, estado:{}});   // quem chega agora não tem nada a tirar
  assert.equal(N.rec.migra['contrib-xp'].xp, 0); assert.equal(N.jenny, 450);
});

ok('relatório: a Jenny ganha por origem', () => {
  const C = GB.carregar({hoje:HOJE, todo:[], avaliacoes:aval, notas:'', jogador:{habitos:[], cf:{handle:'x', meta:3}}, estado:{}, done:[],
    cf:{por_dia:{'2026-10-01':1}, probs:{'2026-10-01':[0]}}, contrib:{issues:[{n:1, tipo:'bug', dia:'2026-10-01'}]}});
  const o = GB.relatorio(C, GB.estado(C)).resumo.jenny.origem;
  assert.equal(o.xp, 150); assert.equal(o.contrib, 300); assert.equal(o.notas, 0);
});
