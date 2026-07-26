import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FiPlus, FiTrash2, FiLogOut, FiSearch } from "react-icons/fi"
import { useCategorias } from "../context/CategoriasContext"
import { useAuth } from "../context/AuthContext"
import ConfirmDialog from "./ConfirmDialog"
import "./CategorySidebar.css"

export default function CategorySidebar({ open }) {
  const { categorias, activeId, setActiveId, handleCreate, handleDelete } =
    useCategorias()
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get("q") || ""

  const [nueva, setNueva] = useState("")
  const [mostrarInput, setMostrarInput] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function setSearch(value) {
    if (value) {
      setSearchParams({ q: value })
    } else {
      setSearchParams({})
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nombre = nueva.trim()
    if (!nombre) return
    handleCreate(nombre)
    setNueva("")
    setMostrarInput(false)
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    handleDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <nav className={`category-sidebar${open ? "" : " category-sidebar--hidden"}`}>
      <div className="category-sidebar__header">
        <h2 className="category-sidebar__title">Categorías</h2>
        <button
          className="category-sidebar__add-btn"
          onClick={() => setMostrarInput(!mostrarInput)}
          title="Nueva categoría"
        >
          <FiPlus size={16} />
        </button>
      </div>

      {mostrarInput && (
        <form className="category-sidebar__form" onSubmit={handleSubmit}>
          <input
            className="category-sidebar__input"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Nombre de la categoría"
            autoFocus
          />
        </form>
      )}

      <div className="category-sidebar__search">
        <FiSearch size={14} className="category-sidebar__search-icon" />
        <input
          className="category-sidebar__search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar apuntes..."
        />
      </div>

      <button
        className={`category-sidebar__item${!activeId ? " category-sidebar__item--active" : ""}`}
        onClick={() => setActiveId(null)}
      >
        Todas
      </button>

      {categorias.map((cat) => (
        <div
          key={cat.id}
          className={`category-sidebar__row${activeId === cat.id ? " category-sidebar__row--active" : ""}`}
        >
          <button
            className="category-sidebar__item"
            onClick={() => setActiveId(cat.id)}
          >
            {cat.nombre}
          </button>
          <button
            className="category-sidebar__del-btn"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(cat)
            }}
            title="Eliminar categoría"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ))}

      {deleteTarget && (
        <ConfirmDialog
          message={`¿Eliminar la categoría "${deleteTarget.nombre}"? Los apuntes que contenga no se borrarán.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="category-sidebar__spacer" />

      <div className="category-sidebar__user">
        <span className="category-sidebar__email" title={user?.email}>
          {user?.email}
        </span>
        <button
          className="category-sidebar__logout-btn"
          onClick={logout}
          title="Cerrar sesión"
        >
          <FiLogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
