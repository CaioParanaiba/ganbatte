// Corte do XP no início da temporada e recálculo do zero (#126): node tests/test_recalculo.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB, HOJE = '2026-10-15';
const aval = 'temporada | Teste | 2026-08-10 | 2026-12-18 | 2027-02-08';
const roda = (op = {}) => GB.estado(GB.carregar({hoje:HOJE, todo:[], avaliacoes:aval, notas:'', jogador:op.jogador || {habitos:[]},
  estado:op.estado || {}, done:op.done || [], duo:op.duo || null}));
const ok = (nome, f) => { f(); console.log('OK', nome); };
const boleto = 'x 2026-09-01 2026-09-01 Pagar boleto', antigas = ['x 2025-03-01 2025-03-01 Coisa do ano passado', 'x 2026-08-09 2026-08-09 Véspera'];

ok('tarefa de antes da temporada não vale XP nem Ten', () => {
  const a = roda({done:[boleto]}), b = roda({done:[boleto, ...antigas]});
  assert.equal(b.total, a.total);
  assert.equal(b.first, '2026-09-01');
  assert.equal(b.ten.max, a.ten.max);
});

ok('recálculo: tira os dias de antes, grava o corte e o antes/depois', () => {
  const S = roda({done:[boleto, ...antigas], estado:{xpDias:{'2025-03-01':10, '2026-08-09':10, '2026-09-01':10, '2026-09-02':7}}});
  assert.deepEqual({...S.rec.xpDias}, {'2026-09-01':10});
  assert.equal(S.total, 10);   // a linha que sumiu (09-02) perde o XP gravado
  const m = S.rec.migra.recalculo;
  assert.equal(m.ini, '2026-08-10'); assert.equal(m.antes, 37); assert.equal(m.depois, 10); assert.equal(m.em, HOJE);
  assert.equal(S.rec.mudou, true);
});

ok('recálculo só uma vez; o corte não anda com a temporada', () => {
  const estado = {migra:{recalculo:{ini:'2026-08-10', em:'2026-10-15', antes:0, depois:10}}, xpDias:{'2026-09-01':10}, acertos:{recalculo:0}};
  const S = GB.estado(GB.carregar({hoje:'2027-03-01', todo:[], done:[boleto], avaliacoes:'temporada | Nova | 2027-02-08 | 2027-06-30 | 2027-08-01',
    jogador:{habitos:[]}, estado}));
  assert.equal(S.total, 10);
  assert.equal(S.rec.migra.recalculo.depois, 10);
});

ok('carteira negativa pelo recálculo fica em zero; o gasto continua', () => {
  const S = roda({done:[boleto, ...antigas], estado:{spent:250, acertos:{'0.5.2':0, '0.6.4':0}, xpDias:{'2025-03-01':10, '2026-08-09':10, '2026-09-01':10}}});
  assert.equal(S.jenny, 0);
  assert.equal(S.rec.acertos.recalculo, 150);
  const T = roda({done:[boleto], estado:{spent:50, acertos:{'0.5.2':0, '0.6.4':0}}});
  assert.equal(T.jenny, 50); assert.equal(T.rec.acertos.recalculo, 0);
});

ok('Duolingo: o nível sobe só com os dias da ofensiva dentro da temporada', () => {
  const jogador = {habitos:[{id:'duo', nome:'Duolingo'}], duo:{usuario:'x'}}, done = ['x 2026-10-14 2026-10-14 Duolingo rec:duo:2026-10-14'];
  const longa = roda({jogador, done, duo:{desde:'2026-10-01', ini:'2025-10-01', ofensiva:380}});   // 67 dias da ofensiva na temporada
  const curta = roda({jogador, done, duo:{desde:'2026-10-01', ini:'2026-10-07', ofensiva:8}});
  assert.equal(longa.xpDia['2026-10-14'], GB.habXP(7));   // 66 dias antes da lista: nível 7 (o 6 com 35, o 7 com 49, o 8 pede 70)
  assert.equal(curta.xpDia['2026-10-14'], GB.habXP(2));
  assert.ok(longa.xpDia['2026-10-14'] < GB.habXP(10));
});
