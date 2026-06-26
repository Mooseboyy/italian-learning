// ── Firebase init (config loaded from config.js, which is gitignored) ────────
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ── Cloud helpers ────────────────────────────────────────────────────────────
async function cloudSave(key, value) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection('users').doc(user.uid).set({ [key]: value, updatedAt: new Date() }, { merge: true });
  } catch (e) { console.warn('cloudSave failed', e); }
}

async function cloudLoad() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    return doc.exists ? doc.data() : {};
  } catch (e) { console.warn('cloudLoad failed', e); return null; }
}
