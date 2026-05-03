import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBS-7DPn8almqe2vjrbclQ1_jO-hN5T2fY",
  authDomain: "Yeskro.firebaseapp.com",
  projectId: "Yeskro",
  storageBucket: "Yeskro.firebasestorage.app",
  messagingSenderId: "819865730242",
  appId: "1:819865730242:web:e3193445bc5db0f83e4f5b"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
