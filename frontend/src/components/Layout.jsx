import { Outlet } from 'react-router'
import { Header } from './Header.jsx'

// Estructura común de todas las páginas />
export function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}
