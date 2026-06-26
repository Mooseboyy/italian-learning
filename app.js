// ══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ══════════════════════════════════════════════════════════════════════════
const state = {
  // Listening
  videoId: null, player: null, playerReady: false,
  captions: [], currentPhase: 1, activeLineIdx: -1, tickInterval: null,
  // Shared
  wordList: [],
  tooltipWord: null, tooltipTranslation: null,
  flashcardQueue: [], flashcardIdx: 0,
  // Speaking
  speakingIdx: 0,
  speakingAnswers: {},  // { questionId: { en, it } }
  speakingDrillQueue: [], speakingDrillIdx: 0,
  // Reading
  readingLevelFilter: 'all', currentTextId: null,
  readingAnswers: {},
  // Verb practice
  currentVerbIdx: null, currentTense: 'presente',
  verbDrillQueue: [], verbDrillIdx: 0, verbDrillCorrect: 0,
};

const PHASE_DESC = {
  1: '🎧 <strong>Immerse</strong> — Just listen. Don\'t try to understand yet. Let the sounds and rhythm of Italian wash over you.',
  2: '🔍 <strong>Hunt Words</strong> — Transcript mostly hidden. As each line plays it reveals itself. Pick out words you\'ve heard.',
  3: '📖 <strong>Learn Vocab</strong> — Click any word to see its translation and save it to your word list.',
  4: '🧩 <strong>Comprehend</strong> — Full transcript, saved words highlighted green. How much can you piece together?',
};

// ══════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function selectLanguage(lang) {
  if (lang === 'italian') showScreen('home');
}

function openBranch(branch) {
  if (branch === 'video-immersion') initSuggestions();
  if (branch === 'speaking')        initSpeaking();
  if (branch === 'reading')         initReading();
  if (branch === 'verb-practice')   initVerbPractice();
  showScreen(branch);
}

// ── Suggested videos ─────────────────────────────────────────────────────────
function renderSuggestions(videos) {
  const grid = document.getElementById('suggestions-grid');
  if (!grid) return;
  grid.innerHTML = videos.map(v => `
    <div class="sug-card" onclick="loadSuggestedVideo('${v.id}')">
      <img class="sug-thumb" src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy">
      <div class="sug-info">
        <div class="sug-badges">
          <span class="sug-level sug-level-${v.level}">${v.level}</span>
          <span class="sug-type-tag sug-type-${v.type}">${v.type === 'story' ? '📖 Story' : '🗣️ Situation'}</span>
          <span class="sug-topic-tag">${v.topic}</span>
        </div>
        <div class="sug-title">${v.title}</div>
        <div class="sug-channel">${v.channel}</div>
      </div>
    </div>
  `).join('');
}

function filterSuggestions(el, type, level) {
  document.querySelectorAll('.sug-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.sug-topic').forEach(b => b.classList.remove('active'));

  const topicRow = document.getElementById('topic-filter-row');

  if (type === 'all') {
    topicRow.classList.add('hidden');
    renderSuggestions(SUGGESTED_VIDEOS);
  } else if (type === 'story' || type === 'situation') {
    // Show only topic chips relevant to this type
    document.querySelectorAll('.sug-topic').forEach(b => {
      b.classList.toggle('hidden', b.dataset.type !== type);
    });
    topicRow.classList.remove('hidden');
    renderSuggestions(SUGGESTED_VIDEOS.filter(v => v.type === type));
  } else if (type === 'level') {
    topicRow.classList.add('hidden');
    renderSuggestions(SUGGESTED_VIDEOS.filter(v => v.level === level));
  }
}

function filterTopic(el, topic) {
  document.querySelectorAll('.sug-topic').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderSuggestions(SUGGESTED_VIDEOS.filter(v => v.topic === topic));
}

function loadSuggestedVideo(videoId) {
  document.getElementById('youtube-url').value = 'https://www.youtube.com/watch?v=' + videoId;
  loadVideo();
}

function initSuggestions() {
  renderSuggestions(SUGGESTED_VIDEOS);
}

function goHome() {
  stopTick();
  showScreen('home');
}

// ══════════════════════════════════════════════════════════════════════════
// LISTENING — YouTube + captions
// ══════════════════════════════════════════════════════════════════════════
function extractVideoId(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    return u.searchParams.get('v');
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
}

function changeVideo() {
  stopTick();
  if (state.player) { try { state.player.stopVideo(); } catch (_) {} }
  // Reset video visibility state
  state.videoId = null;
  const pc = document.getElementById('player-container');
  pc.style.height = ''; pc.style.opacity = '';
  document.getElementById('audio-only-bar')?.classList.add('hidden');
  const tvb = document.getElementById('toggle-video-btn');
  if (tvb) { tvb.textContent = '🎧 Audio only'; tvb.classList.add('hidden'); }
  // Show loader, hide session
  document.getElementById('session-view').classList.add('hidden');
  document.getElementById('video-loader').classList.remove('hidden');
  document.getElementById('youtube-url').value = '';
}

function loadVideo() {
  const url = document.getElementById('youtube-url').value.trim();
  const err = document.getElementById('load-error');
  err.classList.add('hidden');
  const videoId = extractVideoId(url);
  if (!videoId) {
    err.textContent = 'Could not find a video ID in that URL.';
    err.classList.remove('hidden');
    return;
  }
  state.videoId = videoId;
  state.captions = [];
  state.currentPhase = 1;
  videoVisible = true;
  document.getElementById('video-loader').classList.add('hidden');
  document.getElementById('session-view').classList.remove('hidden');
  document.getElementById('toggle-video-btn').classList.remove('hidden');
  document.getElementById('player-container').style.height = '';
  document.getElementById('player-container').style.opacity = '';
  initPlayer(videoId);
  fetchCaptions(videoId);
  setPhase(1);
  updateWordCount();
}

let ytAPIReady = false, pendingVideoId = null;
window.onYouTubeIframeAPIReady = function () {
  ytAPIReady = true;
  if (pendingVideoId) createPlayer(pendingVideoId);
};

function initPlayer(videoId) {
  if (!ytAPIReady) {
    pendingVideoId = videoId;
    if (!document.getElementById('yt-api-script')) {
      const s = document.createElement('script');
      s.id = 'yt-api-script';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  } else {
    createPlayer(videoId);
  }
}

function createPlayer(videoId) {
  if (state.player) { state.player.loadVideoById(videoId); return; }
  const container = document.getElementById('player-container');
  const w = container ? container.offsetWidth || 640 : 640;
  state.player = new YT.Player('yt-player', {
    videoId,
    width: w,
    height: Math.round(w * 9 / 16),
    playerVars: { rel: 0, modestbranding: 1 },
    events: { onReady: () => { state.playerReady = true; startTick(); } },
  });
}

async function fetchCaptions(videoId) {
  setTranscriptStatus('Fetching captions…');
  const langs = ['it', 'it-IT'];
  let xml = null;
  for (const lang of langs) {
    try {
      const res = await fetch(`https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`);
      const text = await res.text();
      if (text && text.includes('<text')) { xml = text; break; }
    } catch {}
  }
  if (!xml) {
    try {
      const res = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&asr_langs=it&kind=asr&lang=it`);
      const text = await res.text();
      if (text && text.includes('<text')) xml = text;
    } catch {}
  }
  if (xml) {
    state.captions = parseTimedText(xml);
    renderTranscript();
    setTranscriptStatus(`${state.captions.length} lines loaded`);
  } else {
    showNoCaptionsMessage();
  }
}

function parseTimedText(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const nodes = doc.querySelectorAll('text,p');
  const lines = [];
  nodes.forEach(node => {
    const t = node.getAttribute('t');
    const start = parseFloat(node.getAttribute('start') || node.getAttribute('t') || 0) / (t ? 1000 : 1);
    const d = node.getAttribute('d');
    const dur   = parseFloat(node.getAttribute('dur')   || node.getAttribute('d') || 2) / (d ? 1000 : 1);
    const text = decodeHTMLEntities(node.textContent.trim());
    if (text) lines.push({ start, dur, text });
  });
  return lines;
}

function decodeHTMLEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function showNoCaptionsMessage() {
  document.getElementById('transcript-lines').innerHTML = `
    <div class="no-captions">
      <h4>No Italian captions found</h4>
      <p>Paste the transcript manually below:</p>
      <textarea id="manual-transcript" placeholder="One sentence per line…"></textarea>
      <button onclick="loadManualTranscript()">Use This Transcript</button>
    </div>`;
  setTranscriptStatus('No captions found');
}

function loadManualTranscript() {
  const text = document.getElementById('manual-transcript').value.trim();
  if (!text) return;
  state.captions = text.split('\n').filter(l => l.trim()).map((t, i) => ({ start: i * 5, dur: 5, text: t.trim() }));
  renderTranscript();
  setTranscriptStatus(`${state.captions.length} lines (manual)`);
}

function setTranscriptStatus(msg) { document.getElementById('transcript-status').textContent = msg; }

function renderTranscript() {
  const container = document.getElementById('transcript-lines');
  container.innerHTML = '';
  state.captions.forEach((cap, idx) => {
    const line = document.createElement('div');
    line.className = 'transcript-line';
    line.dataset.idx = idx;
    const ts = document.createElement('span');
    ts.className = 'transcript-timestamp';
    ts.textContent = formatTime(cap.start);
    line.appendChild(ts);
    cap.text.split(/(\s+)/).forEach(token => {
      if (/^\s+$/.test(token)) { line.appendChild(document.createTextNode(token)); return; }
      const span = document.createElement('span');
      span.className = 'transcript-word';
      span.textContent = token;
      const clean = token.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
      span.dataset.word = clean;
      if (state.wordList.some(w => w.italian.toLowerCase() === clean)) span.classList.add('learned');
      span.addEventListener('click', e => onWordClick(e, span, clean));
      line.appendChild(span);
    });
    container.appendChild(line);
  });
  applyPhaseClass();
}

function applyPhaseClass() {
  document.getElementById('transcript-body').className = 'phase-' + state.currentPhase;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function startTick() { stopTick(); state.tickInterval = setInterval(tick, 250); }
function stopTick()  { if (state.tickInterval) clearInterval(state.tickInterval); }

function tick() {
  if (!state.playerReady || !state.player || typeof state.player.getCurrentTime !== 'function') return;
  const t = state.player.getCurrentTime();
  let active = -1;
  for (let i = 0; i < state.captions.length; i++) {
    const c = state.captions[i];
    if (t >= c.start && t < c.start + c.dur) { active = i; break; }
  }
  if (active !== state.activeLineIdx) {
    if (state.activeLineIdx >= 0) {
      document.querySelector(`.transcript-line[data-idx="${state.activeLineIdx}"]`)?.classList.remove('active-line');
    }
    if (active >= 0) {
      const el = document.querySelector(`.transcript-line[data-idx="${active}"]`);
      if (el) { el.classList.add('active-line'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }
    state.activeLineIdx = active;
  }
}

// ── Video / audio toggle ───────────────────────────────────────────────────
let videoVisible = true;

function toggleVideoVisibility() {
  videoVisible = !videoVisible;
  const container = document.getElementById('player-container');
  const bar       = document.getElementById('audio-only-bar');
  const btn       = document.getElementById('toggle-video-btn');
  if (videoVisible) {
    container.style.height = '';
    container.style.opacity = '';
    bar.classList.add('hidden');
    btn.textContent = '🎧 Audio only';
  } else {
    container.style.height = '0';
    container.style.opacity = '0';
    container.style.overflow = 'hidden';
    bar.classList.remove('hidden');
    btn.textContent = '📺 Show video';
  }
}

function setPhase(n) {
  state.currentPhase = n;
  document.querySelectorAll('.phase-btn').forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.phase) === n));
  document.getElementById('phase-description').innerHTML = PHASE_DESC[n];
  const overlay = document.getElementById('phase-overlay');
  if (n === 1) {
    overlay.classList.remove('hidden');
    document.getElementById('overlay-message').innerHTML = '🎧 Just listen.<br>Transcript hidden in this phase.';
  } else {
    overlay.classList.add('hidden');
  }
  applyPhaseClass();
  if (n === 4 && state.captions.length) renderTranscript();
}

// ── Word click & translation ───────────────────────────────────────────────
function onWordClick(e, span, word) {
  if (state.currentPhase !== 3) return;
  e.stopPropagation();
  showTooltip(e, word, span);
}

function showTooltip(e, word, span) {
  state.tooltipWord = word;
  state.tooltipTranslation = null;
  document.getElementById('tooltip-word').textContent = word;
  document.getElementById('tooltip-translation').innerHTML = '<span class="loading-dots">Translating…</span>';
  const saveBtn = document.getElementById('tooltip-save-btn');
  const saved = state.wordList.some(w => w.italian.toLowerCase() === word);
  saveBtn.disabled = saved;
  saveBtn.textContent = saved ? '✓ Already saved' : '+ Save word';
  const tooltip = document.getElementById('word-tooltip');
  tooltip.classList.remove('hidden');
  const rect = (span || e.target).getBoundingClientRect();
  tooltip.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
  tooltip.style.top  = (rect.bottom + 8) + 'px';
  translateWord(word).then(eng => {
    state.tooltipTranslation = eng;
    document.getElementById('tooltip-translation').textContent = eng;
  });
}

document.addEventListener('click', e => {
  if (!e.target.closest('#word-tooltip') && !e.target.classList.contains('transcript-word') && !e.target.classList.contains('reader-word')) {
    document.getElementById('word-tooltip').classList.add('hidden');
  }
});

async function translateWord(word) {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=it|en`);
    const data = await res.json();
    if (data.responseStatus === 200) return data.responseData.translatedText;
  } catch {}
  return '(translation unavailable)';
}

function saveCurrentWord() {
  const word = state.tooltipWord;
  const eng  = state.tooltipTranslation || '…';
  if (!word || state.wordList.some(w => w.italian.toLowerCase() === word)) return;
  state.wordList.push({ italian: word, english: eng, videoId: state.videoId });
  saveWordList();
  updateWordCount();
  document.querySelectorAll(`.transcript-word[data-word="${word}"], .reader-word[data-word="${word}"]`).forEach(el => el.classList.add('learned'));
  const btn = document.getElementById('tooltip-save-btn');
  btn.disabled = true;
  btn.textContent = '✓ Saved!';
}

// ── Word list ──────────────────────────────────────────────────────────────
function saveWordList() { localStorage.setItem('italiano_wordlist', JSON.stringify(state.wordList)); }
function loadWordList() {
  try { const r = localStorage.getItem('italiano_wordlist'); if (r) state.wordList = JSON.parse(r); } catch {}
}
function updateWordCount() { document.getElementById('word-count').textContent = state.wordList.length; }

function openWordList() { renderWordListTable(); document.getElementById('wordlist-modal').classList.remove('hidden'); }
function closeWordList() { document.getElementById('wordlist-modal').classList.add('hidden'); }

function renderWordListTable() {
  const wrap = document.getElementById('wordlist-table-wrap');
  const empty = document.getElementById('wordlist-empty');
  const btn = document.getElementById('flashcard-btn');
  if (!state.wordList.length) { wrap.innerHTML = ''; empty.classList.remove('hidden'); btn.classList.add('hidden'); return; }
  empty.classList.add('hidden');
  btn.classList.remove('hidden');
  wrap.innerHTML = `<table class="word-table"><thead><tr><th>Italian</th><th>English</th><th></th></tr></thead><tbody>
    ${state.wordList.map((w, i) => `<tr><td class="word-italian">${w.italian}</td><td>${w.english}</td><td><button class="word-remove" onclick="removeWord(${i})">✕</button></td></tr>`).join('')}
  </tbody></table>`;
}

function removeWord(idx) {
  state.wordList.splice(idx, 1);
  saveWordList(); updateWordCount(); renderWordListTable(); renderTranscript();
}

function startFlashcards() {
  closeWordList();
  state.flashcardQueue = [...state.wordList].sort(() => Math.random() - 0.5);
  state.flashcardIdx = 0;
  document.getElementById('flashcard-modal').classList.remove('hidden');
  showFlashcard();
}
function closeFlashcards() { document.getElementById('flashcard-modal').classList.add('hidden'); }

function showFlashcard() {
  const q = state.flashcardQueue;
  if (state.flashcardIdx >= q.length) {
    document.getElementById('flashcard-card').innerHTML = '<div style="font-size:1.5rem;text-align:center">🎉 All done!</div>';
    document.getElementById('flashcard-actions').innerHTML = `<button onclick="closeFlashcards()" style="background:var(--accent);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer">Done</button>`;
    document.getElementById('flashcard-progress').textContent = '';
    return;
  }
  const card = q[state.flashcardIdx];
  document.getElementById('flashcard-progress').textContent = `${state.flashcardIdx + 1} / ${q.length}`;
  document.getElementById('card-front').textContent = card.italian;
  document.getElementById('card-back').textContent = card.english;
  document.getElementById('card-back').classList.add('hidden');
  document.getElementById('reveal-btn').classList.remove('hidden');
  document.getElementById('grade-btns').classList.add('hidden');
}

function revealCard() {
  document.getElementById('card-back').classList.remove('hidden');
  document.getElementById('reveal-btn').classList.add('hidden');
  document.getElementById('grade-btns').classList.remove('hidden');
}

function gradeCard(grade) {
  if (grade === 'hard') state.flashcardQueue.push(state.flashcardQueue[state.flashcardIdx]);
  state.flashcardIdx++;
  showFlashcard();
}

// ══════════════════════════════════════════════════════════════════════════
// SPEAKING BRANCH
// ══════════════════════════════════════════════════════════════════════════
function initSpeaking() {
  const saved = localStorage.getItem('italiano_speaking');
  if (saved) {
    try { state.speakingAnswers = JSON.parse(saved); } catch {}
  }
  document.getElementById('speaking-restart-btn').style.display = '';
  state.speakingIdx = 0;

  // Find first unanswered
  for (let i = 0; i < SPEAKING_QUESTIONS.length; i++) {
    if (!state.speakingAnswers[SPEAKING_QUESTIONS[i].id]) { state.speakingIdx = i; break; }
    if (i === SPEAKING_QUESTIONS.length - 1) {
      // All answered — go to review
      showSpeakReview(); return;
    }
  }
  showSpeakCollect();
}

function showSpeakCollect() {
  document.getElementById('speak-collect').classList.remove('hidden');
  document.getElementById('speak-review').classList.add('hidden');
  document.getElementById('speak-drill').classList.add('hidden');
  renderSpeakQuestion();
}

function renderSpeakQuestion() {
  const q = SPEAKING_QUESTIONS[state.speakingIdx];
  const total = SPEAKING_QUESTIONS.length;
  const done = Object.keys(state.speakingAnswers).length;
  document.getElementById('speak-progress-fill').style.width = ((done / total) * 100) + '%';
  document.getElementById('speak-progress-label').textContent = `Question ${state.speakingIdx + 1} of ${total}`;
  document.getElementById('speak-question').textContent = q.en;
  document.getElementById('speak-answer').value = state.speakingAnswers[q.id]?.en || '';
  document.getElementById('speak-answer').placeholder = q.prompt;
  document.getElementById('speak-answer').focus();
}

async function speakingNext() {
  const q = SPEAKING_QUESTIONS[state.speakingIdx];
  const answer = document.getElementById('speak-answer').value.trim();
  if (!answer) { speakingAdvance(); return; }
  // Translate and save
  const it = await translateWord(answer.length < 200 ? answer : answer.slice(0, 200));
  state.speakingAnswers[q.id] = { en: answer, it };
  saveSpeaking();
  speakingAdvance();
}

function speakingSkip() {
  speakingAdvance();
}

function speakingAdvance() {
  state.speakingIdx++;
  if (state.speakingIdx >= SPEAKING_QUESTIONS.length) {
    showSpeakReview();
  } else {
    renderSpeakQuestion();
  }
}

function showSpeakReview() {
  document.getElementById('speak-collect').classList.add('hidden');
  document.getElementById('speak-review').classList.remove('hidden');
  document.getElementById('speak-drill').classList.add('hidden');
  renderPhraseList();
}

function renderPhraseList() {
  const list = document.getElementById('speak-phrase-list');
  const answered = SPEAKING_QUESTIONS.filter(q => state.speakingAnswers[q.id]);
  if (!answered.length) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No answers yet — go back and answer some questions!</p>';
    return;
  }
  list.innerHTML = answered.map(q => {
    const a = state.speakingAnswers[q.id];
    return `<div class="phrase-card">
      <div class="phrase-question">${q.en}</div>
      <div class="phrase-english">${a.en}</div>
      <div class="phrase-italian">${a.it}</div>
      <button class="phrase-tts-btn" onclick="speakTTSText(${JSON.stringify(a.it)})">🔊</button>
    </div>`;
  }).join('');
}

function speakingStartDrill() {
  const answered = SPEAKING_QUESTIONS.filter(q => state.speakingAnswers[q.id]);
  if (!answered.length) return;
  state.speakingDrillQueue = [...answered].sort(() => Math.random() - 0.5);
  state.speakingDrillIdx = 0;
  document.getElementById('speak-collect').classList.add('hidden');
  document.getElementById('speak-review').classList.add('hidden');
  document.getElementById('speak-drill').classList.remove('hidden');
  renderSpeakDrill();
}

function renderSpeakDrill() {
  const q = state.speakingDrillQueue;
  if (state.speakingDrillIdx >= q.length) {
    document.getElementById('speak-drill-card').innerHTML = '<div style="text-align:center;font-size:1.4rem;padding:20px">🎉 Drill complete!</div>';
    document.getElementById('speak-drill-progress').textContent = '';
    document.getElementById('speak-drill-actions').innerHTML = `<button class="btn-primary" onclick="showSpeakReview()">← Back to phrases</button>`;
    return;
  }
  const item = q[state.speakingDrillIdx];
  const a = state.speakingAnswers[item.id];
  document.getElementById('speak-drill-progress').textContent = `${state.speakingDrillIdx + 1} / ${q.length}`;
  document.getElementById('speak-card-front').textContent = a.it;
  document.getElementById('speak-card-back').textContent = a.en;
  document.getElementById('speak-card-back').classList.add('hidden');
  document.getElementById('speak-tts-btn').onclick = () => speakTTSText(a.it);
  document.getElementById('speak-reveal-btn').classList.remove('hidden');
  document.getElementById('speak-grade-btns').classList.add('hidden');
}

function speakReveal() {
  document.getElementById('speak-card-back').classList.remove('hidden');
  document.getElementById('speak-reveal-btn').classList.add('hidden');
  document.getElementById('speak-grade-btns').classList.remove('hidden');
}

function speakGrade(grade) {
  if (grade === 'hard') state.speakingDrillQueue.push(state.speakingDrillQueue[state.speakingDrillIdx]);
  state.speakingDrillIdx++;
  renderSpeakDrill();
}

function speakTTS() {
  const it = document.getElementById('speak-card-front').textContent;
  speakTTSText(it);
}

function speakTTSText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'it-IT';
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

function speakingReset() {
  if (!confirm('Reset all your speaking answers and start over?')) return;
  state.speakingAnswers = {};
  saveSpeaking();
  state.speakingIdx = 0;
  showSpeakCollect();
}

function saveSpeaking() {
  localStorage.setItem('italiano_speaking', JSON.stringify(state.speakingAnswers));
}

// ══════════════════════════════════════════════════════════════════════════
// READING BRANCH
// ══════════════════════════════════════════════════════════════════════════
function initReading() {
  renderReadingList();
  document.getElementById('reading-list-view').classList.remove('hidden');
  document.getElementById('reading-reader-view').classList.add('hidden');
  document.getElementById('reading-back-btn').classList.add('hidden');
}

function renderReadingList() {
  const grid = document.getElementById('reading-texts-grid');
  const filter = state.readingLevelFilter;
  const texts = filter === 'all' ? READING_TEXTS : READING_TEXTS.filter(t => t.level === filter);
  grid.innerHTML = texts.map(t => `
    <div class="reading-text-card" onclick="openText(${t.id})">
      <span class="reading-level-badge level-${t.level}">${t.level}</span>
      <h3>${t.title}</h3>
      <p>${t.intro}</p>
      <div class="reading-card-footer">${t.questions.length} questions →</div>
    </div>`).join('');
}

function readingFilterLevel(level, btn) {
  state.readingLevelFilter = level;
  document.querySelectorAll('.level-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderReadingList();
}

function openText(id) {
  const text = READING_TEXTS.find(t => t.id === id);
  if (!text) return;
  state.currentTextId = id;
  state.readingAnswers = {};
  document.getElementById('reading-list-view').classList.add('hidden');
  document.getElementById('reading-reader-view').classList.remove('hidden');
  document.getElementById('reading-back-btn').classList.remove('hidden');
  document.getElementById('reader-level-badge').textContent = text.level;
  document.getElementById('reader-level-badge').className = `reader-level-badge level-${text.level}`;
  document.getElementById('reader-title').textContent = text.title;
  renderReaderText(text);
  renderReaderQuestions(text);
  document.getElementById('reader-results').classList.add('hidden');
}

function renderReaderText(text) {
  const container = document.getElementById('reader-text');
  container.innerHTML = text.text.split('\n').map(para => {
    if (!para.trim()) return '';
    const words = para.split(/(\s+)/);
    return '<p>' + words.map(token => {
      if (/^\s+$/.test(token)) return token;
      const clean = token.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
      const saved = state.wordList.some(w => w.italian.toLowerCase() === clean);
      return `<span class="reader-word${saved ? ' learned' : ''}" data-word="${clean}" onclick="onReaderWordClick(event, this, '${clean}')">${token}</span>`;
    }).join('') + '</p>';
  }).join('');
}

function onReaderWordClick(e, span, word) {
  e.stopPropagation();
  state.tooltipWord = word;
  state.tooltipTranslation = null;
  document.getElementById('tooltip-word').textContent = word;
  document.getElementById('tooltip-translation').innerHTML = '<span class="loading-dots">Translating…</span>';
  const saveBtn = document.getElementById('tooltip-save-btn');
  const saved = state.wordList.some(w => w.italian.toLowerCase() === word);
  saveBtn.disabled = saved;
  saveBtn.textContent = saved ? '✓ Already saved' : '+ Save word';
  const tooltip = document.getElementById('word-tooltip');
  tooltip.classList.remove('hidden');
  const rect = span.getBoundingClientRect();
  tooltip.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
  tooltip.style.top  = (rect.bottom + 8) + 'px';
  translateWord(word).then(eng => {
    state.tooltipTranslation = eng;
    document.getElementById('tooltip-translation').textContent = eng;
  });
}

function renderReaderQuestions(text) {
  const container = document.getElementById('reader-questions');
  container.innerHTML = text.questions.map((q, qi) => `
    <div class="rq-block" id="rq-${qi}">
      <div class="rq-text">${qi + 1}. ${q.q}</div>
      <div class="rq-options">
        ${q.opts.map((opt, oi) => `
          <button class="rq-opt" onclick="readingAnswer(${qi}, ${oi}, ${q.a})">${opt}</button>
        `).join('')}
      </div>
    </div>`).join('');
}

function readingAnswer(qi, chosen, correct) {
  if (state.readingAnswers[qi] !== undefined) return;
  state.readingAnswers[qi] = chosen;
  const block = document.getElementById(`rq-${qi}`);
  block.querySelectorAll('.rq-opt').forEach((btn, i) => {
    if (i === correct) btn.classList.add('rq-correct');
    else if (i === chosen && chosen !== correct) btn.classList.add('rq-wrong');
    btn.disabled = true;
  });
  const text = READING_TEXTS.find(t => t.id === state.currentTextId);
  if (Object.keys(state.readingAnswers).length === text.questions.length) {
    showReadingResults(text);
  }
}

function showReadingResults(text) {
  const correct = text.questions.filter((q, i) => state.readingAnswers[i] === q.a).length;
  const total = text.questions.length;
  const score = document.getElementById('reader-score');
  const pct = Math.round((correct / total) * 100);
  const emoji = pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚';
  score.innerHTML = `<div class="reading-score">${emoji} ${correct}/${total} correct (${pct}%)</div>`;
  document.getElementById('reader-results').classList.remove('hidden');
}

function readingBackToList() {
  document.getElementById('reading-list-view').classList.remove('hidden');
  document.getElementById('reading-reader-view').classList.add('hidden');
  document.getElementById('reading-back-btn').classList.add('hidden');
}

// ══════════════════════════════════════════════════════════════════════════
// VERB PRACTICE BRANCH
// ══════════════════════════════════════════════════════════════════════════
function initVerbPractice() {
  verbBackToList();
}

function verbBackToList() {
  document.getElementById('verb-list-view').classList.remove('hidden');
  document.getElementById('verb-detail-view').classList.add('hidden');
  document.getElementById('verb-drill-view').classList.add('hidden');
  document.getElementById('verb-back-btn').classList.add('hidden');
  renderVerbGrid('all');
}

function renderVerbGrid(filter) {
  const grid = document.getElementById('verb-grid');
  const verbs = filter === 'all' ? VERBS : VERBS.filter(v => v.type === filter);
  grid.innerHTML = verbs.map((v, i) => {
    const realIdx = VERBS.indexOf(v);
    return `<div class="verb-card" onclick="openVerb(${realIdx})">
      <div class="verb-card-inf">${v.infinitive}</div>
      <div class="verb-card-meaning">${v.meaning}</div>
      <span class="verb-type-pill pill-${v.type}">${v.type}</span>
    </div>`;
  }).join('');
}

function verbFilter(filter, btn) {
  document.querySelectorAll('.verb-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVerbGrid(filter);
}

function openVerb(idx) {
  state.currentVerbIdx = idx;
  state.currentTense = 'presente';
  document.getElementById('verb-list-view').classList.add('hidden');
  document.getElementById('verb-detail-view').classList.remove('hidden');
  document.getElementById('verb-drill-view').classList.add('hidden');
  document.getElementById('verb-back-btn').classList.remove('hidden');
  renderVerbDetail();
}

function renderVerbDetail() {
  const v = VERBS[state.currentVerbIdx];
  document.getElementById('verb-detail-infinitive').textContent = v.infinitive;
  document.getElementById('verb-detail-meaning').textContent = v.meaning;
  const tb = document.getElementById('verb-detail-type');
  tb.textContent = v.type;
  tb.className = `verb-type-badge pill-${v.type}`;

  // Tense tabs
  const tabs = document.getElementById('tense-tabs');
  tabs.innerHTML = Object.keys(TENSE_LABELS).map(t => `
    <button class="tense-tab${t === state.currentTense ? ' active' : ''}" onclick="verbSetTense('${t}', this)">${TENSE_LABELS[t]}</button>
  `).join('');

  renderConjugationTable(v);
}

function verbSetTense(tense, btn) {
  state.currentTense = tense;
  document.querySelectorAll('.tense-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderConjugationTable(VERBS[state.currentVerbIdx]);
}

function renderConjugationTable(v) {
  const forms = v.tenses[state.currentTense];
  document.getElementById('conjugation-table').innerHTML = `
    <table class="conj-table">
      <thead><tr><th>Pronoun</th><th>${TENSE_LABELS[state.currentTense]}</th></tr></thead>
      <tbody>
        ${PRONOUNS.map((p, i) => `
          <tr>
            <td class="conj-pronoun">${p}</td>
            <td class="conj-form">${forms[i]}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="aux-note">Auxiliary: <strong>${v.auxiliary}</strong></div>`;
}

function verbStartDrill() {
  const v = VERBS[state.currentVerbIdx];
  // Build queue: all tenses × all pronouns
  const queue = [];
  Object.keys(v.tenses).forEach(tense => {
    PRONOUNS.forEach((pronoun, pi) => {
      queue.push({ verbIdx: state.currentVerbIdx, tense, pronoun, pronounIdx: pi });
    });
  });
  // Shuffle
  state.verbDrillQueue = queue.sort(() => Math.random() - 0.5);
  state.verbDrillIdx = 0;
  state.verbDrillCorrect = 0;

  document.getElementById('verb-detail-view').classList.add('hidden');
  document.getElementById('verb-drill-view').classList.remove('hidden');
  renderVerbDrill();
}

function renderVerbDrill() {
  const q = state.verbDrillQueue;
  if (state.verbDrillIdx >= q.length) {
    const score = state.verbDrillCorrect;
    const total = q.length;
    const pct = Math.round((score / total) * 100);
    document.getElementById('verb-drill-view').innerHTML = `
      <div style="text-align:center;padding:40px 20px">
        <div style="font-size:2rem;margin-bottom:12px">${pct >= 80 ? '🔥' : pct >= 50 ? '💪' : '📚'}</div>
        <div style="font-size:1.2rem;font-weight:700;margin-bottom:8px">${score}/${total} correct (${pct}%)</div>
        <div style="color:var(--text-muted);margin-bottom:24px">${pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good progress — keep drilling.' : 'Keep at it. Repetition is the key.'}</div>
        <button class="btn-primary" onclick="openVerb(${state.verbDrillQueue[0].verbIdx})">← Back to verb</button>
      </div>`;
    return;
  }
  const item = q[state.verbDrillIdx];
  const v = VERBS[item.verbIdx];
  document.getElementById('verb-drill-progress').textContent = `${state.verbDrillIdx + 1} / ${q.length} · ${state.verbDrillCorrect} correct`;
  document.getElementById('verb-drill-prompt').textContent = `${item.pronoun}  →  ${v.infinitive}`;
  document.getElementById('verb-drill-tense').textContent = TENSE_LABELS[item.tense];
  document.getElementById('verb-drill-input').value = '';
  document.getElementById('verb-drill-input').disabled = false;
  document.getElementById('verb-drill-input').focus();
  document.getElementById('verb-drill-feedback').classList.add('hidden');
  document.getElementById('verb-check-btn').classList.remove('hidden');
  document.getElementById('verb-next-btn').classList.add('hidden');
  document.getElementById('verb-drill-score').textContent = '';
}

function verbCheckAnswer() {
  const item = state.verbDrillQueue[state.verbDrillIdx];
  const v = VERBS[item.verbIdx];
  const correct = v.tenses[item.tense][item.pronounIdx];
  const input = document.getElementById('verb-drill-input').value.trim().toLowerCase();
  const isCorrect = input === correct.toLowerCase() ||
    correct.toLowerCase().split('/').map(s => s.trim()).includes(input);

  if (isCorrect) state.verbDrillCorrect++;
  const fb = document.getElementById('verb-drill-feedback');
  fb.classList.remove('hidden');
  fb.className = isCorrect ? 'verb-feedback-correct' : 'verb-feedback-wrong';
  fb.textContent = isCorrect ? `✓ ${correct}` : `✗ Correct: ${correct}`;
  document.getElementById('verb-drill-input').disabled = true;
  document.getElementById('verb-check-btn').classList.add('hidden');
  document.getElementById('verb-next-btn').classList.remove('hidden');
}

function verbNextDrill() {
  state.verbDrillIdx++;
  renderVerbDrill();
}

// Enter key support in drill
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const checkBtn = document.getElementById('verb-check-btn');
  const nextBtn  = document.getElementById('verb-next-btn');
  if (checkBtn && !checkBtn.classList.contains('hidden')) verbCheckAnswer();
  else if (nextBtn && !nextBtn.classList.contains('hidden')) verbNextDrill();
  // Speaking next
  const speakCollect = document.getElementById('speak-collect');
  if (speakCollect && !speakCollect.classList.contains('hidden')) speakingNext();
});

// ══════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════
loadWordList();
updateWordCount();
