import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCLvdSSOB9kNdSk4Dbt0uYDvwATHjlx5Qo",
  authDomain: "yeskro-bd480.firebaseapp.com",
  projectId: "yeskro-bd480",
  storageBucket: "yeskro-bd480.firebasestorage.app",
  messagingSenderId: "491879851542",
  appId: "1:491879851542:web:0e752166b9afc90a61f737"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app