// Tipos das tarefas (#121) e sugestões do formulário (#5): node tests/test_tipos.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB;
const ok = (nome, f) => { f(); console.log('OK', nome); };
const L = s => GB.parseLinha(s, 0);

ok('tipo pela tag e pela disciplina', () => {
  const tipo = s => GB.tipoDe(L(s)), nen = s => GB.nenDe(L(s));
  assert.equal(tipo('2026-10-20 Fazer lista 2 +fac.BD'), 'est');                 // só a disciplina: estudo (antes, faculdade)
  assert.equal(nen('2026-10-20 Fazer lista 2 +fac.BD'), 0);
  assert.equal(tipo('2026-10-20 Entregar lista 3 +fac.BD @entrega'), 'ent');
  assert.equal(tipo('2026-10-20 Meu site +projeto'), 'pro');
  assert.equal(nen('2026-10-20 Meu site +projeto'), 2);
  assert.equal(tipo('2026-10-20 Upsolve +treino'), 'tre');
  assert.equal(nen('2026-10-20 Upsolve +treino'), 1);
  assert.equal(tipo('2026-10-20 Treino do app novo +treino'), 'tre');           // depois da #121 vale a tag escolhida
  assert.equal(tipo('2026-10-01 Lançar a versão do app +treino'), 'pro');       // +treino de antes, com palavra de projeto
  assert.equal(tipo('x 2026-10-02 2026-10-01 Fazer a aba do grupo (#67) +treino'), 'pro');
  assert.equal(tipo('2026-10-01 Virtual contest +treino'), 'tre');
  assert.equal(nen('Issue #96: recompensa gh:96 esf:medio'), 2);                // tarefa de dev de uma issue (antes, vida)
  assert.equal(tipo('Pagar o boleto'), 'vid');
});

ok('recorrente com a tag de hábito não é hábito', () => {
  assert.equal(GB.isRec(L('2026-10-20 Treino de digitação +rotina')), true);
  assert.equal(GB.isRec(L('2026-10-20 Revisão semanal +rotina due:2026-10-25 rep:sem-dom')), false);   // tem dia certo: tarefa comum
  assert.equal(GB.nenDe(L('2026-10-20 Revisão semanal +rotina due:2026-10-25 rep:sem-dom')), 3);
  assert.equal(GB.tipoDe(L('2026-10-20 Revisão de BD +fac.BD +rotina due:2026-10-25 rep:sem-dom')), 'est');
  assert.equal(GB.isRec(L('2026-10-20 Leitura +rotina rep:qualquer')), true);   // rep: inválido não conta
});

ok('sugestão do tipo pelo texto', () => {
  const s = (txt, disc = false) => { const r = GB.sugereTipo(txt, disc); return r && r.k; };
  assert.equal(s('Fazer lista 2 BD', true), 'est');               // lista é estudo, com ou sem prazo
  assert.equal(s('Entregar lista 3', true), 'ent');
  assert.equal(s('Trabalho escrito', true), 'ent');
  assert.equal(s('Entregar roupa para fulano'), 'vid');           // sem disciplina, entregar não é trabalho cobrado
  assert.equal(s('Relatório do estágio'), 'vid');
  assert.equal(s('Programar exercicio 3', true), 'est');          // com disciplina, treino e projeto não valem
  assert.equal(GB.sugereTipo('POO-E03', true).disc, true);        // sem palavra, com disciplina: estudo
  assert.equal(s('POO-E03', true), 'est');
  assert.equal(s('algo qualquer'), null);
  assert.equal(s('Fazer a aba Torre Trick do grupo (#67)'), 'pro');
  assert.equal(s('Lançar 0.5.8-beta1: Lista mais limpa'), 'pro');
  assert.equal(s('Resolver contest no Codeforces'), 'tre');
  assert.equal(s('Consolidar slide 3', true), 'est');
  assert.equal(s('Preparar encontro de catequese'), 'vid');
});

ok('prioridade por fatores', () => {
  const HOJE = '2026-10-15', aval = `temporada | Teste | 2026-09-01 | 2026-12-01 | 2027-01-01
[BD] Banco
P1 | Prova 1 | 40 | 2026-10-17
P2 | Prova 2 | 60 | 2026-11-30`;
  const C = GB.carregar({hoje:HOJE, todo:[], done:[], avaliacoes:aval, notas:'', jogador:{}, estado:{}}), S = GB.estado(C);
  const pri = linha => GB.sugerePri(L(HOJE + ' ' + linha), S.bs, HOJE, C).pri;
  assert.equal(pri('Arrumar a casa'), null);                                        // nada
  assert.equal(pri('Arrumar a casa due:2026-10-20'), 'C');                          // um importante (prazo em 5 dias)
  assert.equal(pri('Arrumar a casa due:2026-10-16'), 'C');                          // um muito importante sozinho
  assert.equal(pri('Lista @entrega due:2026-10-20'), 'B');                          // dois importantes
  assert.equal(pri('Revisar P2 +fac.BD av:P2 due:2026-10-20'), 'C');                // P2 longe: só o prazo
  assert.equal(pri('Revisar +fac.BD av:P1 due:2026-10-20'), 'B');                   // P1 em 2 dias (muito) + prazo (importante): B
  assert.equal(pri('Revisar +fac.BD av:P1 due:2026-10-16'), 'A');                   // dois muito importantes
  assert.equal(pri('Lista +fac.BD av:P1 @entrega due:2026-10-20'), 'A');            // muito + dois importantes
});

ok('XP, Jenny e missão de antes não mudam; a missão nova vale da semana seguinte', () => {
  // estudo pela disciplina sem tag: era Conjuração, agora é Intensificação. Missão da semana 12/10 pela regra antiga.
  const done = [], dia = d => `2026-10-${String(d).padStart(2, '0')}`;
  for(let d = 1; d <= 9; d++) done.push(`x ${dia(d)} ${dia(d)} Ler capítulo ${d} +fac.BD @estudo`, `x ${dia(d)} ${dia(d)} Contest ${d} +treino`,
    `x ${dia(d)} ${dia(d)} Entregar ${d} +fac.BD @entrega`, `x ${dia(d)} ${dia(d)} Casa ${d}`);
  done.push(`x 2026-10-13 2026-10-13 Lista 1 +fac.BD`, `x 2026-10-14 2026-10-14 Lista 2 +fac.BD`, `x 2026-10-20 2026-10-20 Lista 3 +fac.BD`);
  const api = (hoje, estado = {}) => ({hoje, todo:[], done, avaliacoes:'', notas:'', jogador:{}, estado});
  const S1 = GB.estado(GB.carregar(api('2026-10-15'))), m = S1.rec.migra.tipos;
  assert.equal(m.em, '2026-10-15');
  assert.equal(S1.fraco, 2);                                               // na semana da troca, a missão é a Conjuração antiga
  assert.ok(S1.xs.find(o => o.t.txt === 'Lista 2').x === 23);              // 15 × 1,5: a lista sem tag ainda conta para ela
  assert.notDeepEqual(m.antes, m.depois);
  const S2 = GB.estado(GB.carregar(api('2026-10-21', {migra:{tipos:m}})));
  assert.equal(S2.xs.find(o => o.t.txt === 'Lista 2').x, 23);              // semana passada: igual
  assert.equal(S2.fraco, 2);                                               // a Conjuração (projeto) é a mais fraca agora
  assert.equal(S2.xs.find(o => o.t.txt === 'Lista 3').x, 15);              // e a lista, estudo, não ganha mais a missão
});

ok('conquista de faculdade: aberta cancela, cumprida fica', () => {
  const HOJE = '2026-10-15', done = ['x 2026-10-10 2026-10-10 Falar com o professor +fac.BD', 'x 2026-10-11 2026-10-11 Ver a ementa +fac.BD'];
  const conq = [{no:'200', regra:'contagem', n:2, tipo:'fac', rk:'D', criada:'2026-10-01', nome:'a'},
    {no:'201', regra:'contagem', n:50, tipo:'fac', rk:'D', criada:'2026-10-01', nome:'b'},
    {no:'202', regra:'contagem', n:50, tipo:'fac', rk:'D', criada:'2026-10-01', nome:'c', resgate:{como:'jenny', j:800, em:'2026-10-05'}}];
  const C = GB.carregar({hoje:HOJE, todo:[], done, avaliacoes:'', notas:'', jogador:{}, estado:{}, conquistas:conq}), S = GB.estado(C);
  assert.deepEqual([...GB.conqCancelar(C, S)], ['201']);
  const cia = GB.conqIA(C, S);
  assert.deepEqual(cia.map(c => c.no), ['200', '202']);
  assert.ok(cia.every(c => c.on));
  assert.match(cia[0].regra, /de estudo/);
});
