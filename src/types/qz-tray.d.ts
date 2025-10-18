// Declaración mínima para el paquete `qz-tray` cuando no hay tipos oficiales.
// Esto evita errores de compilación en TypeScript. Si quieres tipos más precisos,
// reemplaza con una declaración más detallada o instala `@types/qz-tray` si existe.

declare module 'qz-tray' {
  const qz: any;
  export default qz;
  export = qz;
}
