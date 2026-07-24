import { useNavigate } from "react-router-dom"
import "./NoteCard.css"

function extraerTitulo(contenido) {
  const linea = contenido?.split("\n").find((l) => l.trim().startsWith("# "))
  return linea ? linea.trim().replace(/^#\s+/, "") : ""
}

export default function NoteCard({ apunte }) {
  const navigate = useNavigate()

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

  return (
    <article
      className="note-card"
      onClick={() => navigate(`/apunte/${apunte.id}`)}
    >
      <h3 className="note-card__title">{titulo}</h3>
      <p className="note-card__preview">{preview}</p>
      {fecha && <span className="note-card__date">{fecha}</span>}
    </article>
  )
}
