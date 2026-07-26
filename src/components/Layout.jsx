import { useState } from "react"
import { Outlet } from "react-router-dom"
import { FiMenu } from "react-icons/fi"
import { CategoriasProvider } from "../context/CategoriasContext"
import { ThemeProvider } from "../context/ThemeContext"
import CategorySidebar from "./CategorySidebar"
import Footer from "./Footer"
import "./Layout.css"

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider>
      <CategoriasProvider>
        <div className="layout">
          <div className={`layout__body${sidebarOpen ? "" : " layout__body--sidebar-closed"}`}>
            <CategorySidebar open={sidebarOpen} />
            <main className="layout__main">
              <button
                className="layout__menu-btn"
                onClick={() => setSidebarOpen((o) => !o)}
                title={sidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
              >
                <FiMenu size={20} />
              </button>
              <Outlet />
            </main>
          </div>
          <Footer />
        </div>
      </CategoriasProvider>
    </ThemeProvider>
  )
}
