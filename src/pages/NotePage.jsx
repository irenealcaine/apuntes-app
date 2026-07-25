import { useState, useEffect, Children } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import MDEditor from "@uiw/react-md-editor"
import { getApunte, updateApunte, deleteApunte } from "../services/firebase"
import { useCategorias } from "../context/CategoriasContext"
import { useTheme } from "../context/ThemeContext"
import ConfirmDialog from "../components/ConfirmDialog"
import "./NotePage.css"

function CodeBlock({ className, code, themeMode }) {
  const language = className ? className.replace(/language-/, "") : ""
  const prismTheme = themeMode === "dark" ? themes.nightOwl : themes.github

  if (!language) {
    return (
      <pre className="note-page__code-plain">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <Highlight theme={prismTheme} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style} className="note-page__code-highlighted">
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line })
            return (
              <div key={i} {...lineProps} className="note-page__code-line">
                <span className="note-page__code-num">{i + 1}</span>
                <span className="note-page__code-content">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            )
          })}
        </pre>
      )}
    </Highlight>
  )
}

function extraerTitulo(contenido) {
  const linea = contenido?.split("\n").find((l) => l.trim().startsWith("# "))
  return linea ? linea.trim().replace(/^#\s+/, "") : "Sin título"
}

export default function NotePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categorias } = useCategorias()
  const { theme } = useTheme()

  const [apunte, setApunte] = useState(null)
  const [categoriaId, setCategoriaId] = useState("")
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [contenido, setContenido] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    getApunte(id).then((data) => {
      if (!data) {
        navigate("/", { replace: true })
        return
      }
      setApunte(data)
      setCategoriaId(data.categoriaId || "")
      setContenido(data.contenido || "")
      setLoading(false)
      if (!data.titulo && !data.contenido) {
        setEditando(true)
      }
    })
  }, [id, navigate])

  async function handleSave() {
    const titulo = extraerTitulo(contenido)
    await updateApunte(id, { titulo, contenido, categoriaId })
    setApunte((prev) => ({ ...prev, titulo, contenido, categoriaId }))
    setEditando(false)
  }

  function handleCancel() {
    setCategoriaId(apunte.categoriaId || "")
    setContenido(apunte.contenido || "")
    setEditando(false)
  }

  async function handleDelete() {
    await deleteApunte(id)
    navigate("/", { replace: true })
  }

  if (loading) {
    return <p className="note-page__loading">Cargando...</p>
  }

  const catActual = categorias.find((c) => c.id === categoriaId)

  return (
    <div className="note-page">
      <div className="note-page__header">
        <button className="note-page__back" onClick={() => navigate("/")}>
          <FiArrowLeft size={18} /> Volver
        </button>

        <div className="note-page__actions">
          {editando ? (
            <>
              <button
                className="note-page__btn note-page__btn--save"
                onClick={handleSave}
              >
                <FiSave size={16} /> Guardar
              </button>
              <button
                className="note-page__btn note-page__btn--cancel"
                onClick={handleCancel}
              >
                <FiX size={16} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                className="note-page__btn note-page__btn--edit"
                onClick={() => setEditando(true)}
              >
                <FiEdit2 size={16} /> Editar
              </button>
              <button
                className="note-page__btn note-page__btn--delete"
                onClick={() => setConfirmDelete(true)}
              >
                <FiTrash2 size={16} /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {editando ? (
        <>
          <div className="note-page__category-selector">
            <label className="note-page__cat-label">Categoría</label>
            <select
              className="note-page__cat-select"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div data-color-mode={theme}>
            <MDEditor
              value={contenido}
              onChange={setContenido}
              height={500}
              preview="live"
            />
          </div>
        </>
      ) : (
        <div className="note-page__content">
          {catActual && (
            <span className="note-page__cat-tag">{catActual.nombre}</span>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children }) {
                if (inline) {
                  return <code className="note-page__code-inline">{children}</code>
                }
                return <code className={className}>{children}</code>
              },
              pre({ children }) {
                const codeEl = Children.only(children)
                return (
                  <CodeBlock
                    className={codeEl.props.className}
                    code={String(codeEl.props.children).replace(/\n$/, "")}
                    themeMode={theme}
                  />
                )
              },
            }}
          >
            {apunte.contenido || ""}
          </ReactMarkdown>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="¿Estás seguro de que quieres eliminar este apunte? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
