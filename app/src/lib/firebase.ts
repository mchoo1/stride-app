// Firebase client SDK — used in browser/client components
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: all three core keys must be present or Firebase will throw
const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let _app: FirebaseApp | null = null;

if (isConfigured) {
  try {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  } catch (e) {
    console.error(
      '[Stride] Firebase init failed — check NEXT_PUBLIC_FIREBASE_* env vars in Vercel:',
      e
    );
  }
} else {
  console.warn(
    '[Stride] Firebase is not configured. ' +
    'Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID, ' +
    'and NEXT_PUBLIC_FIREBASE_APP_ID (+ the other 3 keys) in Vercel → ' +
    'Settings → Environment Variables. Auth and data sync will be disabled until then.'
  );
}

// Export null-safe singletons — consumers must guard against null
export const auth: Auth | null       = _app ? getAuth(_app)      : null;
export const db:   Firestore | null  = _app ? getFirestore(_app) : null;
export const isFirebaseReady         = Boolean(_app);
