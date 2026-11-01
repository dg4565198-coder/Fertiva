import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Firestore
} from 'firebase/firestore';
import { SoilSample, Property, Plot, UserAccount } from '../types';

// Configuração padrão do Firebase ou recuperada do localStorage/ambiente
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFertivaDefaultPlaceholderKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fertiva-agro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fertiva-agro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fertiva-agro.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

export function getActiveFirebaseConfig() {
  const saved = localStorage.getItem('fertiva_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignora e usa padrão
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: typeof DEFAULT_FIREBASE_CONFIG) {
  localStorage.setItem('fertiva_firebase_config', JSON.stringify(config));
  window.location.reload();
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  const config = getActiveFirebaseConfig();
  if (config.apiKey && !config.apiKey.includes('Placeholder')) {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase inicializado em modo offline/demonstração:', e);
}

export function isFirebaseActive(): boolean {
  return auth !== null && db !== null;
}

// 1. Login com E-mail e Senha
export async function firebaseLoginEmail(email: string, pass: string): Promise<UserAccount | null> {
  if (!auth) {
    throw new Error('Firebase não configurado com credenciais válidas. Usando autenticação local.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = userCredential.user;
  return {
    id: fbUser.uid,
    name: fbUser.displayName || email.split('@')[0],
    email: fbUser.email || email,
    role: email.toLowerCase().includes('guilherme') ? 'admin' : 'produtor',
    tier: 'pro',
    createdAt: new Date().toISOString()
  };
}

// 2. Registro com E-mail e Senha
export async function firebaseRegisterEmail(
  name: string,
  email: string,
  pass: string
): Promise<UserAccount | null> {
  if (!auth) {
    throw new Error('Firebase não configurado com credenciais válidas.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = userCredential.user;
  const user: UserAccount = {
    id: fbUser.uid,
    name,
    email: fbUser.email || email,
    role: email.toLowerCase().includes('guilherme') ? 'admin' : 'produtor',
    tier: 'pro',
    createdAt: new Date().toISOString()
  };

  // Salva perfil no Firestore se disponível
  if (db) {
    try {
      await setDoc(doc(db, 'users', fbUser.uid), user);
    } catch (e) {
      console.warn('Erro ao salvar usuário no Firestore:', e);
    }
  }

  return user;
}

// 3. Login com Google Popup
export async function firebaseLoginGoogle(): Promise<UserAccount | null> {
  if (!auth) {
    throw new Error('Firebase não configurado.');
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;
  return {
    id: fbUser.uid,
    name: fbUser.displayName || 'Usuário Google',
    email: fbUser.email || '',
    role: fbUser.email?.toLowerCase().includes('guilherme') ? 'admin' : 'produtor',
    tier: 'pro',
    createdAt: new Date().toISOString()
  };
}

// 4. Logout do Firebase
export async function firebaseLogout(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

// 5. Sincronização de Laudo de Solo no Firestore
export async function syncSampleToFirestore(sample: SoilSample): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'soil_samples', sample.id), sample);
  } catch (e) {
    console.warn('Erro ao sincronizar laudo no Firebase:', e);
  }
}

// 6. Sincronização de Fazenda no Firestore
export async function syncPropertyToFirestore(property: Property): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'properties', property.id), property);
  } catch (e) {
    console.warn('Erro ao sincronizar fazenda no Firebase:', e);
  }
}

// 7. Sincronização de Talhão no Firestore
export async function syncPlotToFirestore(plot: Plot): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, 'plots', plot.id), plot);
  } catch (e) {
    console.warn('Erro ao sincronizar talhão no Firebase:', e);
  }
}

// 8. Carregamento de Amostras do Usuário a partir do Firestore
export async function fetchUserSamplesFromFirestore(userId: string): Promise<SoilSample[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'soil_samples'));
    const snapshot = await getDocs(q);
    const list: SoilSample[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as SoilSample);
    });
    return list;
  } catch (e) {
    console.warn('Falha ao buscar do Firestore:', e);
    return [];
  }
}
