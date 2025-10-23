import { supabase } from '../supabaseClient';
import { getLocalDayRange } from './fechas';

export async function verificarAperturaHoy(cajero_id: string, caja: string): Promise<boolean> {
  const { start, end } = getLocalDayRange();
  const { data: aperturas } = await supabase
    .from('cierres')
    .select('*')
    .eq('tipo_registro', 'apertura')
    .eq('cajero_id', cajero_id)
    .eq('caja', caja)
    .gte('fecha', start)
    .lte('fecha', end);
  return !!(aperturas && aperturas.length > 0);
}
