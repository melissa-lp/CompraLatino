// Página temporal para las secciones que todavía no se construyen (Inicio, Productos, Carrito…)
export function PlaceholderPage({ title }) {
  return (
    <section className="page">
      <h1>{title}</h1>
      <p className="page-status">Esta sección está en construcción.</p>
    </section>
  )
}
