// Only the Firebase pieces the app uses. Bundled into vendor/firebase.js by tools/vendor.js.
export { initializeApp } from 'firebase/app';
export {
  initializeAuth, browserLocalPersistence, indexedDBLocalPersistence,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'firebase/auth';
export {
  initializeFirestore, memoryLocalCache, doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
