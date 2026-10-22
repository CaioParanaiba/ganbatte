// Firefox headless, sem dados reais: node tests/test_constancia.mjs http://127.0.0.1:8799/?demo
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

async function verifica(){
  const confere = (ok, msg) => { if(!ok) throw new Error(msg); };
  const pausa = ms => new Promise(r => setTimeout(r, ms));
  for(let i = 0; !CTX && i < 100; i++) await pausa(50);
  confere(CTX, 'A página não carregou');
  const base = await fetch('/api/jogo').then(r => r.json()), passou = [];
  const carrega = api => {
    CTX = GBx.carregar(api); ({D, HOJE, TEMP, BOSSES, AVAL, NOTAS, PARC, INBOX, EST} = CTX);
    habitosL(GBx.estado(CTX));
  };
  const cenarios = [
    ['2026-08-20','2026-12-20','2027-02-01','2026-10-22',6], // férias até janeiro, sem fevereiro vazio
    ['2026-11-01','2026-11-12','2026-11-13','2026-11-05',1], // início no domingo; a segunda fica no mês anterior
    ['2024-02-01','2024-03-02','2024-03-03','2024-02-29',2], // ano bissexto
    ['2026-10-31','2026-11-01','2026-11-02','2026-10-31',2], // temporada curta na virada do mês
    ['2026-09-30','2026-10-01','2026-10-01','2026-09-30',2], // sem férias
  ];
  for(const [ini, fim, volta, hoje, meses] of cenarios){
    const jogador = {configurado:true, nome:'Teste', habitos:[{id:'h-a',n:'Leitura'}, {id:'h-s',n:'Academia',semana:2}],
      cf:{handle:'exemplo',meta:3}, duo:{usuario:'exemplo'}};
    const tarefa = (d, id, nome) => `x ${d} ${d} ${nome} +rotina rec:${id}:${d}`;
    const api = {hoje, jogador, avaliacoes:`temporada | Teste | ${ini} | ${fim} | ${volta}`, todo:[],
      done:[tarefa(ini,'h-a','Leitura'), tarefa(hoje,'h-s','Academia'), tarefa(hoje,'duo','Duolingo')],
      cf:{por_dia:{[hoje]:3}}, estado:{}, notas:'', ajustes:'', avatares:[]};
    carrega(api);
    const antes = JSON.stringify(CTX), saldo = GBx.estado(CTX).jenny;
    const linhas = [...document.querySelectorAll('#l-heat .l-hrow')];
    confere(linhas.length === 5, 'Faltou Ten, hábitos diários/semanais, Codeforces ou Duolingo');
    const ultimo = volta > fim ? addD(volta,-1) : fim;
    for(const linha of linhas){
      const blocos = [...linha.querySelectorAll('.l-hmonth')];
      confere(blocos.length === meses, `Quantidade de meses errada em ${ini}`);
      confere(blocos[0].dataset.mes === ini.slice(0,7) && blocos.at(-1).dataset.mes === ultimo.slice(0,7), 'Limites dos meses errados');
      const celulas = [...linha.querySelectorAll('.l-hg i:not(.fora)')], semanal = !!linha.querySelector('.sem');
      if(semanal){
        const seg = addD(ini, -dow(ini)), n = Math.ceil((dias(seg,ultimo)+1)/7);
        confere(celulas.length === n, 'Semana sumiu ou apareceu em dois meses');
        confere(new Set(celulas.map(c => c.title)).size === n, 'Semana duplicada');
        const primeira = celulas[0];
        confere(primeira.closest('.l-hmonth').dataset.mes === ini.slice(0,7), 'A primeira semana parcial ficou fora do mês inicial');
      } else {
        confere(celulas.length === dias(ini,ultimo)+1, 'Dia sumiu ou apareceu em dois meses');
        confere(linha.querySelectorAll('.hj').length === 1, 'O dia atual sumiu ou apareceu duas vezes');
        for(const bloco of blocos){
          const primeiro = bloco.dataset.mes + '-01', seg = addD(primeiro,-dow(primeiro));
          [...bloco.querySelectorAll('.l-hg i')].forEach((c,i) => {
            const dia = addD(seg,i), valido = dia >= ini && dia <= ultimo && dia.slice(0,7) === bloco.dataset.mes;
            confere(c.classList.contains('fora') !== valido, 'Dia exibido no mês errado');
          });
        }
      }
    }
    habitosL(GBx.estado(CTX));
    confere(JSON.stringify(CTX) === antes && GBx.estado(CTX).jenny === saldo, 'Desenhar os meses alterou os dados ou o saldo');
    passou.push(`meses, dias e semanas: ${ini} a ${ultimo}`);
  }
  // O resumo continua ao lado em tela larga; em tela estreita só a faixa dos meses rola.
  carrega(base);
  const card = document.getElementById('l-heatc');
  for(const largura of [1100,600,350]){
    card.style.width = largura + 'px'; card.style.maxWidth = 'none';
    await pausa(80);
    const faixa = card.querySelector('.l-hmonths'), resumo = card.querySelector('.l-hres');
    confere((getComputedStyle(resumo).display === 'none') === (largura < 860), 'Resumo não acompanhou a largura do bloco');
    confere(faixa.getBoundingClientRect().right <= card.getBoundingClientRect().right, 'A faixa de meses escapou do card');
    if(largura === 350){
      confere(faixa.scrollWidth > faixa.clientWidth, 'Faltou a rolagem em bloco estreito');
      faixa.scrollLeft = faixa.scrollWidth;
      confere(faixa.scrollLeft > 0, 'Não foi possível rolar até o último mês');
    }
    for(const c of card.querySelectorAll('.l-hg i:not(.fora)')){
      const r = c.getBoundingClientRect();
      confere(r.width >= 11.9 && r.width <= 26.1 && Math.abs(r.width-r.height) < .1, 'Quadradinho deformado');
    }
  }
  passou.push('larguras de 1100, 600 e 350px, resumo, quadradinhos e rolagem');
  card.style.width = ''; card.style.maxWidth = '';
  const resumo = [...card.querySelectorAll('.l-hres')].map(r => r.textContent).join('|');
  for(const nen of [false,true]) for(const nova of [false,true]) for(const efeito of ['', 'cartas','pegadas','chamas','gungi']){
    document.documentElement.classList.toggle('vis-nen',nen);
    document.documentElement.classList.toggle('lnova',nova); UI.lnova = nova; UI.heat = efeito;
    aplicaTema(); habitosL(GBx.estado(CTX));
    confere([...card.querySelectorAll('.l-hres')].map(r => r.textContent).join('|') === resumo, 'Visual alterou o resumo');
    confere([...card.querySelectorAll('.l-hrow')].every(l => l.querySelector('.l-hmonth')), 'Visual perdeu os meses');
  }
  passou.push('Lista antiga/nova, visual clássico/Nen e efeitos cartas, pegadas, chamas e Gungi');
  carrega(base);
  window.resultadoConstancia = passou;
}

const url = process.argv[2];
if(!url || (!new URL(url).searchParams.has('demo') && new URL(url).protocol !== 'file:')) throw new Error('Use o modo ?demo ou o arquivo standalone');
const pasta = mkdtempSync(join(tmpdir(), 'ganbatte-constancia-')), roteiro = join(pasta,'roteiro.json');
writeFileSync(roteiro, JSON.stringify([{js:`await (${verifica.toString()})()`}, {log:'JSON.stringify(window.resultadoConstancia)'}, {log:'Array.isArray(window.resultadoConstancia)'}]));
const navegador = fileURLToPath(new URL('../ferramentas/navegador.mjs', import.meta.url));
const r = spawnSync(process.execPath, [navegador,url,roteiro], {cwd:pasta,encoding:'utf8',timeout:90000});
process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
if(r.error || r.status !== 0 || /ERRO js:/.test(r.stdout) || !/=> true\s*$/.test(r.stdout)) process.exit(1);
