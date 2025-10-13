import { useState, useEffect } from 'react';
import Login from './Login';
import Landing from './Landing';
import AdminPanel from './AdminPanel';
import UsuariosView from './UsuariosView';
import InventarioView from './InventarioView';
import PuntoDeVentaView from './PuntoDeVentaView';
import CaiFacturasView from './CaiFacturasView';
import './App.css';


function App() {
  const [user, setUser] = useState<any>(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });
  const [showLanding, setShowLanding] = useState(false);
  const [view, setView] = useState<'home' | 'puntoDeVenta' | 'admin' | 'usuarios' | 'inventario' | 'cai' | 'resultados' | 'gastos'>('home');

  // Cuando el usuario inicia sesión, mostrar landing
  useEffect(() => {
    if (user) {
      setShowLanding(true);
    }
  }, [user]);

  // Cuando termina el landing, mostrar la vista según el rol
  const handleLandingFinish = () => {
    setShowLanding(false);
    if (user.rol === 'Admin') {
      setView('admin');
    } else if (user.rol === 'cajero') {
      setView('puntoDeVenta');
    } else {
      setView('home');
    }
  };

  // Guardar usuario en localStorage al iniciar sesión
  const handleLogin = (usuario: any) => {
    setUser(usuario);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  };

  // Limpiar usuario al cerrar sesión
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('usuario');
    setView('home');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (showLanding) {
    return <Landing onFinish={handleLandingFinish} user={user} />;
  }

  if (view === 'admin') {
    return (
      <>
        <AdminPanel onSelect={setView} user={user} />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </>
    );
  }

  if (view === 'usuarios') {
    return <UsuariosView onBack={() => setView('admin')} />;
  }
  if (view === 'inventario') {
    return <InventarioView onBack={() => setView('admin')} />;
  }
  if (view === 'cai') {
    return <CaiFacturasView onBack={() => setView('admin')} />;
  }
  if (view === 'resultados') {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <h2>Resultados de Venta</h2>
        <p>Aquí irá el resumen de resultados de venta.</p>
        <button onClick={() => setView('admin')}>Volver</button>
      </div>
    );
  }
  if (view === 'gastos') {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <h2>Gastos</h2>
        <p>Aquí irá la gestión de gastos.</p>
        <button onClick={() => setView('admin')}>Volver</button>
      </div>
    );
  }

  if (view === 'puntoDeVenta') {
    return <PuntoDeVentaView />;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h1>Bienvenido, {user.nombre}</h1>
      <p>Código: {user.codigo}</p>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}

export default App;
