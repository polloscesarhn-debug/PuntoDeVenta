// Helper para obtener el inicio y fin del día en ISO (UTC) basados en la fecha local
export function getLocalDayRange(date?: Date) {
  const d = date ? new Date(date) : new Date();
  // inicio de día en hora local
  const startLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  // fin de día en hora local
  const endLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return {
    start: startLocal.toISOString(),
    end: endLocal.toISOString(),
    // día en formato YYYY-MM-DD (útil si se necesita)
    day: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`,
  };
}
