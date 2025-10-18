// Wrapper robusto para QZ Tray 2.2.5
// Expone los métodos principales de la API QZ Tray y helpers para impresión y apertura de gaveta.
//
// Uso recomendado:
// import qz from './qz';
// await qz.websocket.connect();
// if (await qz.websocket.isActive()) {
//   const printers = await qz.printers.find();
//   const config = qz.configs.create('NOMBRE_IMPRESORA');
//   await qz.print(config, [{ type: 'html', format: 'plain', data: '<h1>Prueba</h1>' }]);
//   // Para abrir gaveta:
//   await qz.print(config, [{ type: 'raw', format: 'hex', data: '1B700019FA' }]);
// }
// await qz.websocket.disconnect();
//
// Notas:
// - Si usas HTTPS, QZ intentará wss (8181); si usas HTTP, ws (8182).
// - Si usas firmas digitales, configura qz.security.setSignaturePromise.
// - El wrapper expone helpers: printHTML, openCashDrawer, etc.
// Exponer métodos principales de QZ Tray 2.2.5
export async function getQZInstance(): Promise<any> {
  // @ts-ignore
  return (globalThis.qz) || (window as any).qz || null;
}

export const websocket = {
  async connect(opts?: any) {
    const qz = await getQZInstance();
    if (!qz) throw new Error('QZ Tray no está cargado');
    return qz.websocket.connect(opts);
  },
  async disconnect() {
    const qz = await getQZInstance();
    if (!qz) throw new Error('QZ Tray no está cargado');
    return qz.websocket.disconnect();
  },
  async isActive() {
    const qz = await getQZInstance();
    if (!qz) return false;
    return qz.websocket.isActive();
  },
  setErrorCallbacks(cb: Function | Function[]) {
    getQZInstance().then(qz => qz && qz.websocket.setErrorCallbacks(cb));
  },
  setClosedCallbacks(cb: Function | Function[]) {
    getQZInstance().then(qz => qz && qz.websocket.setClosedCallbacks(cb));
  },
};

export const printers = {
  async find(query?: string) {
    const qz = await getQZInstance();
    if (!qz) return [];
    return qz.printers.find(query);
  },
  async getDefault() {
    const qz = await getQZInstance();
    if (!qz) return null;
    return qz.printers.getDefault();
  },
  async details() {
    const qz = await getQZInstance();
    if (!qz) return [];
    return qz.printers.details();
  },
};

export const configs = {
  async create(printer?: string) {
    const qz = await getQZInstance();
    if (!qz) throw new Error('QZ Tray no está cargado');
    return qz.configs.create(printer);
  },
  setDefaults(opts: any) {
    getQZInstance().then(qz => qz && qz.configs.setDefaults(opts));
  },
};

export async function print(config: any, data: any) {
  const qz = await getQZInstance();
  if (!qz) throw new Error('QZ Tray no está cargado');
  return qz.print(config, data);
}

export const security = {
  setSignaturePromise(fn: () => Promise<string>) {
    getQZInstance().then(qz => qz && qz.security.setSignaturePromise(fn));
  },
  setSignatureAlgorithm(alg: string) {
    getQZInstance().then(qz => qz && qz.security.setSignatureAlgorithm(alg));
  },
  getSignatureAlgorithm() {
    return getQZInstance().then(qz => qz && qz.security.getSignatureAlgorithm());
  },
};

export const api = {
  showDebug(show: boolean) {
    getQZInstance().then(qz => qz && qz.api.showDebug(show));
  },
  getVersion() {
    return getQZInstance().then(qz => qz && qz.api.getVersion());
  },
  isVersion(major: number, minor?: number, patch?: number) {
    return getQZInstance().then(qz => qz && qz.api.isVersion(major, minor, patch));
  },
};


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

  // Intentar cargar la versión local `src/qz-tray.js` primero (archivo subido por el usuario)
  try {
  // @ts-ignore - el archivo local `qz-tray` no tiene declaración de tipos
  const local = await import('./qz-tray');
    // El script globaliza `qz` normalmente, pero algunos bundlers exportan también
    if (local && (local.default || local.qz)) {
      return (local.default || local.qz) as QZ;
    }
    // Si el módulo no exporta, verificar globalThis.qz de nuevo
    if ((globalThis as any).qz) return (globalThis as any).qz;
  } catch (err) {
    log('No se pudo importar ./qz-tray.js localmente:', err);
  }

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
  websocket,
  printers,
  configs,
  print,
  security,
  api,
  getQZInstance,
};
