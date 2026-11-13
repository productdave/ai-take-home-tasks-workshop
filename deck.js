(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const slides = [...stage.querySelectorAll('.slide')];
  const count = document.getElementById('slideCount');
  const phase = document.getElementById('phaseLabel');
  const progress = document.getElementById('progressFill');
  const prev = document.getElementById('prevSlide');
  const next = document.getElementById('nextSlide');
  const notesButton = document.getElementById('notesButton');
  const notesPanel = document.getElementById('notesPanel');
  let index = 0;

  function hashIndex() {
    const match = window.location.hash.match(/^#(\d+)$/);
    if (!match) return null;
    const number = Number(match[1]);
    return Number.isInteger(number) ? Math.max(0, Math.min(slides.length - 1, number - 1)) : null;
  }

  function closeNotes() {
    notesPanel.classList.remove('open');
    notesButton.setAttribute('aria-expanded', 'false');
  }

  function show(number, updateHash = true) {
    index = Math.max(0, Math.min(slides.length - 1, number));
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    count.textContent = `${index + 1} / ${slides.length}`;
    phase.textContent = slides[index].dataset.phase || '';
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    closeNotes();
    if (updateHash && window.location.hash !== `#${index + 1}`) {
      history.replaceState(null, '', `#${index + 1}`);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  window.addEventListener('hashchange', () => {
    const target = hashIndex();
    if (target !== null && target !== index) show(target, false);
  });
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      show(index + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      show(index - 1);
    }
    if (event.key === 'Escape') closeNotes();
  });

  notesButton.addEventListener('click', () => {
    const isOpen = notesPanel.classList.toggle('open');
    notesButton.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      notesPanel.textContent = slides[index].querySelector('.speaker-note')?.textContent?.trim() || 'No notes for this slide.';
    }
  });

  stage.querySelectorAll('[data-reveal]').forEach(button => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.dataset.reveal);
      if (!panel) return;
      const open = panel.classList.toggle('visible');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Hide answer' : button.dataset.originalLabel;
    });
    button.dataset.originalLabel = button.textContent;
    button.setAttribute('aria-expanded', 'false');
  });

  stage.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const source = document.getElementById(button.dataset.copy);
      if (!source) return;
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(source.textContent.trim());
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select and copy text';
        source.hidden = false;
      }
      setTimeout(() => { button.textContent = original; }, 1800);
    });
  });

  const timers = new Map();
  function renderTimer(timer) {
    const minutes = Math.floor(timer.remaining / 60);
    const seconds = timer.remaining % 60;
    timer.element.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  stage.querySelectorAll('.timer[data-seconds]').forEach(element => {
    const initial = Number(element.dataset.seconds);
    const timer = { element, initial, remaining: initial, interval: null, deadline: null };
    timers.set(element.id, timer);
    renderTimer(timer);
  });
  stage.querySelectorAll('[data-timer-start]').forEach(button => {
    button.addEventListener('click', () => {
      const timer = timers.get(button.dataset.timerStart);
      if (!timer) return;
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.remaining = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
        renderTimer(timer);
        return;
      }
      if (timer.remaining === 0) timer.remaining = timer.initial;
      timer.deadline = Date.now() + timer.remaining * 1000;
      timer.interval = setInterval(() => {
        timer.remaining = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
        renderTimer(timer);
        if (timer.remaining === 0) {
          clearInterval(timer.interval);
          timer.interval = null;
        }
      }, 250);
    });
  });
  stage.querySelectorAll('[data-timer-reset]').forEach(button => {
    button.addEventListener('click', () => {
      const timer = timers.get(button.dataset.timerReset);
      if (!timer) return;
      if (timer.interval) clearInterval(timer.interval);
      timer.interval = null;
      timer.remaining = timer.initial;
      renderTimer(timer);
    });
  });

  show(hashIndex() ?? 0, false);
})();
