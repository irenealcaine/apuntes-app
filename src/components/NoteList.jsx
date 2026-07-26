import NoteCard from "./NoteCard"
import "./NoteList.css"

export default function NoteList({ apuntes, onDelete }) {
  if (apuntes.length === 0) {
    return (
      <div className="note-list">
        <p className="note-list__empty">
          No hay apuntes en esta categoría
        </p>
      </div>
    )
  }

  return (
    <div className="note-list">
      {apuntes.map((apunte) => (
        <NoteCard key={apunte.id} apunte={apunte} onDelete={onDelete} />
      ))}
    </div>
  )
}
