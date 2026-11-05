import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { supabase } from './supabase';
import Inicio from './pages/Inicio';
import Asignatura from './pages/Asignatura';
import Clase from './pages/Clase';
import AnalisisCompleto from './pages/AnalisisCompleto';
import Portada from './pages/Portada';
import Marco from './pages/publico/Marco';
import ComoFunciona from './pages/publico/ComoFunciona';
import ElModelo from './pages/publico/ElModelo';
import PocosRecursos from './pages/publico/PocosRecursos';
import ComoLlega from './pages/publico/ComoLlega';

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
            <Route path="/como-funciona" element={<ComoFunciona />} />
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
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/asignatura/:id" element={<Asignatura />} />
        <Route path="/asignatura/:asig/clase/:id" element={<Clase />} />
        <Route path="/asignatura/:asig/clase/:id/analisis" element={<AnalisisCompleto />} />
      </Routes>
    </BrowserRouter>
  );
}
