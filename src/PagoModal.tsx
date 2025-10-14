import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura?: string;
  onPagoConfirmado?: () => void;
}

const tiposPago = [
  { label: 'Efectivo', value: 'Efectivo', color: '#43a047' },
  { label: 'Tarjeta', value: 'Tarjeta', color: '#1976d2' },
  { label: 'Transferencia', value: 'Transferencia', color: '#fbc02d' },
];

const PagoModal: React.FC<PagoModalProps> = ({ isOpen, onClose, factura, onPagoConfirmado }) => {
  const [tipo, setTipo] = useState('Efectivo');
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    const pago = {
      tipo,
      monto: parseFloat(monto),
      referencia: referencia || null,
      tarjeta: tarjeta || null,
      factura: factura || null,
    };
    const { error } = await supabase.from('pagos').insert([pago]);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setMonto('');
      setReferencia('');
      setTarjeta('');
      setTipo('Efectivo');
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (typeof onPagoConfirmado === 'function') {
          onPagoConfirmado();
        }
      }, 800);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 16, minWidth: 340, boxShadow: '0 4px 24px rgba(25,118,210,0.12)', maxWidth: 380 }}>
        <h2 style={{ textAlign: 'center', color: '#1976d2', fontWeight: 800, marginBottom: 18 }}>Registrar Pago</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'block' }}>Tipo de pago:</label>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
              {tiposPago.map(tp => (
                <button
                  key={tp.value}
                  type="button"
                  onClick={() => setTipo(tp.value)}
                  style={{
                    background: tipo === tp.value ? tp.color : '#eee',
                    color: tipo === tp.value ? '#fff' : '#333',
                    border: tipo === tp.value ? '2px solid ' + tp.color : '2px solid #ccc',
                    borderRadius: 10,
                    padding: '12px 22px',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: tipo === tp.value ? '0 2px 8px ' + tp.color + '44' : 'none',
                    transition: 'all 0.2s',
                  }}
                >{tp.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: 16 }}>Monto:</label>
            <input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16, marginTop: 6 }} />
          </div>
          {(tipo === 'Tarjeta' || tipo === 'Transferencia') && (
            <>
              <div>
                <label style={{ fontWeight: 700, fontSize: 16 }}>Referencia:</label>
                <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16, marginTop: 6 }} />
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 16 }}>Tarjeta:</label>
                <input type="text" value={tarjeta} onChange={e => setTarjeta(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16, marginTop: 6 }} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10 }}>
            <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #1976d222' }}>Confirmar Pago</button>
            <button type="button" onClick={onClose} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #d32f2f22' }}>Cancelar</button>
          </div>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8, textAlign: 'center' }}>¡Pago registrado!</div>}
      </div>
    </div>
  );
};

export default PagoModal;
