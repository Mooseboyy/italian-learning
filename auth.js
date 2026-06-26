// ── Auth UI state ────────────────────────────────────────────────────────────
let authMode = 'signin'; // 'signin' | 'signup'

function authSwitchTab(mode) {
  authMode = mode;
  document.getElementById('tab-signin').classList.toggle('active', mode === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('auth-submit-btn').textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-password2').classList.toggle('hidden', mode === 'signin');
  document.getElementById('auth-error').classList.add('hidden');
  if (mode === 'signup') {
    document.getElementById('auth-password').autocomplete = 'new-password';
  } else {
    document.getElementById('auth-password').autocomplete = 'current-password';
  }
}

function authShowError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function authSubmit() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-password').value;
  const pass2 = document.getElementById('auth-password2').value;
  const btn   = document.getElementById('auth-submit-btn');

  document.getElementById('auth-error').classList.add('hidden');

  if (!email || !pass) { authShowError('Please enter your email and password.'); return; }

  if (authMode === 'signup') {
    if (pass !== pass2) { authShowError('Passwords do not match.'); return; }
    if (pass.length < 6) { authShowError('Password must be at least 6 characters.'); return; }
  }

  btn.textContent = '...';
  btn.disabled = true;

  try {
    if (authMode === 'signin') {
      await auth.signInWithEmailAndPassword(email, pass);
    } else {
      await auth.createUserWithEmailAndPassword(email, pass);
    }
    // onAuthStateChanged handles the rest
  } catch (e) {
    btn.textContent = authMode === 'signin' ? 'Sign In' : 'Create Account';
    btn.disabled = false;
    authShowError(friendlyAuthError(e.code));
  }
}

function authGuest() {
  localStorage.setItem('guest_mode', '1');
  showScreen('language');
}

async function authSignOut() {
  await auth.signOut();
  localStorage.removeItem('guest_mode');
  state.wordList = [];
  state.speakingAnswers = {};
  updateWordCount();
  showScreen('auth');
}

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':      'No account found with that email.',
    'auth/wrong-password':      'Incorrect password.',
    'auth/email-already-in-use':'An account with that email already exists.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/too-many-requests':   'Too many attempts. Please try again later.',
    'auth/invalid-credential':  'Incorrect email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ── Auth state listener ───────────────────────────────────────────────────────
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Update UI
    const emailEl = document.getElementById('user-email-display');
    if (emailEl) emailEl.textContent = user.email || 'Guest';
    document.getElementById('user-badge')?.classList.remove('hidden');

    // Load cloud data into state
    const data = await cloudLoad();
    if (data) {
      if (data.wordList)  { state.wordList = data.wordList; updateWordCount(); }
      if (data.speaking)  { state.speakingAnswers = data.speaking; }
    }

    // Hide loading screen and go to language select
    showScreen('language');
  } else {
    document.getElementById('user-badge')?.classList.add('hidden');
    // No session — show login, unless they chose guest mode
    if (localStorage.getItem('guest_mode')) {
      showScreen('language');
    } else {
      showScreen('auth');
    }
  }
});

// ── Override save functions to also write to cloud ───────────────────────────
const _saveWordListOrig = saveWordList;
saveWordList = function () {
  localStorage.setItem('italiano_wordlist', JSON.stringify(state.wordList));
  cloudSave('wordList', state.wordList);
};

const _saveSpeakingOrig = saveSpeaking;
saveSpeaking = function () {
  localStorage.setItem('italiano_speaking', JSON.stringify(state.speakingAnswers));
  cloudSave('speaking', state.speakingAnswers);
};

// Support Enter key on auth inputs
['auth-email', 'auth-password', 'auth-password2'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => {
    if (e.key === 'Enter') authSubmit();
  });
});
