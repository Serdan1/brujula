import { useState } from 'react';
import { supabase } from '../supabase';

// Portada pública: se muestra antes de iniciar sesión. No consulta datos; la tarjeta es un ejemplo fijo.

const PASOS = [
  { titulo: 'La escuela ya tiene los datos', texto: 'Notas, asistencia, prácticas y participación. Nada que no se recoja ya en cualquier centro.' },
  { titulo: 'Brújula avisa y explica', texto: 'Detecta a tiempo qué alumnos y grupos podrían necesitar apoyo, y dice qué datos lo indican.' },
  { titulo: 'El profesor decide', texto: 'Revisa, registra qué va a hacer o descarta el aviso con un motivo. Brújula nunca decide por él.' },
];

const VENTAJAS = [
  { titulo: 'Datos que ya existen.', texto: 'Notas y asistencia bastan para empezar.' },
  { titulo: 'Sin instalar nada.', texto: 'Funciona en el navegador.' },
  { titulo: 'Coste de infraestructura cero', texto: 'para empezar, con servicios en su capa gratuita.' },
  { titulo: 'Comprueba que es justa.', texto: 'Mide si el modelo acierta igual con chicas y chicos, con alumnado rural y urbano, y entre centros.' },
];

const LIMITES = [
  { titulo: 'Sin decisiones automáticas', texto: 'Cada aviso termina en una decisión humana, y queda registrado quién la tomó.' },
  { titulo: 'Sin rankings', texto: 'No hay listas de mejores y peores alumnos ni porcentajes de riesgo por alumno.' },
  { titulo: 'Solo lo necesario', texto: 'No se guardan datos familiares, económicos ni de hábitos personales.' },
  { titulo: 'Cada uno ve lo suyo', texto: 'Un profesor solo ve sus clases y sus asignaturas. La dirección, su centro.' },
];

export default function Portada() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#24343A] font-[Inter,system-ui,sans-serif] leading-normal">
      <header className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <span className="text-lg font-bold text-[#174A55]">Brújula</span>
        <a href="#entrar" className="text-sm font-medium text-[#174A55] underline underline-offset-4">Entrar</a>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-start">
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
          className="bg-white p-6 rounded-xl border border-[#CBD5D4] flex flex-col gap-3 scroll-mt-6"
        >
          <h2 className="text-lg font-semibold text-[#174A55]">Entrar en la demo</h2>
          <label className="text-sm font-medium flex flex-col gap-1">
            Correo
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required
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

      <section className="bg-white/50 border-y border-[#CBD5D4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl font-semibold text-[#174A55]">Cómo funciona</h2>
          <ol className="mt-6 grid gap-8 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo}>
                <span className="text-3xl font-bold text-[#174A55]">{i + 1}</span>
                <h3 className="mt-1 font-semibold">{p.titulo}</h3>
                <p className="mt-1 text-sm text-[#64777A]">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-[#174A55]">Pensada para escuelas con pocos recursos</h2>
          <p className="mt-4">
            Donde hay menos orientadores y más alumnos por profesor, detectar a tiempo quién se está quedando atrás es
            más difícil y más importante. Brújula no pide sensores, plataformas caras ni personal técnico.
          </p>
        </div>
        <ul className="flex flex-col gap-3 md:pt-1">
          {VENTAJAS.map((v) => (
            <li key={v.titulo}><strong className="text-[#174A55]">{v.titulo}</strong> {v.texto}</li>
          ))}
        </ul>

        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold text-[#174A55]">Lo que Brújula no hace</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {LIMITES.map((l) => (
              <li key={l.titulo} className="border-l-4 border-[#174A55] pl-4">
                <h3 className="font-semibold">{l.titulo}</h3>
                <p className="text-sm text-[#64777A]">{l.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-[#CBD5D4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-xs text-[#64777A] flex flex-col gap-1">
          <p>Proyecto para #hack4edu 2026, reto 13 de ProFuturo. Código abierto con licencia MIT.</p>
          <p>
            Datos: dataset Student Performance (P. Cortez y A. Silva, UCI, CC BY 4.0), ampliado con datos sintéticos.
            Los nombres de alumnos y profesores son ficticios.
          </p>
        </div>
      </footer>
    </div>
  );
}
