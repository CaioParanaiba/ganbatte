// Feitiços em pausa: missão e preparação de antes continuam feitiço; as seguintes viram Jenny. node tests/test_feiticos.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB;
const ok = (nome, f) => { f(); console.log('OK', nome); };

const HOJE = '2026-10-15', aval = `temporada | Teste | 2026-09-01 | 2026-12-01 | 2027-01-01
[BD] Banco
P1 | Prova 1 | 40 | 2026-10-10
P2 | Prova 2 | 60 | 2026-11-30`;
const done = ['x 2026-10-05 2026-10-01 Revisar normalização +fac.BD av:P1'];
const S = estado => GB.estado(GB.carregar({hoje:HOJE, todo:[], done, avaliacoes:aval, notas:'', jogador:{}, estado}));

ok('na migração, a preparação que já existia continua feitiço à escolha', () => {
  const s = S({});
  assert.deepEqual({...s.rec.migra.feiticos}, {miss:0, prep:1, em:HOJE});
  assert.equal(s.inv.escolha, 1);
  assert.equal(s.feitJ, 0);
});

ok('preparação depois da migração vira Jenny no dia da prova', () => {
  const s = S({migra:{feiticos:{miss:0, prep:0, em:'2026-10-01'}}}), s0 = S({migra:{feiticos:{miss:0, prep:1, em:HOJE}}});
  assert.equal(s.inv.escolha, undefined);
  assert.equal(s.feitJ, GB.FEIT_J);
  assert.deepEqual([...s.feitJDias], ['2026-10-10']);
  assert.equal(s.jenny - s0.jenny, GB.FEIT_J);
  assert.equal(GB.relatorio(GB.carregar({hoje:HOJE, todo:[], done, avaliacoes:aval, notas:'', jogador:{}, estado:{migra:{feiticos:{miss:0, prep:0, em:'2026-10-01'}}}}), s).resumo.jenny.origem.missao, GB.FEIT_J);
});
