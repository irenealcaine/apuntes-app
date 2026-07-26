import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiTrash2 } from "react-icons/fi"
import ConfirmDialog from "./ConfirmDialog"
import "./NoteCard.css"

function extraerTitulo(contenido) {
  const linea = contenido?.split("\n").find((l) => l.trim().startsWith("# "))
  return linea ? linea.trim().replace(/^#\s+/, "") : ""
}

export default function NoteCard({ apunte, onDelete }) {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const titulo = apunte.titulo || extraerTitulo(apunte.contenido) || "Apunte nuevo"

  const preview =
    apunte.contenido
      ?.replace(/[#*`[\]]/g, "")
      .split("\n")
      .slice(titulo ? 1 : 0, 4)
      .join(" ")
      .substring(0, 150) || ""

  const fecha = apunte.createdAt?.toDate
    ? apunte.createdAt.toDate().toLocaleDateString("es-ES")
    : ""

  if (showConfirm) {
    return (
      <div className="note-card">
        <div className="note-card__confirm">
          <span>¿Eliminar definitivamente?</span>
          <button
            className="note-card__del-yes"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(apunte.id)
            }}
          >
            Sí
          </button>
          <button
            className="note-card__del-no"
            onClick={(e) => {
              e.stopPropagation()
              setShowConfirm(false)
            }}
          >
            No
          </button>
        </div>
      </div>
    )
  }

  return (
    <article
      className="note-card"
      onClick={() => navigate(`/apunte/${apunte.id}`)}
    >
      <div className="note-card__text">
        <h3 className="note-card__title">{titulo}</h3>
        <p className="note-card__preview">{preview}</p>
      </div>
      {fecha && <span className="note-card__date">{fecha}</span>}
      {onDelete && (
        <button
          className="note-card__del-btn"
          onClick={(e) => {
            e.stopPropagation()
            setShowConfirm(true)
          }}
          title="Eliminar definitivamente"
        >
          <FiTrash2 size={14} />
        </button>
      )}
    </article>
  )
}
