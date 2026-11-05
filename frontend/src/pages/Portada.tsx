import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

// Portada pública: se muestra antes de iniciar sesión. No consulta datos; la tarjeta es un ejemplo fijo.
// El resto de apartados están en pages/publico/ y comparten cabecera y pie (Marco.tsx).

const APARTADOS = [
  { ruta: '/como-funciona', titulo: 'Cómo funciona', texto: 'Tres pasos, y decide el profesor.' },
  { ruta: '/el-modelo', titulo: 'El modelo, por dentro', texto: 'Qué estima, qué deja fuera y cómo acierta.' },
  { ruta: '/pocos-recursos', titulo: 'Pocos recursos', texto: 'Pensada para escuelas con menos medios.' },
  { ruta: '/como-llega', titulo: 'Cómo llega', texto: 'Gratis para quien más lo necesita.' },
];

export default function Portada() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const correo = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Si se llega desde "Entrar" o "Probar la demo", poner el foco en el correo
  useEffect(() => {
    if ((location.state as { entrar?: boolean } | null)?.entrar) correo.current?.focus();
  }, [location]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <section className="pt-10 pb-14 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#174A55] leading-tight">
            Que ningún alumno necesite apoyo sin que nadie lo vea venir.
          </h1>
          <p className="mt-5 text-lg max-w-xl">
            Brújula convierte los datos que la escuela ya tiene en avisos claros para el profesorado, con el motivo de
            cada aviso y espacio para decidir qué hacer.
          </p>

          {/* Ejemplo ilustrativo: datos inventados, sin conexión a la base de datos */}
          <div className="mt-8 max-w-md rounded-xl border border-[#E9B45C] bg-[#F9E9C9] p-4" aria-label="Ejemplo de aviso">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E9B45C] text-[#24343A]">Prioridad alta</span>
              <span className="text-xs text-[#78541B]">Podría necesitar apoyo</span>
            </div>
            <p className="font-semibold text-[#174A55]">Podría necesitar apoyo en Portugués</p>
            <p className="text-sm text-[#64777A]">Alumna de 10.º C · ejemplo ficticio</p>
            <p className="mt-2 text-sm">Por qué salta:</p>
            <ul className="text-sm list-disc pl-5">
              <li>Nota del primer periodo: <strong>9</strong></li>
              <li>Asistencia: <strong>68 %</strong></li>
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-3" aria-hidden="true">
              <span className="text-xs px-3 py-1 rounded-lg bg-[#174A55] text-white">Registrar acción</span>
              <span className="text-xs text-[#64777A]">Descartar con motivo</span>
            </div>
          </div>
        </div>

        <form
          id="entrar"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError('Correo o contraseña incorrectos.');
          }}
          className="bg-white p-6 rounded-xl border border-[#CBD5D4] flex flex-col gap-3"
        >
          <h2 className="text-lg font-semibold text-[#174A55]">Entrar en la demo</h2>
          <label className="text-sm font-medium flex flex-col gap-1">
            Correo
            <input ref={correo} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="border border-[#CBD5D4] rounded-lg p-2 font-normal focus:outline-2 focus:outline-[#174A55]" />
          </label>
          <label className="text-sm font-medium flex flex-col gap-1">
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="border border-[#CBD5D4] rounded-lg p-2 font-normal focus:outline-2 focus:outline-[#174A55]" />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="bg-[#174A55] text-white p-2 rounded-lg font-medium hover:opacity-90">Entrar</button>
          <p className="text-xs text-[#64777A]">
            Prueba con profesor.gp@example.com o director.gp@example.com. Todos los nombres de alumnos son ficticios.
          </p>
        </form>
      </section>

      <nav aria-label="Conoce Brújula" className="pb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {APARTADOS.map((a) => (
          <Link key={a.ruta} to={a.ruta}
            className="group bg-white rounded-xl border border-[#CBD5D4] p-4 hover:border-[#174A55]">
            <span className="font-semibold text-[#174A55] group-hover:underline underline-offset-4">{a.titulo} →</span>
            <span className="block mt-1 text-sm text-[#64777A]">{a.texto}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
