import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import {
  getCategorias,
  addCategoria,
  deleteCategoria,
} from "../services/firebase"

const CategoriasContext = createContext(null)

export function CategoriasProvider({ children }) {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (!user) {
      setCategorias([])
      setActiveId(null)
      return
    }
    getCategorias(user.uid).then(setCategorias)
  }, [user])

  async function handleCreate(nombre) {
    if (!user) return
    await addCategoria(user.uid, nombre)
    const cats = await getCategorias(user.uid)
    setCategorias(cats)
  }

  async function handleDelete(id) {
    await deleteCategoria(id)
    if (!user) return
    const cats = await getCategorias(user.uid)
    setCategorias(cats)
    if (activeId === id) setActiveId(null)
  }

  return (
    <CategoriasContext.Provider
      value={{ categorias, activeId, setActiveId, handleCreate, handleDelete }}
    >
      {children}
    </CategoriasContext.Provider>
  )
}

export function useCategorias() {
  return useContext(CategoriasContext)
}
