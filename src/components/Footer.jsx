import { FiGithub, FiMoon, FiSun } from "react-icons/fi"
import { useTheme } from "../context/ThemeContext"
import "./Footer.css"

export default function Footer() {
  const { theme, toggleTheme } = useTheme()

  return (
    <footer className="footer">
      <span className="footer__text">Apuntes App &mdash; tus apuntes en markdown</span>
      <div className="footer__actions">
        <button
          className="footer__theme-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>
        <a
          className="footer__link"
          href="https://github.com/irenealcaine/apuntes-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiGithub size={16} /> GitHub
        </a>
      </div>
    </footer>
  )
}
