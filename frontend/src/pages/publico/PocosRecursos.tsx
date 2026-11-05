import { TituloPagina } from './Marco';

const VENTAJAS = [
  { titulo: 'Datos que ya existen.', texto: 'Notas y asistencia bastan para empezar.' },
  { titulo: 'Sin instalar nada.', texto: 'Funciona en el navegador, también en el móvil.' },
  { titulo: 'Coste de infraestructura cero', texto: 'para empezar, con servicios en su capa gratuita.' },
  { titulo: 'Comprueba que es justa.', texto: 'Mide si el modelo acierta igual con chicas y chicos, con alumnado rural y urbano, y entre centros.' },
];

export default function PocosRecursos() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="Pensada para escuelas con pocos recursos"
        entradilla="Donde hay menos orientadores y más alumnos por profesor, detectar a tiempo quién se está quedando atrás es más difícil y más importante." />

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p>Brújula no pide sensores, plataformas caras ni personal técnico.</p>
          <p>También para centros con brechas de acceso: basta un navegador, en el ordenador o en el móvil.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {VENTAJAS.map((v) => (
            <li key={v.titulo} className="bg-white rounded-xl border border-[#CBD5D4] p-4">
              <strong className="block text-[#174A55]">{v.titulo}</strong>
              <span className="text-sm">{v.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
