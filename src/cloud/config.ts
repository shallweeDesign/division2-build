/**
 * Firebase 設定 / The Firebase web app's config, from
 * Firebase console → Project settings → Your apps → Web app → SDK setup.
 *
 * These values are public by design — they identify the project, they do not
 * grant access. What protects each player's data is `firestore.rules` at the
 * repo root (a player may only read and write `users/<their uid>`).
 *
 * `null` turns sign-in off entirely: no button, no SDK download, and the site
 * keeps everything in the browser as before.
 */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export const FIREBASE_CONFIG: FirebaseWebConfig | null = {
  apiKey: 'AIzaSyAyMNkBWsFKIvYT1FwnKBalpRzTGcwkwXM',
  authDomain: 'jdivision2-be285.firebaseapp.com',
  projectId: 'jdivision2-be285',
  storageBucket: 'jdivision2-be285.firebasestorage.app',
  messagingSenderId: '420852728103',
  appId: '1:420852728103:web:b13ceb8f80a21d09e4e902',
  // measurementId left out: the site does not load Analytics.
};
