const frame = document.querySelector('.frame');
const viewport = document.querySelector('.presentation-viewport');
const stage = document.querySelector('.stage');
const slides = [...stage.querySelectorAll('.slide')];
const index = document.querySelector('#slide-index');
const indexList = document.querySelector('#index-list');
const notes = document.querySelector('#notes');
const timerButton = document.querySelector('#notes-timer');
const elapsed = document.querySelector('#elapsed');
const pipeFlow = document.querySelector('.pipe-flow');
const pipeButtons = [...document.querySelectorAll('.pipe-steps button')];
const pipeDetail = document.querySelector('#pipe-detail');
const rehearsalNotes = [
  'Diga seu nome. Olhe para a foto e identifique Thompson e Ritchie. Abra com a pergunta de como o sistema conecta dois programas independentes.',
  'Apresente os três blocos em uma frase e passe à origem no Bell Labs.',
  'Distinga a experiência de um usuário no terminal do mecanismo que divide a CPU. Use Space Travel como exemplo de como o grupo passou a trabalhar no PDP-7.',
  'Aponte a data no manual. Em 1971 ainda não havia grep nem pipes. Ligue o uso no departamento de patentes à adoção do PDP-11 dentro do laboratório.',
  'Mostre a entrada no kernel a partir de read(). Uma mudança de modo pode ocorrer no mesmo processo. Se a leitura bloqueia, o escalonador pode escolher outro.',
  'Diga seu nome ao assumir a fala. Compare um arquivo regular, um terminal e um pipe anônimo. Use lseek como exemplo de operação que faz sentido para o arquivo comum e falha no pipe.',
  'Duas aberturas independentes do mesmo inode podem ter posições diferentes. Depois de fork, pai e filho podem compartilhar a mesma posição se os descritores apontarem para a mesma abertura.',
  'Deixe o público prever a saída, depois use M. O cat só inspeciona a entrada. O wc -l conta quebras de linha.',
  'Exiba as quatro etapas em ordem. Fechar pontas de escrita é necessário para que wc veja EOF quando o buffer esvaziar. Use 1 a 4 para selecionar uma etapa.',
  'Diga seu nome. Compare um acesso a campos nomeados em C com o cálculo de posições em B. Relacione essa mudança à manutenção de estruturas do kernel.',
  'Explique o denominador dos 95%. O porte ainda exigiu adaptação de drivers, da entrada de traps e da montagem da pilha de exec. Recompilar o fonte cria um novo binário.',
  'Separe descendência por código, compatibilidade de interfaces e certificação. Use BSD para descendência e POSIX para o contrato que um programa espera encontrar.',
  'Volte ao pipeline. Identifique o que o usuário vê, o que o shell orquestra e o que o kernel faz. Feche a fala antes da cartela de fontes.',
  'Reserve dez segundos para a cartela de referências e avance ao agradecimento.',
  'Agradeçam ao público e encerrem a gravação. Tempo-alvo do vídeo inteiro 14min32s.'
];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const fullscreen = document.querySelector('#fullscreen');
const terminal = document.querySelector('.terminal-body');
const result = document.querySelector('#demo-result');
const reveal = document.querySelector('#reveal');
const titles = slides.map((slide) => document.getElementById(slide.getAttribute('aria-labelledby')).textContent.replace(/\s+/g, ' ').trim());
const formatIndex = (number) => String(number).padStart(2, '0');
let current = 0;
let timerStart = null;
let elapsedBeforePause = 0;
let timerInterval;

function renderTimer() {
  const running = timerStart === null ? 0 : performance.now() - timerStart;
  const seconds = Math.floor((elapsedBeforePause + running) / 1000);
  elapsed.textContent = formatIndex(Math.floor(seconds / 60)) + ':' + formatIndex(seconds % 60);
}

function toggleTimer() {
  if (timerStart === null) {
    timerStart = performance.now();
    timerInterval = setInterval(renderTimer, 250);
    timerButton.textContent = 'Pausar cronômetro';
  } else {
    elapsedBeforePause += performance.now() - timerStart;
    timerStart = null;
    clearInterval(timerInterval);
    timerButton.textContent = 'Retomar cronômetro';
  }
  renderTimer();
}

function resetTimer() {
  elapsedBeforePause = 0;
  if (timerStart === null) timerButton.textContent = 'Iniciar cronômetro';
  else timerStart = performance.now();
  renderTimer();
}

function showPipeStep(step) {
  pipeFlow.dataset.step = step;
  pipeButtons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === step)));
  pipeDetail.textContent = pipeButtons[step].dataset.detail;
}

function revealResult() {
  result.hidden = false;
  reveal.disabled = true;
}

function replay() {
  result.hidden = true;
  reveal.disabled = false;
  terminal.classList.remove('playing');
  void terminal.offsetWidth;
  terminal.classList.add('playing');
}

function getHashIndex() {
  const number = Number(location.hash.slice(1));
  return Number.isInteger(number) && number >= 1 && number <= slides.length ? number - 1 : 0;
}

function showSlide(target, updateHash = true) {
  current = Math.min(slides.length - 1, Math.max(0, target));
  slides.forEach((slide, position) => {
    slide.classList.toggle('active', position === current);
    slide.inert = position !== current;
    indexList.children[position].firstElementChild.setAttribute('aria-current', String(position === current));
  });
  const slide = slides[current];
  stage.classList.toggle('paper-stage', slide.classList.contains('paper'));
  document.querySelector('#chapter').textContent = slide.dataset.chapter;
  document.querySelector('#folio').textContent = formatIndex(current + 1) + ' / ' + formatIndex(slides.length);
  document.querySelector('#progress').style.setProperty('--position', (current + 1) / slides.length);
  document.querySelector('#announcement').textContent = 'Slide ' + (current + 1) + ' de ' + slides.length + '. ' + titles[current];
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  if (slide.contains(terminal)) replay();
  else terminal.classList.remove('playing');
  if (slide.contains(pipeFlow)) showPipeStep(0);
  if (updateHash && location.hash !== '#' + (current + 1)) location.hash = current + 1;
  viewport.scrollTop = 0;
  window.scrollTo(0, 0);
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (frame.requestFullscreen) {
    try {
      await frame.requestFullscreen();
    } catch {
      document.querySelector('#announcement').textContent = 'Use o modo de tela cheia do navegador.';
    }
  }
}

slides.forEach((slide, position) => {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  const number = document.createElement('small');
  number.textContent = formatIndex(position + 1);
  const title = document.createElement('span');
  title.textContent = titles[position];
  const timing = document.createElement('small');
  timing.textContent = slide.dataset.speaker + ' · ' + slide.dataset.time;
  button.append(number, title, timing);
  button.addEventListener('click', () => {
    index.close();
    showSlide(position);
  });
  item.append(button);
  indexList.append(item);
});

function openIndex() {
  index.showModal();
  indexList.children[current].firstElementChild.focus();
}

function openNotes() {
  const slide = slides[current];
  document.querySelector('#notes-meta').textContent = slide.dataset.speaker + ' · entrada em ' + slide.dataset.time;
  document.querySelector('#notes-title').textContent = titles[current];
  document.querySelector('#notes-text').textContent = rehearsalNotes[current];
  renderTimer();
  notes.showModal();
}

document.querySelector('#index').addEventListener('click', openIndex);
document.querySelector('#notes-button').addEventListener('click', openNotes);
timerButton.addEventListener('click', toggleTimer);
document.querySelector('#notes-reset').addEventListener('click', resetTimer);
pipeButtons.forEach((button, step) => button.addEventListener('click', () => showPipeStep(step)));
document.querySelector('#replay').addEventListener('click', replay);
reveal.addEventListener('click', revealResult);
fullscreen.addEventListener('click', toggleFullscreen);
previous.addEventListener('click', () => showSlide(current - 1));
next.addEventListener('click', () => showSlide(current + 1));
window.addEventListener('hashchange', () => {
  const target = getHashIndex();
  if (target !== current) showSlide(target, false);
});
document.addEventListener('fullscreenchange', () => {
  stage.focus({ preventScroll: true });
});
document.addEventListener('keydown', (event) => {
  if (index.open || notes.open || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.key === ' ' && event.target.closest('button, a')) return;
  const key = event.key.toLowerCase();
  switch (key) {
    case 'arrowright': case 'arrowdown': case 'pagedown': case ' ':
      showSlide(current + 1);
      break;
    case 'arrowleft': case 'arrowup': case 'pageup':
      showSlide(current - 1);
      break;
    case 'home': showSlide(0); break;
    case 'end': showSlide(slides.length - 1); break;
    case 'f': toggleFullscreen(); break;
    case 'i': openIndex(); break;
    case 'n': openNotes(); break;
    case 'm':
      if (slides[current].contains(terminal)) revealResult();
      break;
    case '1': case '2': case '3': case '4':
      if (slides[current].contains(pipeFlow)) showPipeStep(Number(key) - 1);
      break;
    case 'r':
      if (slides[current].contains(terminal)) replay();
      break;
    default: return;
  }
  event.preventDefault();
});

let touchStart;
stage.addEventListener('touchstart', (event) => {
  touchStart = event.touches.length === 1 ? event.touches[0] : undefined;
}, { passive: true });
stage.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const horizontal = touch.clientX - touchStart.clientX;
  const vertical = touch.clientY - touchStart.clientY;
  if (Math.abs(horizontal) > 65 && Math.abs(horizontal) > 2 * Math.abs(vertical)) {
    showSlide(current + (horizontal < 0 ? 1 : -1));
  }
  touchStart = undefined;
}, { passive: true });

showSlide(getHashIndex(), false);
