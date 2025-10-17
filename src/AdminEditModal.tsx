import React from "react";

interface AdminEditModalProps {
  open: boolean;
  nombre: string;
  clave: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onChangeNombre: (nombre: string) => void;
  onChangeClave: (clave: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({
  open,
  nombre,
  clave,
  loading,
  error,
  onClose,
  onChangeNombre,
  onChangeClave,
  onSubmit,
}) => {
  if (!open) return null;
  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: "#222",
          borderRadius: 16,
          padding: 32,
          minWidth: 320,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 8px 32px #0008",
          position: "relative",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer",
          }}
          aria-label="Cerrar"
        >
          ×
        </button>
        <h3 style={{ color: "#ffffff", marginBottom: "1rem" }}>
          🔒 Editar Admin (solo nombre y contraseña)
        </h3>
        <form onSubmit={onSubmit} className="form-grid">
          <input
            className="form-input"
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => onChangeNombre(e.target.value)}
            required
            style={{ color: "#43a047", fontWeight: 700 }}
          />
          <input
            className="form-input"
            type="password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => onChangeClave(e.target.value)}
            required
            style={{ color: "#43a047", fontWeight: 700 }}
          />
          {error && (
            <div style={{ color: "#ff5252", marginBottom: 8 }}>{error}</div>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ gridColumn: "1/-1", justifySelf: "start" }}
          >
            {loading ? "⏳ Guardando..." : "💾 Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminEditModal;
