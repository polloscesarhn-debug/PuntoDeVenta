import React, { useState } from "react";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";

const EtiquetasView: React.FC = () => {
  // Cargar configuración desde Supabase al montar
  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("etiquetas_config")
        .select("*")
        .eq("nombre", "default")
        .single();
      if (data) {
        setComanda(data.etiqueta_comanda || "");
        setRecibo(data.etiqueta_recibo || "");
        setAncho(data.etiqueta_ancho?.toString() || "58");
        setAlto(data.etiqueta_alto?.toString() || "40");
        setFontSize(data.etiqueta_fontsize?.toString() || "14");
        setPadding(data.etiqueta_padding?.toString() || "8");
      }
    };
    fetchConfig();
  }, []);
  const [padding, setPadding] = useState(
    () => localStorage.getItem("etiqueta_padding") || "8"
  );
  const [clienteDemo, setClienteDemo] = useState("Cliente de ejemplo");
  // Productos de ejemplo para emular la impresión
  const [productosDemo, setProductosDemo] = useState([
    { id: "1", nombre: "Pollo Asado", precio: 120, cantidad: 1 },
    { id: "2", nombre: "Papas Fritas", precio: 45, cantidad: 2 },
  ]);
  const handleDemoChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setProductosDemo((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]:
          field === "cantidad" || field === "precio" ? Number(value) : value,
      };
      return copy;
    });
  };
  const handleAddDemo = () => {
    setProductosDemo((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        nombre: "Nuevo producto",
        precio: 0,
        cantidad: 1,
      },
    ]);
  };
  const handleRemoveDemo = (index: number) => {
    setProductosDemo((prev) => prev.filter((_, i) => i !== index));
  };
  const [comanda, setComanda] = useState(
    () => localStorage.getItem("etiqueta_comanda") || ""
  );
  const [recibo, setRecibo] = useState(
    () => localStorage.getItem("etiqueta_recibo") || ""
  );
  const [ancho, setAncho] = useState(
    () => localStorage.getItem("etiqueta_ancho") || "58"
  );
  const [alto, setAlto] = useState(
    () => localStorage.getItem("etiqueta_alto") || "40"
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("etiqueta_fontSize") || "14"
  );
  const handleVolver = () => {
    window.dispatchEvent(new CustomEvent("setViewAdmin"));
  };
  const handleSave = () => {
    localStorage.setItem("etiqueta_padding", padding);
    localStorage.setItem("etiqueta_comanda", comanda);
    localStorage.setItem("etiqueta_recibo", recibo);
    localStorage.setItem("etiqueta_ancho", ancho);
    localStorage.setItem("etiqueta_alto", alto);
    localStorage.setItem("etiqueta_fontSize", fontSize);
    // Guardar en Supabase
    supabase
      .from("etiquetas_config")
      .upsert({
        nombre: "default",
        etiqueta_comanda: comanda,
        etiqueta_recibo: recibo,
        etiqueta_ancho: Number(ancho),
        etiqueta_alto: Number(alto),
        etiqueta_fontsize: Number(fontSize),
        etiqueta_padding: Number(padding),
        actualizado: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (!error) {
          alert(
            "Configuración de etiquetas guardada correctamente en Supabase"
          );
        } else {
          alert("Error al guardar en Supabase: " + error.message);
        }
      });
  };

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 24,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px #0002",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
          Padding/Margen del texto (px):
        </label>
        <input
          type="number"
          min={0}
          max={32}
          value={padding}
          onChange={(e) => setPadding(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      </div>
      <button
        onClick={handleVolver}
        style={{
          marginBottom: 18,
          padding: "8px 18px",
          background: "#43a047",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        ← Volver
      </button>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Panel de Edición de Etiquetas
      </h2>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
          Nombre del cliente:
        </label>
        <input
          type="text"
          value={clienteDemo}
          onChange={(e) => setClienteDemo(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
          Texto Comanda:
        </label>
        <input
          type="text"
          value={comanda}
          onChange={(e) => setComanda(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
          Texto Recibo:
        </label>
        <input
          type="text"
          value={recibo}
          onChange={(e) => setRecibo(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Ancho etiqueta (mm):
          </label>
          <input
            type="number"
            min={30}
            max={80}
            value={ancho}
            onChange={(e) => setAncho(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Alto etiqueta (mm):
          </label>
          <input
            type="number"
            min={20}
            max={100}
            value={alto}
            onChange={(e) => setAlto(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>
            Tamaño de letra (px):
          </label>
          <input
            type="number"
            min={8}
            max={32}
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: 12,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 24,
        }}
      >
        Guardar configuración
      </button>
      <div
        style={{
          marginTop: 10,
          padding: 16,
          background: "#f5f5f5",
          borderRadius: 12,
          border: "1px solid #ddd",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: 10 }}>Vista previa</h3>
        <div style={{ marginBottom: 16 }}>
          <b>Productos tipo comida (emulación):</b>
          {productosDemo.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <input
                type="text"
                value={p.nombre}
                onChange={(e) => handleDemoChange(i, "nombre", e.target.value)}
                style={{
                  width: 120,
                  padding: 4,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="number"
                value={p.precio}
                min={0}
                onChange={(e) => handleDemoChange(i, "precio", e.target.value)}
                style={{
                  width: 60,
                  padding: 4,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="number"
                value={p.cantidad}
                min={1}
                onChange={(e) =>
                  handleDemoChange(i, "cantidad", e.target.value)
                }
                style={{
                  width: 40,
                  padding: 4,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={() => handleRemoveDemo(i)}
                style={{
                  background: "#c62828",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={handleAddDemo}
            style={{
              marginTop: 6,
              background: "#43a047",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
            }}
          >
            Agregar producto
          </button>
        </div>
        <div
          style={{
            width: `${ancho}mm`,
            height: `${alto}mm`,
            background: "#fff",
            border: "1px dashed #43a047",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${fontSize}px`,
            color: "#222",
            margin: "0 auto",
            padding: `${padding}px`,
          }}
        >
          <div style={{ fontWeight: 700 }}>{comanda || "Comanda"}</div>
          <div
            style={{
              fontWeight: 400,
              margin: "6px 0 10px 0",
              fontSize: fontSize,
            }}
          >
            {clienteDemo}
          </div>
          <ul
            style={{ listStyle: "none", padding: 0, margin: 0, width: "100%" }}
          >
            {productosDemo.map((p) => (
              <li
                key={p.id}
                style={{
                  fontSize: fontSize,
                  marginBottom: 8,
                  borderBottom: "1px dashed #eee",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span style={{ fontWeight: 700 }}>{p.nombre}</span>
                <span style={{ float: "right" }}>
                  L {p.precio.toFixed(2)} x{p.cantidad}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EtiquetasView;
