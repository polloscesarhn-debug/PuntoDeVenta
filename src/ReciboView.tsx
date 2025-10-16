import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const ReciboView: React.FC = () => {
  // ...existing code...
  const [recibo, setRecibo] = useState("");
  const [ancho, setAncho] = useState("58");
  const [alto, setAlto] = useState("40");
  const [fontSize, setFontSize] = useState("14");
  const [padding, setPadding] = useState("8");
  const [clienteDemo, setClienteDemo] = useState("Cliente de ejemplo");
  const [productosDemo, setProductosDemo] = useState([
    { id: "1", nombre: "Pollo Asado", precio: 120, cantidad: 1 },
    { id: "2", nombre: "Papas Fritas", precio: 45, cantidad: 2 },
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("recibo_config")
        .select("*")
        .eq("nombre", "default")
        .single();
      if (data) {
        setRecibo(data.recibo_texto || "");
        setAncho(data.recibo_ancho?.toString() || "58");
        setAlto(data.recibo_alto?.toString() || "40");
        setFontSize(data.recibo_fontsize?.toString() || "14");
        setPadding(data.recibo_padding?.toString() || "8");
      }
    };
    fetchConfig();
  }, []);

  const handleSave = () => {
    supabase
      .from("recibo_config")
      .upsert({
        nombre: "default",
        recibo_texto: recibo,
        recibo_ancho: Number(ancho),
        recibo_alto: Number(alto),
        recibo_fontsize: Number(fontSize),
        recibo_padding: Number(padding),
        actualizado: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (!error) {
          alert("Configuración de recibo guardada correctamente en Supabase");
        } else {
          alert("Error al guardar en Supabase: " + error.message);
        }
      });
  };

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

  // Calcular total sin impuestos
  const total = productosDemo.reduce(
    (acc, p) => acc + p.precio * p.cantidad,
    0
  );
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
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Panel de Edición de Recibo
      </h2>
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
        <h3 style={{ textAlign: "center", marginBottom: 10 }}>
          Vista previa recibo
        </h3>
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
            border: "1px dashed #1976d2",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            fontSize: `${fontSize}px`,
            color: "#222",
            margin: "0 auto",
            padding: `${padding}px`,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: fontSize + 2 }}>
            {recibo || "Recibo"}
          </div>
          <div
            style={{
              fontWeight: 400,
              margin: "6px 0 10px 0",
              fontSize: fontSize,
            }}
          >
            {clienteDemo}
          </div>
          <table style={{ width: "100%", marginBottom: 10 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: Number(fontSize) - 2,
                  }}
                >
                  Producto
                </th>
                <th
                  style={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: Number(fontSize) - 2,
                  }}
                >
                  Cant
                </th>
                <th
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: Number(fontSize) - 2,
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {productosDemo.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                  <td style={{ textAlign: "center" }}>{p.cantidad}</td>
                  <td style={{ textAlign: "right" }}>
                    L {(p.precio * p.cantidad).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              width: "100%",
              borderTop: "1px dashed #ccc",
              paddingTop: 8,
              fontWeight: 700,
              fontSize: fontSize + 2,
              textAlign: "right",
            }}
          >
            Total: L {total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReciboView;
