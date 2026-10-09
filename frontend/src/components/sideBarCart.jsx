import { useEffect, useRef } from "react";
import "./sideBarCart.css";

const formatoYenes = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function CarritoLateral({
  abierto,
  productos = [],
  cerrarCarrito,
  cambiarCantidad,
  eliminarProducto,
  continuarCompra,
}) {
  const referenciaDialogo = useRef(null);

  const cantidadArticulos = productos.reduce(
    (total, producto) => total + producto.quantity,
    0,
  );

  const subtotal = productos.reduce(
    (total, producto) => total + producto.priceJpy * producto.quantity,
    0,
  );

  useEffect(() => {
    if (!abierto) return;

    const dialogo = referenciaDialogo.current;
    const desbordamientoAnterior = document.body.style.overflow;

    if (!dialogo.open) {
      dialogo.showModal();
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = desbordamientoAnterior;
    };
  }, [abierto]);

  function solicitarCierre() {
    referenciaDialogo.current?.close();
  }

  function pulsarFondo(evento) {
    if (evento.target === evento.currentTarget) {
      solicitarCierre();
    }
  }

  function continuar() {
    solicitarCierre();
    continuarCompra();
  }

  if (!abierto) return null;

  return (
    <dialog
      ref={referenciaDialogo}
      className="carrito-panel"
      aria-labelledby="titulo-carrito"
      onClose={cerrarCarrito}
      onClick={pulsarFondo}
    >
      <div className="carrito-panel__contenido">
        <header className="carrito-panel__encabezado">
          <div>
            <h2 id="titulo-carrito">Tu carrito</h2>

            <p>
              {cantidadArticulos}{" "}
              {cantidadArticulos === 1 ? "artículo" : "artículos"}
            </p>
          </div>

          <button
            type="button"
            className="carrito-panel__cerrar"
            aria-label="Cerrar carrito"
            onClick={solicitarCierre}
          >
            ×
          </button>
        </header>

        <div className="carrito-panel__cuerpo">
          {productos.length === 0 ? (
            <div className="carrito-panel__vacio">
              <span aria-hidden="true">🛒</span>
              <h3>Tu carrito está vacío</h3>
              <p>Agrega productos desde el catálogo.</p>

              <button
                type="button"
                className="carrito-panel__boton"
                onClick={solicitarCierre}
              >
                Seguir explorando
              </button>
            </div>
          ) : (
            <ul className="carrito-panel__lista">
              {productos.map((producto) => (
                <li key={producto.id} className="carrito-panel__producto">
                  <div className="carrito-panel__imagen">
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

                  <div className="carrito-panel__informacion">
                    <h3>{producto.title}</h3>

                    <p className="carrito-panel__precio">
                      {formatoYenes.format(producto.priceJpy)} / unidad
                    </p>

                    <div className="carrito-panel__acciones">
                      <div
                        className="carrito-panel__cantidad"
                        role="group"
                        aria-label={`Cantidad de ${producto.title}`}
                      >
                        <button
                          type="button"
                          aria-label={`Reducir cantidad de ${producto.title}`}
                          disabled={producto.quantity <= 1}
                          onClick={() =>
                            cambiarCantidad(producto.id, producto.quantity - 1)
                          }
                        >
                          −
                        </button>

                        <span>{producto.quantity}</span>

                        <button
                          type="button"
                          aria-label={`Aumentar cantidad de ${producto.title}`}
                          disabled={producto.quantity >= 99}
                          onClick={() =>
                            cambiarCantidad(producto.id, producto.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="carrito-panel__eliminar"
                        aria-label={`Eliminar ${producto.title}`}
                        onClick={() => eliminarProducto(producto.id)}
                      >
                        Eliminar
                      </button>
                    </div>

                    <strong className="carrito-panel__importe">
                      {formatoYenes.format(
                        producto.priceJpy * producto.quantity,
                      )}
                    </strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {productos.length > 0 && (
          <footer className="carrito-panel__pie">
            <div className="carrito-panel__subtotal">
              <span>Subtotal</span>
              <strong>{formatoYenes.format(subtotal)}</strong>
            </div>

            <p className="carrito-panel__nota">
              Revisa la conversión, comisión y envío al finalizar.
            </p>

            <button
              type="button"
              className="carrito-panel__boton"
              onClick={continuar}
            >
              Continuar compra →
            </button>
          </footer>
        )}
      </div>
    </dialog>
  );
}
