import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { supabase } from './supabase';
import Inicio from './pages/Inicio';
import Asignatura from './pages/Asignatura';
import Clase from './pages/Clase';
import AnalisisCompleto from './pages/AnalisisCompleto';
import Portada from './pages/Portada';

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Portada />;

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
