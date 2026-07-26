import { useState, useEffect, Children, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiEdit2, FiTrash2, FiSave, FiX, FiCopy, FiArchive } from "react-icons/fi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import MDEditor from "@uiw/react-md-editor"
import { getApunte, updateApunte, deleteApunte } from "../services/firebase"
import { useCategorias } from "../context/CategoriasContext"
import { useTheme } from "../context/ThemeContext"
import ConfirmDialog from "../components/ConfirmDialog"
import "./NotePage.css"

const CALLOUT_LABELS = {
  note: "Nota",
  tip: "Consejo",
  important: "Importante",
  warning: "Advertencia",
  caution: "Cuidado",
}

function rehypeCallout() {
  return (tree) => {
    function findCallout(node) {
      if (node.type === "text") {
        const m = node.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/)
        if (m) return m[1].toLowerCase()
      }
      if (node.children) {
        for (const child of node.children) {
          const result = findCallout(child)
          if (result) return result
        }
      }
      return null
    }

    function removeCalloutMarker(node) {
      if (node.type === "text") {
        node.value = node.value.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, "")
      }
      if (node.children) {
        for (const child of node.children) removeCalloutMarker(child)
      }
    }

    function walk(node) {
      if (node.type === "element" && node.tagName === "blockquote") {
        const type = findCallout(node)
        node.properties = node.properties || {}
        if (type) {
          node.properties.className = `note-page__callout note-page__callout--${type}`
          removeCalloutMarker(node)
          node.children.unshift({
            type: "element",
            tagName: "strong",
            properties: { className: "note-page__callout-label" },
            children: [{ type: "text", value: CALLOUT_LABELS[type] }],
          })
        } else {
          node.properties.className = "note-page__blockquote"
        }
      }
      if (node.children) {
        for (const child of node.children) walk(child)
      }
    }
    walk(tree)
  }
}

function CodeBlock({ className, code, themeMode }) {
  const [copied, setCopied] = useState(false)
  const language = className ? className.replace(/language-/, "") : ""
  const prismTheme = themeMode === "dark" ? themes.nightOwl : themes.github

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code])

  const copyBtn = (
    <button
      className={`note-page__code-copy${copied ? " note-page__code-copy--copied" : ""}`}
      onClick={handleCopy}
      title="Copiar al portapapeles"
    >
      <FiCopy size={14} />
      <span>{copied ? "Copiado" : "Copiar"}</span>
    </button>
  )

  if (!language) {
    return (
      <div className="note-page__code-wrapper">
        <pre className="note-page__code-plain">
          <code>{code}</code>
        </pre>
        {copyBtn}
      </div>
    )
  }

  return (
    <Highlight theme={prismTheme} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <div className="note-page__code-wrapper">
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
          {copyBtn}
        </div>
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
  const { categorias, archivadosId } = useCategorias()
  const { theme } = useTheme()

  const [apunte, setApunte] = useState(null)
  const [categoriaId, setCategoriaId] = useState("")
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [contenido, setContenido] = useState("")
  const [confirmAction, setConfirmAction] = useState(null) // null | 'archive' | 'delete'

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

  async function handleArchive() {
    if (!archivadosId) return
    await updateApunte(id, { categoriaId: archivadosId })
    navigate("/", { replace: true })
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
              {categoriaId === archivadosId ? (
                <button
                  className="note-page__btn note-page__btn--delete"
                  onClick={() => setConfirmAction("delete")}
                >
                  <FiTrash2 size={16} /> Eliminar definitivamente
                </button>
              ) : archivadosId ? (
                <button
                  className="note-page__btn note-page__btn--archive"
                  onClick={() => setConfirmAction("archive")}
                >
                  <FiArchive size={16} /> Archivar
                </button>
              ) : null}
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
              previewOptions={{
                rehypePlugins: [rehypeCallout],
              }}
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
            rehypePlugins={[rehypeCallout]}
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

      {confirmAction === "delete" && (
        <ConfirmDialog
          message="¿Estás seguro de que quieres eliminar este apunte definitivamente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "archive" && archivadosId && (
        <ConfirmDialog
          message="¿Archivar este apunte? Se moverá a la categoría Archivados."
          confirmText="Archivar"
          onConfirm={handleArchive}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
