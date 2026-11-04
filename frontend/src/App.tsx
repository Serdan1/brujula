import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

type Asignatura = { id: string; nombre: string; };

// --- PANTALLA 2: ASIGNATURA (CLASES Y ALERTAS) ---
function PantallaAsignatura() {
  const { id } = useParams(); // ID de la asignatura
  const [clases, setClases] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatosAsignatura() {
      if (!id) return;
      
      // 1. Cargamos las clases que imparte el profesor en esta asignatura
      // Usamos la relación entre "imparte" y "clase"
      const { data: datosClases, error: errorClases } = await supabase
        .from('imparte')
        .select(`
          clase_id,
          clase ( id, curso, letra )
        `)
        .eq('asignatura_id', id);

      if (errorClases) console.error("Error al cargar clases:", errorClases.message);
      
      // Extraemos los datos limpios de la clase
      const clasesLimpias = datosClases?.map(d => d.clase) || [];
      setClases(clasesLimpias);

      // 2. Cargamos las alertas de severidad alta/media para esta asignatura
      const { data: datosAlertas, error: errorAlertas } = await supabase
        .from('alerta')
        .select('*')
        .eq('asignatura_id', id)
        .neq('estado', 'descartada'); // No mostramos las descartadas

      if (errorAlertas) console.error("Error al cargar alertas:", errorAlertas.message);
      setAlertas(datosAlertas || []);
      
      setLoading(false);
    }
    
    cargarDatosAsignatura();
  }, [id]);

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen">
      <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-6 inline-block">
        ← Volver a Mis Asignaturas
      </Link>
      
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">Panel de la Asignatura</h1>
      
      {/* SECCIÓN DE ALERTAS */}
      <h2 className="text-xl font-semibold text-[#0f3d4c] mb-4">Alertas Activas</h2>
      {loading ? (
        <p className="text-gray-500 mb-8">Cargando alertas...</p>
      ) : alertas.length === 0 ? (
        <p className="text-green-600 bg-green-50 p-4 rounded-md mb-8 border border-green-200">
          No hay alertas activas para esta asignatura. Todo va bien.
        </p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {alertas.map((alerta) => (
            <div key={alerta.id} className="p-4 bg-amber-50 border border-amber-300 shadow-sm rounded-lg flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                  {alerta.severidad}
                </span>
                <h3 className="font-bold text-[#0f3d4c]">{alerta.titulo}</h3>
              </div>
              <p className="text-gray-700 text-sm mb-2">{alerta.descripcion}</p>
              <p className="text-xs text-gray-500">Motivo: {alerta.motivo}</p>
            </div>
          ))}
        </div>
      )}

      {/* SECCIÓN DE CLASES */}
      <h2 className="text-xl font-semibold text-[#0f3d4c] mb-4">Mis Clases</h2>
      {loading ? (
        <p className="text-gray-500">Cargando clases...</p>
      ) : clases.length === 0 ? (
        <p className="text-gray-500">No tienes clases asignadas a esta materia.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clases.map((clase) => (
            <Link 
              key={clase.id} 
              to={`/clase/${clase.id}`} 
              className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-lg text-[#0f3d4c]">
                  {clase.curso}º {clase.letra}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Ver listado de alumnos y detalles →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE: FORMULARIO DE ACCIÓN ---
function FormularioAccion({ alumno, onClose, onSave }: { alumno: any, onClose: () => void, onSave: (datos: any) => void }) {
  const [tipo, setTipo] = useState('tutoría');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ tipo, descripcion, fecha_revision: fecha });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-[#0f3d4c] mb-4">Registrar acción para {alumno.nombre_ficticio}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acción</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border p-2 rounded">
              <option value="tutoría">Tutoría con el alumno</option>
              <option value="reunión_familia">Reunión con la familia</option>
              <option value="refuerzo">Material de refuerzo</option>
              <option value="seguimiento">Seguimiento en clase</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea 
              value={descripcion} onChange={(e) => setDescripcion(e.target.value)} 
              className="w-full border p-2 rounded h-24" placeholder="Detalles de la acción..." required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha prevista de revisión</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#0f3d4c] text-white rounded hover:bg-opacity-90">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- PANTALLA 1: INICIO DEL PROFESOR ---
function InicioProfesor() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarAsignaturas() {
      const { data } = await supabase.from('asignatura').select('*');
      setAsignaturas(data || []);
      setLoading(false);
    }
    cargarAsignaturas();
  }, []);

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0f3d4c]">Mis Asignaturas</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline">
          Cerrar sesión
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          asignaturas.map((asig) => (
            <Link 
              key={asig.id} 
              to={`/asignatura/${asig.id}`} 
              className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg hover:border-amber-400 hover:shadow-md transition-all cursor-pointer block"
            >
              <h2 className="font-semibold text-lg text-[#0f3d4c]">{asig.nombre}</h2>
              <p className="text-sm text-gray-500 mt-2">Ver clases y alertas →</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// --- PANTALLA 3: CLASE (ALUMNOS Y ALERTAS) ---
function PantallaClase() {
  const { id } = useParams();
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el modal de acción
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarAlumnos() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('alumno')
        .select(`
          id, 
          nombre,
          rendimiento ( nota_examen, nota_practicas, participacion, asistencia )
        `)
        .eq('clase_id', id);

      if (error) {
        console.error("Error al cargar alumnos:", error.message);
      } else {
        setAlumnos(data || []);
      }
      
      setLoading(false);
    }
    
    cargarAlumnos();
  }, [id]);

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen">
      <button onClick={() => window.history.back()} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-6 inline-block">
        ← Volver atrás
      </button>
      
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
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No hay alumnos en esta clase.</td></tr>
            ) : (
              alumnos.map((alumno) => {
                // Prevenimos fallos si un alumno no tiene datos de rendimiento
                const rend = (alumno.rendimiento && alumno.rendimiento.length > 0) ? alumno.rendimiento[0] : {};
                
                return (
                  <tr key={alumno.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-[#0f3d4c]">{alumno.nombre}</td>
                    <td className="p-3">{rend.nota_examen ?? '-'}</td>
                    <td className="p-3">{rend.nota_practicas ?? '-'}</td>
                    <td className="p-3">{rend.participacion ?? '-'}/10</td>
                    <td className="p-3">{rend.asistencia ? `${rend.asistencia}%` : '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded hover:bg-amber-200 border border-amber-300 transition">
                        Lo reviso
                      </button>
                      <button 
                        onClick={() => setAlumnoSeleccionado(alumno)}
                        className="bg-[#0f3d4c] text-white text-xs px-2 py-1 rounded hover:bg-opacity-90 transition"
                      >
                        Registrar acción
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE ACCIÓN INCRUSTADO */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#0f3d4c] mb-4">Registrar acción para {alumnoSeleccionado.nombre}</h2>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setGuardando(true);
                
                // Leemos los datos del formulario (usando el DOM directamente por rapidez)
                const form = e.target as HTMLFormElement;
                const tipo = (form.elements.namedItem('tipo') as HTMLSelectElement).value;
                const descripcion = (form.elements.namedItem('descripcion') as HTMLTextAreaElement).value;
                const fecha_revision = (form.elements.namedItem('fecha') as HTMLInputElement).value;
                
                const { data: { user } } = await supabase.auth.getUser();
                
                // Según contrato, requiere profesor_id, tipo, descripcion, fecha_revision, fecha_inicio
                const nuevaAccion = {
                  profesor_id: user?.id, 
                  tipo,
                  descripcion,
                  fecha_revision,
                  fecha_inicio: new Date().toISOString().split('T')[0]
                };

                const { error } = await supabase.from('accion').insert(nuevaAccion);
                
                setGuardando(false);
                if (error) {
                  alert("Error al guardar: " + error.message);
                } else {
                  alert("Acción registrada correctamente.");
                  setAlumnoSeleccionado(null);
                }
              }} 
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acción</label>
                <select name="tipo" className="w-full border p-2 rounded">
                  <option value="tutoría">Tutoría con el alumno</option>
                  <option value="reunión_familia">Reunión con la familia</option>
                  <option value="refuerzo">Material de refuerzo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="descripcion" className="w-full border p-2 rounded h-24" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de revisión</label>
                <input name="fecha" type="date" className="w-full border p-2 rounded" required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setAlumnoSeleccionado(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" disabled={guardando} className="px-4 py-2 bg-[#0f3d4c] text-white rounded hover:bg-opacity-90">
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

// --- APP PRINCIPAL Y LOGIN ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Error al entrar: " + error.message);
  };

  if (!session) {
    return (
      <div className="p-8 bg-[#fdfbf7] min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-[#0f3d4c] mb-8">Brújula</h1>
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4 w-80">
          <h2 className="font-semibold text-lg text-center mb-2">Iniciar Sesión</h2>
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded" required />
          <button type="submit" className="bg-[#0f3d4c] text-white p-2 rounded">Entrar</button>
          {error && <p className="text-amber-600 text-sm mt-2 text-center">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicioProfesor />} />
        <Route path="/asignatura/:id" element={<PantallaAsignatura />} />
        <Route path="/clase/:id" element={<PantallaClase />} />
      </Routes>
    </BrowserRouter>
  );
}