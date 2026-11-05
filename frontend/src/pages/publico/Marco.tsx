import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

// Marco de las páginas públicas (sin sesión): cabecera con el menú, cierre "Probar la demo" y pie.

const MENU = [
  { ruta: '/el-modelo', texto: 'El modelo' },
  { ruta: '/pocos-recursos', texto: 'Pocos recursos' },
  { ruta: '/como-llega', texto: 'Cómo llega' },
];

// Lleva a la portada y pone el foco en el formulario de acceso
export function BotonDemo({ claro = false, children = 'Probar la demo' }: { claro?: boolean; children?: string }) {
  return (
    <Link to="/" state={{ entrar: true }}
      className={`inline-block text-center font-medium rounded-lg px-5 py-2 hover:opacity-90 ${claro ? 'bg-white text-[#174A55]' : 'bg-[#174A55] text-white'}`}>
      {children}
    </Link>
  );
}

export default function Marco() {
  const { pathname } = useLocation();

  // Al cambiar de página, empezar desde arriba
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4ED] text-[#24343A] font-[Inter,system-ui,sans-serif] leading-normal">
      <header className="bg-white/70 border-b border-[#CBD5D4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          <Link to="/" className="text-base font-bold text-[#174A55]">Brújula</Link>
          <nav aria-label="Apartados" className="flex flex-wrap justify-center gap-x-8 gap-y-2 order-last sm:order-none w-full sm:w-auto">
            {MENU.map((m) => (
              <NavLink key={m.ruta} to={m.ruta}
                className={({ isActive }) => `underline-offset-4 hover:text-[#174A55] ${isActive ? 'text-[#174A55] font-semibold' : 'text-[#24343A]'}`}>
                {m.texto}
              </NavLink>
            ))}
          </nav>
          <Link to="/" state={{ entrar: true }}
            className="font-medium px-4 py-1 rounded-lg bg-[#174A55] text-white hover:opacity-90">
            Entrar
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <section className="bg-[#174A55] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-lg font-semibold">Míralo con datos de ejemplo, sin instalar nada.</p>
          <BotonDemo claro />
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

// Cabecera común de cada página interior
export function TituloPagina({ titulo, entradilla }: { titulo: string; entradilla: string }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-[#174A55]">{titulo}</h1>
      <p className="mt-3 text-lg">{entradilla}</p>
    </div>
  );
}
