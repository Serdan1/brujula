import { useState } from 'react';
import { registrarAccion } from '../datos';

export default function FormularioAccion({ alerta, onClose, onGuardado }: { alerta: any; onClose: () => void; onGuardado: () => void }) {
  const [tipo, setTipo] = useState('tutoría');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const ok = await registrarAccion(alerta.id, tipo, descripcion, fecha);
    setGuardando(false);
    if (ok) onGuardado();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-[#0f3d4c]">Registrar acción</h2>
        <p className="text-sm text-gray-600 mb-4">
          {alerta.alumno?.nombre ? `${alerta.alumno.nombre} · ` : ''}{alerta.titulo}
        </p>
        <form onSubmit={guardar} className="flex flex-col gap-3">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border p-2 rounded">
            <option value="tutoría">Tutoría con el alumno</option>
            <option value="reunión_familia">Reunión con la familia</option>
            <option value="refuerzo">Material de refuerzo</option>
            <option value="seguimiento">Seguimiento en clase</option>
          </select>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="border p-2 rounded h-24" placeholder="Qué vas a hacer..." required />
          <label className="text-sm text-gray-600">
            Fecha de revisión
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="border p-2 rounded w-full mt-1" required />
          </label>
          <p className="text-xs text-gray-500">La decisión es tuya: Brújula solo propone. La acción queda registrada.</p>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 rounded">Cancelar</button>
            <button type="submit" disabled={guardando} className="px-4 py-2 bg-[#0f3d4c] text-white rounded disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
