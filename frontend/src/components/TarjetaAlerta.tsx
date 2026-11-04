import { useState } from 'react';
import { MOTIVOS, SINTETICAS, descartarAlerta, marcarRevisada, motivosDe, nombreClase } from '../datos';
import FormularioAccion from './FormularioAccion';

type Props = {
  alerta: any;
  mostrarContexto?: boolean; // alumno y clase (en Asignatura e Inicio)
  conAcciones?: boolean;
  compacta?: boolean;
  onCambio?: () => void;
};

export default function TarjetaAlerta({ alerta, mostrarContexto = true, conAcciones = true, compacta = false, onCambio }: Props) {
  const [abierto, setAbierto] = useState(false);
  const alta = alerta.severidad === 'alta';
  const motivos = alerta.nivel === 'alumno' ? motivosDe(alerta) : [];
  const contexto = [alerta.alumno?.nombre, nombreClase(alerta.clase)].filter(Boolean).join(' · ');

  async function revisar() {
    if (await marcarRevisada(alerta.id)) onCambio?.();
  }

  async function descartar() {
    const motivo = window.prompt('¿Por qué descartas esta alerta? (queda registrado)');
    if (!motivo || !motivo.trim()) return;
    if (await descartarAlerta(alerta.id, motivo.trim())) onCambio?.();
  }

  return (
    <div className={`rounded-lg border p-4 ${alta ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'} ${compacta ? 'p-3' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${alta ? 'bg-amber-400 text-[#0f3d4c]' : 'bg-gray-100 text-gray-700'}`}>
          {alta ? 'Prioridad alta' : 'Prioridad media'}
        </span>
        <span className="text-xs text-gray-500">{MOTIVOS[alerta.motivo]?.corto ?? alerta.motivo}</span>
        {alerta.estado === 'revisada' && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Revisada</span>
        )}
      </div>

      <h3 className="font-semibold text-[#0f3d4c]">{alerta.titulo}</h3>
      {mostrarContexto && contexto && <p className="text-sm text-gray-600">{contexto}</p>}

      {motivos.length > 0 ? (
        <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
          {motivos.map((m) => (
            <li key={m.variable}>
              {m.nombre}{SINTETICAS.has(m.variable) ? '*' : ''}: <strong>{m.valor}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-gray-700">{alerta.descripcion}</p>
      )}

      {conAcciones && alerta.nivel === 'alumno' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {alerta.estado === 'nueva' && (
            <button onClick={revisar} className="text-xs px-3 py-1 rounded border border-[#0f3d4c] text-[#0f3d4c] hover:bg-gray-50">
              Lo reviso
            </button>
          )}
          <button onClick={() => setAbierto(true)} className="text-xs px-3 py-1 rounded bg-[#0f3d4c] text-white">
            Registrar acción
          </button>
          <button onClick={descartar} className="text-xs px-3 py-1 rounded text-gray-600 hover:underline">
            Descartar con motivo
          </button>
        </div>
      )}

      {abierto && (
        <FormularioAccion
          alerta={alerta}
          onClose={() => setAbierto(false)}
          onGuardado={() => {
            setAbierto(false);
            onCambio?.();
          }}
        />
      )}
    </div>
  );
}
