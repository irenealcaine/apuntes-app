import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { getApuntes, deleteApunte } from "../services/firebase"
import { useAuth } from "../context/AuthContext"
import { useCategorias } from "../context/CategoriasContext"
import NoteList from "../components/NoteList"
import "./HomePage.css"

export default function HomePage() {
  const { user } = useAuth()
  const { categorias, activeId, archivadosId } = useCategorias()
  const [searchParams] = useSearchParams()
  const search = searchParams.get("q") || ""
  const [apuntes, setApuntes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getApuntes(user.uid, activeId).then((data) => {
      setApuntes(data)
      setLoading(false)
    })
  }, [user, activeId])

  const filtrados = useMemo(() => {
    let items = apuntes
    if (!activeId && archivadosId) {
      items = items.filter((a) => a.categoriaId !== archivadosId)
    }
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (a) =>
        (a.titulo || "").toLowerCase().includes(q) ||
        (a.contenido || "").toLowerCase().includes(q)
    )
  }, [apuntes, search, activeId, archivadosId])

  async function handleDeleteNote(id) {
    await deleteApunte(id)
    setApuntes((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h1>
          {activeId === archivadosId
            ? "Archivados"
            : activeId
              ? categorias.find((c) => c.id === activeId)?.nombre
              : "Todos los apuntes"}
        </h1>

      </div>
      {loading ? (
        <p className="home-page__loading">Cargando...</p>
      ) : filtrados.length === 0 && search ? (
        <p className="home-page__loading">Sin resultados para "{search}"</p>
      ) : (
        <NoteList apuntes={filtrados} onDelete={activeId === archivadosId ? handleDeleteNote : undefined} />
      )}
    </div>
  )
}
