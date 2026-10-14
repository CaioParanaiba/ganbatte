/* Ganbatte · temporadas guardadas (#7).
 * Quando a temporada acaba (na volta às aulas), a página calcula a cápsula (GB.capsula: números finais congelados, chaves
 * neutras e os nomes do tema) e o servidor grava temporadas/NOME/ por POST /api/temporada. Também guarda antes de o
 * assistente trocar a temporada no avaliacoes.txt, e o card em Configurações guarda uma foto parcial quando o jogador quiser
 * (a da volta às aulas substitui). Ainda não há tela de histórico: por enquanto só guarda.
 * Carregado depois do script da página: usa CTX, HOJE, TEMP, post, recarrega, render, esc, toast, ddmm.
 */
(function(){
'use strict';
const GB = window.GB;
const tentou = new Set();   // nomes já tentados nesta aba (a página recarrega os dados a cada 20 s)
let rodando = false;

const temLinha = () => /^\s*temporada\s*\|/im.test(CTX.AV_TXT);   // sem a linha, o TEMP é inventado e não há o que guardar
const guardada = nome => (CTX.TEMPORADAS || []).find(t => t.nome === nome) || null;

async function guarda(motivo){
  if(rodando || window.GB_DEMO) return false;
  rodando = true;
  try {
    const r = await fetch('/api/jogo', {cache:'no-store'}), api = await r.json();
    if(!api.ok) throw new Error(api.error || 'sem dados');
    const cap = GB.capsula(api);
    await post('/api/temporada', {resumo:cap});
    await recarrega(); render();
    toast(`Temporada ${esc(cap.nome)} guardada <small>${esc(motivo)}</small>`);
    return true;
  } catch(e){ toast('Não guardou a temporada: ' + esc(e.message)); return false; }
  finally { rodando = false; }
}
/* acabou a temporada (passou da véspera da volta) e ela não está guardada até o último dia: guarda sozinha, uma vez por aba */
function confere(){
  if(!CTX || window.GB_DEMO || !temLinha()) return;
  const nome = GB.nomeTemporada(TEMP), fim = GB.fimTemporada(TEMP), g = guardada(nome);
  if(HOJE <= fim || (g && g.ate >= fim) || tentou.has(nome)) return;
  tentou.add(nome);
  guarda('os números finais ficaram congelados em temporadas/' + nome);
}
/* o assistente vai gravar um avaliacoes.txt novo: se ele troca a temporada, guarda a atual antes (até hoje) */
async function antesDeTrocar(txt){
  if(!CTX || window.GB_DEMO || !temLinha()) return true;
  const nova = GB.parseAvaliacoes(txt).temp, nome = GB.nomeTemporada(TEMP), fim = GB.fimTemporada(TEMP), g = guardada(nome);
  if(!nova || nova.nome === TEMP.nome || HOJE < TEMP.ini || (g && g.ate >= (HOJE < fim ? HOJE : fim))) return true;   // já guardada até hoje (ou até o fim)
  return guarda('antes de trocar para a ' + GB.nomeTemporada(nova));
}
function card(){
  if(!CTX || !temLinha()) return '';
  const nome = GB.nomeTemporada(TEMP), fim = GB.fimTemporada(TEMP), g = guardada(nome);
  const outras = (CTX.TEMPORADAS || []).filter(t => t.nome !== nome).map(t => esc(t.nome));
  const st = g ? (g.ate >= fim ? `A temporada <b>${esc(nome)}</b> está guardada, com os números finais (até ${ddmm(g.ate)}).`
      : `Há uma foto da <b>${esc(nome)}</b> com os números até ${ddmm(g.ate)}. A foto final sai sozinha na volta às aulas (${ddmm(GB.addD(fim, 1))}).`)
    : `A temporada <b>${esc(nome)}</b> é guardada sozinha na volta às aulas (${ddmm(GB.addD(fim, 1))}): os números finais ficam congelados e nenhuma mudança do jogo mexe neles depois.`;
  const pode = !(g && g.ate >= fim) && !window.GB_DEMO;
  return `<div class="card"><h2><span class="c">~/</span>temporada</h2><p style="margin:0 0 10px;font-size:14px">${st} Fica na pasta de dados, em <span class="mono">temporadas/${esc(nome)}/</span>, junto com uma cópia das tarefas, notas, cartas e loja daquele momento.${outras.length ? ` Guardadas antes: ${outras.join(', ')}.` : ''}</p>
    ${pode ? `<button type="button" class="btn" data-tguarda>${g ? 'atualizar a foto' : 'guardar uma foto agora'}</button>` : ''}</div>`;
}
document.addEventListener('click', e => {
  if(e.target.closest('[data-tguarda]')) guarda('foto parcial: a da volta às aulas substitui');
});
window.GB_TEMP = {confere, antesDeTrocar, card, guarda};
confere();
})();
