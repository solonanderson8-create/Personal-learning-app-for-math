// Talks to Firebase: sign-in and reading/writing documents.
// Firestore's own offline cache is switched off (memory only), because it may not
// work in the Quest browser. Unsent work is kept by js/outbox.js instead.

import {
  initializeApp, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  initializeFirestore, memoryLocalCache, doc, getDoc, setDoc,
} from '../vendor/firebase.js';
import { firebaseConfig } from './firebase-config.js';

export const configured = !Object.values(firebaseConfig).includes('PASTE_ME');

let auth, db;
if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
}

export function onUser(fn) {
  if (!configured) { fn(null); return; }
  onAuthStateChanged(auth, fn);
}

export const currentUser = () => auth?.currentUser ?? null;

export async function signIn(email, password) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export const signOutNow = () => signOut(auth);

// Paths are relative to the signed-in user's own folder: users/{uid}/...
function ref(path) {
  const user = currentUser();
  if (!user) throw new Error('not signed in');
  return doc(db, 'users', user.uid, ...path.split('/'));
}

export async function write(path, data) {
  await setDoc(ref(path), data, { merge: true });
}

export async function read(path) {
  const snap = await getDoc(ref(path));
  return snap.exists() ? snap.data() : null;
}

// Plain-language messages for the errors you're likely to see.
export function explain(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Email or password is wrong.';
  }
  if (code.includes('too-many-requests')) return 'Too many tries. Wait a minute.';
  if (code.includes('network')) return 'No internet connection.';
  if (code.includes('permission-denied')) return 'The database said no. Check the rules step.';
  return `Something went wrong (${code || err?.message || 'unknown'}).`;
}
