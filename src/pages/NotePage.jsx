import { useState, useEffect, Children, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiEdit2, FiTrash2, FiSave, FiX, FiCopy, FiCheck, FiArchive, FiDownload } from "react-icons/fi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import "../utils/registerPrismLanguages"
import MDEditor from "@uiw/react-md-editor"
import { getApunte, updateApunte, deleteApunte } from "../services/firebase"
import { useCategorias } from "../context/CategoriasContext"
import { useTheme } from "../context/ThemeContext"
import ConfirmDialog from "../components/ConfirmDialog"
import TableOfContents, { extractHeadings, rehypeAddIds } from "../components/TableOfContents"
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

// Numera cada checkbox de task-list en orden del documento para que el
// onChange sepa exactamente qué línea del markdown debe alternar.
// Es determinista (va en el AST), así no depende del orden de render.
function rehypeTaskIndex() {
  return (tree) => {
    let idx = 0
    function walk(node) {
      if (
        node.type === "element" &&
        node.tagName === "input" &&
        node.properties?.type === "checkbox"
      ) {
        // En hast las data-* van en kebab dentro de properties
        node.properties = { ...node.properties, "data-task-index": idx++ }
      }
      if (node.children) {
        for (const child of node.children) walk(child)
      }
    }
    walk(tree)
  }
}

function InlineCode({ children, className }) {
  const [copied, setCopied] = useState(false)
  const text = Children.toArray(children).join("")

  const handleCopy = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }, [text])

  return (
    <code
      className={`note-page__code-inline${copied ? " note-page__code-inline--copied" : ""}`}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleCopy()
        }
      }}
      role="button"
      tabIndex={0}
      title={copied ? "¡Copiado!" : "Clic para copiar"}
    >
      <span className="note-page__code-inline-text">{children}</span>
      <span className="note-page__code-inline-icon" aria-hidden="true">
        {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
      </span>
    </code>
  )
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

// Cambia el n-ésimo task-list (`- [ ]` / `- [x]`) del markdown, ignorando
// bloques de código vallados para que el orden coincida con lo renderizado.
function toggleTaskInMarkdown(markdown, targetIndex) {
  const lines = (markdown || "").split("\n")
  let taskSeen = -1
  let inFence = false
  const taskRe =
    /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+)\[([ xX])\](\s.*|\s*)$/

  const next = lines.map((line) => {
    const trimmed = line.trimStart()
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence
      return line
    }
    if (inFence) return line
    const m = line.match(taskRe)
    if (!m) return line
    taskSeen += 1
    if (taskSeen !== targetIndex) return line
    const mark = m[2] === " " ? "x" : " "
    return `${m[1]}[${mark}]${m[3]}`
  })

  if (taskSeen < targetIndex) return null
  return next.join("\n")
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

  // Permite marcar/desmarcar tasks sin entrar en edición.
  // Actualización optimista + persistencia en Firestore.
  const handleToggleTask = useCallback(
    async (taskIndex) => {
      if (!apunte) return
      const prev = apunte.contenido || ""
      const next = toggleTaskInMarkdown(prev, taskIndex)
      if (next === null || next === prev) return
      setApunte((p) => (p ? { ...p, contenido: next } : p))
      setContenido(next)
      try {
        await updateApunte(id, { contenido: next })
      } catch {
        // Revertir si falla el guardado
        setApunte((p) => (p ? { ...p, contenido: prev } : p))
        setContenido(prev)
      }
    },
    [apunte, id]
  )

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

  function handleDownload() {
    const markdown = editando ? contenido : apunte?.contenido || ""
    const titulo = extraerTitulo(markdown) || apunte?.titulo || "apunte"
    const nombreArchivo =
      titulo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase() || "apunte"
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${nombreArchivo}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <p className="note-page__loading">Cargando...</p>
  }

  const catActual = categorias.find((c) => c.id === categoriaId)
  const headings = extractHeadings(apunte?.contenido)

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
                className="note-page__btn note-page__btn--download"
                onClick={handleDownload}
                title="Descargar como archivo Markdown (.md)"
                aria-label="Descargar como archivo Markdown (.md)"
              >
                <FiDownload size={16} />
                <span className="note-page__btn-text">Descargar .md</span>
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
                className="note-page__btn note-page__btn--edit note-page__btn--icon-only-mobile"
                onClick={() => setEditando(true)}
                title="Editar"
                aria-label="Editar"
              >
                <FiEdit2 size={16} />
                <span className="note-page__btn-text">Editar</span>
              </button>
              <button
                className="note-page__btn note-page__btn--download note-page__btn--icon-only-mobile"
                onClick={handleDownload}
                title="Descargar como archivo Markdown (.md)"
                aria-label="Descargar como archivo Markdown (.md)"
              >
                <FiDownload size={16} />
                <span className="note-page__btn-text">Descargar .md</span>
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
                  className="note-page__btn note-page__btn--archive note-page__btn--icon-only-mobile"
                  onClick={() => setConfirmAction("archive")}
                  title="Archivar"
                  aria-label="Archivar"
                >
                  <FiArchive size={16} />
                  <span className="note-page__btn-text">Archivar</span>
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
        <div className="note-page__view">
          <div className="note-page__content">
            {catActual && (
              <span className="note-page__cat-tag">{catActual.nombre}</span>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeTaskIndex, rehypeCallout, rehypeAddIds]}
              components={{
                input({ type, checked, disabled, node, ...props }) {
                  if (type !== "checkbox") {
                    return <input type={type} disabled={disabled} {...props} />
                  }
                  // remark-gfm los genera como disabled; los hacemos
                  // interactivos y persistimos el cambio en el markdown.
                  // El índice viene del AST (rehypeTaskIndex), no del orden
                  // de render, así cada checkbox alterna su propia línea.
                  const raw =
                    props["data-task-index"] ??
                    props.dataTaskIndex ??
                    props.datataskindex
                  const taskIndex = Number(raw)
                  return (
                    <input
                      {...props}
                      type="checkbox"
                      checked={!!checked}
                      onChange={() => {
                        if (Number.isInteger(taskIndex) && taskIndex >= 0)
                          handleToggleTask(taskIndex)
                      }}
                      aria-label={
                        Number.isInteger(taskIndex) && taskIndex >= 0
                          ? `Marcar tarea ${taskIndex + 1} como ${checked ? "pendiente" : "completada"}`
                          : "Marcar tarea como completada"
                      }
                    />
                  )
                },
                li({ className, children, ...props }) {
                  const isTask =
                    className?.includes("task-list-item") ||
                    "checked" in props
                  if (!isTask) {
                    return (
                      <li className={className} {...props}>
                        {children}
                      </li>
                    )
                  }
                  // En flexbox cada nodo de texto suelto se convierte en un
                  // flex-item anónimo (efecto "tres columnas" en móvil).
                  // Agrupamos todo menos el checkbox en un solo contenedor.
                  const kids = Children.toArray(children)
                  const [first, ...rest] = kids
                  return (
                    <li className={className} {...props}>
                      {first}
                      <span className="task-list-item-text">{rest}</span>
                    </li>
                  )
                },
                code({ className, children }) {
                  // En react-markdown v9+ ya no existe la prop `inline`:
                  // los bloques vienen envueltos en <pre> y los interceptamos
                  // abajo, así que todo <code> que llega aquí es en línea.
                  return <InlineCode className={className}>{children}</InlineCode>
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
          <TableOfContents headings={headings} />
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
