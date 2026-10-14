// Use um servidor com dados de teste: node tests/test_formulario.mjs http://127.0.0.1:8799/
// Reaproveita o Firefox headless do projeto, sem instalar dependências.
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

async function verifica(){
  const el = id => document.getElementById(id), pausa = ms => new Promise(r => setTimeout(r, ms));
  const erros = [], passou = [];
  addEventListener('error', e => erros.push(e.message));
  addEventListener('unhandledrejection', e => erros.push(String(e.reason)));
  const confere = (ok, msg) => { if(!ok) throw new Error(msg); };
  const espera = async fn => { for(let i = 0; i < 100; i++){ if(fn()) return; await pausa(50); } throw new Error('Tempo esgotado'); };
  const tecla = (key, extra = {}) => (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', {key, bubbles:true, ...extra}));
  const texto = t => { el('l-txt').focus(); el('l-txt').value = t; el('l-txt').dispatchEvent(new Event('input', {bubbles:true})); };
  const conta = async t => (await fetch('/api/jogo').then(r => r.json())).todo.filter(l => l.includes(t)).length;
  const abre = () => { document.activeElement.blur(); tecla('n'); confere(el('xn'), 'N não abriu a janela'); };
  const fechou = () => {
    confere(!el('xn'), 'A janela ficou aberta');
    confere(el('l-add').parentNode === el('l-form'), 'O formulário não voltou para a Lista');
    confere(document.querySelectorAll('#l-add').length === 1, 'Formulário duplicado');
    confere(el('ia-lote').parentNode === el('l-form').parentNode, 'O painel da IA saiu da Lista');
    confere(!el('l-btn').classList.contains('salva') && el('l-btn').textContent === '+ adicionar', 'Fechar manteve a confirmação de envio na Lista');
  };
  const envia = async () => { el('l-add').requestSubmit(); await espera(() => !LA.salvando); };
  const adicionou = () => {
    confere(el('xn'), 'Adicionar fechou a janela');
    confere(el('l-txt').value === '' && !el('l-txt').readOnly, 'O campo não ficou pronto para a próxima tarefa: ' + JSON.stringify({texto:el('l-txt').value, bloqueado:el('l-txt').readOnly, erro:el('l-erro').textContent}));
    confere(document.activeElement === el('l-txt'), 'O foco não voltou ao campo');
    confere(el('l-btn').classList.contains('salva') && el('l-btn').textContent === '✓ adicionada', 'O botão não confirmou o envio');
    confere(getComputedStyle(el('l-btn')).opacity === '1', 'A confirmação está apagada');
  };
  const confirmacaoSumiu = () => {
    confere(!LA.adicionada && !el('l-btn').classList.contains('salva') && el('l-btn').textContent === '+ adicionar', 'O botão não voltou ao normal após dois segundos');
    confere(![...document.querySelectorAll('.toast')].some(t => t.textContent.includes('Adicionada')), 'O aviso Adicionada não sumiu após dois segundos');
  };
  const fechaVazia = () => { el('l-txt').focus(); tecla('Enter'); fechou(); };
  const nome = t => `Teste formulário ${Date.now()} ${t}`;

  await espera(() => !!CTX);
  confere(CTX.JOG.configurado, 'Configure o jogador de teste antes de executar');
  document.querySelector('#nv-big [data-nvbig]')?.click();
  if(!el('tr-pop')) GB_GUIA.tutorial('l');
  confere(el('tr-pop'), 'O tutorial não abriu para testar o preparo automático');
  EST.tour = Object.assign(EST.tour || {}, Object.fromEntries(TABS.map(t => [t, 1])));
  // A primeira visita pode já ter aberto (ou agendado) o tutorial da Lista.
  await pausa(400);
  document.querySelector('#tr-pop [data-tr="x"]')?.click();
  await post('/api/jogo/estado', {estado:EST});
  await recarrega(); render();
  confere(TABS.every(t => EST.tour[t]), 'Os tutoriais de teste não ficaram gravados');
  confere(!document.querySelector('.wz-bg, #tr-pop'), 'Feche o assistente ou tutorial antes de executar');
  passou.push('preparo automático dos tutoriais e estado preservado ao recarregar');

  // Atualizar a Lista removia o irmão que fechaN() usava em insertBefore().
  tab('l'); UI.ldet = false; abre();
  confere(el('xn-t').textContent.includes('C cria uma caçada inteira'), 'A dica do atalho C não aparece na janela');
  const rascunho = nome('rascunho'); texto(rascunho);
  document.querySelector('#xn .wz-body').click(); confere(el('xn'), 'Clique dentro fechou a janela');
  render(); render();
  confere(!el('xn').contains(el('ia-lote')), 'O painel da IA foi parar na janela');
  el('xn').click(); fechou(); confere(!UI.ldet, 'Detalhes não voltaram ao estado anterior');
  confere(el('l-txt').value === rascunho, 'Fechar perdeu o rascunho');
  abre(); render(); tecla('Escape'); fechou();
  abre(); render(); document.querySelector('[data-nfecha]').click(); fechou();
  UI.ldet = true; abre(); tecla('Escape'); confere(UI.ldet, 'Detalhes abertos foram fechados');
  passou.push('atualização, clique fora, Esc, botão fechar e rascunho');

  for(const t of TABS){ tab(t); abre(); render(); tecla('Escape'); fechou(); }
  passou.push('N em todas as abas');
  tab('l'); texto(''); el('l-txt').focus(); tecla('n');
  confere(!el('xn'), 'Digitar N no campo abriu a janela');
  document.activeElement.blur(); tecla('n', {repeat:true}); confere(!el('xn'), 'Repetição de N abriu a janela');
  tecla('n', {ctrlKey:true}); confere(!el('xn'), 'Ctrl+N foi tratado como atalho do jogo');
  tecla('c'); confere(el('xc'), 'C não abriu a caçada'); tecla('Escape'); confere(!el('xc'), 'Esc não fechou a caçada');
  passou.push('digitação e atalhos N/C');

  abre(); const normal = nome('adicionar'); texto(normal); render();
  // Também reproduz a atualização ao voltar de outra aba do navegador.
  document.dispatchEvent(new Event('visibilitychange')); await pausa(150);
  el('l-txt').focus();
  tecla('Enter'); await espera(() => !LA.salvando); adicionou();
  confere(await conta(normal) === 1, 'A tarefa não foi gravada uma vez');
  confere([...document.querySelectorAll('.toast')].some(t => t.textContent.includes('Adicionada')), 'Confirmação visual ausente');
  confere(+getComputedStyle(document.querySelector('.toast')).zIndex > +getComputedStyle(el('xn')).zIndex, 'O aviso ficou atrás da janela');
  document.querySelector('[data-lundo]').click(); await espera(() => !D.abertas.some(t => t.raw.includes(normal)));
  confere(await conta(normal) === 0, 'Desfazer não removeu a tarefa');
  passou.push('gravação, confirmação e desfazer após atualização');

  for(let i = 0; i < 3; i++){
    const tarefa = nome('sequência ' + i); texto(tarefa);
    confere(!el('l-btn').classList.contains('salva') && !el('l-btn').disabled, 'O botão não ficou pronto para novo envio');
    tecla('Enter'); await espera(() => !LA.salvando); adicionou();
    confere(await conta(tarefa) === 1, 'Tarefa da sequência não foi gravada uma vez');
    tecla('Enter', {repeat:true}); confere(el('xn'), 'Segurar Enter fechou a janela depois do envio');
  }
  const total = (await fetch('/api/jogo').then(r => r.json())).todo.length;
  texto('   '); fechaVazia();
  confere((await fetch('/api/jogo').then(r => r.json())).todo.length === total, 'Enter vazio criou uma tarefa');
  passou.push('três tarefas sem reabrir, Enter repetido e Enter vazio fecha sem gravar');

  const fetch0 = window.fetch;
  try {
    abre(); const repetida = nome('envios repetidos'); texto(repetida);
    let pedidos = 0, libera;
    window.fetch = (url, op) => {
      if(url !== '/api/add') return fetch0(url, op);
      pedidos++; return new Promise((ok, err) => { libera = () => fetch0(url, op).then(ok, err); });
    };
    el('l-add').requestSubmit(); await espera(() => !!libera);
    for(let i = 0; i < 30; i++) el('l-add').dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
    texto(repetida); render();
    confere(el('l-btn').disabled && el('l-btn').textContent === 'adicionando…', 'O botão não indica a gravação');
    confere(el('l-add').getAttribute('aria-busy') === 'true', 'O formulário não indica que está ocupado');
    confere(el('l-txt').readOnly, 'O campo aceita texto que seria perdido durante o envio');
    tecla('Enter'); confere(el('xn'), 'Enter durante a gravação fechou a janela');
    confere(pedidos === 1, 'Envios repetidos geraram requisições duplicadas');
    libera(); await espera(() => !LA.salvando); adicionou();
    confere(await conta(repetida) === 1, 'Envios repetidos duplicaram a tarefa');
    confere(!el('l-add').hasAttribute('aria-busy'), 'O formulário continuou ocupado');
    fechaVazia();
    passou.push('30 envios simultâneos e botão durante a gravação');

    abre(); const falha = nome('falha no servidor'); texto(falha);
    window.fetch = (url, op) => url === '/api/add'
      ? Promise.resolve(new Response(JSON.stringify({ok:false, error:'Falha de teste'}))) : fetch0(url, op);
    await envia(); confere(el('xn'), 'Erro fechou a janela');
    confere(el('l-txt').value === falha && !el('l-btn').disabled, 'Erro perdeu o texto ou bloqueou a nova tentativa');
    confere(!el('l-erro').hidden && el('l-erro').textContent.includes('Falha de teste'), 'Erro não aparece dentro da janela');
    confere(await conta(falha) === 0, 'Erro criou uma tarefa');
    window.fetch = fetch0; await envia(); adicionou(); confere(await conta(falha) === 1, 'Nova tentativa não salvou'); fechaVazia();
    passou.push('erro do servidor com texto preservado e nova tentativa');

    abre(); const rede = nome('falha na conexão'); texto(rede);
    window.fetch = (url, op) => url === '/api/add' ? Promise.reject(new Error('Conexão de teste')) : fetch0(url, op);
    await envia(); confere(el('xn') && !el('l-erro').hidden && el('l-txt').value === rede, 'Falha na conexão perdeu o rascunho');
    tecla('Escape'); fechou(); passou.push('falha na conexão e fechamento');

    abre(); const atualiza = nome('falha ao atualizar'); texto(atualiza);
    let salvo = false;
    window.fetch = async (url, op) => {
      if(url === '/api/add'){ const r = await fetch0(url, op); salvo = true; return r; }
      if(url === '/api/jogo' && salvo) throw new Error('Atualização de teste');
      return fetch0(url, op);
    };
    await envia(); adicionou();
    confere(!el('l-erro').hidden && el('l-erro').textContent.includes('Tarefa adicionada'), 'Falha ao atualizar não informou que salvou');
    window.fetch = fetch0; confere(await conta(atualiza) === 1, 'Falha ao atualizar perdeu a tarefa');
    await recarrega(); render(); fechaVazia(); passou.push('gravação bem-sucedida com falha ao atualizar a Lista');
  } finally { window.fetch = fetch0; }

  abre(); const cacada = nome('caçada'); texto(cacada);
  el('l-cac').value = '+nova'; el('l-cac').dispatchEvent(new Event('change', {bubbles:true}));
  el('l-cacn').value = ''; await envia();
  confere(el('xn') && !el('l-erro').hidden, 'Caçada sem nome não mostrou o erro');
  el('l-cacn').value = nome('nome da caçada'); await envia(); adicionou();
  confere(await conta(cacada) === 1, 'Etapa da caçada não foi gravada');
  const slug = el('l-cac').value, etapa = nome('segunda etapa'); texto(etapa); await envia(); adicionou();
  confere(slug && slug !== '+nova' && el('l-cac').value === slug, 'As etapas não mantiveram a mesma caçada');
  confere((await fetch('/api/jogo').then(r => r.json())).todo.some(t => t.includes(etapa) && t.includes('+cac.' + slug)), 'Segunda etapa criou outra caçada');
  fechaVazia();
  el('l-cac').value = ''; el('l-cac').dispatchEvent(new Event('change', {bubbles:true}));
  const direta = nome('formulário da Lista'); texto(direta); await envia();
  confere(await conta(direta) === 1 && !el('xn'), 'O formulário direto da Lista parou de funcionar');
  passou.push('caçada nova, validação e formulário direto da Lista');

  confere(el('l-btn').textContent === '✓ adicionada', 'A Lista não confirmou o envio');
  tab('b'); await pausa(2200); tab('l');
  confirmacaoSumiu();
  const anterior = nome('timer da Lista'); texto(anterior); await envia();
  await pausa(1200);
  abre(); texto(nome('confirmação da janela')); await envia(); adicionou();
  await pausa(1000); adicionou();
  confere([...document.querySelectorAll('.toast')].some(t => t.textContent.includes('Adicionada')), 'O timer anterior apagou o aviso da tarefa nova');
  await pausa(1200); confirmacaoSumiu();
  confere(el('xn') && document.activeElement === el('l-txt') && el('l-txt').value === '', 'O fim da confirmação fechou a janela ou tirou o foco');
  tecla('Escape'); fechou();
  passou.push('botão e aviso somem após dois segundos na Lista e na janela, sem interromper o próximo cadastro');

  document.querySelector('[data-l="edit"]').click(); confere(el('l-ed'), 'Edição não abriu');
  abre(); texto(nome('foco')); render();
  confere(document.activeElement === el('l-txt'), 'A edição atrás da janela roubou o foco');
  tecla('Escape'); fechou();
  document.activeElement.blur(); tecla('c'); el('xc-n').focus(); render();
  confere(document.activeElement === el('xc-n'), 'A edição atrás da janela roubou o foco da caçada');
  tecla('Escape'); UI.ledit = null; render();
  const abreC = () => { document.activeElement.blur(); tecla('c'); confere(el('xc'), 'C não abriu a janela da caçada'); };
  const textoC = (n, etapas) => {
    el('xc-n').value = n; el('xc-n').dispatchEvent(new Event('input', {bubbles:true}));
    el('xc-e').value = etapas; el('xc-e').dispatchEvent(new Event('input', {bubbles:true})); el('xc-e').focus();
  };
  const enviaC = async extra => { el('xc-e').focus(); tecla('Enter', extra); await espera(() => !el('xc')?.hasAttribute('aria-busy')); };
  const criouC = () => {
    confere(el('xc') && el('xc-n').value === '' && el('xc-e').value === '', 'Criar fechou a janela ou não limpou os campos da caçada');
    confere(document.activeElement === el('xc-n'), 'O foco não voltou ao nome da próxima caçada');
    confere(!el('xc').hasAttribute('aria-busy') && !el('xc-e').disabled, 'A janela da caçada continuou ocupada');
    confere(el('xc').querySelector('[data-xok]').textContent === '✓ caçada criada', 'O botão não confirmou a criação da caçada');
    const aviso = [...document.querySelectorAll('.toast')].find(t => t.textContent.includes('Caçada criada'));
    confere(aviso && +getComputedStyle(aviso).zIndex > +getComputedStyle(el('xc')).zIndex, 'A confirmação da caçada ficou atrás da janela');
  };
  const projeto = 'teste-c-' + Date.now();
  EST.expedicoes = {...EST.expedicoes, [projeto]:{n:'Projeto de teste do C', ic:'island', ini:HOJE}};
  await post('/api/jogo/estado', {estado:EST}); await recarrega(); render();
  abreC(); el('xc-x').value = projeto; el('xc-t').value = 'est';
  const disciplina = el('xc-d').options[1].value; el('xc-d').value = disciplina;
  for(let i = 0; i < 3; i++){
    const n = nome('C sequência ' + i), etapa = nome('C etapa ' + i);
    textoC(n, etapa); el('xc-p').value = HOJE;
    if(i === 2){ el('xc').querySelector('[data-xok]').click(); await espera(() => !el('xc')?.hasAttribute('aria-busy')); }
    else await enviaC(i === 1 ? {ctrlKey:true} : {});
    criouC();
    const j = await fetch('/api/jogo').then(r => r.json()), cs = Object.entries(j.estado.cacadas).filter(([s, c]) => c.n === n);
    confere(cs.length === 1 && cs[0][1].exp === projeto && cs[0][1].prazo === HOJE, 'A caçada perdeu o projeto ou o prazo, ou foi duplicada');
    confere(j.todo.filter(l => l.includes(etapa)).length === 1 && j.todo.some(l => l.includes(etapa) && l.includes('+cac.' + cs[0][0]) && l.includes('+fac.' + disciplina)), 'A etapa foi duplicada ou perdeu os vínculos');
    confere(el('xc-x').value === projeto && el('xc-t').value === 'est' && el('xc-d').value === disciplina && el('xc-p').value === '', 'Os campos da próxima caçada não ficaram prontos');
    tecla('Enter', {repeat:true}); confere(el('xc'), 'Enter repetido fechou a janela após criar a caçada');
  }
  await pausa(2200);
  confere(el('xc').querySelector('[data-xok]').textContent === 'criar caçada' && !el('xc').querySelector('[data-xok]').classList.contains('salva'), 'O botão da caçada não voltou ao normal após dois segundos');
  confere(![...document.querySelectorAll('.toast')].some(t => t.textContent.includes('Caçada criada')), 'O aviso da caçada não sumiu após dois segundos');
  const antesC = (await fetch('/api/jogo').then(r => r.json())).todo.length;
  el('xc-e').focus(); tecla('Enter'); confere(!el('xc'), 'Enter com etapas vazias não fechou a janela');
  confere((await fetch('/api/jogo').then(r => r.json())).todo.length === antesC, 'Enter vazio criou uma etapa');
  passou.push('C mantém a janela para três caçadas, Enter/Ctrl+Enter/botão, vínculos, confirmação de dois segundos e Enter vazio');

  abreC(); const validacaoC = nome('C validação'); textoC('', validacaoC); await enviaC();
  confere(el('xc') && el('xc-e').value === validacaoC && el('xc-err').textContent.includes('nome'), 'Caçada sem nome fechou ou perdeu o rascunho');
  const shift = new KeyboardEvent('keydown', {key:'Enter', shiftKey:true, bubbles:true, cancelable:true});
  el('xc-e').dispatchEvent(shift); confere(!shift.defaultPrevented && !el('xc').hasAttribute('aria-busy'), 'Shift+Enter foi tratado como envio');
  tecla('Enter', {isComposing:true}); confere(!el('xc').hasAttribute('aria-busy'), 'Composição de texto enviou a caçada');
  tecla('Escape'); confere(!el('xc'), 'Esc não fechou a janela da caçada');
  abreC(); el('xc').querySelector('.wz-body').click(); confere(el('xc'), 'Clique dentro fechou a caçada');
  el('xc').click(); confere(!el('xc'), 'Clique fora não fechou a caçada');
  abreC(); el('xc').querySelector('[data-xfecha]').click(); confere(!el('xc'), 'Botão fechar não fechou a caçada');
  abreC(); tecla('Enter'); confere(!el('xc'), 'Enter com nome e etapas vazios não fechou a caçada');
  passou.push('C preserva a validação e o rascunho, Shift+Enter, composição de texto, Esc, clique fora e botão fechar');

  try {
    abreC(); const repetidaC = nome('C envio repetido'), etapaC = nome('C etapa única'); textoC(repetidaC, etapaC);
    let pedidos = 0, libera;
    window.fetch = (url, op) => {
      if(url !== '/api/add') return fetch0(url, op);
      pedidos++; return new Promise((ok, err) => { libera = () => fetch0(url, op).then(ok, err); });
    };
    el('xc').querySelector('[data-xok]').click(); await espera(() => !!libera);
    for(let i = 0; i < 30; i++){ el('xc').querySelector('[data-xok]').dispatchEvent(new MouseEvent('click', {bubbles:true})); tecla('Enter', {ctrlKey:true}); }
    confere(pedidos === 1 && el('xc').querySelector('[data-xok]').disabled && el('xc-e').disabled, 'C repetido duplicou o envio ou não bloqueou o formulário');
    libera(); await espera(() => !el('xc').hasAttribute('aria-busy')); criouC();
    confere(await conta(etapaC) === 1, 'C repetido duplicou a etapa'); tecla('Escape');
    passou.push('C bloqueia 30 envios simultâneos sem duplicar a etapa');

    abreC(); const parcialC = nome('C falha parcial'), primeira = nome('C primeira etapa'), segunda = nome('C segunda etapa'); textoC(parcialC, primeira + '\n' + segunda);
    let enviadas = 0;
    window.fetch = (url, op) => url === '/api/add' && ++enviadas === 2
      ? Promise.resolve(new Response(JSON.stringify({ok:false, error:'Falha parcial de teste'}))) : fetch0(url, op);
    await enviaC();
    confere(el('xc') && el('xc-e').value === segunda && el('xc-n').value === parcialC && el('xc-err').textContent.includes('em parte'), 'A falha parcial não preservou só a etapa restante');
    confere(await conta(primeira) === 1 && await conta(segunda) === 0, 'A falha parcial perdeu ou duplicou etapas');
    window.fetch = fetch0; await enviaC(); criouC();
    const j = await fetch('/api/jogo').then(r => r.json()), cs = Object.entries(j.estado.cacadas).filter(([s, c]) => c.n === parcialC);
    confere(cs.length === 1 && j.todo.filter(l => l.includes('+cac.' + cs[0][0])).length === 2 && await conta(primeira) === 1 && await conta(segunda) === 1, 'Tentar de novo criou outra caçada ou duplicou a primeira etapa');
    tecla('Enter'); confere(!el('xc'), 'Enter vazio após tentar novamente não fechou a caçada');
    passou.push('C recupera falha parcial sem reenviar etapas já gravadas nem criar outra caçada');
  } finally { window.fetch = fetch0; }
  confere(erros.length === 0, 'Erros no navegador: ' + erros.join('; '));
  passou.push('foco com edição aberta e ausência de erros no navegador');
  window.resultadoFormulario = passou;
}

const url = process.argv[2];
if(!url) throw new Error('Informe a URL do servidor com dados de teste');
const pasta = mkdtempSync(join(tmpdir(), 'ganbatte-formulario-'));
const roteiro = join(pasta, 'roteiro.json');
writeFileSync(roteiro, JSON.stringify([{js:`await (${verifica.toString()})()`}, {log:'JSON.stringify(window.resultadoFormulario)'}, {log:'Array.isArray(window.resultadoFormulario)'}]));
const navegador = fileURLToPath(new URL('../ferramentas/navegador.mjs', import.meta.url));
const r = spawnSync(process.execPath, [navegador, url, roteiro], {cwd:pasta, encoding:'utf8', timeout:120000});
process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
if(r.error || r.status !== 0 || /ERRO js:/.test(r.stdout) || !/=> true\s*$/.test(r.stdout)) process.exit(1);
