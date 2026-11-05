import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { supabase } from './supabase';
import Inicio from './pages/Inicio';
import Asignatura from './pages/Asignatura';
import Clase from './pages/Clase';
import AnalisisCompleto from './pages/AnalisisCompleto';
import MisAcciones from './pages/MisAcciones';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="p-8 bg-[#fdfbf7] min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-[#0f3d4c] mb-2">Brújula</h1>
        <p className="text-gray-600 mb-8">Alertas explicables para que la escuela aprenda de sus datos</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError('Correo o contraseña incorrectos.');
          }}
          className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4 w-80"
        >
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded" required />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" className="bg-[#0f3d4c] text-white p-2 rounded">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/asignatura/:id" element={<Asignatura />} />
        <Route path="/asignatura/:asig/clase/:id" element={<Clase />} />
        <Route path="/asignatura/:asig/clase/:id/analisis" element={<AnalisisCompleto />} />
        <Route path="/intervenciones" element={<MisAcciones />}/>
      </Routes>
    </BrowserRouter>
  );
}
