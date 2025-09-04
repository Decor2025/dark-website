import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID
// };
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAD4piXNNzWi3z1riCEl07NHnjg2IHcFhc",
  authDomain: "decordrapesinstyle.com",
  databaseURL: "https://decor-drapes-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "decor-drapes",
  storageBucket: "decor-drapes.firebasestorage.app",
  messagingSenderId: "175917446618",
  appId: "1:175917446618:web:1567dfe6a9d9c43e873ce3",
  measurementId: "G-8W8BZMLVZC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
