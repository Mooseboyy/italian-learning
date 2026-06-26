// ── Firebase init ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDQsDldVUYJ_6Tb2_r4wknM0qNuDWUrLew",
  authDomain: "language-lab-ba68d.firebaseapp.com",
  projectId: "language-lab-ba68d",
  storageBucket: "language-lab-ba68d.firebasestorage.app",
  messagingSenderId: "1072718032657",
  appId: "1:1072718032657:web:b074c2740ae291ac5666b0"
};

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
