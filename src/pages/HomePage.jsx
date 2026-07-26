import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { FiPlus } from "react-icons/fi"
import { getApuntes, addApunte } from "../services/firebase"
import { useAuth } from "../context/AuthContext"
import { useCategorias } from "../context/CategoriasContext"
import NoteList from "../components/NoteList"
import "./HomePage.css"

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categorias, activeId } = useCategorias()
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
    if (!search) return apuntes
    const q = search.toLowerCase()
    return apuntes.filter(
      (a) =>
        (a.titulo || "").toLowerCase().includes(q) ||
        (a.contenido || "").toLowerCase().includes(q)
    )
  }, [apuntes, search])

  async function handleNuevoApunte() {
    const catId = activeId || (categorias.length > 0 ? categorias[0].id : null)

    if (!catId) {
      alert("Primero crea una categoría.")
      return
    }

    const doc = await addApunte({
      uid: user.uid,
      titulo: "",
      contenido: "",
      categoriaId: catId,
    })
    navigate(`/apunte/${doc.id}`)
  }

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h1>
          {activeId
            ? categorias.find((c) => c.id === activeId)?.nombre
            : "Todos los apuntes"}
        </h1>
        <button className="home-page__add-btn" onClick={handleNuevoApunte}>
          <FiPlus size={18} /> Nuevo
        </button>
      </div>
      {loading ? (
        <p className="home-page__loading">Cargando...</p>
      ) : filtrados.length === 0 && search ? (
        <p className="home-page__loading">Sin resultados para "{search}"</p>
      ) : (
        <NoteList apuntes={filtrados} />
      )}
    </div>
  )
}
