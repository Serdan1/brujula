import { Database, PiggyBank, Scale, Smartphone } from 'lucide-react';
import { TituloPagina } from './Marco';

const VENTAJAS = [
  { icono: Database, titulo: 'Datos que ya existen.', texto: 'Notas y asistencia bastan para empezar.' },
  { icono: Smartphone, titulo: 'Sin instalar nada.', texto: 'Funciona en el navegador, también en el móvil.' },
  { icono: PiggyBank, titulo: 'Coste de infraestructura cero', texto: 'para empezar, con servicios en su capa gratuita.' },
  { icono: Scale, titulo: 'Comprueba que es justa.', texto: 'Mide si el modelo acierta igual con chicas y chicos, con alumnado rural y urbano, y entre centros.' },
];

// Dibujo de un móvil con un aviso de ejemplo (datos inventados)
function MovilEjemplo() {
  return (
    <div aria-hidden="true" className="mx-auto w-56 rounded-[2rem] border-[6px] border-[#174A55] bg-[#F7F4ED] p-3 pt-5 shadow-sm">
      <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#174A55]/30" />
      <p className="text-xs font-bold text-[#174A55]">Brújula</p>
      <p className="mt-2 text-[11px] text-[#64777A]">Portugués · 10.º C</p>
      <div className="mt-2 rounded-lg border border-[#E9B45C] bg-[#F9E9C9] p-2">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E9B45C] text-[#24343A]">Prioridad alta</span>
        <p className="mt-1 text-xs font-semibold text-[#174A55]">Podría necesitar apoyo</p>
        <p className="text-[11px]">Asistencia: <strong>68 %</strong></p>
      </div>
      <div className="mt-2 rounded-lg border border-[#CBD5D4] bg-white p-2">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EDEFEC] text-[#24343A]">Prioridad media</span>
        <p className="mt-1 text-xs font-semibold text-[#174A55]">Baja la participación</p>
        <p className="text-[11px]">Grupo de 10.º C</p>
      </div>
      <div className="mt-3 h-8 rounded-lg bg-[#174A55]/10" />
    </div>
  );
}

export default function PocosRecursos() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="Pensada para escuelas con pocos recursos"
        entradilla="Donde hay menos orientadores y más alumnos por profesor, detectar a tiempo quién se está quedando atrás es más difícil y más importante." />

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex flex-col gap-3">
            <p>Brújula no pide sensores, plataformas caras ni personal técnico.</p>
            <p>También para centros con brechas de acceso: basta un navegador, en el ordenador o en el móvil.</p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {VENTAJAS.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="bg-white rounded-xl border border-[#CBD5D4] p-4 flex gap-3">
                <span className="shrink-0 w-10 h-10 rounded-full bg-[#174A55]/10 flex items-center justify-center">
                  <Icono aria-hidden="true" className="w-5 h-5 text-[#174A55]" />
                </span>
                <span>
                  <strong className="block text-[#174A55]">{titulo}</strong>
                  <span className="text-sm">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <MovilEjemplo />
      </div>
    </div>
  );
}
