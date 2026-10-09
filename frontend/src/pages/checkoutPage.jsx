import { useState } from "react";
import "./checkoutPage.css";

const formatoYenes = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const formatoDolares = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

export function PaginaCheckout({
  productos = [],
  nombreUsuario = "",
  editarCarrito,
  confirmarCompra,
  tasaCambio = null,
  comisionDolares = 0,
}) {
  const [direccion, establecerDireccion] = useState({
    nombreCompleto: nombreUsuario,
    telefono: "",
    pais: "",
    ciudad: "",
    domicilio: "",
  });

  const [error, establecerError] = useState("");
  const [aviso, establecerAviso] = useState("");
  const [enviando, establecerEnviando] = useState(false);

  const subtotalYenes = productos.reduce(
    (total, producto) => total + producto.priceJpy * producto.quantity,
    0,
  );

  const conversionDisponible = Number.isFinite(tasaCambio) && tasaCambio > 0;

  const subtotalCentavos = conversionDisponible
    ? Math.round(subtotalYenes * tasaCambio * 100)
    : 0;

  const totalDolares =
    (subtotalCentavos + Math.round(comisionDolares * 100)) / 100;

  function cambiarDireccion(evento) {
    const { name: campo, value: valor } = evento.target;

    establecerDireccion((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    establecerError("");
    establecerAviso("");
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();

    if (enviando) return;

    const datosEnvio = Object.fromEntries(
      Object.entries(direccion).map(([campo, valor]) => [campo, valor.trim()]),
    );

    if (Object.values(datosEnvio).some((valor) => !valor)) {
      establecerError("Completa todos los datos de envío.");
      return;
    }

    establecerError("");
    establecerAviso("");

    if (!confirmarCompra) {
      establecerAviso(
        "Datos revisados. Esta vista todavía no procesa compras ni pagos.",
      );
      return;
    }

    establecerEnviando(true);

    try {
      await confirmarCompra({
        direccion: datosEnvio,
        productos: productos.map((producto) => ({
          id: producto.id,
          cantidad: producto.quantity,
        })),
      });
    } catch (problema) {
      establecerError(problema.message || "No se pudo procesar la compra.");
    } finally {
      establecerEnviando(false);
    }
  }

  if (productos.length === 0) {
    return (
      <section className="checkout-pagina">
        <h1>No hay productos para comprar</h1>
        <p>Agrega productos al carrito antes de continuar.</p>
      </section>
    );
  }

  return (
    <section className="checkout-pagina">
      <header className="checkout-encabezado">
        <p className="checkout-etiqueta">ÚLTIMO PASO</p>
        <h1>Finalizar compra</h1>
        <p>Revisa tus productos y completa los datos de envío.</p>
      </header>

      <div className="checkout-distribucion">
        <div className="checkout-contenido">
          <section className="checkout-tarjeta">
            <div className="checkout-titulo-seccion">
              <h2>Tu pedido</h2>

              {editarCarrito && (
                <button
                  type="button"
                  className="checkout-boton-texto"
                  disabled={enviando}
                  onClick={editarCarrito}
                >
                  Editar carrito
                </button>
              )}
            </div>

            <ul className="checkout-productos">
              {productos.map((producto) => (
                <li key={producto.id} className="checkout-producto">
                  <div className="checkout-imagen">
                    <span aria-hidden="true">📦</span>

                    {producto.imageUrl && (
                      <img
                        src={producto.imageUrl}
                        alt=""
                        onError={(evento) => {
                          evento.currentTarget.hidden = true;
                        }}
                      />
                    )}
                  </div>

                  <div className="checkout-producto__informacion">
                    <h3>{producto.title}</h3>
                    <p>Cantidad: {producto.quantity}</p>
                  </div>

                  <strong>
                    {formatoYenes.format(producto.priceJpy * producto.quantity)}
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="checkout-tarjeta">
            <h2>Datos de envío</h2>

            <form
              id="formulario-checkout"
              className="checkout-formulario"
              onSubmit={enviarFormulario}
            >
              <fieldset disabled={enviando}>
                <label className="checkout-formulario__ancho">
                  Nombre completo
                  <input
                    name="nombreCompleto"
                    autoComplete="shipping name"
                    maxLength={120}
                    required
                    value={direccion.nombreCompleto}
                    onChange={cambiarDireccion}
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    type="tel"
                    name="telefono"
                    autoComplete="shipping tel"
                    placeholder="+503 7000 0000"
                    maxLength={30}
                    required
                    value={direccion.telefono}
                    onChange={cambiarDireccion}
                  />
                </label>

                <label>
                  País
                  <input
                    name="pais"
                    autoComplete="shipping country-name"
                    placeholder="El Salvador"
                    maxLength={80}
                    required
                    value={direccion.pais}
                    onChange={cambiarDireccion}
                  />
                </label>

                <label className="checkout-formulario__ancho">
                  Ciudad
                  <input
                    name="ciudad"
                    autoComplete="shipping address-level2"
                    placeholder="San Salvador"
                    maxLength={100}
                    required
                    value={direccion.ciudad}
                    onChange={cambiarDireccion}
                  />
                </label>

                <label className="checkout-formulario__ancho">
                  Dirección
                  <textarea
                    name="domicilio"
                    autoComplete="shipping street-address"
                    placeholder="Calle, número de casa y referencias"
                    rows={3}
                    maxLength={300}
                    required
                    value={direccion.domicilio}
                    onChange={cambiarDireccion}
                  />
                </label>
              </fieldset>

              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}
            </form>
          </section>
        </div>

        <aside className="checkout-resumen">
          <h2>Resumen de compra</h2>

          <dl className="checkout-importes">
            <div>
              <dt>Subtotal en yenes</dt>
              <dd>{formatoYenes.format(subtotalYenes)}</dd>
            </div>

            <div>
              <dt>Conversión a dólares</dt>
              <dd>
                {conversionDisponible
                  ? formatoDolares.format(subtotalCentavos / 100)
                  : "Por calcular"}
              </dd>
            </div>

            <div>
              <dt>Comisión</dt>
              <dd>{formatoDolares.format(comisionDolares)}</dd>
            </div>

            <div>
              <dt>Envío</dt>
              <dd>Por definir</dd>
            </div>

            <div className="checkout-importes__total">
              <dt>Total estimado</dt>
              <dd>
                {conversionDisponible
                  ? formatoDolares.format(totalDolares)
                  : "Por calcular"}
              </dd>
            </div>
          </dl>

          <p className="checkout-nota">
            El envío no está incluido. Los importes definitivos se verificarán
            antes de ejecutar la compra.
          </p>

          <button
            type="submit"
            form="formulario-checkout"
            className="checkout-boton-principal"
            disabled={enviando}
          >
            {enviando ? "Procesando…" : "Confirmar compra"}
          </button>

          {aviso && (
            <p className="checkout-aviso" role="status">
              {aviso}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
