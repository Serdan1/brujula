import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

type Asignatura = { id: string; nombre: string; };

// --- PANTALLA 3: CLASE (ALUMNOS Y ALERTAS) ---
function PantallaClase() {
  // 1. CORRECCIÓN: La ruta ahora recibe 'asig' (asignatura) e 'id' (clase)
  const { asig, id } = useParams(); 
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarAlumnos() {
      if (!id || !asig) return;
      
      // 2. CORRECCIÓN: Filtramos el rendimiento por la asignatura actual y el periodo 1
      const { data, error } = await supabase
        .from('alumno')
        .select(`
          id, 
          nombre,
          rendimiento ( nota_examen, nota_practicas, participacion, asistencia )
        `)
        .eq('clase_id', id)
        .eq('rendimiento.asignatura_id', asig)
        .eq('rendimiento.periodo', 1); // Según contrato, modelo y alertas usan datos del final del periodo 1

      if (error) console.error("Error al cargar alumnos:", error.message);
      else setAlumnos(data || []);
      
      setLoading(false);
    }
    cargarAlumnos();
  }, [id, asig]);

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen">
      <Link to={`/asignatura/${asig}`} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-6 inline-block">
        ← Volver a la Asignatura
      </Link>
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">Listado de Alumnos</h1>
      
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f3d4c] text-white text-sm">
              <th className="p-3 font-semibold">Alumno (Ficticio)</th>
              <th className="p-3 font-semibold">Examen</th>
              <th className="p-3 font-semibold">Prácticas</th>
              <th className="p-3 font-semibold">Participación</th>
              <th className="p-3 font-semibold">Asistencia</th>
              <th className="p-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Cargando alumnos...</td></tr>
            ) : alumnos.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No hay alumnos (Revisa el RLS).</td></tr>
            ) : (
              alumnos.map((alumno) => {
                const rend = (alumno.rendimiento && alumno.rendimiento.length > 0) ? alumno.rendimiento[0] : {};
                return (
                  <tr key={alumno.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-[#0f3d4c]">{alumno.nombre}</td>
                    <td className="p-3">{rend.nota_examen ?? '-'}</td>
                    <td className="p-3">{rend.nota_practicas ?? '-'}</td>
                    <td className="p-3">{rend.participacion ?? '-'}/10</td>
                    <td className="p-3">{rend.asistencia ? `${rend.asistencia}%` : '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded border border-amber-300">Lo reviso</button>
                      <button onClick={() => setAlumnoSeleccionado(alumno)} className="bg-[#0f3d4c] text-white text-xs px-2 py-1 rounded">Registrar acción</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL REGISTRAR ACCIÓN (Ya corregido con el profesor.id numérico) */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#0f3d4c] mb-4">Registrar acción para {alumnoSeleccionado.nombre}</h2>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setGuardando(true);
                
                const form = e.target as HTMLFormElement;
                const tipo = (form.elements.namedItem('tipo') as HTMLSelectElement).value;
                const descripcion = (form.elements.namedItem('descripcion') as HTMLTextAreaElement).value;
                const fecha_revision = (form.elements.namedItem('fecha') as HTMLInputElement).value;
                
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profData } = await supabase.from('profesor').select('id').eq('user_id', user?.id).single();
                
                const nuevaAccion = {
                  profesor_id: profData?.id, 
                  tipo, descripcion, fecha_revision,
                  fecha_inicio: new Date().toISOString().split('T')[0]
                };

                const { error } = await supabase.from('accion').insert(nuevaAccion);
                
                setGuardando(false);
                if (error) alert("Error al guardar: " + error.message);
                else { alert("Acción registrada correctamente."); setAlumnoSeleccionado(null); }
              }} 
              className="flex flex-col gap-4"
            >
              <select name="tipo" className="w-full border p-2 rounded">
                <option value="tutoría">Tutoría con el alumno</option>
                <option value="reunión_familia">Reunión con la familia</option>
                <option value="refuerzo">Material de refuerzo</option>
              </select>
              <textarea name="descripcion" className="w-full border p-2 rounded h-24" placeholder="Descripción..." required />
              <input name="fecha" type="date" className="w-full border p-2 rounded" required />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setAlumnoSeleccionado(null)} className="px-4 py-2 text-gray-600 rounded">Cancelar</button>
                <button type="submit" disabled={guardando} className="px-4 py-2 bg-[#0f3d4c] text-white rounded">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PANTALLA 2: ASIGNATURA (CLASES) ---
function PantallaAsignatura() {
  const { id } = useParams(); 
  const [clases, setClases] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatosAsignatura() {
      if (!id) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: prof } = await supabase.from('profesor').select('id').eq('user_id', user?.id).single();
      
      if (!prof) return;

      // 3. CORRECCIÓN: Añadido .eq('profesor_id', miId) a la tabla 'imparte'
      const { data: datosClases } = await supabase
        .from('imparte')
        .select(`clase_id, clase ( id, curso, letra )`)
        .eq('asignatura_id', id)
        .eq('profesor_id', prof.id);
      
      setClases(datosClases?.map(d => d.clase) || []);

      const { data: datosAlertas } = await supabase.from('alerta').select('*').eq('asignatura_id', id).neq('estado', 'descartada');
      setAlertas(datosAlertas || []);
      
      setLoading(false);
    }
    cargarDatosAsignatura();
  }, [id]);

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen">
      <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-6 inline-block">← Volver a Mis Asignaturas</Link>
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">Panel de la Asignatura</h1>
      
      <h2 className="text-xl font-semibold text-[#0f3d4c] mb-4">Mis Clases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {loading ? <p>Cargando clases...</p> : clases.map((clase) => (
          // 4. CORRECCIÓN: La ruta de la clase ahora incluye la asignatura actual
          <Link key={clase.id} to={`/asignatura/${id}/clase/${clase.id}`} className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg hover:border-amber-400">
            <h3 className="font-bold text-lg text-[#0f3d4c]">{clase.curso}º {clase.letra}</h3>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-[#0f3d4c] mb-4">Alertas Activas</h2>
      <div className="flex flex-col gap-3">
        {alertas.map((alerta) => (
          <div key={alerta.id} className="p-4 bg-amber-50 border border-amber-300 shadow-sm rounded-lg">
            <h3 className="font-bold text-[#0f3d4c]">{alerta.titulo}</h3>
            <p className="text-gray-700 text-sm">{alerta.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PANTALLA 1: INICIO PROFESOR ---
function InicioProfesor() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarAsignaturas() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 5. CORRECCIÓN: Sacamos las asignaturas a través de 'imparte' y eliminamos duplicados
      const { data: prof } = await supabase.from('profesor').select('id').eq('user_id', user.id).single();
      if (!prof) return;

      const { data: imparteData } = await supabase
        .from('imparte')
        .select('asignatura_id, asignatura (id, nombre)')
        .eq('profesor_id', prof.id);

      const asignaturasUnicas: Asignatura[] = [];
      const idsVistos = new Set();
      
      imparteData?.forEach((item: any) => {
        if (item.asignatura && !idsVistos.has(item.asignatura.id)) {
          idsVistos.add(item.asignatura.id);
          asignaturasUnicas.push(item.asignatura);
        }
      });

      setAsignaturas(asignaturasUnicas);
      setLoading(false);
    }
    cargarAsignaturas();
  }, []);

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0f3d4c]">Mis Asignaturas</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline">Cerrar sesión</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? <p>Cargando...</p> : asignaturas.map((asig) => (
          <Link key={asig.id} to={`/asignatura/${asig.id}`} className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg hover:border-amber-400 block">
            <h2 className="font-semibold text-lg text-[#0f3d4c]">{asig.nombre}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- APP PRINCIPAL Y LOGIN ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="p-8 bg-[#fdfbf7] min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-[#0f3d4c] mb-8">Brújula</h1>
        <form onSubmit={async (e) => { e.preventDefault(); await supabase.auth.signInWithPassword({ email, password }); }} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4 w-80">
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded" required />
          <button type="submit" className="bg-[#0f3d4c] text-white p-2 rounded">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicioProfesor />} />
        <Route path="/asignatura/:id" element={<PantallaAsignatura />} />
        {/* 6. CORRECCIÓN: Ruta anidada para incluir el ID de la asignatura y la clase */}
        <Route path="/asignatura/:asig/clase/:id" element={<PantallaClase />} />
      </Routes>
    </BrowserRouter>
  );
}