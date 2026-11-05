import { useState } from 'react';
import { supabase } from '../supabase';

// Portada pública: se muestra antes de iniciar sesión. No consulta datos; la tarjeta es un ejemplo fijo.

// ---- Textos editables de "Cómo llega a las escuelas" ----
const LLEGADA_INTRO = 'Brújula es gratis para quien más lo necesita. Lo financian quienes gestionan muchos centros.';

const NIVELES = [
  { para: 'Centros públicos y en contextos vulnerables', condicion: 'Gratis', incluye: 'Todas las funciones para su centro.' },
  { para: 'Redes de centros y administraciones educativas', condicion: 'De pago', incluye: 'Varios centros a la vez, informes y soporte.' },
  { para: 'Fundaciones y ONG educativas', condicion: 'Implantación', incluye: 'Lo llevan a los centros que acompañan y ayudan a ponerlo en marcha.' },
];

const HOJA_DE_RUTA = ['Importar las notas desde Excel.', 'Versión en portugués e inglés.'];

// ---- Cifras de "El modelo, por dentro" ----
// Fuentes: docs/ficha-del-modelo.md (§4.1, §4.2, §6), ml/results/baselines.json (recall 0,835),
// combinaciones.json (precisión 0,699), red_neuronal.json (MAE 1,054; cobertura 0,804),
// equidad_combinado.json (recall 0,829–0,848; falsas alarmas rural 0,154 y urbana 0,084).
const CIFRAS = [
  { cifra: '8 de cada 10', texto: 'alumnos que acaban necesitando apoyo reciben un aviso al final del 1.º trimestre.' },
  { cifra: '7 de cada 10', texto: 'avisos son de alumnos que de verdad acaban necesitando apoyo.' },
  { cifra: '1 punto', texto: 'es lo que se desvía de media la nota estimada, sobre 20. El margen incluye la nota real 8 de cada 10 veces.' },
  { cifra: 'Igual de atento', texto: 'avisa de 8 de cada 10 alumnos que lo necesitan, sean chicas o chicos, de zona rural o urbana, y en los dos centros.' },
];

const EXCLUIDAS = [
  { titulo: 'Datos sensibles:', texto: 'consumo de alcohol, relaciones de pareja y situación familiar. Señalar a un alumno por ellos lo estigmatiza.' },
  { titulo: 'Datos socioeconómicos:', texto: 'estudios y trabajo de los padres. Repetirían desigualdades de origen.' },
  { titulo: 'Sexo, zona y centro:', texto: 'no entran en el modelo. Solo sirven para comprobar que trata igual a todos.' },
];

const SECCIONES = [
  { id: 'como-funciona', texto: 'Cómo funciona' },
  { id: 'el-modelo', texto: 'El modelo' },
  { id: 'pocos-recursos', texto: 'Pocos recursos' },
  { id: 'como-llega', texto: 'Cómo llega' },
];

// Desplazamiento suave hasta un apartado, salvo si el usuario prefiere reducir el movimiento
function irA(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const destino = document.getElementById(id);
  if (!destino) return;
  e.preventDefault();
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  destino.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

const PASOS = [
  { titulo: 'La escuela ya tiene los datos', texto: 'Notas, asistencia, prácticas y participación. Nada que no se recoja ya en cualquier centro.' },
  { titulo: 'Brújula avisa y explica', texto: 'Detecta a tiempo qué alumnos y grupos podrían necesitar apoyo, y dice qué datos lo indican.' },
  { titulo: 'El profesor decide', texto: 'Revisa, registra qué va a hacer o descarta el aviso con un motivo. Brújula nunca decide por él.' },
];

const VENTAJAS = [
  { titulo: 'Datos que ya existen.', texto: 'Notas y asistencia bastan para empezar.' },
  { titulo: 'Sin instalar nada.', texto: 'Funciona en el navegador, también en el móvil.' },
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
      <header className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
        <span className="text-lg font-bold text-[#174A55]">Brújula</span>
        <nav className="flex items-center gap-5 text-sm font-medium text-[#174A55]">
          {SECCIONES.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => irA(e, s.id)} className="hidden sm:inline hover:underline underline-offset-4">
              {s.texto}
            </a>
          ))}
          <a href="#entrar" onClick={(e) => irA(e, 'entrar')} className="underline underline-offset-4">Entrar</a>
        </nav>
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

      <section id="como-funciona" className="bg-white/50 border-y border-[#CBD5D4] scroll-mt-4">
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

      <section id="el-modelo" className="max-w-5xl mx-auto px-4 sm:px-6 py-14 scroll-mt-4">
        <h2 className="text-2xl font-semibold text-[#174A55]">El modelo, por dentro</h2>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div>
            <p>Al final del 1.º trimestre, Brújula estima para cada alumno y asignatura:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>si podría necesitar apoyo para aprobar, y por qué;</li>
              <li>su nota final, con un margen.</li>
            </ul>
            <p className="mt-3">
              Solo usa lo que ya se sabe en ese momento: notas, faltas, asistencia, prácticas, participación, tiempo de
              estudio y suspensos anteriores.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Lo que deja fuera</h3>
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {EXCLUIDAS.map((x) => (
                <li key={x.titulo}><strong className="text-[#174A55]">{x.titulo}</strong> {x.texto}</li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="mt-10 font-semibold">Cómo de bien acierta</h3>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CIFRAS.map((c) => (
            <li key={c.cifra} className="bg-white rounded-xl border border-[#CBD5D4] p-4">
              <p className="text-2xl font-bold text-[#174A55]">{c.cifra}</p>
              <p className="mt-1 text-sm">{c.texto}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm max-w-3xl">
          En zona rural salta más veces sin necesidad: a 15 de cada 100 alumnos que no lo necesitaban, frente a 8 en
          zona urbana. Por eso cada aviso lo revisa una persona.
        </p>
        <p className="mt-3 text-xs text-[#64777A] max-w-3xl">
          Cifras medidas con datos de dos institutos portugueses (curso 2005-06), ampliados con datos sintéticos. Antes
          de usarlo en una escuela, hay que volver a entrenarlo con sus propios datos.
        </p>
      </section>

      <section id="pocos-recursos" className="bg-white/50 border-y border-[#CBD5D4] scroll-mt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-[#174A55]">Pensada para escuelas con pocos recursos</h2>
            <p className="mt-4">
              Donde hay menos orientadores y más alumnos por profesor, detectar a tiempo quién se está quedando atrás es
              más difícil y más importante. Brújula no pide sensores, plataformas caras ni personal técnico.
            </p>
            <p className="mt-3">También para centros con brechas de acceso: basta un navegador, en el ordenador o en el móvil.</p>
          </div>
          <ul className="flex flex-col gap-3 md:pt-1">
            {VENTAJAS.map((v) => (
              <li key={v.titulo}><strong className="text-[#174A55]">{v.titulo}</strong> {v.texto}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div>
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

      <section id="como-llega" className="bg-[#174A55] text-white scroll-mt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl font-semibold">Cómo llega a las escuelas</h2>
          <p className="mt-3 max-w-2xl">{LLEGADA_INTRO}</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {NIVELES.map((n) => (
              <li key={n.para} className="rounded-xl border border-white/30 p-4">
                <p className="text-xs font-semibold inline-block px-2 py-0.5 rounded bg-white text-[#174A55]">{n.condicion}</p>
                <h3 className="mt-2 font-semibold">{n.para}</h3>
                <p className="mt-1 text-sm text-white/85">{n.incluye}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-6 md:grid-cols-2 md:items-end">
            <div>
              <h3 className="font-semibold">Próximos pasos</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-white/85">
                {HOJA_DE_RUTA.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </div>
            <a href="#entrar" onClick={(e) => irA(e, 'entrar')}
              className="block text-center bg-white text-[#174A55] font-medium rounded-lg p-2 hover:opacity-90">
              Probar la demo
            </a>
          </div>
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
