import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth.js'
import './AboutPage.css'

const DIFFERENCES = [
  {
    topic: 'Precio',
    informal: 'Se conoce al final, a veces con cargos que no se mencionaron',
    compraLatino: 'Total en dólares, con tipo de cambio y cargo por servicio, antes de confirmar'
  },
  {
    topic: 'Compra',
    informal: 'Se coordina por mensajes y depende de una persona',
    compraLatino: 'Se ejecuta directamente en YAuctions, con número de confirmación'
  },
  {
    topic: 'Seguimiento',
    informal: 'Hay que preguntar cada cierto tiempo "¿cómo va mi pedido?"',
    compraLatino: 'Historial de estados de cada pedido en "Mis pedidos"'
  },
  {
    topic: 'Errores',
    informal: 'Productos equivocados o pedidos que se pierden',
    compraLatino: 'Cada orden guarda qué se compró, a qué precio y a dónde se envía'
  }
]

export function AboutPage() {
  const { user } = useAuth()

  return (
    <>
      <section className="about-hero">
        <h1>Quiénes somos</h1>
        <p>Hacemos que comprar en Japón sea tan sencillo como comprar en tu ciudad.</p>
      </section>

      <section className="about-section about-story">
        <h2>Nuestra historia</h2>
        <p>
          En YAuctions, uno de los sitios ventas más grandes de Japón, hay productos de tecnología que
          no se consiguen en Latinoamérica o que allá cuestan mucho menos. Pero comprarlos desde aquí no es
          fácil: el sitio está en japonés, no acepta pagos ni envíos internacionales y no hay a quién reclamar
          si algo sale mal.
        </p>
        <p>
          Hasta ahora, la única opción eran intermediarios informales. El resultado suele ser lento,
          sin seguimiento y con errores. <strong>CompraLatino</strong> nace para resolver eso con una
          plataforma propia: tú eliges el producto, ves el total en dólares, y nosotros nos encargamos de la
          compra y del envío hasta tu puerta.
        </p>
      </section>

      <section className="about-section">
        <div className="about-cards">
          <article className="about-card">
            <h2>Misión</h2>
            <p>
              Conectar a clientes de Latinoamérica con los productos de Japón mediante un proceso de compra
              claro, seguro y con seguimiento de principio a fin.
            </p>
          </article>
          <article className="about-card">
            <h2>Visión</h2>
            <p>
              Ser la forma más confiable de comprar en Japón desde Latinoamérica, reemplazando a los
              intermediarios informales por una experiencia transparente.
            </p>
          </article>
        </div>
      </section>

      <section className="about-section">
        <h2>Qué nos diferencia</h2>
        <div className="about-table-wrapper">
          <table className="about-table">
            <thead>
              <tr>
                <th scope="col"><span className="visually-hidden">Aspecto</span></th>
                <th scope="col">Intermediario informal</th>
                <th scope="col">CompraLatino</th>
              </tr>
            </thead>
            <tbody>
              {DIFFERENCES.map((row) => (
                <tr key={row.topic}>
                  <th scope="row">{row.topic}</th>
                  <td>{row.informal}</td>
                  <td className="about-table__ours">{row.compraLatino}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="about-section about-cta">
        <h2>¿Listo para tu primera compra?</h2>
        <div className="about-cta__actions">
          <Link to="/productos" className="button">Ver productos</Link>
          {!user && <Link to="/registro" className="about-cta__secondary">Crear cuenta</Link>}
        </div>
      </section>
    </>
  )
}
