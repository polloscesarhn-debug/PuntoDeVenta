import { useEffect, useState } from "react";
import PagoModal from "./PagoModal";
import RegistroCierreView from "./RegistroCierreView";
import { createClient } from "@supabase/supabase-js";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  tipo: "comida" | "bebida";
  tipo_impuesto?: string;
  imagen?: string;
}

interface Seleccion {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: "comida" | "bebida";
}

const supabase = createClient(
  "https://zyziaizfmfvtibhpqwda.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5emlhaXpmbWZ2dGliaHBxd2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjU1MzcsImV4cCI6MjA3NTk0MTUzN30.cLiAwO8kw23reAYLXOQ4AO1xgrTDI_vhXkJCJHGWXLY"
);

// Obtener usuario actual de localStorage
const usuarioActual = (() => {
  try {
    const stored = localStorage.getItem("usuario");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

export default function PuntoDeVentaView({
  setView,
}: {
  setView?: (
    view:
      | "home"
      | "puntoDeVenta"
      | "admin"
      | "usuarios"
      | "inventario"
      | "cai"
      | "resultados"
      | "gastos"
      | "facturasEmitidas"
      | "apertura"
      | "resultadosCaja"
      | "cajaOperada"
  ) => void;
}) {
  const [showCierre, setShowCierre] = useState(false);
  const [theme, setTheme] = useState<"lite" | "dark">(() => {
    try {
      const stored = localStorage.getItem("theme");
      return stored === "dark" ? "dark" : "lite";
    } catch {
      return "lite";
    }
  });
  const [facturaActual, setFacturaActual] = useState<string>("");
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("");
  const [caiInfo, setCaiInfo] = useState<{
    caja_asignada: string;
    nombre_cajero: string;
    cai: string;
  } | null>(null);
  const [online] = useState(navigator.onLine);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [seleccionados, setSeleccionados] = useState<Seleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"comida" | "bebida">("comida");

  // Obtener datos de CAI y factura actual
  useEffect(() => {
    async function fetchCaiYFactura() {
      if (!usuarioActual) return;
      const { data: caiData } = await supabase
        .from("cai_facturas")
        .select("*")
        .eq("cajero_id", usuarioActual.id)
        .single();
      if (caiData) {
        setCaiInfo({
          caja_asignada: caiData.caja_asignada,
          nombre_cajero: usuarioActual.nombre,
          cai: caiData.cai,
        });
        const rango_inicio = parseInt(caiData.rango_desde);
        const rango_fin = parseInt(caiData.rango_hasta);
        const caja = caiData.caja_asignada;
        const { data: facturasData } = await supabase
          .from("facturas")
          .select("factura")
          .eq("cajero", usuarioActual.nombre)
          .eq("caja", caja);
        let maxFactura = rango_inicio - 1;
        if (facturasData && facturasData.length > 0) {
          for (const f of facturasData) {
            const num = parseInt(f.factura);
            if (Number.isFinite(num) && num > maxFactura) {
              maxFactura = num;
            }
          }
          if (!Number.isFinite(maxFactura)) {
            setFacturaActual(rango_inicio.toString());
          } else if (maxFactura + 1 > rango_fin) {
            setFacturaActual("Límite alcanzado");
          } else {
            setFacturaActual((maxFactura + 1).toString());
          }
        } else {
          setFacturaActual(rango_inicio.toString());
        }
      } else {
        setFacturaActual("");
      }
    }
    fetchCaiYFactura();
  }, []);

  // Consultar cierre de la fecha actual y redirigir según diferencia/observacion
  useEffect(() => {
    async function consultarCierreYRedirigir() {
      if (!setView || !usuarioActual) return;
      // Consultar el cierre de hoy para este cajero y caja
      const hoy = new Date().toISOString().slice(0, 10);
      // Obtener caja asignada
      let cajaAsignada = caiInfo?.caja_asignada;
      if (!cajaAsignada) {
        // Si no está en caiInfo, buscar en cai_facturas
        const { data: caiData } = await supabase
          .from("cai_facturas")
          .select("caja_asignada")
          .eq("cajero_id", usuarioActual.id)
          .single();
        cajaAsignada = caiData?.caja_asignada || "";
      }
      if (!cajaAsignada) return;
      const { data: cierresHoy } = await supabase
        .from("cierres")
        .select("diferencia, observacion")
        .eq("tipo_registro", "cierre")
        .eq("cajero", usuarioActual?.nombre)
        .eq("caja", cajaAsignada)
        .gte("fecha", hoy + "T00:00:00")
        .lte("fecha", hoy + "T23:59:59");
      if (cierresHoy && cierresHoy.length > 0) {
        const cierre = cierresHoy[0];
        if (cierre.diferencia !== 0 && cierre.observacion === "sin aclarar") {
          setView("resultadosCaja");
        } else if (
          cierre.diferencia !== 0 &&
          cierre.observacion === "aclarado"
        ) {
          setView("cajaOperada");
        } else if (
          cierre.diferencia === 0 &&
          cierre.observacion === "cuadrado"
        ) {
          setView("cajaOperada");
        } else {
          setView("resultadosCaja");
        }
      }
    }
    consultarCierreYRedirigir();
    // Solo ejecutar al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los modales se deben renderizar dentro del return principal

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data, error } = await supabase.from("productos").select("*");
        if (error) throw error;
        setProductos(data);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar productos");
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  // Bloquear scroll global al montar
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Add product to selection
  const agregarProducto = (producto: Producto) => {
    setSeleccionados((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1, tipo: producto.tipo }];
    });
  };

  // Remove product from selection
  const eliminarProducto = (id: string) => {
    setSeleccionados((prev) => {
      const existe = prev.find((p) => p.id === id);
      if (existe && existe.cantidad > 1) {
        return prev.map((p) =>
          p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p
        );
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Clear all selected products
  const limpiarSeleccion = () => {
    setSeleccionados([]);
  };

  // Calculate total
  const total = seleccionados.reduce(
    (sum, p) => sum + p.precio * p.cantidad,
    0
  );

  // Filter products by type
  const productosFiltrados = productos.filter((p) => p.tipo === activeTab);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background:
          theme === "lite"
            ? "rgba(255,255,255,0.95)"
            : "linear-gradient(135deg, #232526 0%, #414345 100%)",
        color: theme === "lite" ? "#222" : "#f5f5f5",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        zIndex: 999,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Indicador de conexión */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 32,
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: online ? "#43a047" : "#d32f2f",
            border: "2px solid #fff",
            boxShadow: "0 0 4px #0002",
            display: "inline-block",
          }}
        />
        <span
          style={{
            color: online ? "#43a047" : "#d32f2f",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {online ? "Conectado" : "Sin conexión"}
        </span>
      </div>
      {/* Botón cerrar sesión, volver y interruptor de tema */}
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 32,
          display: "flex",
          gap: 12,
          alignItems: "center",
          zIndex: 10000,
        }}
      >
        {/* Interruptor de tema moderno */}
        <button
          onClick={() => {
            const next = theme === "lite" ? "dark" : "lite";
            setTheme(next);
            localStorage.setItem("theme", next);
          }}
          style={{
            background: theme === "dark" ? "#222" : "#eee",
            border: "2px solid #1976d2",
            borderRadius: 20,
            width: 54,
            height: 28,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.3s",
            marginRight: 8,
          }}
          title={theme === "lite" ? "Modo oscuro" : "Modo claro"}
        >
          <span
            style={{
              position: "absolute",
              left: theme === "lite" ? 4 : 26,
              top: 4,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: theme === "dark" ? "#1976d2" : "#fbc02d",
              boxShadow: "0 2px 6px #0002",
              transition: "left 0.3s, background 0.3s",
              display: "block",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              fontSize: 14,
              color: theme === "dark" ? "#fff" : "#222",
              fontWeight: 700,
              opacity: theme === "dark" ? 1 : 0.5,
            }}
          >
            🌙
          </span>
          <span
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              fontSize: 14,
              color: theme === "lite" ? "#fbc02d" : "#fff",
              fontWeight: 700,
              opacity: theme === "lite" ? 1 : 0.5,
            }}
          >
            ☀️
          </span>
        </button>
        {usuarioActual?.rol === "admin" && (
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 2px 8px #1976d222",
            }}
          >
            Volver
          </button>
        )}
        {/* Botón de cerrar sesión oculto */}
        <button style={{ display: "none" }}>Cerrar sesión</button>
        {/* Botón para registrar cierre de caja */}
        <button
          style={{
            background: "#fbc02d",
            color: "#333",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 2px 8px #fbc02d44",
          }}
          onClick={() => setShowCierre(true)}
        >
          Registrar cierre de caja
        </button>

        {showCierre && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.18)",
              zIndex: 99999,
            }}
          >
            <RegistroCierreView
              usuarioActual={usuarioActual}
              caja={caiInfo?.caja_asignada || ""}
              onCierreGuardado={async () => {
                if (!setView) return;
                // Consultar el cierre de hoy para este cajero y caja
                const hoy = new Date().toISOString().slice(0, 10);
                const { data: cierresHoy } = await supabase
                  .from("cierres")
                  .select("diferencia, observacion")
                  .eq("tipo_registro", "cierre")
                  .eq("cajero", usuarioActual?.nombre)
                  .eq("caja", caiInfo?.caja_asignada || "")
                  .gte("fecha", hoy + "T00:00:00")
                  .lte("fecha", hoy + "T23:59:59");
                if (cierresHoy && cierresHoy.length > 0) {
                  const cierre = cierresHoy[0];
                  if (
                    cierre.diferencia !== 0 &&
                    cierre.observacion === "sin aclarar"
                  ) {
                    setView("resultadosCaja");
                  } else if (
                    cierre.diferencia !== 0 &&
                    cierre.observacion === "aclarado"
                  ) {
                    setView("cajaOperada");
                  } else if (
                    cierre.diferencia === 0 &&
                    cierre.observacion === "cuadrado"
                  ) {
                    setView("cajaOperada");
                  } else {
                    setView("resultadosCaja");
                  }
                } else {
                  setView("resultadosCaja");
                }
              }}
            />
            <button
              style={{
                position: "absolute",
                top: 24,
                right: 32,
                background: "#d32f2f",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                zIndex: 100000,
              }}
              onClick={() => setShowCierre(false)}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Modal de pago (fuera del bloque del botón) */}
      <PagoModal
        isOpen={showPagoModal}
        onClose={() => {
          setShowPagoModal(false);
        }}
        factura={facturaActual}
        totalPedido={total}
        cliente={nombreCliente}
        factura_venta={facturaActual}
        onPagoConfirmado={() => {
          setShowPagoModal(false);
          setShowFacturaModal(true);
        }}
      />
      <h1
        style={{
          color: "#1976d2",
          marginBottom: 24,
          textAlign: "center",
          width: "100%",
          fontSize: "2.8rem",
          fontWeight: 800,
          letterSpacing: 2,
          background: "linear-gradient(90deg, #1976d2 60%, #388e3c 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          paddingTop: 32,
          paddingBottom: 8,
        }}
      >
        {caiInfo
          ? `${caiInfo.nombre_cajero} | Caja: ${caiInfo.caja_asignada}`
          : "Punto de Venta - Comedor"}
      </h1>
      {facturaActual && (
        <div
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: facturaActual === "Límite alcanzado" ? "#d32f2f" : "#388e3c",
            marginBottom: 12,
          }}
        >
          {facturaActual === "Límite alcanzado"
            ? "¡Límite de facturas alcanzado!"
            : `Factura actual: ${facturaActual}`}
        </div>
      )}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <div
        style={{
          display: "flex",
          gap: 24,
          width: "100%",
          height: "calc(100vh - 2px)",
          justifyContent: "center",
          alignItems: "stretch",
          marginBottom: "2px",
        }}
      >
        {/* Menu Section */}
        <div
          style={{
            flex: 2,
            minWidth: 0,
            background: theme === "lite" ? "#fff" : "#232526",
            borderRadius: 18,
            boxShadow:
              theme === "lite"
                ? "0 4px 16px rgba(0,0,0,0.12)"
                : "0 4px 16px #0008",
            padding: 8,
            transition: "background 0.3s",
          }}
        >
          {/* Tabs for Comida/Bebida */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 24,
              borderBottom: "2px solid #e0e0e0",
            }}
          >
            <button
              onClick={() => setActiveTab("comida")}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 18,
                fontWeight: activeTab === "comida" ? 700 : 400,
                color: activeTab === "comida" ? "#388e3c" : "#666",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "comida" ? "3px solid #388e3c" : "none",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            >
              Comidas
            </button>
            <button
              onClick={() => setActiveTab("bebida")}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 18,
                fontWeight: activeTab === "bebida" ? 700 : 400,
                color: activeTab === "bebida" ? "#1976d2" : "#666",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "bebida" ? "3px solid #1976d2" : "none",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            >
              Bebidas
            </button>
          </div>

          {/* Product Grid */}
          {loading ? (
            <p style={{ textAlign: "center" }}>Cargando...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 28,
                maxHeight: "60vh",
                overflowY: "auto",
                paddingRight: 8,
              }}
            >
              {productosFiltrados.map((p) => (
                <div
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  style={{
                    background: theme === "lite" ? "#fff" : "#333",
                    borderRadius: 18,
                    padding: 24,
                    boxShadow:
                      theme === "lite"
                        ? "0 4px 16px rgba(0,0,0,0.12)"
                        : "0 4px 16px #0008",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transition:
                      "transform 0.2s, background 0.3s', color 0.3s', box-shadow 0.3s', border 0.3s',",
                    minHeight: 260,
                    color: theme === "lite" ? "#222" : "#f5f5f5",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.07)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  {p.imagen && (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      style={{
                        width: 180,
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 16,
                        marginBottom: 18,
                        boxShadow: "0 4px 16px #1976d222",
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 22,
                      color: activeTab === "comida" ? "#388e3c" : "#1976d2",
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    {p.nombre}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: "#333",
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    L {p.precio.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        <div
          style={{
            flex: 1,
            minWidth: 300,
            background: theme === "lite" ? "#fffde7" : "#232526",
            borderRadius: 16,
            boxShadow:
              theme === "lite"
                ? "0 2px 12px rgba(0,0,0,0.1)"
                : "0 2px 12px #0008",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            color: theme === "lite" ? "#222" : "#f5f5f5",
            transition: "background 0.3s, color 0.3s",
          }}
        >
          <h2
            style={{ color: "#fbc02d", marginBottom: 16, textAlign: "center" }}
          >
            Pedido Actual
          </h2>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fbc02d",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            L {total.toFixed(2)}
          </div>
          {seleccionados.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center" }}>
              No hay productos seleccionados
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                flex: 1,
                overflowY: "auto",
                marginBottom: 16,
              }}
            >
              {seleccionados.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    background: theme === "lite" ? "#fff" : "#333",
                    borderRadius: 8,
                    padding: "8px 12px",
                    boxShadow:
                      theme === "lite"
                        ? "0 1px 4px rgba(0,0,0,0.05)"
                        : "0 1px 4px #0008",
                    color: theme === "lite" ? "#222" : "#f5f5f5",
                  }}
                >
                  <span
                    style={{
                      flex: 2,
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1976d2",
                    }}
                  >
                    {p.nombre}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "#333",
                      textAlign: "center",
                    }}
                  >
                    L {p.precio.toFixed(2)}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "#388e3c",
                      textAlign: "center",
                    }}
                  >
                    x{p.cantidad}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    L {(p.precio * p.cantidad).toFixed(2)}
                  </span>
                  <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                    <button
                      onClick={() =>
                        agregarProducto(
                          productos.find((prod) => prod.id === p.id)!
                        )
                      }
                      style={{
                        background: "#388e3c",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => eliminarProducto(p.id)}
                      style={{
                        background: "#d32f2f",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                    >
                      −
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={limpiarSeleccion}
              style={{
                background: theme === "lite" ? "#d32f2f" : "#b71c1c",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                opacity: seleccionados.length === 0 ? 0.5 : 1,
                transition: "background 0.3s",
              }}
              disabled={seleccionados.length === 0}
            >
              Limpiar
            </button>
            <button
              style={{
                background: theme === "lite" ? "#1976d2" : "#1565c0",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                opacity: seleccionados.length === 0 ? 0.5 : 1,
                transition: "background 0.3s",
              }}
              disabled={seleccionados.length === 0}
              onClick={() => setShowClienteModal(true)} // <-- CAMBIA ESTO
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Modal para nombre del cliente */}
      {showClienteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background:
              theme === "lite" ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: theme === "lite" ? "#fff" : "#232526",
              borderRadius: 16,
              boxShadow:
                theme === "lite"
                  ? "0 8px 32px rgba(25, 118, 210, 0.18)"
                  : "0 8px 32px #0008",
              padding: 32,
              minWidth: 350,
              maxWidth: 420,
              width: "100%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              color: theme === "lite" ? "#222" : "#f5f5f5",
              transition: "background 0.3s, color 0.3s",
            }}
          >
            <h3 style={{ color: "#1976d2", marginBottom: 12 }}>
              Nombre del Cliente
            </h3>
            <input
              type="text"
              placeholder="Ingrese el nombre del cliente"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value.toUpperCase())}
              style={{
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
                marginBottom: 18,
              }}
            />
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button
                onClick={() => {
                  if (nombreCliente.trim()) {
                    setShowClienteModal(false);
                    setShowPagoModal(true); // <-- CAMBIA ESTO
                  }
                }}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  borderRadius: 8,
                  border: "none",
                  padding: "10px 24px",
                  fontWeight: 600,
                  fontSize: 16,
                }}
                disabled={!nombreCliente.trim()}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para requerir factura */}
      {showFacturaModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(25, 118, 210, 0.18)",
              padding: 32,
              minWidth: 350,
              maxWidth: 420,
              width: "100%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <h3 style={{ color: "#1976d2", marginBottom: 12 }}>
              ¿Requiere factura?
            </h3>
            <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
              <button
                onClick={async () => {
                  setShowFacturaModal(false);
                  setTimeout(async () => {
                    // Comanda con nombre del cliente y mejor formato
                    const comandaHtml = `
                      <div style='font-family:monospace; width:58mm; margin:0; padding:0;'>
                        <div style='font-size:20px; font-weight:700; color:#388e3c; text-align:center; margin-bottom:6px;'>COMANDA COCINA</div>
                        <div style='font-size:16px; font-weight:600; color:#222; text-align:center; margin-bottom:10px;'>Cliente: <b>${nombreCliente}</b></div>
                        <ul style='list-style:none; padding:0; margin-bottom:0;'>
                          ${seleccionados
                            .filter((p) => p.tipo === "comida")
                            .map(
                              (p) =>
                                `<li style='font-size:17px; margin-bottom:8px; border-bottom:1px dashed #eee; text-align:left;'><span style='font-weight:700;'>${
                                  p.nombre
                                }</span> <span style='float:right;'>L ${p.precio.toFixed(
                                  2
                                )} x${p.cantidad}</span></li>`
                            )
                            .join("")}
                        </ul>
                      </div>
                    `;
                    // Comprobante con nombre, precio y cantidad
                    const comprobanteHtml = `
                      <div style='font-family:monospace; width:58mm; margin:0; padding:0;'>
                        <div style='font-size:20px; font-weight:700; color:#1976d2; text-align:center; margin-bottom:6px;'>COMPROBANTE CLIENTE</div>
                        <div style='font-size:16px; font-weight:600; color:#222; text-align:center; margin-bottom:10px;'>Cliente: <b>${nombreCliente}</b></div>
                        <ul style='list-style:none; padding:0; margin-bottom:0;'>
                          ${seleccionados
                            .map(
                              (p) =>
                                `<li style='font-size:17px; margin-bottom:8px; border-bottom:1px dashed #eee; text-align:left;'><span style='font-weight:700;'>${
                                  p.nombre
                                }</span> <span style='float:right;'>L ${p.precio.toFixed(
                                  2
                                )} x${p.cantidad}</span></li>`
                            )
                            .join("")}
                        </ul>
                        <div style='font-weight:700; font-size:18px; margin-top:12px; text-align:right;'>Total: L ${total.toFixed(
                          2
                        )}</div>
                      </div>
                    `;
                    // Imprimir comanda
                    const printWindow = window.open(
                      "",
                      "",
                      "height=600,width=400"
                    );
                    if (printWindow) {
                      printWindow.document.write(
                        `<html><head><title>Comanda Cocina</title></head><body>${comandaHtml}</body></html>`
                      );
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                      printWindow.close();
                    }
                    // Imprimir comprobante
                    const printWindow2 = window.open(
                      "",
                      "",
                      "height=600,width=400"
                    );
                    if (printWindow2) {
                      printWindow2.document.write(
                        `<html><head><title>Comprobante Cliente</title></head><body>${comprobanteHtml}</body></html>`
                      );
                      printWindow2.document.close();
                      printWindow2.focus();
                      printWindow2.print();
                      printWindow2.close();
                    }
                    // Guardar venta en la tabla 'facturas' con nuevos campos
                    try {
                      const subTotal = seleccionados.reduce((sum, p) => {
                        if (p.tipo === "comida") {
                          return sum + (p.precio / 1.15) * p.cantidad;
                        } else if (p.tipo === "bebida") {
                          return sum + (p.precio / 1.18) * p.cantidad;
                        } else {
                          return sum + p.precio * p.cantidad;
                        }
                      }, 0);
                      const isv15 = seleccionados
                        .filter((p) => p.tipo === "comida")
                        .reduce(
                          (sum, p) =>
                            sum + (p.precio - p.precio / 1.15) * p.cantidad,
                          0
                        );
                      const isv18 = seleccionados
                        .filter((p) => p.tipo === "bebida")
                        .reduce(
                          (sum, p) =>
                            sum + (p.precio - p.precio / 1.18) * p.cantidad,
                          0
                        );
                      if (facturaActual === "Límite alcanzado") {
                        alert(
                          "¡Se ha alcanzado el límite de facturas para este cajero!"
                        );
                        return;
                      }
                      const factura = facturaActual;
                      const venta = {
                        fecha_hora: new Date().toISOString(),
                        cajero: usuarioActual?.nombre || "",
                        caja: caiInfo?.caja_asignada || "",
                        cai: caiInfo && caiInfo.cai ? caiInfo.cai : "",
                        factura,
                        cliente: nombreCliente,
                        productos: JSON.stringify(
                          seleccionados.map((p) => ({
                            id: p.id,
                            nombre: p.nombre,
                            precio: p.precio,
                            cantidad: p.cantidad,
                            tipo: p.tipo,
                          }))
                        ),
                        sub_total: subTotal.toFixed(2),
                        isv_15: isv15.toFixed(2),
                        isv_18: isv18.toFixed(2),
                        total: seleccionados
                          .reduce((sum, p) => sum + p.precio * p.cantidad, 0)
                          .toFixed(2),
                      };
                      await supabase.from("facturas").insert([venta]);
                      // Actualizar el número de factura actual en la vista
                      if (facturaActual !== "Límite alcanzado") {
                        setFacturaActual(
                          (parseInt(facturaActual) + 1).toString()
                        );
                      }
                    } catch (err) {
                      console.error("Error al guardar la venta:", err);
                    }
                    // Limpiar selección después de imprimir
                    limpiarSeleccion();
                    setNombreCliente("");
                  }, 300);
                }}
                style={{
                  background: "#388e3c",
                  color: "#fff",
                  borderRadius: 8,
                  border: "none",
                  padding: "10px 32px",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Sí
              </button>
              <button
                onClick={async () => {
                  setShowFacturaModal(false);
                  setTimeout(async () => {
                    const comandaHtml = `
                      <div style='font-family:monospace; width:58mm; margin:0; padding:0;'>
                        <div style='font-size:20px; font-weight:700; color:#388e3c; text-align:center; margin-bottom:6px;'>COMANDA COCINA</div>
                        <div style='font-size:16px; font-weight:600; color:#222; text-align:center; margin-bottom:10px;'>Cliente: <b>${nombreCliente}</b></div>
                        <ul style='list-style:none; padding:0; margin-bottom:0;'>
                          ${seleccionados
                            .filter((p) => p.tipo === "comida")
                            .map(
                              (p) =>
                                `<li style='font-size:17px; margin-bottom:8px; border-bottom:1px dashed #eee; text-align:left;'><span style='font-weight:700;'>${
                                  p.nombre
                                }</span> <span style='float:right;'>L ${p.precio.toFixed(
                                  2
                                )} x${p.cantidad}</span></li>`
                            )
                            .join("")}
                        </ul>
                      </div>
                    `;
                    const comprobanteHtml = `
                      <div style='font-family:monospace; width:58mm; margin:0; padding:0;'>
                        <div style='font-size:20px; font-weight:700; color:#1976d2; text-align:center; margin-bottom:6px;'>COMPROBANTE CLIENTE</div>
                        <div style='font-size:16px; font-weight:600; color:#222; text-align:center; margin-bottom:10px;'>Cliente: <b>${nombreCliente}</b></div>
                        <ul style='list-style:none; padding:0; margin-bottom:0;'>
                          ${seleccionados
                            .map(
                              (p) =>
                                `<li style='font-size:17px; margin-bottom:8px; border-bottom:1px dashed #eee; text-align:left;'><span style='font-weight:700;'>${
                                  p.nombre
                                }</span> <span style='float:right;'>L ${p.precio.toFixed(
                                  2
                                )} x${p.cantidad}</span></li>`
                            )
                            .join("")}
                        </ul>
                        <div style='font-weight:700; font-size:18px; margin-top:12px; text-align:right;'>Total: L ${total.toFixed(
                          2
                        )}</div>
                      </div>
                    `;
                    const printWindow = window.open(
                      "",
                      "",
                      "height=600,width=400"
                    );
                    if (printWindow) {
                      printWindow.document.write(
                        `<html><head><title>Comanda Cocina</title></head><body>${comandaHtml}</body></html>`
                      );
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                      printWindow.close();
                    }
                    const printWindow2 = window.open(
                      "",
                      "",
                      "height=600,width=400"
                    );
                    if (printWindow2) {
                      printWindow2.document.write(
                        `<html><head><title>Comprobante Cliente</title></head><body>${comprobanteHtml}</body></html>`
                      );
                      printWindow2.document.close();
                      printWindow2.focus();
                      printWindow2.print();
                      printWindow2.close();
                    }
                    try {
                      // Cálculo correcto de sub_total, isv_15, isv_18 y total según tipo_impuesto de cada producto
                      let subTotal = 0;
                      let isv15 = 0;
                      let isv18 = 0;
                      for (const p of seleccionados) {
                        // Buscar el producto en la lista de productos para obtener tipo_impuesto
                        const prod = productos.find((prod) => prod.id === p.id);
                        const tipoImpuesto = prod?.tipo_impuesto || "venta";
                        if (tipoImpuesto === "venta") {
                          // ISV 15%
                          const base = p.precio / 1.15;
                          subTotal += base * p.cantidad;
                          isv15 += (p.precio - base) * p.cantidad;
                        } else if (tipoImpuesto === "alcohol") {
                          // ISV 18%
                          const base = p.precio / 1.18;
                          subTotal += base * p.cantidad;
                          isv18 += (p.precio - base) * p.cantidad;
                        } else {
                          // Sin impuesto
                          subTotal += p.precio * p.cantidad;
                        }
                      }
                      if (facturaActual === "Límite alcanzado") {
                        alert(
                          "¡Se ha alcanzado el límite de facturas para este cajero!"
                        );
                        return;
                      }
                      const factura = facturaActual;
                      const venta = {
                        fecha_hora: new Date().toISOString(),
                        cajero: usuarioActual?.nombre || "",
                        caja: caiInfo?.caja_asignada || "",
                        cai: caiInfo && caiInfo.cai ? caiInfo.cai : "",
                        factura,
                        cliente: nombreCliente,
                        productos: JSON.stringify(
                          seleccionados.map((p) => ({
                            id: p.id,
                            nombre: p.nombre,
                            precio: p.precio,
                            cantidad: p.cantidad,
                            tipo: p.tipo,
                          }))
                        ),
                        sub_total: subTotal.toFixed(2),
                        isv_15: isv15.toFixed(2),
                        isv_18: isv18.toFixed(2),
                        total: seleccionados
                          .reduce((sum, p) => sum + p.precio * p.cantidad, 0)
                          .toFixed(2),
                      };
                      await supabase.from("facturas").insert([venta]);
                      if (facturaActual !== "Límite alcanzado") {
                        setFacturaActual(
                          (parseInt(facturaActual) + 1).toString()
                        );
                      }
                    } catch (err) {
                      console.error("Error al guardar la venta:", err);
                    }
                    limpiarSeleccion();
                    setNombreCliente("");
                  }, 300);
                }}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  borderRadius: 8,
                  border: "none",
                  padding: "10px 32px",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
