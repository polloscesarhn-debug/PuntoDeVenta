// Script de prueba (dry-run) para mostrar el objeto `registro` que se enviaría al insertar
// Usa la zona America/Tegucigalpa para formatear la fecha en 'YYYY-MM-DD HH:MM:SS'

function formatToHondurasLocal(date) {
  const d = date ? new Date(date) : new Date();
  const fmt = new Intl.DateTimeFormat('sv', {
    timeZone: 'America/Tegucigalpa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(d).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function buildRegistro({tipo, usuarioNombre, usuarioId, caja, fondoFijo=0, efectivo=0, tarjeta=0, transferencias=0, fondoFijoDia=0, efectivoDia=0, tarjetaDia=0, transferenciasDia=0, diferencia=0, observacion=''}){
  const fechaLocal = formatToHondurasLocal();
  return {
    tipo_registro: tipo,
    cajero: usuarioNombre || 'Prueba Cajero',
    cajero_id: usuarioId || 'PRUEBA_ID',
    caja: caja || 'PRUEBA_CAJA',
    fecha: fechaLocal,
    fondo_fijo_registrado: Number(fondoFijo),
    fondo_fijo: Number(fondoFijoDia),
    efectivo_registrado: Number(efectivo),
    efectivo_dia: Number(efectivoDia),
    monto_tarjeta_registrado: Number(tarjeta),
    monto_tarjeta_dia: Number(tarjetaDia),
    transferencias_registradas: Number(transferencias),
    transferencias_dia: Number(transferenciasDia),
    diferencia: Number(diferencia),
    observacion: observacion,
  };
}

// Simular una apertura a las 21:00 hora local (no cambiamos la hora del sistema; mostramos valores actuales)
const aperturaSim = buildRegistro({
  tipo: 'apertura',
  usuarioNombre: 'Carlos',
  usuarioId: 'C123',
  caja: 'Caja1',
  fondoFijo: 500,
  fondoFijoDia: 0,
  observacion: 'apertura',
});

const cierreSim = buildRegistro({
  tipo: 'cierre',
  usuarioNombre: 'Carlos',
  usuarioId: 'C123',
  caja: 'Caja1',
  fondoFijo: 500,
  efectivo: 1200,
  tarjeta: 300,
  transferencias: 50,
  fondoFijoDia: 500,
  efectivoDia: 1150,
  tarjetaDia: 280,
  transferenciasDia: 40,
  diferencia: (500 - 500) + (1200 - 1150) + (300 - 280) + (50 - 40),
  observacion: 'cuadrado',
});

console.log('=== PREVIEW: registro apertura (dry-run) ===');
console.log(JSON.stringify(aperturaSim, null, 2));
console.log('\n=== PREVIEW: registro cierre (dry-run) ===');
console.log(JSON.stringify(cierreSim, null, 2));

// Mostrar ejemplos de conversión ISO vs local para referencia
const now = new Date();
console.log('\n=== Ejemplos de fecha/hora ===');
console.log('Now toISOString():', now.toISOString());
console.log('Now formatted Honduras (YYYY-MM-DD HH:MM:SS):', formatToHondurasLocal(now));

// Mostrar conversión inversa: si tuvieras '2025-10-31 21:00:00' como string, podemos parsearla y obtener ISO
function parseLocalStringToISO(localStr){
  // localStr format: YYYY-MM-DD HH:MM:SS assumed in America/Tegucigalpa
  const [datePart, timePart] = localStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  // Create a Date using the zone offset by building an ISO-like string with offset -06:00
  const isoLike = `${year.toString().padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}-06:00`;
  const d = new Date(isoLike);
  return { iso: d.toISOString(), toLocale: d.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }) };
}

const exampleLocal = aperturaSim.fecha; // e.g. '2025-10-31 21:00:00'
console.log('\n=== Parse ejemplo local a ISO y vuelta ===');
console.log('Local string:', exampleLocal);
console.log('Parsed ->', parseLocalStringToISO(exampleLocal));

console.log('\n(Nota: Este script es solo un dry-run, no realiza inserciones en la DB)');
