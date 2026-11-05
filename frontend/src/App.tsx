import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { supabase } from './supabase';
import InicioSegunRol from './pages/InicioSegunRol';
import Asignatura from './pages/Asignatura';
import Clase from './pages/Clase';
import AnalisisCompleto from './pages/AnalisisCompleto';
import Portada from './pages/Portada';
import Marco from './pages/publico/Marco';
import ElModelo from './pages/publico/ElModelo';
import PocosRecursos from './pages/publico/PocosRecursos';
import ComoLlega from './pages/publico/ComoLlega';
import ComoFuncionaPagina from './pages/ComoFuncionaPagina';
import Alumno from './pages/Alumno';
import MisAcciones from './pages/MisAcciones';
import { SelectorIdioma, useIdioma } from './i18n';

// Modo oscuro de la web con sesión (las páginas públicas mantienen su diseño).
// Se recuerda en este navegador; los colores están en index.css (html.dark).
function BotonTema() {
  const { t } = useIdioma();
  const [oscuro, setOscuro] = useState(() => {
    try { return localStorage.getItem('brujula-tema') === 'oscuro'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
    try { localStorage.setItem('brujula-tema', oscuro ? 'oscuro' : 'claro'); } catch { /* sin almacenamiento */ }
    return () => document.documentElement.classList.remove('dark');   // al cerrar sesión, vuelve el tema claro
  }, [oscuro]);

  return (
    <button
      type="button"
      onClick={() => setOscuro((v) => !v)}
      aria-label={oscuro ? t.app.modoClaroAria : t.app.modoOscuroAria}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
    >
      {oscuro ? t.app.modoClaro : t.app.modoOscuro}
    </button>
  );
}

// Esquina inferior derecha de la web con sesión: idioma y tema
function Ajustes() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <span className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-700 shadow-sm">
        <SelectorIdioma />
      </span>
      <BotonTema />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Sin sesión: portada y páginas públicas. Cualquier otra ruta lleva a la portada.
  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<Marco />}>
            <Route path="/el-modelo" element={<ElModelo />} />
            <Route path="/pocos-recursos" element={<PocosRecursos />} />
            <Route path="/como-llega" element={<ComoLlega />} />
            <Route path="*" element={<Portada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Ajustes />
      <Routes>
        <Route path="/" element={<InicioSegunRol />} />
        <Route path="/asignatura/:id" element={<Asignatura />} />
        <Route path="/asignatura/:asig/clase/:id" element={<Clase />} />
        <Route path="/asignatura/:asig/clase/:id/analisis" element={<AnalisisCompleto />} />
        <Route path="/asignatura/:asig/clase/:clase/alumno/:id" element={<Alumno />} />
        <Route path="/como-funciona" element={<ComoFuncionaPagina />} />
        <Route path="/intervenciones" element={<MisAcciones />} />
      </Routes>
    </BrowserRouter>
  );
}
