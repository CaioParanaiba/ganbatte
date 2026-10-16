// Regressões da #75, no motor usado pelo jogo. Não lê dados pessoais.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const G = ctx.window.GB, hoje = '2026-08-30';
const api = extra => ({hoje, todo:[], done:[], jogador:{habitos:[{id:'ler', n:'Ler'}, {id:'treinar', n:'Treinar', semana:3}]},
  avaliacoes:'temporada | teste | 2026-08-01 | 2026-12-12 | 2027-02-01', ...extra});
const carrega = extra => {const C = G.carregar(api(extra)); return [C, G.estado(C)];};
const avalia = (p, extra) => G.avaliaConq(p, ...carrega(extra));
const tarefa = (d, i=0) => `x ${d} ${d} Revisar assunto ${i} @estudo`;
const historico = Array.from({length:28}, (_,i) => G.addD(hoje, i-27)).flatMap(d => Array.from({length:4}, (_,i) => tarefa(d,i)));
const progresso = (v, extra) => G.progConq(v.r, ...carrega(extra), v.r.inicio);
let grupos = 0;
function teste(nome, f){f(); grupos++; console.log('OK '+nome);}

teste('pouco histórico não transforma duas ou cinco tarefas em lendária', () => {
  for(const done of [[], [tarefa(G.addD(hoje,-1))]]) for(const n of [2,5]) assert.ok(avalia({regra:'contagem',n,tipo:'est'}, {done}).erro);
  const v = avalia({regra:'contagem',n:14,tipo:'est'}); assert.equal(v.rk,'D'); assert.equal(v.r.diasMin,7);
});
teste('tarefas concentradas num dia não dão recompensa; completar ambos os critérios dá', () => {
  const v=avalia({regra:'contagem',n:14,tipo:'est'}), de=v.r.inicio;
  assert.equal(progresso(v,{hoje:de,done:Array.from({length:14},(_,i)=>tarefa(de,i))}).on,false);
  const done=Array.from({length:7},(_,i)=>G.addD(de,i)).flatMap(d=>[tarefa(d),tarefa(d,1)]);
  assert.equal(progresso(v,{hoje:G.addD(de,6),done}).on,true);
});
teste('ritmo alto exige mais volume; a atividade do dia da aceitação não é reutilizada', () => {
  const v=avalia({regra:'contagem',n:35,tipo:'est',rk:'D'},{done:historico}); assert.equal(v.rk,'D');
  assert.ok(avalia({regra:'contagem',n:14,tipo:'est',rk:'D'},{done:historico}).erro);
  assert.equal(progresso(v,{done:historico}).at,0);
});
teste('rank não é inflado pela baixa frequência; sequência lendária pede 60 dias', () => {
  assert.equal(avalia({regra:'sequencia',hab:'ler',n:13}).rk,'D');
  assert.ok(avalia({regra:'sequencia',hab:'ler',n:13,rk:'A'}).erro);
  const v=avalia({regra:'sequencia',hab:'ler',n:60,rk:'A'});
  const done=Array.from({length:60},(_,i)=>{const d=G.addD(v.r.inicio,i);return `x ${d} ${d} Ler +rotina rec:ler:${d}`;});
  assert.equal(progresso(v,{hoje:G.addD(v.r.inicio,58),done:done.slice(0,59)}).on,false);
  assert.equal(progresso(v,{hoje:G.addD(v.r.inicio,59),done}).on,true);
});
teste('hábito semanal usa semanas de verdade e não antecipa dias futuros', () => {
  const v=avalia({regra:'sequencia',hab:'treinar',n:2,rk:'D'}), de=v.r.inicio;
  const done=[0,1,2,7,8,9].map(i=>{const d=G.addD(de,i);return `x ${d} ${d} Treinar +rotina rec:treinar:${d}`;});
  assert.equal(progresso(v,{hoje:G.addD(de,8),done}).on,false);
  assert.equal(progresso(v,{hoje:G.addD(de,9),done}).on,true);
});
teste('folga salva o Ten, mas não substitui atividade na nova conquista', () => {
  const v=avalia({regra:'constancia',n:7,rk:'D'}), de=v.r.inicio;
  const done=[0,1,2,4,5,6].map(i=>tarefa(G.addD(de,i)));
  assert.equal(progresso(v,{hoje:G.addD(de,6),done}).on,false);
  assert.equal(progresso(v,{hoje:G.addD(de,6),done:Array.from({length:7},(_,i)=>tarefa(G.addD(de,i)))}).on,true);
});
teste('XP exige semanas completas consecutivas; uma semana forte não basta', () => {
  const v=avalia({regra:'semana',xp:110,semanas:2,rk:'D'}), de=v.r.inicio;
  const xpDias=Object.fromEntries(Array.from({length:14},(_,i)=>[G.addD(de,i),20]));
  assert.equal(progresso(v,{hoje:G.addD(de,13),estado:{xpDias, migra:{recalculo:{ini:'2026-08-01'}}}}).on,false);
  assert.equal(progresso(v,{hoje:G.addD(de,14),estado:{xpDias, migra:{recalculo:{ini:'2026-08-01'}}}}).on,true);
  xpDias[G.addD(de,7)]=0; for(let i=8;i<14;i++) xpDias[G.addD(de,i)]=0;
  assert.equal(progresso(v,{hoje:G.addD(de,14),estado:{xpDias, migra:{recalculo:{ini:'2026-08-01'}}}}).on,false);
});
teste('nota leva em conta o peso; prova pequena não vira lendária', () => {
  const plano=peso=>api().avaliacoes+`\n[BD] Boss\nP1 | Prova | ${peso} | 2026-09-30 | |\nP2 | Prova | ${100-peso} | 2026-10-30 | |`;
  assert.ok(avalia({regra:'nota',disc:'BD',aval:'P1',nota:10,rk:'A'},{avaliacoes:plano(20)}).erro);
  assert.equal(avalia({regra:'nota',disc:'BD',aval:'P1',nota:10,rk:'A'},{avaliacoes:plano(80)}).rk,'A');
  assert.ok(avalia({regra:'nota',disc:'BD',aval:'P1',nota:7,rk:'D'},{avaliacoes:plano(40)}).erro);
});
teste('média final normaliza os pesos e recusa metas impossíveis', () => {
  const avaliacoes=api().avaliacoes+'\n[BD] Boss\nP1 | Prova | 4 | 2026-09-30 | |\nP2 | Prova | 6 | 2026-10-30 | |';
  const v=avalia({regra:'nota',disc:'BD',media:10,rk:'A'},{avaliacoes}); assert.equal(v.rk,'A');
  assert.equal(progresso(v,{avaliacoes,hoje:'2026-10-30',notas:'2026-09-30 | BD | P1 | 10\n2026-10-30 | BD | P2 | 10'}).on,true);
  assert.ok(avalia({regra:'nota',disc:'BD',media:9.5},{avaliacoes,notas:'2026-08-29 | BD | P1 | 5'}).erro);
});
teste('avaliação contínua pode melhorar, mas a nota anterior não cumpre uma carta nova', () => {
  const avaliacoes=api().avaliacoes+'\n[BD] Boss\nL | Listas | 100 | 2026-11-30 | | contínua';
  const notas='2026-08-29 | BD | L | 7 | parcial';
  const v=avalia({regra:'nota',disc:'BD',aval:'L',nota:8,rk:'D'},{avaliacoes,notas});
  assert.equal(v.rk,'D'); assert.equal(progresso(v,{avaliacoes,notas}).on,false);
  assert.equal(progresso(v,{avaliacoes,notas:notas+'\n2026-09-10 | BD | L | 9 | parcial',hoje:'2026-09-10'}).on,true);
  assert.equal(avalia({regra:'nota',disc:'BD',media:8,rk:'D'},{avaliacoes,notas}).rk,'D');
  assert.ok(avalia({regra:'nota',disc:'BD',media:10,rk:'A'},{avaliacoes,notas}).erro);
  assert.ok(avalia({regra:'nota',disc:'BD',aval:'L',nota:10,rk:'A'},{avaliacoes,notas}).erro);
});
teste('metas iguais com números diferentes não ocupam várias vagas', () => {
  const conquistas=[{regra:'contagem',tipo:'est',n:14,rk:'D',no:'200',criada:hoje}];
  assert.ok(avalia({regra:'contagem',tipo:'est',n:35,rk:'C'},{conquistas}).erro);
  conquistas[0].resgate={como:'jenny',j:800};
  assert.equal(avalia({regra:'contagem',tipo:'est',n:35,rk:'C'},{conquistas}).rk,'C');
});
teste('meta que não cabe na temporada é recusada', () => {
  const avaliacoes='temporada | teste | 2026-08-01 | 2026-09-01 | 2027-02-01';
  assert.ok(avalia({regra:'sequencia',hab:'ler',n:60,rk:'A'},{avaliacoes}).erro);
});
teste('cartas antigas e Jenny já resgatada continuam iguais', () => {
  const antigas=[{no:'200',regra:'contagem',n:5,tipo:'est',rk:'A',criada:hoje},
    {no:'201',regra:'constancia',n:5,rk:'C',criada:hoje,resgate:{como:'jenny',j:1500,em:hoje}}];
  const [C,S]=carrega({conquistas:antigas,done:Array.from({length:5},(_,i)=>tarefa(hoje,i))});
  assert.equal(G.conqIA(C,S)[0].on,true); assert.equal(G.conqIA(C,S)[0].j,6000); assert.equal(S.conqJ,1500);
});
console.log(`${grupos} grupos passaram.`);
