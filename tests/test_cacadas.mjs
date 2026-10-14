// Caçada dentro de caçada (#92) no motor: node tests/test_cacadas.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB, HOJE = '2026-10-14';
const aval = 'temporada | Teste | 2026-09-01 | 2026-12-01 | 2027-01-01';
const carrega = (todo, done, cacadas) => GB.carregar({hoje:HOJE, todo, done, avaliacoes:aval, notas:'', jogador:{habitos:[]},
  estado:{cacadas, expedicoes:{app:{n:'App', ini:'2026-10-01'}}}});
const todo = ['2026-10-10 Etapa da v1 +cac.v1', '2026-10-10 Etapa A +cac.v091', '2026-10-10 Etapa B +cac.v092', '2026-10-10 Neta +cac.neta', '2026-10-10 Laço +cac.laco'];
const done = ['x 2026-10-12 2026-10-10 Feita A +cac.v091', 'x 2026-10-13 2026-10-10 Feita B +cac.v091'];
const cacadas = {v1:{n:'v1.0', exp:'app', criada:'2026-10-01'}, v091:{n:'v0.9.1', pai:'v1', criada:'2026-10-02'}, v092:{n:'v0.9.2', pai:'v1', exp:'outra', criada:'2026-10-03'},
  neta:{n:'Neta', pai:'v091'}, laco:{n:'Laço', pai:'laco'}, orfa:{n:'Órfã', pai:'nao-existe'}};
const C = carrega(todo, done, cacadas), G = GB.grupos(C, C.D.feitas, C.D.abertas);

assert.equal(G.cac.v091.pai, 'v1'); assert.equal(G.cac.v092.pai, 'v1');
assert.equal(G.cac.v1.filhas.map(c => c.slug).join(), 'v091,v092', 'as de dentro, na ordem de criação');
assert.equal(G.cac.v092.exp, 'app', 'a de dentro fica na expedição da de cima');
assert.equal(G.cac.neta.pai, null, 'só dois níveis');
assert.equal(G.cac.laco.pai, null, 'não fica dentro dela mesma');
assert.equal(G.cac.orfa.pai, null, 'pai que não existe é ignorado');
assert.equal(G.exp.app.marcos.map(c => c.slug).join(), 'v1', 'só a de cima é marco');
assert.equal(G.cac.v1.tudo.length, 5); assert.equal(G.cac.v1.tudoFeitas, 2);
assert.equal(G.cac.v1.filhasAbertas, 2);
assert.equal(G.exp.app.tarefas.length, 5, 'as etapas das de dentro contam na expedição');
assert.equal(G.cac.v1.etapas.length, 1, 'o bônus da de cima sai só das etapas dela');
console.log('OK estrutura');

// a de dentro fechada rende o bônus dela no dia em que fechou, e entra no ganho da expedição
const fechada = {...cacadas, v091:{...cacadas.v091, exp:'app', fim:'2026-10-13', bonus:22}};
const C2 = carrega(todo.filter(l => !l.includes('cac.v091')), done, fechada), G2 = GB.grupos(C2, C2.D.feitas, C2.D.abertas);
assert.equal(G2.exp.app.ganho, 22); assert.equal(G2.cac.v1.filhasAbertas, 1);
const S1 = GB.estado(carrega(todo.filter(l => !l.includes('cac.v091')), done, cacadas)), S2 = GB.estado(C2);
assert.equal(S2.gXP - S1.gXP, 22, 'bônus da caçada de dentro no XP'); assert.equal(S2.total - S1.total, 22);
console.log('OK bônus');

// sem pai, nada muda
const C3 = carrega(todo, done, {v1:cacadas.v1, v091:{n:'v0.9.1', exp:'app'}}), G3 = GB.grupos(C3, C3.D.feitas, C3.D.abertas);
assert.equal(G3.exp.app.marcos.map(c => c.slug).sort().join(), 'v091,v1'); assert.equal(G3.cac.v1.filhas.length, 0);
console.log('OK sem pai');
