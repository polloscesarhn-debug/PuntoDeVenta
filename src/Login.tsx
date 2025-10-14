import { useState } from 'react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [codigo, setCodigo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
  const res = await fetch('https://zyziaizfmfvtibhpqwda.supabase.co/rest/v1/usuarios?select=*', {
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5emlhaXpmbWZ2dGliaHBxd2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjU1MzcsImV4cCI6MjA3NTk0MTUzN30.cLiAwO8kw23reAYLXOQ4AO1xgrTDI_vhXkJCJHGWXLY',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5emlhaXpmbWZ2dGliaHBxd2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjU1MzcsImV4cCI6MjA3NTk0MTUzN30.cLiAwO8kw23reAYLXOQ4AO1xgrTDI_vhXkJCJHGWXLY',
        },
      });
      const users = await res.json();
      const user = users.find((u: any) => u.codigo === codigo && u.clave === clave);
      if (user) {
        setShowSplash(true);
        setTimeout(() => {
          onLogin(user);
          window.location.reload();
        }, 2000);
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative' }}>
      {showSplash ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'url(https://i.imgur.com/UiSIq00.jpeg) center/cover no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 24,
            padding: 48,
            boxShadow: '0 4px 24px #0002',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}>
            <img src="https://i.imgur.com/UiSIq00.jpeg" alt="Logo" style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 16, boxShadow: '0 2px 8px #1976d233' }} />
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2', marginBottom: 8 }}>Cargando...</div>
            <div style={{ width: 60, height: 60, border: '6px solid #1976d2', borderTop: '6px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              padding: 32,
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: 8, color: '#333' }}>Iniciar sesión</h2>
            <input
              type="text"
              placeholder="Código"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              required
              style={{
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: 16,
              }}
            />
            <input
              type="password"
              placeholder="Clave"
              value={clave}
              onChange={e => setClave(e.target.value)}
              required
              style={{
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: 8,
                background: '#1976d2',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
