import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCKi2Irrp1sRKuHFOZDZv27BHsM3Gc3SmE",
  authDomain: "decor-drapes-instyle.firebaseapp.com",
  databaseURL: "https://decor-drapes-instyle-default-rtdb.firebaseio.com",
  projectId: "decor-drapes-instyle",
  storageBucket: "decor-drapes-instyle.firebasestorage.app",
  messagingSenderId: "936396093551",
  appId: "1:936396093551:web:e72e2c2a0aee81fd9e759a"
};
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;