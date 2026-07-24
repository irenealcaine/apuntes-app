import { Outlet } from "react-router-dom"
import { CategoriasProvider } from "../context/CategoriasContext"
import { ThemeProvider } from "../context/ThemeContext"
import CategorySidebar from "./CategorySidebar"
import Footer from "./Footer"
import "./Layout.css"

export default function Layout() {
  return (
    <ThemeProvider>
      <CategoriasProvider>
        <div className="layout">
          <div className="layout__body">
            <CategorySidebar />
            <main className="layout__main">
              <Outlet />
            </main>
          </div>
          <Footer />
        </div>
      </CategoriasProvider>
    </ThemeProvider>
  )
}
