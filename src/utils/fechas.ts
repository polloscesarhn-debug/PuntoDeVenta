// Helper para obtener el inicio y fin del día en ISO (UTC) basados en la fecha local
export function getLocalDayRange(date?: Date) {
  const d = date ? new Date(date) : new Date();
  // inicio de día en hora local
  const startLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  // fin de día en hora local
  const endLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Formato local sin conversión a UTC: 'YYYY-MM-DD HH:MM:SS'
  const startLocalString = `${day} 00:00:00`;
  const endLocalString = `${day} 23:59:59`;

  return {
    // start/end usados por consultas en Supabase (cadena en zona local)
    start: startLocalString,
    end: endLocalString,
    // ISO por compatibilidad si se necesita
    startIso: startLocal.toISOString(),
    endIso: endLocal.toISOString(),
    day,
  };
}
