// ── State ──────────────────────────────────────────────────────────────────
const state = {
  videoId: null,
  player: null,
  playerReady: false,
  captions: [],       // [{start, dur, text}]
  currentPhase: 1,
  wordList: [],       // [{italian, english, videoId}]
  activeLineIdx: -1,
  tickInterval: null,
  tooltipWord: null,
  tooltipTranslation: null,
  flashcardQueue: [],
  flashcardIdx: 0,
};

const PHASE_DESC = {
  1: '🎧 <strong>Immerse</strong> — Just listen. Don\'t try to understand yet. Let the sounds and rhythm of Italian wash over you. Play the video 2–3 times.',
  2: '🔍 <strong>Hunt Words</strong> — The transcript is mostly hidden. As each line plays, it reveals itself. Try to pick out individual words you\'ve heard before, even if you don\'t know what they mean.',
  3: '📖 <strong>Learn Vocab</strong> — Click any word to see its translation and save it to your word list. Build up your vocabulary for this specific video.',
  4: '🧩 <strong>Comprehend</strong> — Full transcript, learned words highlighted in green. How much can you piece together now? Play the video and follow along.',
};

// ── Navigation ─────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function selectLanguage(lang) {
  if (lang === 'italian') showScreen('home');
}

function openBranch(branch) {
  showScreen(branch);
}

function goHome() {
  stopTick();
  showScreen('home');
}

// ── YouTube helpers ─────────────────────────────────────────────────────────
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

function loadVideo() {
  const url = document.getElementById('youtube-url').value.trim();
  const err = document.getElementById('load-error');
  err.classList.add('hidden');

  const videoId = extractVideoId(url);
  if (!videoId) {
    err.textContent = 'Could not find a video ID in that URL. Please paste a standard YouTube link.';
    err.classList.remove('hidden');
    return;
  }

  state.videoId = videoId;
  state.captions = [];
  state.currentPhase = 1;

  document.getElementById('video-loader').classList.add('hidden');
  document.getElementById('session-view').classList.remove('hidden');

  initPlayer(videoId);
  fetchCaptions(videoId);
  setPhase(1);
  updateWordCount();
}

// ── YouTube IFrame Player ───────────────────────────────────────────────────
let ytAPIReady = false;
let pendingVideoId = null;

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
  if (state.player) {
    state.player.loadVideoById(videoId);
    return;
  }
  state.player = new YT.Player('yt-player', {
    videoId,
    playerVars: { rel: 0, modestbranding: 1 },
    events: {
      onReady: () => { state.playerReady = true; startTick(); },
    },
  });
}

// ── Captions ────────────────────────────────────────────────────────────────
async function fetchCaptions(videoId) {
  setTranscriptStatus('Fetching captions…');

  // Try YouTube's timedtext endpoint (unofficial but reliable for auto-captions)
  const langs = ['it', 'it-IT'];
  let xml = null;

  for (const lang of langs) {
    try {
      const url = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`;
      const res = await fetch(url);
      const text = await res.text();
      if (text && text.includes('<text')) { xml = text; break; }
    } catch {}
  }

  if (!xml) {
    // Try without lang (auto-detect)
    try {
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&asr_langs=it&kind=asr&lang=it`;
      const res = await fetch(url);
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
    const start = parseFloat(node.getAttribute('start') || node.getAttribute('t') || 0) / (node.getAttribute('t') ? 1000 : 1);
    const dur = parseFloat(node.getAttribute('dur') || node.getAttribute('d') || 2) / (node.getAttribute('d') ? 1000 : 1);
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
      <p>This video may not have Italian subtitles, or they may be unavailable.<br>
      You can paste the transcript manually below:</p>
      <textarea id="manual-transcript" placeholder="Paste Italian transcript here, one sentence per line…"></textarea>
      <button onclick="loadManualTranscript()">Use This Transcript</button>
    </div>`;
  setTranscriptStatus('No captions found');
}

function loadManualTranscript() {
  const text = document.getElementById('manual-transcript').value.trim();
  if (!text) return;
  const lines = text.split('\n').filter(l => l.trim());
  state.captions = lines.map((text, i) => ({ start: i * 5, dur: 5, text: text.trim() }));
  renderTranscript();
  setTranscriptStatus(`${state.captions.length} lines loaded (manual)`);
}

function setTranscriptStatus(msg) {
  document.getElementById('transcript-status').textContent = msg;
}

// ── Transcript rendering ────────────────────────────────────────────────────
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

    // Split into words, keep punctuation attached
    const words = cap.text.split(/(\s+)/);
    words.forEach(token => {
      if (/^\s+$/.test(token)) {
        line.appendChild(document.createTextNode(token));
      } else {
        const span = document.createElement('span');
        span.className = 'transcript-word';
        span.textContent = token;
        const clean = token.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
        span.dataset.word = clean;
        if (state.wordList.some(w => w.italian.toLowerCase() === clean)) {
          span.classList.add('learned');
        }
        span.addEventListener('click', (e) => onWordClick(e, span, clean));
        line.appendChild(span);
      }
    });

    container.appendChild(line);
  });

  applyPhaseClass();
}

function applyPhaseClass() {
  const body = document.getElementById('transcript-body');
  body.className = 'phase-' + state.currentPhase;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── Playback tick ────────────────────────────────────────────────────────────
function startTick() {
  stopTick();
  state.tickInterval = setInterval(tick, 250);
}

function stopTick() {
  if (state.tickInterval) clearInterval(state.tickInterval);
}

function tick() {
  if (!state.playerReady || !state.player || typeof state.player.getCurrentTime !== 'function') return;
  const t = state.player.getCurrentTime();

  let activeIdx = -1;
  for (let i = 0; i < state.captions.length; i++) {
    const c = state.captions[i];
    if (t >= c.start && t < c.start + c.dur) { activeIdx = i; break; }
  }

  if (activeIdx !== state.activeLineIdx) {
    if (state.activeLineIdx >= 0) {
      const prev = document.querySelector(`.transcript-line[data-idx="${state.activeLineIdx}"]`);
      if (prev) prev.classList.remove('active-line');
    }
    if (activeIdx >= 0) {
      const el = document.querySelector(`.transcript-line[data-idx="${activeIdx}"]`);
      if (el) {
        el.classList.add('active-line');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    state.activeLineIdx = activeIdx;
  }
}

// ── Phases ───────────────────────────────────────────────────────────────────
function setPhase(n) {
  state.currentPhase = n;

  document.querySelectorAll('.phase-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.phase) === n);
  });

  document.getElementById('phase-description').innerHTML = PHASE_DESC[n];

  const overlay = document.getElementById('phase-overlay');
  const overlayMsg = document.getElementById('overlay-message');

  if (n === 1) {
    overlay.classList.remove('hidden');
    overlayMsg.innerHTML = '🎧 Just listen.<br>Transcript hidden in this phase.';
  } else {
    overlay.classList.add('hidden');
  }

  applyPhaseClass();

  // Re-render to apply learned highlights in phase 4
  if (n === 4 && state.captions.length) renderTranscript();
}

// ── Word click & translation ────────────────────────────────────────────────
function onWordClick(e, span, word) {
  if (state.currentPhase !== 3) return;
  e.stopPropagation();

  state.tooltipWord = word;
  state.tooltipTranslation = null;

  const tooltip = document.getElementById('word-tooltip');
  document.getElementById('tooltip-word').textContent = word;
  document.getElementById('tooltip-translation').innerHTML = '<span class="loading-dots">Translating…</span>';

  const saveBtn = document.getElementById('tooltip-save-btn');
  const alreadySaved = state.wordList.some(w => w.italian.toLowerCase() === word);
  saveBtn.disabled = alreadySaved;
  saveBtn.textContent = alreadySaved ? '✓ Already saved' : '+ Save word';

  // Position tooltip near click
  const rect = span.getBoundingClientRect();
  tooltip.classList.remove('hidden');
  tooltip.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
  tooltip.style.top = (rect.bottom + 8) + 'px';

  translateWord(word).then(eng => {
    state.tooltipTranslation = eng;
    document.getElementById('tooltip-translation').textContent = eng;
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#word-tooltip') && !e.target.classList.contains('transcript-word')) {
    document.getElementById('word-tooltip').classList.add('hidden');
  }
});

async function translateWord(word) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=it|en`
    );
    const data = await res.json();
    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    }
  } catch {}
  return '(translation unavailable)';
}

function saveCurrentWord() {
  const word = state.tooltipWord;
  const eng = state.tooltipTranslation || '…';
  if (!word || state.wordList.some(w => w.italian.toLowerCase() === word)) return;

  state.wordList.push({ italian: word, english: eng, videoId: state.videoId });
  saveWordList();
  updateWordCount();

  // Mark as learned in transcript
  document.querySelectorAll(`.transcript-word[data-word="${word}"]`).forEach(el => {
    el.classList.add('learned');
  });

  const saveBtn = document.getElementById('tooltip-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = '✓ Saved!';
}

// ── Word list persistence ───────────────────────────────────────────────────
function saveWordList() {
  localStorage.setItem('italiano_wordlist', JSON.stringify(state.wordList));
}

function loadWordList() {
  try {
    const raw = localStorage.getItem('italiano_wordlist');
    if (raw) state.wordList = JSON.parse(raw);
  } catch {}
}

function updateWordCount() {
  document.getElementById('word-count').textContent = state.wordList.length;
}

// ── Word list modal ─────────────────────────────────────────────────────────
function openWordList() {
  renderWordListTable();
  document.getElementById('wordlist-modal').classList.remove('hidden');
}

function closeWordList() {
  document.getElementById('wordlist-modal').classList.add('hidden');
}

function renderWordListTable() {
  const wrap = document.getElementById('wordlist-table-wrap');
  const empty = document.getElementById('wordlist-empty');
  const flashBtn = document.getElementById('flashcard-btn');

  if (!state.wordList.length) {
    wrap.innerHTML = '';
    empty.classList.remove('hidden');
    flashBtn.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  flashBtn.classList.remove('hidden');

  wrap.innerHTML = `
    <table class="word-table">
      <thead><tr><th>Italian</th><th>English</th><th></th></tr></thead>
      <tbody>
        ${state.wordList.map((w, i) => `
          <tr>
            <td class="word-italian">${w.italian}</td>
            <td>${w.english}</td>
            <td><button class="word-remove" onclick="removeWord(${i})">✕</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function removeWord(idx) {
  state.wordList.splice(idx, 1);
  saveWordList();
  updateWordCount();
  renderWordListTable();
  renderTranscript(); // refresh learned highlights
}

// ── Flashcards ───────────────────────────────────────────────────────────────
function startFlashcards() {
  closeWordList();
  state.flashcardQueue = [...state.wordList].sort(() => Math.random() - 0.5);
  state.flashcardIdx = 0;
  document.getElementById('flashcard-modal').classList.remove('hidden');
  showFlashcard();
}

function closeFlashcards() {
  document.getElementById('flashcard-modal').classList.add('hidden');
}

function showFlashcard() {
  const q = state.flashcardQueue;
  if (state.flashcardIdx >= q.length) {
    document.getElementById('flashcard-card').innerHTML = '<div style="font-size:1.5rem">🎉 All done!</div>';
    document.getElementById('flashcard-actions').innerHTML = `<button onclick="closeFlashcards()" style="background:var(--accent);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:0.9rem">Done</button>`;
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
  if (grade === 'hard') {
    // Push to end of queue
    state.flashcardQueue.push(state.flashcardQueue[state.flashcardIdx]);
  }
  state.flashcardIdx++;
  showFlashcard();
}

// ── Init ────────────────────────────────────────────────────────────────────
loadWordList();
updateWordCount();
