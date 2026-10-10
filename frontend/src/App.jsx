import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AdminPage } from './pages/AdminPage.jsx'
import { CartPage } from './pages/CartPage.jsx'
import { CheckoutPage } from './pages/CheckoutPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { OrderPage } from './pages/OrderPage.jsx'
import { OrdersPage } from './pages/OrdersPage.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { PlaceholderPage } from './pages/PlaceholderPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'

// Mapa de páginas
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="productos" element={<ProductsPage />} />
        <Route path="quienes-somos" element={<PlaceholderPage title="Quiénes somos" />} />
        <Route path="privacidad" element={<PlaceholderPage title="Política de privacidad" />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />

        {/* Carrito */}
        <Route path="carrito" element={<CartPage />} />
        {/* Páginas que exigen sesión */}
        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="pedidos/:id" element={<OrderPage />} />
        </Route>
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
