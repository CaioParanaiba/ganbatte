/* Ganbatte · efeitos da Masadora: texturas, molduras, fontes, animações e sons comprados na loja.
 * Os itens (preço, descrição) ficam em COS no motor.js; aqui fica o que eles fazem na tela.
 * - CSS: injetado uma vez, pelos atributos data-fx, data-bg, data-frame, data-font e os da #135 (data-borda, data-hover,
 *   data-cursor, data-hp, data-heat, data-trans) do <html> (aplicaTema no index.html)
 *   e pelas classes do preview da loja (.fxd.X, .tex-X, .fr-X, .ft-X).
 * - Efeitos com laço (poeira, rastro, gyo): GB_FX.aplica() liga e desliga conforme o que está equipado.
 * - Efeitos de evento: GB_FX.tarefa(retângulo do botão) ao concluir uma tarefa; GB_FX.festa() no andar novo ou chefão derrotado.
 * - Sons: Web Audio sintetizado, sem arquivos. Desligáveis por computador em Configurações (localStorage gb-somoff).
 * - Na loja, o botão ▶ (data-fxver) mostra o efeito ou toca o som antes de comprar.
 * Carregado depois do index.html: usa UI, COS (via GBx), toast.
 */
(() => {
const CSS = `
/* ---------- texturas ---------- */
:root[data-bg="scan"] body,.tex-scan{background-image:repeating-linear-gradient(0deg,color-mix(in srgb,#000 22%,transparent) 0 1px,transparent 1px 3px),radial-gradient(130% 100% at 50% 50%,transparent 55%,color-mix(in srgb,#000 38%,transparent))}
:root[data-bg="grao"] body,.tex-grao{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .45 0 0 0 0 .4 0 0 0 .13 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
:root[data-bg="hex"] body,.tex-hex{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17.32' height='30' viewBox='0 0 17.32 30'%3E%3Cpath d='M8.66 0L17.32 5V15L8.66 20L0 15V5Z M8.66 20V30' fill='none' stroke='%23909090' stroke-opacity='.16' stroke-width='.7'/%3E%3C/svg%3E");background-size:31px 54px}
:root[data-bg="teia"] body,.tex-teia{background-image:
  repeating-radial-gradient(circle at 100% 0,transparent 0 54px,color-mix(in srgb,var(--ink) 8%,transparent) 54px 55.5px),
  repeating-conic-gradient(from 180deg at 100% 0,color-mix(in srgb,var(--ink) 8%,transparent) 0 .12deg,transparent .12deg 7.5deg)}
/* ---------- molduras ---------- */
:root[data-frame="carta"] .av.me,.fr-carta .av.me{border-radius:7px;border:3px double var(--amb);box-shadow:0 0 0 2px color-mix(in srgb,var(--amb) 25%,transparent),0 6px 16px -8px var(--amb)}
:root[data-frame="escarlate"] .av.me,.fr-escarlate .av.me{border-color:#FF2E4D;animation:hjEscarlate 2.4s ease-in-out infinite}
:root[data-frame="giro"] .av.me,.fr-giro .av.me{border-color:transparent;box-shadow:none}
:root[data-frame="giro"] .av.me::after,.fr-giro .av.me::after{content:"";position:absolute;inset:-6px;border-radius:50%;pointer-events:none;
  background:conic-gradient(var(--aura),var(--volt),var(--amb),var(--red),var(--aura));
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));
  filter:drop-shadow(0 0 4px var(--aura));animation:hjGiro 3.2s linear infinite}
@keyframes hjEscarlate{0%,100%{box-shadow:0 0 0 3px color-mix(in srgb,#FF2E4D 18%,transparent),0 0 10px -4px #FF2E4D}50%{box-shadow:0 0 0 4px color-mix(in srgb,#FF2E4D 35%,transparent),0 0 26px 2px #FF2E4D}}
@keyframes hjGiro{to{transform:rotate(1turn)}}
/* ---------- fontes ---------- */
:root[data-font="maquina"],.ft-maquina{--f-ui:"JetBrains Mono",ui-monospace,monospace;--f-hud:"JetBrains Mono",ui-monospace,monospace}
:root[data-font="manga"],.ft-manga{--f-hud:Bangers,Impact,sans-serif}
:root[data-font="manga"] :is(h1,h3,.wal7),:root[data-font="manga"] h2:not(.card h2){font-family:var(--f-manga);letter-spacing:.03em;font-weight:400}
:root[data-font="pixel"],.ft-pixel{--f-hud:"Pixelify Sans","Courier New",monospace}
:root[data-font="pixel"] :is(h1,h3,.wal7),:root[data-font="pixel"] h2:not(.card h2){font-family:var(--f-pxl);font-weight:400;letter-spacing:.02em}
:root[data-font="arcade"],.ft-arcade{--f-hud:DotGothic16,"Courier New",monospace}
:root[data-font="arcade"] :is(h1,h3,.wal7),:root[data-font="arcade"] h2:not(.card h2){font-family:var(--f-dot);font-weight:400}
/* ---------- efeitos na tela ---------- */
@media (prefers-reduced-motion:no-preference){
  :root[data-fx~="corrente"] :is(.xpbar > b,.l-bar i),.fxd.corrente .xpbar > b{
    background:repeating-linear-gradient(90deg,var(--amb) 0 9px,color-mix(in srgb,var(--amb) 30%,transparent) 9px 11px,color-mix(in srgb,var(--amb) 70%,var(--bg)) 11px 20px,color-mix(in srgb,var(--amb) 30%,transparent) 20px 22px);
    background-size:44px 100%;animation:hjCorrente 1.1s linear infinite;box-shadow:0 0 8px -1px var(--amb)}
  :root[data-fx~="digita"].gb-entra :is(h1,h3,.card h2),:root[data-fx~="digita"].gb-entra h2:not(.card h2),.fxd.digita .mini b{animation:hjDigita .75s steps(22) both}
  :root[data-fx~="digita"].gb-entra .card h2::after,.fxd.digita .mini b::after{content:"_";color:var(--prompt);animation:hjCursor .5s steps(1) 4}
  :root[data-fx~="gyo"] .card,.fxd.gyo .mini{background-image:radial-gradient(240px circle at var(--mx,-999px) var(--my,-999px),color-mix(in srgb,var(--aura) 14%,transparent),transparent 70%)}
  :root[data-fx~="gyo"] .card:hover{border-color:color-mix(in srgb,var(--aura) 45%,var(--hair))}
  .fxd.gyo .mini{--mx:40%;--my:50%}
  :root[data-fx~="ascensao"] body::after{content:"";position:fixed;inset:-30%;pointer-events:none;z-index:0;opacity:.2;filter:blur(60px);
    background:conic-gradient(from 0deg at 50% 50%,var(--grn),var(--volt),var(--aura),var(--red),var(--amb),var(--grn));animation:hjGiro 48s linear infinite}
  .fxd.ascensao{background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--grn) 30%,transparent),color-mix(in srgb,var(--aura) 30%,transparent),color-mix(in srgb,var(--red) 30%,transparent),color-mix(in srgb,var(--grn) 30%,transparent))}
  :root:is([data-fx~="ascensao"],[data-fx~="estrelas"]) .wrap{position:relative;z-index:1}
  .fxd.estrelas,.fxd.rastro{background-image:radial-gradient(2px 2px at 20% 70%,var(--aura),transparent),radial-gradient(2px 2px at 60% 40%,var(--volt),transparent),radial-gradient(1.5px 1.5px at 85% 80%,var(--aura),transparent),radial-gradient(1.5px 1.5px at 40% 20%,var(--volt),transparent);animation:hjSobe 3s linear infinite}
}
@keyframes hjCorrente{to{background-position:44px 0}}
@keyframes hjDigita{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes hjCursor{50%{opacity:0}}
@keyframes hjSobe{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 -96px,0 -96px,0 -96px,0 -96px}}
/* ---------- partes dos efeitos de evento ---------- */
.gb-cv{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60}
.gb-flash{position:fixed;inset:0;pointer-events:none;z-index:59;background:radial-gradient(circle at var(--fx,50%) var(--fy,50%),var(--volt),color-mix(in srgb,var(--volt) 30%,transparent) 40%,transparent 75%);animation:hjFlash .5s ease-out forwards}
@keyframes hjFlash{0%{opacity:.55}15%{opacity:.15}30%{opacity:.4}100%{opacity:0}}
.gb-raio{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:61;overflow:visible}
.gb-raio path{fill:none;stroke-linecap:round;stroke-linejoin:round;animation:hjRaio .55s ease-out forwards}
@keyframes hjRaio{0%{stroke-dashoffset:var(--len);opacity:1}35%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.gb-carta{position:fixed;width:26px;height:36px;margin:-18px 0 0 -13px;border-radius:4px;background:#FBF8F2;border:1px solid #CFC6B5;z-index:61;pointer-events:none;
  display:grid;place-items:center;font:700 17px/1 Georgia,serif;box-shadow:0 4px 10px -4px #000;animation:hjCarta 1.1s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes hjCarta{0%{transform:translate(0,0) rotate(0) scale(.6);opacity:1}80%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(1);opacity:0}}
.gb-jan{position:fixed;z-index:62;pointer-events:none;transform:translate(-50%,-50%);font:400 54px/1 var(--f-comic);letter-spacing:.04em;color:var(--c);
  -webkit-text-stroke:2px #000;text-shadow:3px 3px 0 #000,0 0 24px var(--c);animation:hjJan .9s cubic-bezier(.2,1.6,.4,1) forwards;white-space:nowrap}
@keyframes hjJan{0%{transform:translate(-50%,-50%) scale(.2) rotate(-12deg);opacity:0}25%{transform:translate(-50%,-50%) scale(1.15) rotate(-6deg);opacity:1}70%{transform:translate(-50%,-60%) scale(1) rotate(-6deg);opacity:1}100%{transform:translate(-50%,-90%) scale(.95) rotate(-6deg);opacity:0}}
.gb-onda{position:fixed;z-index:61;pointer-events:none;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:5px solid var(--c);box-shadow:0 0 18px var(--c),inset 0 0 12px var(--c);animation:hjOnda .65s ease-out forwards}
@keyframes hjOnda{to{transform:scale(9);opacity:0;border-width:1px}}
.gb-rastro{position:fixed;z-index:58;pointer-events:none;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--c);box-shadow:0 0 10px 2px var(--c);animation:hjRastro .7s ease-out forwards}
@keyframes hjRastro{to{transform:scale(.1) translateY(-10px);opacity:0}}
/* ---------- itens novos da Masadora (#135): bordas, hover, cursor, HP, heatmap e transição de aba ----------
   Cada um tem o seu atributo no <html> (data-borda, data-hover, data-cursor, data-hp, data-heat, data-trans) e a classe
   do preview da loja (.bd-X, .hv-X, .hp-X, .hm-X, .tr-X dentro de .pvc) */
.pvc{display:block;padding:0}
.pvc .mc{position:absolute;left:16px;right:16px;top:16px;bottom:16px;background:var(--panel);border:1px solid var(--hair);border-radius:8px;display:grid;place-items:center;font:600 12px var(--f-hud);color:var(--soft)}
.pvc .tr7{position:absolute;inset:16px;overflow:hidden;border-radius:8px} .pvc .tr7 .mc{inset:0} .pvc .tr7 .tB{background:var(--panel2)}
.pvc .cur7{position:absolute;inset:0;display:grid;place-items:center} .pvc .cur7 svg{width:34px;height:40px}
.pvc .hp7{position:absolute;left:16px;right:16px;top:30px;display:grid;gap:6px;font:600 11px var(--f-hud);color:var(--soft)}
.pvc .hp7 > i{display:block;height:12px;border-radius:4px;background:var(--track);overflow:hidden} .pvc .hp7 > i > b{display:block;height:100%;width:62%;background:var(--red)}
.pvc .hm7{position:absolute;inset:14px 18px;display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(4,1fr);gap:4px}
.pvc .hm7 i{background:var(--track);border-radius:2px} .pvc .hm7 i.h3{background:var(--grn)}
:root[data-borda="dupla"] .card,.bd-dupla .mc{border:4px double var(--soft)}
:root[data-borda="corte"] .card,.bd-corte .mc{--cc:12px;border-color:transparent;border-radius:2px;background:
    linear-gradient(var(--soft),var(--soft)) right top/calc(100% - var(--cc)) 1px,linear-gradient(var(--soft),var(--soft)) left bottom/1px calc(100% - var(--cc)),
    linear-gradient(var(--soft),var(--soft)) left bottom/calc(100% - var(--cc)) 1px,linear-gradient(var(--soft),var(--soft)) right top/1px calc(100% - var(--cc)),
    linear-gradient(to bottom right,transparent calc(50% - .8px),var(--soft) 0 calc(50% + .8px),transparent 0) left top/var(--cc) var(--cc),
    linear-gradient(to bottom right,transparent calc(50% - .8px),var(--soft) 0 calc(50% + .8px),transparent 0) right bottom/var(--cc) var(--cc),
    linear-gradient(135deg,transparent calc(var(--cc) * .7071 + .5px),var(--panel) 0) left top/100% 51%,linear-gradient(-45deg,transparent calc(var(--cc) * .7071 + .5px),var(--panel) 0) right bottom/100% 51%;
  background-repeat:no-repeat;background-origin:border-box}
:root[data-borda="cantos"] .card,.bd-cantos .mc{border-color:color-mix(in srgb,var(--hair) 55%,transparent);border-radius:2px;background-origin:border-box;background-repeat:no-repeat;
  background-image:linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink)),linear-gradient(var(--ink),var(--ink));
  background-size:16px 2px,2px 16px,16px 2px,2px 16px,16px 2px,2px 16px,16px 2px,2px 16px;background-position:0 0,0 0,100% 0,100% 0,0 100%,0 100%,100% 100%,100% 100%}
:root[data-borda="corrente"] .card,.bd-corrente .mc{border:5px solid transparent;border-image:repeating-linear-gradient(90deg,var(--amb) 0 7px,transparent 7px 9px,color-mix(in srgb,var(--amb) 60%,var(--bg)) 9px 16px,transparent 16px 18px) 5}
:root[data-borda="aura"] .card,.bd-aura .mc{border-color:var(--nen-forte,var(--n2))}
:root[data-hover="contorno"] .card:hover{border-color:var(--ink)}
:root[data-hover="shu"] .card:hover{border-color:var(--aura);box-shadow:0 0 0 2px color-mix(in srgb,var(--aura) 50%,transparent),0 0 16px -2px var(--aura)}
.gb-en{position:fixed;z-index:58;pointer-events:none;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid var(--aura);animation:hjEn .7s ease-out forwards}
:root[data-cursor="ioio"] body{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='32' viewBox='0 0 24 32'%3E%3Cpath d='M12 0v16' stroke='%23999' stroke-width='1.2'/%3E%3Ccircle cx='12' cy='22' r='8' fill='%239FD3FF' stroke='%23111' stroke-width='2'/%3E%3Ccircle cx='12' cy='22' r='2.5' fill='%23111'/%3E%3C/svg%3E") 12 2,auto}
:root[data-cursor="carta"] body{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='28' viewBox='0 0 24 28'%3E%3Crect x='3' y='2' width='16' height='23' rx='2.5' fill='%23fff' stroke='%23777' transform='rotate(-14 11 14)'/%3E%3Ctext x='8' y='18' font-size='10' fill='%23E0365A' transform='rotate(-14 11 14)'%3E%E2%99%A6%3C/text%3E%3C/svg%3E") 4 4,auto}
:root[data-cursor="agulha"] body{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'%3E%3Cpath d='M2 2 22 22' stroke='%23fff' stroke-width='4' stroke-linecap='round'/%3E%3Cpath d='M2 2 22 22' stroke='%23222' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='22' cy='22' r='3' fill='none' stroke='%23222' stroke-width='1.4'/%3E%3C/svg%3E") 3 3,auto}
:root[data-hp="corrente"] :is(.hp4 > b,.l-boss .hp i),.hp-corrente .hp7 > i > b{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='14'%3E%3Cellipse cx='7.5' cy='7' rx='6.2' ry='4' fill='none' stroke='%23596069' stroke-width='3.2'/%3E%3Cellipse cx='7.5' cy='7' rx='6.2' ry='4' fill='none' stroke='%23B9BFC8' stroke-width='1.8'/%3E%3Crect x='12.5' y='5.6' width='10' height='2.8' rx='1.4' fill='%23D5D9DF' stroke='%23596069' stroke-width='.8'/%3E%3C/svg%3E") repeat-x left center/22px 100%;background-color:transparent}
:root[data-hp="cristal"] :is(.hp4 > b,.l-boss .hp i),.hp-cristal .hp7 > i > b{background:linear-gradient(115deg,#BFE8FF 0 20%,#7FC8F8 20% 45%,#E6F7FF 45% 55%,#5FA8E8 55% 80%,#BFE8FF 80%)}
:root[data-heat="cartas"] .l-hg i:not(.fora),.hm-cartas .hm7 i{border-radius:1px;transform:scaleX(.72)}
:root[data-heat="cartas"] .l-hg i:is(.h1,.h2,.h3,.h4,.z),.hm-cartas .hm7 i.h3{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 35%,transparent)}
:root[data-heat="pegadas"] .l-hg i:not(.fora),.hm-pegadas .hm7 i{border-radius:50% 50% 45% 45%/60% 60% 40% 40%;transform:scale(.75,.95)}
:root[data-heat="chamas"] .l-hg i:is(.h1,.h2,.h3,.h4,.z),.hm-chamas .hm7 i.h3{-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 14'%3E%3Cpath d='M5 0C6.5 3 9.5 5.5 9.5 9a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.6 2.4-4.6 0 1.8.8 3 1.9 3.2C4.2 5.6 3.6 2.8 5 0Z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 14'%3E%3Cpath d='M5 0C6.5 3 9.5 5.5 9.5 9a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.6 2.4-4.6 0 1.8.8 3 1.9 3.2C4.2 5.6 3.6 2.8 5 0Z'/%3E%3C/svg%3E") center/contain no-repeat}
:root[data-heat="chamas"] .l-hg i:is(.h3,.h4),.hm-chamas .hm7 i.h3{background:#FF6A1F}
@media (prefers-reduced-motion:no-preference){
  :root[data-borda="aura"] .card,.bd-aura .mc{animation:hjBordaAura 2.4s ease-in-out infinite}
  :root[data-hover="vira"] .card:hover{animation:hjVira .7s ease-in-out}
  :root[data-hover="bungee"] .card:hover{transform-origin:0 50%;animation:hjBungee .6s ease-in-out}
  .hv-contorno .mc{animation:hjContorno 2.4s ease-in-out infinite} .hv-shu .mc{animation:hjShu 2.4s ease-in-out infinite}
  .hv-vira .mc{animation:hjVira 2.4s ease-in-out infinite} .hv-bungee .mc{transform-origin:0 50%;animation:hjBungee 2.4s ease-in-out infinite}
  .hv-en .en7{position:absolute;width:20px;height:20px;border-radius:50%;left:40%;top:40%;border:2px solid var(--aura);animation:hjEn 2.4s ease-out infinite}
  .pvc .cur7 svg{animation:hjCur 3s ease-in-out infinite}
  :root[data-heat="chamas"] .l-hg i:is(.h1,.h2,.h3,.h4,.z),.hm-chamas .hm7 i.h3{transform-origin:50% 100%;animation:hjChama 1.3s ease-in-out infinite alternate}
  :root[data-trans="deslizar"].gb-troca section[id^="v-"]:not([hidden]){animation:hjDesliza .3s ease-out}
  :root[data-trans="glitch"].gb-troca section[id^="v-"]:not([hidden]){animation:hjGlitch .4s steps(1)}
  .tr-deslizar .tA{animation:hjSlideA 3s ease-in-out infinite} .tr-deslizar .tB{animation:hjSlideB 3s ease-in-out infinite}
  .tr-glitch .mc{animation:hjGlitchPv 2.6s steps(1) infinite}
}
@keyframes hjBordaAura{0%,100%{box-shadow:0 0 0 1px var(--nen-forte,var(--n2)),0 0 6px -2px var(--nen-forte,var(--n2))}50%{box-shadow:0 0 0 2px var(--nen-forte,var(--n2)),0 0 18px 2px var(--nen-forte,var(--n2))}}
@keyframes hjContorno{0%,40%{border-color:var(--hair)}50%,90%{border-color:var(--ink)}}
@keyframes hjShu{0%,40%{box-shadow:none;border-color:var(--hair)}55%,90%{box-shadow:0 0 0 2px color-mix(in srgb,var(--aura) 50%,transparent),0 0 16px -2px var(--aura);border-color:var(--aura)}}
@keyframes hjVira{0%{transform:perspective(600px) rotateY(0)}100%{transform:perspective(600px) rotateY(360deg)}}
@keyframes hjBungee{0%{transform:scaleX(1)}35%{transform:scaleX(1.06)}65%{transform:scaleX(.97)}100%{transform:scaleX(1)}}
@keyframes hjEn{0%{transform:scale(.3);opacity:1}100%{transform:scale(7);opacity:0}}
@keyframes hjCur{0%,100%{transform:translate(-20px,-6px)}50%{transform:translate(24px,8px)}}
@keyframes hjChama{0%{transform:scale(1,1)}50%{transform:scale(.88,1.12) skewX(3deg)}100%{transform:scale(1.05,.92) skewX(-3deg)}}
@keyframes hjDesliza{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
@keyframes hjGlitch{0%{clip-path:inset(20% 0 50% 0);transform:translateX(-6px)}30%{clip-path:inset(60% 0 10% 0);transform:translateX(6px)}60%{clip-path:none;transform:translateX(-2px)}100%{clip-path:none;transform:none}}
@keyframes hjGlitchPv{0%,70%{clip-path:none;transform:none}72%{clip-path:inset(20% 0 50% 0);transform:translateX(-6px)}75%{clip-path:inset(60% 0 10% 0);transform:translateX(6px)}78%{clip-path:none;transform:none}}
@keyframes hjSlideA{0%,40%{transform:translateX(0)}50%,90%{transform:translateX(-110%)}100%{transform:translateX(0)}}
@keyframes hjSlideB{0%,40%{transform:translateX(110%)}50%,90%{transform:translateX(0)}100%{transform:translateX(110%)}}
/* ---------- molduras simples ---------- */
:root[data-frame="fina"] .av.me,.fr-fina .av.me{border:1px solid var(--ink);box-shadow:none}
:root[data-frame="dupla"] .av.me,.fr-dupla .av.me{border:4px double var(--soft);box-shadow:none}
/* ---------- loja ---------- */
.gb-ver{min-width:34px;padding-inline:10px}
.pv .gb-tag{position:absolute;right:8px;bottom:6px;font:600 10px var(--f-mono);color:var(--soft);background:var(--panel);border:1px solid var(--hair);border-radius:99px;padding:0 7px}
.pv.som{display:flex;justify-content:center;gap:4px;align-items:flex-end}
.pv.som i{width:6px;border-radius:3px;background:var(--aura);height:var(--h);animation:hjEq 1s ease-in-out infinite alternate;animation-delay:var(--d)}
@keyframes hjEq{from{height:8px}to{height:var(--h)}}
`;
const st = document.createElement('style'); st.id = 'gb-efeitos'; st.textContent = CSS; document.head.appendChild(st);

const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const temFx = f => fxVisiveis().includes(f);   // fxVisiveis (index.html): os equipados e o que está sendo provado na loja
const cor = v => getComputedStyle(document.documentElement).getPropertyValue('--' + v).trim() || '#9FD3FF';
const centro = r => r ? [r.left + r.width/2, r.top + r.height/2] : [innerWidth/2, innerHeight/2];
const tira = (el, ms) => { document.body.appendChild(el); setTimeout(() => el.remove(), ms); return el; };

/* ---------- efeitos de evento ---------- */
const EV = {
  godspeed(r){
    const [x, y] = centro(r), alvo = [innerWidth * (.55 + Math.random()*.4), -20];
    const zigue = (a, b, n, amp) => { const ps = [a]; for(let i = 1; i < n; i++){ const t = i/n;
      ps.push([a[0] + (b[0]-a[0])*t + (Math.random()-.5)*amp, a[1] + (b[1]-a[1])*t + (Math.random()-.5)*amp*.4]); } ps.push(b); return ps; };
    const tronco = zigue([x, y], alvo, 16, 110), caminhos = [tronco];
    for(let k = 0; k < 3; k++){   // galhos saindo do tronco
      const i = 3 + Math.floor(Math.random()*(tronco.length - 6)), o = tronco[i], ang = Math.random()*Math.PI*2, len = 80 + Math.random()*140;
      caminhos.push(zigue(o, [o[0] + Math.cos(ang)*len, o[1] + Math.sin(ang)*len], 6, 40)); }
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'gb-raio');
    caminhos.forEach((ps, j) => {
      const d = 'M' + ps.map(p => p.map(Math.round).join(' ')).join(' L'), k = j ? .45 : 1;
      [[12*k, cor('volt'), .35, 'blur(7px)'], [4*k, cor('volt'), 1, 'drop-shadow(0 0 6px ' + cor('volt') + ')'], [1.6*k, '#FFFFFF', 1, '']].forEach(([w, c, o, f]) => {
        const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.style.stroke = c; p.style.strokeWidth = w; p.style.opacity = o; if(f) p.style.filter = f;
        if(j) p.style.animationDelay = '.08s'; svg.appendChild(p); });
    });
    tira(svg, 800);
    svg.querySelectorAll('path').forEach(p => { const len = Math.ceil(p.getTotalLength()); p.style.strokeDasharray = len; p.style.setProperty('--len', len); });
    const fl = document.createElement('div'); fl.className = 'gb-flash'; fl.style.setProperty('--fx', x + 'px'); fl.style.setProperty('--fy', y + 'px'); tira(fl, 550);
  },
  baralho(r){
    const [x, y] = centro(r), naipes = [['♠','#111'],['♥','#C8102E'],['♦','#C8102E'],['♣','#111']];
    for(let i = 0; i < 12; i++){
      const c = document.createElement('div'), [s, k] = naipes[i % 4], a = -Math.PI/2 + (Math.random()-.5)*2.4, v = 120 + Math.random()*160;
      c.className = 'gb-carta'; c.textContent = s; c.style.color = k; c.style.left = x + 'px'; c.style.top = y + 'px';
      c.style.setProperty('--dx', Math.cos(a)*v + 'px'); c.style.setProperty('--dy', Math.sin(a)*v + 60 + 'px'); c.style.setProperty('--rot', (Math.random()*720 - 360) + 'deg');
      c.style.animationDelay = (i*25) + 'ms'; tira(c, 1500);
    }
  },
  jajanken(r){
    const [x, y] = centro(r), [txt, c] = [['PEDRA!', cor('amb')], ['TESOURA!', cor('red')], ['PAPEL!', cor('grn')]][Math.floor(Math.random()*3)];
    const o = document.createElement('div'); o.className = 'gb-onda'; o.style.left = x + 'px'; o.style.top = y + 'px'; o.style.setProperty('--c', c); tira(o, 700);
    const t = document.createElement('div'); t.className = 'gb-jan'; t.textContent = txt; t.style.setProperty('--c', c);
    t.style.left = Math.min(Math.max(x, 140), innerWidth - 140) + 'px'; t.style.top = Math.max(y - 30, 60) + 'px'; tira(t, 1000);
  },
  fogos(){
    const cv = document.createElement('canvas'), dpr = Math.min(devicePixelRatio || 1, 2); cv.className = 'gb-cv';
    cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr); document.body.appendChild(cv);
    const cores = ['volt','aura','amb','grn','red'].map(cor), ps = [], fim = performance.now() + 2600;
    const estoura = () => { const x = innerWidth*(.15 + Math.random()*.7), y = innerHeight*(.12 + Math.random()*.35), c1 = cores[Math.floor(Math.random()*cores.length)];
      const c2 = cores[Math.floor(Math.random()*cores.length)];
      for(let i = 0; i < 90; i++){ const a = Math.random()*Math.PI*2, v = 1.5 + Math.random()*4.2, c = i % 3 ? c1 : c2; ps.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, c, vida:1}); } };
    [0, 350, 700, 1050, 1500].forEach(t => setTimeout(estoura, t));
    const passo = now => {
      g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, innerWidth, innerHeight);   // rastro que some aos poucos
      g.globalCompositeOperation = 'lighter';
      for(const p of ps){ p.vy += .045; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.vida -= .011;
        if(p.vida <= 0) continue; g.globalAlpha = p.vida; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill();
        if(Math.random() < .08){ g.fillStyle = '#FFF'; g.beginPath(); g.arc(p.x, p.y, 1.4, 0, 7); g.fill(); } }
      if(now < fim) requestAnimationFrame(passo); else cv.remove();
    };
    requestAnimationFrame(passo);
  },
  confete(){ if(typeof confete === 'function') confete(true); },
};

/* ---------- efeitos com laço ---------- */
let poeira = null;
function ligaPoeira(on){
  if(!on){ if(poeira){ cancelAnimationFrame(poeira.raf); poeira.cv.remove(); poeira = null; } return; }
  if(poeira) return;
  const cv = document.createElement('canvas'); cv.className = 'gb-cv'; cv.style.zIndex = 0; cv.style.opacity = .75; document.body.prepend(cv);
  const g = cv.getContext('2d'), ps = [];
  const mede = () => { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  mede(); addEventListener('resize', mede);
  for(let i = 0; i < 46; i++) ps.push({x:Math.random()*innerWidth, y:Math.random()*innerHeight, r:.6 + Math.random()*1.8, v:.15 + Math.random()*.45, f:Math.random()*6, k:i % 2});
  poeira = {cv, raf:0};
  const passo = () => {
    if(!poeira) return;
    if(!document.hidden){
      const cs = [cor('aura'), cor('volt')]; g.clearRect(0, 0, innerWidth, innerHeight);
      for(const p of ps){ p.y -= p.v; p.f += .02; p.x += Math.sin(p.f)*.25; if(p.y < -10){ p.y = innerHeight + 10; p.x = Math.random()*innerWidth; }
        g.globalAlpha = .35 + .35*Math.sin(p.f*1.7); g.fillStyle = cs[p.k]; g.shadowColor = cs[p.k]; g.shadowBlur = 8; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
    }
    poeira.raf = requestAnimationFrame(passo);
  };
  passo();
}
let ultRastro = 0, ultCard = null;
/* En (hover): ao entrar num card, um círculo de aura se espalha do cursor */
document.addEventListener('pointerover', e => {
  if(e.pointerType !== 'mouse' || calmo() || vista().hover !== 'en') return;
  const c = e.target.closest && e.target.closest('.card'); if(!c || c === ultCard) return; ultCard = c;
  const o = document.createElement('i'); o.className = 'gb-en'; o.style.left = e.clientX + 'px'; o.style.top = e.clientY + 'px'; tira(o, 750);
}, {passive:true});
document.addEventListener('pointerout', e => { if(ultCard && !(e.relatedTarget && ultCard.contains(e.relatedTarget))) ultCard = null; }, {passive:true});
document.addEventListener('pointermove', e => {
  if(e.pointerType !== 'mouse' || calmo()) return;
  if(temFx('gyo')){ const c = e.target.closest && e.target.closest('.card'); if(c){ const b = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - b.left) + 'px'); c.style.setProperty('--my', (e.clientY - b.top) + 'px'); } }
  if(temFx('rastro')){ const t = performance.now(); if(t - ultRastro < 22) return; ultRastro = t;
    const d = document.createElement('i'); d.className = 'gb-rastro'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
    d.style.setProperty('--c', Math.random() < .5 ? 'var(--aura)' : 'var(--volt)'); tira(d, 750); }
}, {passive:true});

/* ---------- sons (Web Audio, sem arquivos) ---------- */
let AC = null;
const ac = () => { if(!AC){ const K = window.AudioContext || window.webkitAudioContext; if(!K) return null; AC = new K(); } if(AC.state === 'suspended') AC.resume(); return AC; };
function tom(f, t0, dur, tipo, vol, f2){
  const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
  o.type = tipo || 'square'; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function ruido(t0, dur, vol, corte){
  const a = ac(); if(!a) return; const t = a.currentTime + t0, n = Math.floor(a.sampleRate*dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for(let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1) * (1 - i/n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = corte; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(t);
}
const SONS = {
  moeda: {tarefa(){ tom(988, 0, .09, 'square', .05); tom(1319, .08, .4, 'square', .05); },
          festa(){ [523, 659, 784, 1047, 1319].forEach((f, i) => tom(f, i*.08, .3, 'square', .045)); }},
  golpe: {tarefa(){ ruido(0, .1, .5, 1600); tom(150, 0, .28, 'sine', .5, 45); },
          festa(){ ruido(0, .1, .5, 1600); tom(150, 0, .28, 'sine', .5, 45); ruido(.22, .14, .6, 2200); tom(110, .22, .45, 'sine', .6, 35); }},
  sino:  {tarefa(){ tom(880, 0, 1.8, 'sine', .14); tom(1760, 0, 1.1, 'sine', .04); tom(2640, 0, .6, 'sine', .02); },
          festa(){ [659, 880, 1319].forEach((f, i) => { tom(f, i*.35, 2.2, 'sine', .12); tom(f*2, i*.35, 1.2, 'sine', .035); }); }},
  clique: {tarefa(){ tom(2400, 0, .03, 'square', .05); tom(1200, .02, .03, 'square', .035); },
           festa(){ [0, .09, .18].forEach(t => { tom(2400, t, .03, 'square', .05); tom(1200, t + .02, .03, 'square', .035); }); }},
  gota:   {tarefa(){ tom(1400, 0, .2, 'sine', .16, 500); },
           festa(){ [0, .16, .32].forEach((t, i) => tom(1400 + i*200, t, .2, 'sine', .14, 500 + i*100)); }},
  fanfarra: {tarefa(){ tom(784, 0, .07, 'square', .04); tom(1175, .07, .07, 'square', .04); tom(1568, .14, .18, 'square', .04); },
             festa(){ [[523,0,.12],[523,.13,.12],[523,.26,.12],[659,.4,.35],[587,.78,.12],[659,.92,.12],[784,1.06,.6]].forEach(([f, t, d]) => { tom(f, t, d, 'square', .05); tom(f/2, t, d, 'triangle', .05); }); }},
};
const somOff = () => { try { return localStorage.getItem('gb-somoff') === '1'; } catch(e){ return false; } };
const toca = (k, ev) => { const s = SONS[k]; if(s && s[ev]) try { s[ev](); } catch(e){} };

/* ---------- interface usada pelo index.html ---------- */
window.GB_FX = {
  EV: ['godspeed', 'baralho', 'jajanken'], FESTA: ['fogos'],
  aplica(){ ligaPoeira(temFx('estrelas') && !calmo()); },
  aba(){ const r = document.documentElement;
    if(vista().trans){ r.classList.remove('gb-troca'); void r.offsetWidth; r.classList.add('gb-troca'); clearTimeout(this._tr); this._tr = setTimeout(() => r.classList.remove('gb-troca'), 450); }
    if(!temFx('digita')) return; r.classList.add('gb-entra'); clearTimeout(this._aba); this._aba = setTimeout(() => r.classList.remove('gb-entra'), 900); },
  tarefa(r){
    if(UI.som && !somOff()) toca(UI.som, 'tarefa');
    if(UI.fxOff || calmo()) return;
    for(const f of this.EV) if(UI.fx.includes(f)) EV[f](r);
  },
  festa(){
    if(UI.som && !somOff()) toca(UI.som, 'festa');
    if(UI.fxOff || calmo()) return;
    if(UI.fx.includes('fogos')) EV.fogos();
  },
  /* ▶ na loja: mostra o efeito ou toca o som, comprado ou não */
  ver(id, r){
    const it = GBx.COS.find(i => i.id === id); if(!it) return;
    if(it.cat === 'som'){ toca(it.eq.som, 'tarefa'); setTimeout(() => toca(it.eq.som, 'festa'), 900); return; }
    if(EV[it.fx]) EV[it.fx](r);
  },
  somOff,
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-fxver]'); if(!b) return;
  GB_FX.ver(b.dataset.fxver, b.getBoundingClientRect());
});
})();
