// Pequeño wrapper para QZ Tray
// Funciones: configure, connect, disconnect, getPrinters, printHTML, printRaw, openCashDrawer
//
// Uso básico:
// import qz from './qz';
// qz.configure({ host: 'localhost', port: 8181, secure: false, defaultPrinter: 'EPSON' });
// await qz.connect();
// const printers = await qz.getPrinters();
// await qz.printHTML('<h1>Prueba</h1>');
// await qz.disconnect();
//
// Notas para pruebas locales:
// - Asegúrate de que QZ Tray está instalado y el servicio websocket activo.
// - Si usas el paquete npm `qz-tray`, ya está soportado por import dinámico.
// - Para deshabilitar wss y conectar en localhost, usar `secure: false`.

type QZ = any;

// Configuración local para controlar host/puerto/impresora por defecto
export interface QZConfigOptions {
  host?: string; // host del websocket (sin protocolo)
  port?: number; // puerto del websocket
  secure?: boolean; // usar wss en lugar de ws
  defaultPrinter?: string | null;
  debug?: boolean;
  websocketOptions?: any; // passthrough a qz.websocket.connect()
}

let qzInstance: QZ | null = null;
let connected = false;
let localConfig: QZConfigOptions = { secure: true, defaultPrinter: null, debug: false };

function log(...args: any[]) {
  if (localConfig.debug) console.debug('[qz]', ...args);
}

async function tryImportQz(): Promise<QZ | null> {
  // Primero intentar window.qz (cuando se carga desde CDN)
  // @ts-ignore
  if ((globalThis as any).qz) return (globalThis as any).qz;

  // Intentar import dinámico del paquete `qz-tray` si está instalado
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // usar import() dinámico para no romper entornos donde no exista
    const mod = await import('qz-tray');
    // El paquete puede exportar el objeto como default o named
    return (mod && (mod.default || mod.qz || mod)) as QZ;
  } catch (err) {
    log('No se pudo importar qz-tray dinámicamente:', err);
    return null;
  }
}

function getQZSync(): QZ | null {
  // @ts-ignore
  return (globalThis as any).qz || qzInstance || null;
}

/**
 * Configura opciones locales para las conexiones a QZ Tray.
 * Llamar antes de `connect()` para ajustar host/puerto/impresora por defecto.
 */
export function configure(opts: QZConfigOptions) {
  localConfig = { ...localConfig, ...opts };
}

/**
 * Conectar a QZ Tray. Si no hay `window.qz`, intenta importar `qz-tray`.
 */
export async function connect(): Promise<void> {
  let qz = getQZSync();
  if (!qz) {
    qz = await tryImportQz();
  }
  if (!qz) throw new Error('QZ Tray no está cargado');

  qzInstance = qz;

  // Opciones para websocket.connect: pasar websocketOptions si se proveyeron
  const wsOpts = localConfig.websocketOptions || (localConfig.host || localConfig.port || typeof localConfig.secure === 'boolean'
    ? { host: localConfig.host, port: localConfig.port, secure: localConfig.secure }
    : undefined);

  try {
    // Helper: intentar connect con timeout
    const connectWithTimeout = async (connectFn: () => Promise<any>, ms = 3000) => {
      return Promise.race([
        connectFn(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
      ]);
    };

    if (qz.websocket && typeof qz.websocket.connect === 'function') {
      // Si hay opciones explícitas, intentar primero con ellas
      if (wsOpts) {
        await connectWithTimeout(() => qz.websocket.connect(wsOpts));
      } else {
        try {
          // Intentar conexión por defecto
          await connectWithTimeout(() => qz.websocket.connect());
        } catch (err) {
          // Si falla, intentar puertos locales comunes donde QZ suele exponer websocket
          const localAttempts = [
            { host: localConfig.host || 'localhost', port: localConfig.port || 8181, secure: !!localConfig.secure },
            { host: localConfig.host || 'localhost', port: 8182, secure: !!localConfig.secure },
            // Forzar non-secure (ws) en caso que el certificado impida conexión
            { host: 'localhost', port: 8181, secure: false },
            { host: 'localhost', port: 8182, secure: false },
          ];
          let connectedLocal = false;
          for (const attempt of localAttempts) {
            try {
              log('Intentando conectar a QZ en', attempt);
              // @ts-ignore
              await connectWithTimeout(() => qz.websocket.connect(attempt), 2500);
              connectedLocal = true;
              break;
            } catch (e) {
              log('Intento fallido', attempt, e);
            }
          }
          if (!connectedLocal) throw new Error('No se pudo conectar a QZ Tray en puertos locales');
        }
      }
    } else if (typeof qz.connect === 'function') {
      // algunos wrappers exponen connect directamente
      await connectWithTimeout(() => qz.connect());
    } else {
      throw new Error('API de QZ Tray no expone método de conexión conocido');
    }
    connected = true;
    log('Conectado a QZ Tray');
  } catch (err) {
    connected = false;
    log('Error al conectar:', err);
    throw err;
  }
}

export async function disconnect(): Promise<void> {
  const qz = getQZSync();
  if (!qz) {
    connected = false;
    qzInstance = null;
    return;
  }
  try {
    if (qz.websocket && typeof qz.websocket.disconnect === 'function') {
      await qz.websocket.disconnect();
    } else if (typeof qz.disconnect === 'function') {
      await qz.disconnect();
    }
  } finally {
    connected = false;
    qzInstance = null;
    log('Desconectado de QZ Tray');
  }
}

export async function getPrinters(): Promise<string[]> {
  const qz = getQZSync();
  if (!qz || !qz.printers || typeof qz.printers.find !== 'function') return [];
  try {
    const printers = await qz.printers.find();
    return printers;
  } catch (err) {
    log('Error obteniendo impresoras:', err);
    return [];
  }
}

export async function printHTML(html: string, options?: { printer?: string }) {
  const qz = getQZSync();
  if (!qz) throw new Error('QZ Tray no está disponible');
  const printer = options?.printer ?? localConfig.defaultPrinter ?? null;
  const cfg = qz.configs.create(printer);
  const data = [{ type: 'html', format: 'plain', data: html }];
  return qz.print(cfg, data);
}

// Enviar datos raw (bytes) a la impresora. `bytes` es un Uint8Array o Array<number>
export async function printRaw(bytes: Uint8Array | number[], options?: { printer?: string }) {
  const qz = getQZSync();
  if (!qz) throw new Error('QZ Tray no está disponible');
  const printer = options?.printer ?? localConfig.defaultPrinter ?? null;
  const cfg = qz.configs.create(printer);
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  // Convertir a string binario de forma eficiente
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  const base64 = btoa(binary);
  const data = [{ type: 'raw', format: 'base64', data: base64 }];
  return qz.print(cfg, data);
}

// Enviar datos raw a partir de una cadena hex (ej: '1B700019FA')
export async function printRawHex(hex: string, options?: { printer?: string }) {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substr(i, 2), 16));
  }
  return printRaw(new Uint8Array(bytes), options);
}

// Comando ESC/POS para abrir gaveta. Este es un comando común: ESC p 0 25 250 -> 1B 70 00 19 FA
export async function openCashDrawer(options?: { printer?: string }) {
  return printRawHex('1B700019FA', options);
}

export function isAvailable(): boolean {
  return !!getQZSync();
}

export function isConnected(): boolean {
  return connected;
}

export async function status(): Promise<{ available: boolean; connected: boolean }> {
  const qz = getQZSync();
  const available = !!qz;
  if (!qz) return { available: false, connected: false };
  try {
    if (qz.websocket && typeof qz.websocket.isActive === 'function') {
      const active = await qz.websocket.isActive();
      if (active) return { available, connected: true };
      // si isActive() existe pero es false, intentar conectar a puertos locales rápidamente
      try {
        await connect();
        return { available: true, connected: true };
      } catch {
        return { available, connected: false };
      }
    }
    // Si no existe isActive, intentar conexión rápida
    try {
      await connect();
      // si connect tuvo éxito, desconectar para no alterar estado global
      await disconnect();
      return { available: true, connected: true };
    } catch {
      return { available, connected: false };
    }
  } catch (err) {
    return { available, connected };
  }
}

export default {
  configure,
  connect,
  disconnect,
  getPrinters,
  printHTML,
  printRaw,
  printRawHex,
  openCashDrawer,
  isAvailable,
  isConnected,
  status,
};
