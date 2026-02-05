import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function Root() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  // comprobar ahora: expuesto a window via evento
  const checkNow = async (): Promise<string | null> => {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return null;
      const j = await res.json();
      const ver = String(j.version || j?.ver || j?.v || '');
      if (!ver) return null;
      if (!currentVersion) {
        // first load wasn't set; set current and do not prompt
        setCurrentVersion(ver);
        return null;
      }
      if (ver && ver !== currentVersion) {
        return ver;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (cancelled) return;
        const ver = String(j.version || j?.ver || j?.v || '');
        setCurrentVersion((prev) => prev || ver);
      } catch (e) {
        // ignore
      }
    };
    load();

    const interval = setInterval(async () => {
      try {
        const ver = await checkNow();
        if (ver) {
          // Auto-actualizar sin mostrar modal
          console.log('[AUTO-UPDATE] Nueva versión detectada:', ver, '- Actualizando automáticamente...');
          await autoUpdate();
        }
      } catch (e) {
        // ignore
      }
    }, 30 * 1000); // check every 30s

    // También verificar cuando el usuario regresa a la pestaña
    const handleFocus = async () => {
      try {
        const ver = await checkNow();
        if (ver) {
          console.log('[AUTO-UPDATE] Nueva versión detectada al regresar a la pestaña:', ver);
          await autoUpdate();
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentVersion]);

  // Listen for manual check events from the page
  useEffect(() => {
    const onCheck = async () => {
      const ver = await checkNow();
      if (ver) {
        // Auto-actualizar en verificación manual también
        console.log('[AUTO-UPDATE] Verificación manual - Nueva versión detectada:', ver);
        await autoUpdate();
        window.dispatchEvent(new CustomEvent('app:check-update-result', { detail: { updated: true } }));
      } else {
        window.dispatchEvent(new CustomEvent('app:check-update-result', { detail: { updated: false } }));
      }
    };
    window.addEventListener('app:check-update', onCheck as EventListener);
    return () => window.removeEventListener('app:check-update', onCheck as EventListener);
  }, [currentVersion]);

  const autoUpdate = async () => {
    // try to unregister service workers to ensure fresh files are loaded
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          try { await r.unregister(); } catch (e) { /* ignore */ }
        }
      }
    } catch (e) {
      // ignore
    }
    // Force a full navigation bypassing browser cache by adding a cache-buster query param.
    // This avoids cases where a simple F5 or reload returns a cached index.html.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('_cb', String(Date.now()));
      window.location.href = url.toString();
    } catch (e) {
      // fallback
      window.location.reload();
    }
  };

  return (
    <StrictMode>
      <App />
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(
  <Root />
)

// Auto-actualizar cuando el service worker detecte una nueva versión
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    try {
      const data = event.data;
      if (data && data.type === 'NEW_VERSION_AVAILABLE') {
        console.log('[AUTO-UPDATE] Service Worker detectó nueva versión - Actualizando automáticamente...');
        // Esperar un poco antes de recargar para dar tiempo a que se complete la carga
        setTimeout(async () => {
          try {
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              for (const r of regs) {
                try { await r.unregister(); } catch (e) { /* ignore */ }
              }
            }
          } catch (e) {
            // ignore
          }
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('_cb', String(Date.now()));
            window.location.href = url.toString();
          } catch (e) {
            window.location.reload();
          }
        }, 1000);
      }
    } catch (e) {
      // ignore
    }
  });
}
