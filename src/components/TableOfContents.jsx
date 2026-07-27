import { useState, useEffect } from "react"

export function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
}

export function extractHeadings(markdown) {
  if (!markdown) return []
  const lines = markdown.split("\n")
  const headings = []
  const seen = {}
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const text = match[2].trim()
      if (!text) continue
      let id = slugify(text)
      if (seen[id]) {
        seen[id]++
        id = `${id}-${seen[id]}`
      } else {
        seen[id] = 1
      }
      headings.push({ level: match[1].length, text, id })
    }
  }
  return headings
}

export function rehypeAddIds() {
  return (tree) => {
    function extractText(node) {
      if (node.type === "text") return node.value
      if (node.children) return node.children.map(extractText).join("")
      return ""
    }
    const seen = {}
    function walk(node) {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
        const text = extractText(node).trim()
        if (text) {
          let id = slugify(text)
          if (seen[id]) {
            seen[id]++
            id = `${id}-${seen[id]}`
          } else {
            seen[id] = 1
          }
          node.properties = node.properties || {}
          node.properties.id = id
        }
      }
      if (node.children) {
        node.children.forEach(walk)
      }
    }
    walk(tree)
  }
}

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (headings.length === 0) return
    setActiveId(headings[0].id)

    const handleScroll = () => {
      const offset = 100
      let current = headings[0].id
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (el && el.getBoundingClientRect().top <= offset) {
          current = h.id
        }
      }
      setActiveId(current)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [headings])

  if (headings.length === 0) return null

  return (
    <aside className="note-page__toc">
      <h3 className="note-page__toc-title">En esta página</h3>
      <nav className="note-page__toc-nav">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`note-page__toc-link note-page__toc-link--h${h.level}${
              activeId === h.id ? " note-page__toc-link--active" : ""
            }`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </aside>
  )
}
