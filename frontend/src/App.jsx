import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AdminPage } from './pages/AdminPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { PlaceholderPage } from './pages/PlaceholderPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'

// Mapa de páginas
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PlaceholderPage title="Inicio" />} />
        <Route path="productos" element={<PlaceholderPage title="Productos" />} />
        <Route path="quienes-somos" element={<PlaceholderPage title="Quiénes somos" />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />

        <Route
          path="carrito"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Carrito" />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
      </Route>
    </Routes>
  )
}
