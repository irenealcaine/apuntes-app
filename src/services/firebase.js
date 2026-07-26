import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const categoriasRef = collection(db, "categorias")
const apuntesRef = collection(db, "apuntes")

export { auth, onAuthStateChanged }

export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logout() {
  await signOut(auth)
}

export async function getCategorias(uid) {
  const q = query(categoriasRef, where("userId", "==", uid))
  const snapshot = await getDocs(q)
  const cats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  cats.sort((a, b) => a.nombre.localeCompare(b.nombre))
  return cats
}

export async function addCategoria(uid, nombre) {
  const docRef = await addDoc(categoriasRef, {
    userId: uid,
    nombre,
    orden: Date.now(),
  })
  return { id: docRef.id, nombre }
}

export async function deleteCategoria(id) {
  await deleteDoc(doc(db, "categorias", id))
}

export async function renameCategoria(id, nombre) {
  await updateDoc(doc(db, "categorias", id), { nombre })
}

export async function getApuntes(uid, categoriaId) {
  const filters = [where("userId", "==", uid)]
  if (categoriaId) filters.push(where("categoriaId", "==", categoriaId))

  const q = query(apuntesRef, ...filters)
  const snapshot = await getDocs(q)
  const apuntes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

  apuntes.sort((a, b) => {
    const tA = a.createdAt?.toDate?.()?.getTime() || 0
    const tB = b.createdAt?.toDate?.()?.getTime() || 0
    return tB - tA
  })

  return apuntes
}

export async function getApunte(id) {
  const docSnap = await getDoc(doc(db, "apuntes", id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() }
}

export async function addApunte({ uid, titulo, contenido, categoriaId }) {
  const docRef = await addDoc(apuntesRef, {
    userId: uid,
    titulo,
    contenido,
    categoriaId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id }
}

export async function updateApunte(id, { titulo, contenido, categoriaId }) {
  const data = { updatedAt: serverTimestamp() }
  if (titulo !== undefined) data.titulo = titulo
  if (contenido !== undefined) data.contenido = contenido
  if (categoriaId !== undefined) data.categoriaId = categoriaId
  await updateDoc(doc(db, "apuntes", id), data)
}

export async function deleteApunte(id) {
  await deleteDoc(doc(db, "apuntes", id))
}
