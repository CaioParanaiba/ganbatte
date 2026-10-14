// #75: cenários fictícios, execução diária no motor real, comparação com a revisão anterior.
// node ferramentas/simulador-conquistas.mjs --antes REF --json /tmp/conquistas.json --markdown /tmp/conquistas.md
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
const raiz = new URL('..', import.meta.url), args = process.argv.slice(2);
const opt = k => args[args.indexOf(k)+1];
function motor(src){const c={window:{}}; vm.createContext(c); vm.runInContext(src,c);return c.window.GB;}
const G=motor(readFileSync(new URL('web/motor.js',raiz),'utf8'));
const antigo=args.includes('--antes') ? motor(execFileSync('git',['show',`${opt('--antes')}:web/motor.js`],{cwd:raiz,encoding:'utf8'})) : null;
const hoje='2026-08-30', fim='2026-12-12', base={hoje,todo:[],done:[],jogador:{habitos:[{id:'ler',n:'Ler'},{id:'treinar',n:'Treinar',semana:3}]},
  avaliacoes:`temporada | teste | 2026-08-01 | ${fim} | 2027-02-01`};
const task=(d,i)=>`x ${d} ${d} Revisar assunto ${i} @estudo`;
const hist=Array.from({length:28},(_,i)=>G.addD(hoje,i-27));
const futuro=Array.from({length:103},(_,i)=>G.addD(hoje,i+1));
const carrega=(g,api)=>{const C=g.carregar(api);return [C,g.estado(C)];};
function simula(g,v,inicial,eventos){
  if(v.erro) return {erro:v.erro};
  for(let dia=0;dia<=103;dia++){
    const agora=G.addD(hoje,dia), [C,S]=carrega(g,{...inicial,...eventos(agora),hoje:agora});
    const p=g.progConq(v.r,C,S,v.r.inicio||hoje);
    if(p.on) return {dias:dia,data:agora,progresso:p,jenny:g.conqRk(v.rk).j};
  }
  return {dias:null,jenny:0};
}
function propostaAntiga(regra,rk,api){
  if(!antigo)return null;
  const [C,S]=carrega(antigo,api);
  let ps=[];
  if(regra==='contagem')ps=Array.from({length:299},(_,i)=>({regra,n:i+2,tipo:'est'}));
  if(regra==='sequencia'||regra==='constancia')ps=Array.from({length:118},(_,i)=>({regra,n:i+3,...(regra==='sequencia'?{hab:'ler'}:{})}));
  if(regra==='hábito semanal')ps=Array.from({length:18},(_,i)=>({regra:'sequencia',hab:'treinar',n:i+3}));
  if(regra==='semana')ps=Array.from({length:951},(_,i)=>({regra,xp:i+50}));
  if(regra==='nota')ps=Array.from({length:51},(_,i)=>({regra,disc:'BD',aval:'P1',nota:(i+50)/10}));
  if(regra==='média final')ps=Array.from({length:41},(_,i)=>({regra:'nota',disc:'BD',media:(i+60)/10}));
  return ps.map(p=>antigo.avaliaConq(p,C,S)).find(v=>v.rk===rk)||{erro:'sem proposta neste cenário'};
}
const linhas=[];
function caso(nome,rk,p,inicial,eventos,descricao,regraAntiga=p.regra){
  const v=G.avaliaConq(p,...carrega(G,inicial)), antes=propostaAntiga(regraAntiga,rk,inicial);
  linhas.push({cenario:nome,rank:rk,regra:descricao||(!v.erro?G.descConq(v.r,G.carregar(inicial)):v.erro),
    proposta:v,resultado:simula(G,v,inicial,eventos),antes:antes?{regra:antes.r,resultado:simula(antigo,antes,inicial,eventos)}:null});
}
for(const ritmo of [1,4,8]){
  const done=hist.flatMap(d=>Array.from({length:ritmo},(_,i)=>task(d,i))), inicial={...base,done};
  const metas=G.metasConq(...carrega(G,inicial),{tipo:'est'});
  for(const m of metas)caso(`Contagem: ${ritmo} tarefas/dia`,m.rk,{regra:'contagem',tipo:'est',n:m.tarefas,rk:m.rk},inicial,
    ate=>({done:done.concat(futuro.filter(d=>d<=ate).flatMap(d=>Array.from({length:ritmo},(_,i)=>task(d,i))))}));
}
for(const m of G.CONQ_METAS){
  const done=hist.map(d=>`x ${d} ${d} Ler +rotina rec:ler:${d}`), inicial={...base,done};
  caso('Hábito diário',m.rk,{regra:'sequencia',hab:'ler',n:m.dias,rk:m.rk},inicial,
    ate=>({done:done.concat(futuro.filter(d=>d<=ate).map(d=>`x ${d} ${d} Ler +rotina rec:ler:${d}`))}));
  const treino=hist.filter(d=>G.dow(d)<3).map(d=>`x ${d} ${d} Treinar +rotina rec:treinar:${d}`);
  caso('Hábito semanal: 3×/semana',m.rk,{regra:'sequencia',hab:'treinar',n:m.semanasHab,rk:m.rk},{...base,done:treino},
    ate=>({done:treino.concat(futuro.filter(d=>d<=ate&&G.dow(d)<3).map(d=>`x ${d} ${d} Treinar +rotina rec:treinar:${d}`))}),null,'hábito semanal');
  const tarefas=hist.map(d=>task(d,0));
  caso('Constância diária',m.rk,{regra:'constancia',n:m.dias,rk:m.rk},{...base,done:tarefas},
    ate=>({done:tarefas.concat(futuro.filter(d=>d<=ate).map(d=>task(d,0)))}));
  const xpDias=Object.fromEntries(hist.map(d=>[d,G.dow(d)<5?60:50])), xp=Math.round(400*m.fatorXP);
  const semana={...base,estado:{xpDias}};
  caso('XP: recorde anterior de 400/semana',m.rk,{regra:'semana',xp,semanas:m.semanasXP,rk:m.rk},semana,
    ate=>({estado:{xpDias:{...xpDias,...Object.fromEntries(futuro.filter(d=>d<ate).map(d=>[d,Math.floor(xp/7)+(G.dow(d)<xp%7?1:0)]))}}}));
  const plano=base.avaliacoes+`\n[BD] Boss\nP1 | Prova | ${m.peso} | 2026-09-29 | |\nP2 | Prova | ${100-m.peso} | 2026-11-28 | |`;
  caso('Nota numa avaliação',m.rk,{regra:'nota',disc:'BD',aval:'P1',nota:m.nota,rk:m.rk},{...base,avaliacoes:plano},
    ate=>({notas:ate>='2026-09-29'?`2026-09-29 | BD | P1 | ${m.nota}`:''}),`Nota ${m.nota} numa avaliação de ${m.peso}%`);
  const final=base.avaliacoes+'\n[BD] Boss\nP1 | Prova | 40 | 2026-09-29 | |\nP2 | Prova | 60 | 2026-11-28 | |';
  caso('Média final da disciplina',m.rk,{regra:'nota',disc:'BD',media:m.nota,rk:m.rk},{...base,avaliacoes:final},
    ate=>({notas:(ate>='2026-09-29'?`2026-09-29 | BD | P1 | ${m.nota}`:'')+(ate>='2026-11-28'?`\n2026-11-28 | BD | P2 | ${m.nota}`:'')}),`Média final ${m.nota}; provas de 40% e 60%`,'média final');
}
// Mesmo fluxo de atividade com uma quebra: o total pode crescer, mas a sequência reinicia.
for(const regra of ['sequencia','constancia']){
  const inicial={...base,done:hist.map(d=>regra==='sequencia'?`x ${d} ${d} Ler +rotina rec:ler:${d}`:task(d,0))};
  caso(`${regra}: falta no 10º dia`,'C',{regra,n:14,rk:'C',...(regra==='sequencia'?{hab:'ler'}:{})},inicial,
    ate=>({done:inicial.done.concat(futuro.filter((d,i)=>d<=ate&&i!==9).map(d=>regra==='sequencia'?`x ${d} ${d} Ler +rotina rec:ler:${d}`:task(d,0)))}));
}
const fmt=r=>r.erro?'recusada':r.dias===null?'não cumpriu':`${r.dias} ${r.dias===1?'dia':'dias'}`;
const texto=['# Simulações da issue #75','',
  'Cenários fictícios, executados dia a dia pelo motor real. Aceitação em 30/08/2026; temporada até 12/12/2026. Atividade constante conforme cada cenário, sem dados pessoais. A comparação usa a menor meta aceita no rank pelo motor anterior, no mesmo fluxo de atividade. Não é uma previsão de comportamento humano.', '',
  '| Cenário | Rank | Meta nova | Meta anterior | Antes | Agora | Recompensa |', '|---|---|---|---|---|---|---|',
  ...linhas.map(l=>`| ${l.cenario} | ${l.rank} | ${l.regra} | ${l.antes?.regra?G.descConq(l.antes.regra,G.carregar(base)):'—'} | ${l.antes?fmt(l.antes.resultado):'—'} | ${fmt(l.resultado)} | ${l.resultado.jenny||0} J |`), '',
  'As datas mostram o primeiro resgate possível. XP semanal só conclui na segunda após as semanas completas; hábitos semanais podem concluir ao cumprir a meta da última semana. As notas exigem o peso mínimo indicado; uma avaliação de 20% não produz uma conquista lendária, mesmo com nota 10. As linhas são cenários independentes, não um conjunto simultâneo de cartas.', '',
  'Uma sequência de 13 dias de hábito novo deixa de render 6.000 J: é rank D (800 J). Cinco tarefas sem histórico são recusadas. A nova contagem D sem histórico exige 14 tarefas distribuídas por pelo menos 7 dias. Cartas já aceitas e recompensas já resgatadas conservam a regra anterior.',''].join('\n');
console.log(texto);
if(args.includes('--json'))writeFileSync(opt('--json'),JSON.stringify({hoje,fim,linhas},null,2));
if(args.includes('--markdown'))writeFileSync(opt('--markdown'),texto);
