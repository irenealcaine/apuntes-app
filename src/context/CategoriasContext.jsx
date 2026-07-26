import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./AuthContext"
import {
  getCategorias,
  addCategoria,
  deleteCategoria,
  renameCategoria,
} from "../services/firebase"

const ARCHIVADOS_NOMBRE = "Archivados"

const CategoriasContext = createContext(null)

export function CategoriasProvider({ children }) {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [archivadosId, setArchivadosId] = useState(null)

  const ensureArchivados = useCallback(async (uid) => {
    if (!uid) return
    const cats = await getCategorias(uid)
    let arch = cats.find((c) => c.nombre === ARCHIVADOS_NOMBRE)
    if (!arch) {
      await addCategoria(uid, ARCHIVADOS_NOMBRE)
      const updated = await getCategorias(uid)
      arch = updated.find((c) => c.nombre === ARCHIVADOS_NOMBRE)
      setCategorias(updated)
      setArchivadosId(arch?.id || null)
      return arch?.id || null
    }
    setArchivadosId(arch.id)
    return arch.id
  }, [])

  const refreshCategorias = useCallback(async (uid) => {
    if (!uid) {
      setCategorias([])
      setArchivadosId(null)
      return
    }
    const cats = await getCategorias(uid)
    setCategorias(cats)
    const arch = cats.find((c) => c.nombre === ARCHIVADOS_NOMBRE)
    setArchivadosId(arch?.id || null)
    return cats
  }, [])

  useEffect(() => {
    if (!user) {
      setCategorias([])
      setActiveId(null)
      setArchivadosId(null)
      return
    }
    refreshCategorias(user.uid)
    ensureArchivados(user.uid)
  }, [user, refreshCategorias, ensureArchivados])

  async function handleCreate(nombre) {
    if (!user) return
    await addCategoria(user.uid, nombre)
    await refreshCategorias(user.uid)
  }

  async function handleDelete(id) {
    await deleteCategoria(id)
    if (!user) return
    await refreshCategorias(user.uid)
    if (activeId === id) setActiveId(null)
  }

  async function handleRename(id, nombre) {
    await renameCategoria(id, nombre)
    if (!user) return
    await refreshCategorias(user.uid)
  }

  return (
    <CategoriasContext.Provider
      value={{ categorias, activeId, setActiveId, handleCreate, handleDelete, handleRename, archivadosId, refreshCategorias }}
    >
      {children}
    </CategoriasContext.Provider>
  )
}

export function useCategorias() {
  return useContext(CategoriasContext)
}
