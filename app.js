// ---------- State ----------
const state = {
  data: TAMIL_DATA,     // read-only: content changes by editing data.js and pushing
  view: 'words',       // 'words' | 'quiz'
  currentChapterId: null,
  quiz: null            // active quiz session object
};

if (state.data.chapters.length) {
  state.currentChapterId = state.data.chapters[0].id;
}

// ---------- Helpers ----------
function getChapter(id) {
  return state.data.chapters.find(c => c.id === id);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Render root ----------
const root = document.getElementById('app');

function render() {
  root.innerHTML = '';
  root.appendChild(renderSidebar());
  const main = document.createElement('main');
  main.className = 'main';
  if (state.view === 'words') main.appendChild(renderWordsView());
  else if (state.view === 'quiz') main.appendChild(renderQuizView());
  root.appendChild(main);
}

// ---------- Sidebar ----------
function renderSidebar() {
  const wrap = document.createElement('aside');
  wrap.className = 'sidebar';

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = `<span class="brand-ta">தமிழ்</span><span class="brand-en">Tamil Practice</span>`;
  wrap.appendChild(brand);

  const nav = document.createElement('div');
  nav.className = 'nav';
  [
    ['words', 'Words'],
    ['quiz', 'Quiz']
  ].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = 'nav-btn' + (state.view === key ? ' active' : '');
    b.onclick = () => { state.view = key; render(); };
    nav.appendChild(b);
  });
  wrap.appendChild(nav);

  const chHeader = document.createElement('div');
  chHeader.className = 'sidebar-label';
  chHeader.textContent = 'Chapters';
  wrap.appendChild(chHeader);

  const list = document.createElement('div');
  list.className = 'chapter-list';
  state.data.chapters.forEach(ch => {
    const item = document.createElement('button');
    item.className = 'chapter-item' + (ch.id === state.currentChapterId && state.view === 'words' ? ' active' : '');
    item.innerHTML = `<span>${escapeHtml(ch.name)}</span><span class="chapter-count">${ch.words.length}</span>`;
    item.onclick = () => { state.currentChapterId = ch.id; state.view = 'words'; render(); };
    list.appendChild(item);
  });
  wrap.appendChild(list);

  return wrap;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---------- Words view ----------
function renderWordsView() {
  const wrap = document.createElement('div');
  wrap.className = 'view words-view';

  const chapter = getChapter(state.currentChapterId);
  if (!chapter) {
    wrap.innerHTML = `<div class="empty-state"><h2>No chapters yet</h2><p>Add chapters to data.js.</p></div>`;
    return wrap;
  }

  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `<h2>${escapeHtml(chapter.name)}</h2>`;
  wrap.appendChild(header);

  // Chapter-level notes: cultural points and tips that apply to the whole chapter, not one word.
  if (chapter.notes) {
    const notes = document.createElement('section');
    notes.className = 'chapter-notes';
    notes.innerHTML = `<div class="setup-label">Chapter notes</div><div class="chapter-notes-body">${escapeHtml(chapter.notes)}</div>`;
    wrap.appendChild(notes);
  }

  if (chapter.words.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state small';
    empty.textContent = 'No words in this chapter yet.';
    wrap.appendChild(empty);
    return wrap;
  }

  const table = document.createElement('div');
  table.className = 'word-table';
  const thead = document.createElement('div');
  thead.className = 'word-row word-row-head';
  thead.innerHTML = `<div>Pronunciation</div><div>English</div><div>Notes</div>`;
  table.appendChild(thead);

  chapter.words.forEach(w => {
    const row = document.createElement('div');
    row.className = 'word-row';
    row.innerHTML = `
      <div class="cell-pron">${escapeHtml(w.pronunciation)}</div>
      <div>${escapeHtml(w.english)}</div>
      <div class="cell-notes">${escapeHtml(w.notes || '')}</div>
    `;
    table.appendChild(row);
  });
  wrap.appendChild(table);

  return wrap;
}

// ---------- Quiz setup + session ----------
function renderQuizView() {
  const wrap = document.createElement('div');
  wrap.className = 'view quiz-view';

  if (!state.quiz) {
    wrap.appendChild(renderQuizSetup());
  } else if (!state.quiz.finished) {
    wrap.appendChild(renderQuizCard());
  } else {
    wrap.appendChild(renderQuizSummary());
  }
  return wrap;
}

function renderQuizSetup() {
  const wrap = document.createElement('div');
  wrap.className = 'quiz-setup';
  wrap.innerHTML = `<h2>Start a quiz</h2>`;

  if (state.data.chapters.length === 0) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Add a chapter with some words to data.js first.';
    wrap.appendChild(p);
    return wrap;
  }

  const chSection = document.createElement('div');
  chSection.className = 'setup-section';
  chSection.innerHTML = `<div class="setup-label">Chapters</div>`;
  const chOptions = document.createElement('div');
  chOptions.className = 'chip-group';

  const allChip = document.createElement('button');
  allChip.className = 'chip active';
  allChip.textContent = 'All chapters';
  allChip.dataset.all = 'true';
  chOptions.appendChild(allChip);

  state.data.chapters.forEach(ch => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = ch.name;
    chip.dataset.chapterId = ch.id;
    chOptions.appendChild(chip);
  });
  chSection.appendChild(chOptions);
  wrap.appendChild(chSection);

  let selectedAll = true;
  const selectedChapters = new Set();

  chOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    if (btn.dataset.all) {
      selectedAll = true;
      selectedChapters.clear();
      [...chOptions.children].forEach(c => c.classList.toggle('active', c === btn));
    } else {
      selectedAll = false;
      allChip.classList.remove('active');
      const id = btn.dataset.chapterId;
      if (selectedChapters.has(id)) { selectedChapters.delete(id); btn.classList.remove('active'); }
      else { selectedChapters.add(id); btn.classList.add('active'); }
      if (selectedChapters.size === 0) { selectedAll = true; allChip.classList.add('active'); }
    }
  });

  const dirSection = document.createElement('div');
  dirSection.className = 'setup-section';
  dirSection.innerHTML = `<div class="setup-label">Direction</div>`;
  const dirOptions = document.createElement('div');
  dirOptions.className = 'chip-group';
  let direction = 'mixed';
  const dirs = [['ta-en', 'Pronunciation → English'], ['en-ta', 'English → Pronunciation'], ['mixed', 'Mixed']];
  dirs.forEach(([key, label]) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (key === direction ? ' active' : '');
    chip.textContent = label;
    chip.onclick = () => {
      direction = key;
      [...dirOptions.children].forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    };
    dirOptions.appendChild(chip);
  });
  dirSection.appendChild(dirOptions);
  wrap.appendChild(dirSection);

  const startBtn = document.createElement('button');
  startBtn.className = 'primary-btn large';
  startBtn.textContent = 'Start quiz';
  startBtn.onclick = () => {
    const chapterIds = selectedAll ? state.data.chapters.map(c => c.id) : [...selectedChapters];
    const words = state.data.chapters
      .filter(c => chapterIds.includes(c.id))
      .flatMap(c => c.words.map(w => ({ ...w, chapterName: c.name })));
    if (words.length === 0) { alert('No words in the selected chapter(s).'); return; }
    startQuiz(words, direction);
  };
  wrap.appendChild(startBtn);

  return wrap;
}

function startQuiz(words, direction) {
  const queue = shuffle(words).map(w => {
    let dir = direction;
    if (direction === 'mixed') dir = Math.random() < 0.5 ? 'ta-en' : 'en-ta';
    return { word: w, dir };
  });
  state.quiz = {
    queue,
    index: 0,
    revealed: false,
    finished: false,
    known: 0,
    unknown: 0
  };
  render();
}

function renderQuizCard() {
  const q = state.quiz;
  const current = q.queue[q.index];
  const wrap = document.createElement('div');
  wrap.className = 'quiz-card-wrap';

  const progress = document.createElement('div');
  progress.className = 'quiz-progress';
  progress.textContent = `${q.index + 1} / ${q.queue.length}`;
  wrap.appendChild(progress);

  const card = document.createElement('div');
  card.className = 'flashcard';

  const prompt = current.dir === 'ta-en' ? current.word.pronunciation : current.word.english;
  const answer = current.dir === 'ta-en' ? current.word.english : current.word.pronunciation;

  card.innerHTML = `
    <svg class="kolam-corner tl" viewBox="0 0 40 40"><use href="#kolam-dots"/></svg>
    <svg class="kolam-corner br" viewBox="0 0 40 40"><use href="#kolam-dots"/></svg>
    <div class="flashcard-chapter">${escapeHtml(current.word.chapterName)}</div>
    <div class="flashcard-prompt">${escapeHtml(prompt)}</div>
    <div class="flashcard-answer ${q.revealed ? 'shown' : ''}">
      ${q.revealed ? escapeHtml(answer) : ''}
      ${q.revealed && current.word.notes ? `<div class="flashcard-notes">${escapeHtml(current.word.notes)}</div>` : ''}
    </div>
  `;
  wrap.appendChild(card);

  const controls = document.createElement('div');
  controls.className = 'quiz-controls';

  if (!q.revealed) {
    const showBtn = document.createElement('button');
    showBtn.className = 'primary-btn large';
    showBtn.textContent = 'Show answer';
    showBtn.onclick = () => { q.revealed = true; render(); };
    controls.appendChild(showBtn);
  } else {
    const dontKnow = document.createElement('button');
    dontKnow.className = 'answer-btn no';
    dontKnow.textContent = "Didn't know it";
    dontKnow.onclick = () => { q.unknown++; nextCard(); };
    controls.appendChild(dontKnow);

    const know = document.createElement('button');
    know.className = 'answer-btn yes';
    know.textContent = 'Knew it';
    know.onclick = () => { q.known++; nextCard(); };
    controls.appendChild(know);
  }
  wrap.appendChild(controls);

  const quitBtn = document.createElement('button');
  quitBtn.className = 'ghost-btn';
  quitBtn.textContent = 'End quiz';
  quitBtn.onclick = () => { state.quiz = null; render(); };
  wrap.appendChild(quitBtn);

  return wrap;
}

function nextCard() {
  const q = state.quiz;
  q.index++;
  q.revealed = false;
  if (q.index >= q.queue.length) q.finished = true;
  render();
}

function renderQuizSummary() {
  const q = state.quiz;
  const wrap = document.createElement('div');
  wrap.className = 'quiz-summary';
  const total = q.known + q.unknown;
  const pct = total ? Math.round((q.known / total) * 100) : 0;
  wrap.innerHTML = `
    <h2>Session complete</h2>
    <div class="summary-score">${pct}%</div>
    <p class="muted">${q.known} knew it &middot; ${q.unknown} didn't know · ${total} total</p>
  `;
  const again = document.createElement('button');
  again.className = 'primary-btn large';
  again.textContent = 'Practice again';
  again.onclick = () => {
    const words = q.queue.map(item => item.word);
    const dirs = new Set(q.queue.map(item => item.dir));
    const direction = dirs.size > 1 ? 'mixed' : [...dirs][0];
    startQuiz(words, direction);
  };
  wrap.appendChild(again);

  const back = document.createElement('button');
  back.className = 'ghost-btn';
  back.textContent = 'Back to setup';
  back.onclick = () => { state.quiz = null; render(); };
  wrap.appendChild(back);

  return wrap;
}

render();
