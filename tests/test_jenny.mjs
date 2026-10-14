// Prévia monetária contra a conclusão pelo motor: node tests/test_jenny.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB, HOJE = '2026-10-14';
const aval = `temporada | Teste | 2026-09-01 | 2026-12-01 | 2027-01-01
[CALC] Cálculo
P1 | Prova 1 | 40 | 2026-10-13
P2 | Prova 2 | 60 | 2026-11-01`;
function verifica(nome, linha, xp, op = {}){
  const api = {hoje:HOJE, todo:[`${HOJE} ${linha}`], done:op.done || [], avaliacoes:op.aval || aval, notas:op.notas || '',
    jogador:{habitos:op.habitos || []}, estado:op.estado || {}};
  const C = GB.carregar(api), S = GB.estado(C), t = C.D.abertas[0], antes = JSON.stringify(C);
  const v = S.valeTarefa(t);
  assert.equal(v.x, xp, nome + ': XP previsto');
  assert.equal(v.j, xp * 10, nome + ': Jenny prevista');
  assert.equal(S.valeTarefa(t), v, nome + ': prévia reaproveitada');
  assert.equal(JSON.stringify(C), antes, nome + ': prévia não altera dados');
  const feita = GB.parseLinha(`x ${HOJE} ${HOJE} ${linha}`, 1);
  const depois = GB.estado({...C, D:{...C.D, abertas:[], feitas:C.D.feitas.concat(feita)}});
  assert.equal(depois.xs.find(o => o.t === feita)?.x, v.x, nome + ': igual à conclusão');
  assert.equal(depois.jenny - S.jenny, v.j, nome + ': igual ao ganho na carteira');
  console.log('OK', nome);
}
verifica('vida sem bônus', 'Pagar o boleto', 10);
verifica('entrega no prazo, arredondamento inicial', 'Lista @entrega due:2026-10-14', 38);
verifica('entrega atrasada', 'Lista @entrega due:2026-10-13', 25);
verifica('prazo e missão, dois arredondamentos', 'Lista @entrega due:2026-10-14', 57,
  {estado:{usos:[{k:'gyo', d:HOJE, alvo:5}]}});
verifica('prazo, missão e fúria', 'Lista @entrega +fac.CALC due:2026-10-14', 86,
  {notas:'2026-10-13 | CALC | P1 | 4', estado:{usos:[{k:'gyo', d:HOJE, alvo:5}]}});
verifica('férias pausam missão e fúria', 'Lista @entrega +fac.CALC due:2026-10-14', 38,
  {aval:aval.replace('2026-12-01 | 2027-01-01','2026-10-13 | 2027-01-01'), notas:'2026-10-13 | CALC | P1 | 4', estado:{usos:[{k:'gyo', d:HOJE, alvo:5}]}});
verifica('Ko pendente', 'Lista @entrega due:2026-10-14', 76, {estado:{usos:[{k:'ko', d:HOJE}]}});
verifica('Acompanhar pendente', 'Lista @entrega', 50, {estado:{usos:[{k:'acomp', d:HOJE}]}});
verifica('Acompanhar não dobra vida', 'Pagar o boleto', 10, {estado:{usos:[{k:'acomp', d:HOJE}]}});
verifica('Ko já consumido', 'Lista @entrega', 25,
  {done:[`x ${HOJE} ${HOJE} Organizar a mesa`], estado:{usos:[{k:'ko', d:HOJE}]}});
verifica('Ken estende o prazo', 'Lista @entrega due:2026-10-13', 38,
  {estado:{usos:[{k:'ken', d:HOJE, alvo:'Lista'}]}});
verifica('hábito pelo nível', `Leitura +rotina rec:h-leitura:${HOJE}`, 4,
  {done:Array.from({length:8}, (_,i) => { const d = GB.addD(HOJE, i - 8); return `x ${d} ${d} Leitura +rotina rec:h-leitura:${d}`; })});
verifica('hábito novo', `Leitura +rotina rec:h-leitura:${HOJE}`, 3);
verifica('hábito acima da meta semanal', `Academia +rotina rec:h-academia:${HOJE}`, 6,
  {habitos:[{id:'h-academia', n:'Academia', semana:2}], done:['2026-10-12','2026-10-13'].map(d => `x ${d} ${d} Academia +rotina rec:h-academia:${d}`)});
verifica('bônus da meta do Codeforces', `Codeforces +rotina rec:cf:${HOJE}`, 10);
verifica('prazo da caçada não entra no valor da tarefa', 'Montar slides +cac.apresentacao', 10,
  {estado:{cacadas:{apresentacao:{prazo:HOJE}}}});
