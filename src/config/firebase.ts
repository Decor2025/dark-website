import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAD4piXNNzWi3z1riCEl07NHnjg2IHcFhc",
  authDomain: "decor-drapes.firebaseapp.com",
  projectId: "decor-drapes",
  storageBucket: "decor-drapes.firebasestorage.app",
  messagingSenderId: "175917446618",
  appId: "1:175917446618:web:1567dfe6a9d9c43e873ce3",
  measurementId: "G-8W8BZMLVZC",
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;