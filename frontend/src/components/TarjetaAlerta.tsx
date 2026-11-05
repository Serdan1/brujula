import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SINTETICAS, descartarAlerta, marcarRevisada, motivoCorto, motivosDe, nombreClase, textoSobre10 } from '../datos';
import { useIdioma } from '../i18n';
import FormularioAccion from './FormularioAccion';

type Props = {
  alerta: any;
  mostrarContexto?: boolean; // alumno y clase (en Asignatura e Inicio)
  conAcciones?: boolean;
  compacta?: boolean;
  onCambio?: () => void;
};

export default function TarjetaAlerta({ alerta, mostrarContexto = true, conAcciones = true, compacta = false, onCambio }: Props) {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const alta = alerta.severidad === 'alta';
  const motivos = alerta.nivel === 'alumno' ? motivosDe(alerta) : [];
  const contexto = [alerta.alumno?.nombre, nombreClase(alerta.clase)].filter(Boolean).join(' · ');

  async function revisar() {
    if (await marcarRevisada(alerta.id)) onCambio?.();
  }

  async function descartar() {
    const motivo = window.prompt(t.tarjeta.preguntaDescarte);
    if (!motivo || !motivo.trim()) return;
    if (await descartarAlerta(alerta.id, motivo.trim())) onCambio?.();
  }

  return (
    
<div
  className={`rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
    alta
      ? 'border-amber-200 border-l-4 border-l-[#E9B45C]'
      : 'border-gray-200 border-l-4 border-l-[#174A55]'
  } ${compacta ? 'p-4 sm:p-5' : 'p-5'}`}
>

      <div className="flex flex-wrap items-center gap-2 mb-1">
        
<span
  className={`rounded-full px-3 py-1 text-xs font-semibold ${
    alta
      ? 'bg-amber-100 text-amber-800'
      : 'bg-[#EAF2F0] text-[#174A55]'
  }`}
>

          {alta ? t.app.prioridadAlta : t.app.prioridadMedia}
        </span>
        <span className="text-xs text-gray-500">{motivoCorto(alerta.motivo)}</span>
        {alerta.estado === 'revisada' && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{t.tarjeta.revisada}</span>
        )}
      </div>

      
<h3 className="font-semibold text-[#0f3d4c]">
  {alerta.titulo}
</h3>

{mostrarContexto && contexto && alerta.nivel === 'alumno' && (
  <p className="text-sm text-gray-600">
    {contexto}
    {conAcciones && alerta.clase_id && alerta.alumno_id && (
      <Link
        to={`/asignatura/${alerta.asignatura_id}/clase/${alerta.clase_id}?alumno=${alerta.alumno_id}`}
        className="ml-2 text-[#174A55] underline hover:no-underline"
      >
        {t.tarjeta.verEnClase}
      </Link>
    )}
  </p>
)}

      {motivos.length > 0 ? (
        <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
          {motivos.map((m) => (
            <li key={m.variable}>
              {m.nombre}{SINTETICAS.has(m.variable) ? '*' : ''}: <strong>{m.valor}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-gray-700">{textoSobre10(alerta.descripcion)}</p>
      )}

      {conAcciones && alerta.nivel === 'alumno' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {alerta.estado === 'nueva' && (
            <button onClick={revisar} className="text-xs px-3 py-1 rounded border border-[#0f3d4c] text-[#0f3d4c] hover:bg-gray-50">
              {t.tarjeta.loReviso}
            </button>
          )}
          <button onClick={() => setAbierto(true)} className="text-xs px-3 py-1 rounded bg-[#0f3d4c] text-white">
            {t.tarjeta.registrar}
          </button>
          <button onClick={descartar} className="text-xs px-3 py-1 rounded text-gray-600 hover:underline">
            {t.tarjeta.descartar}
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
