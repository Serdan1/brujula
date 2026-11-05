// frontend/src/pages/Inicio.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { TarjetaAlerta } from '../components/TarjetaAlerta';

export default function Inicio() {
  const [clases, setClases] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profesor } = await supabase
        .from('profesor')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profesor) return;

      // Obtener las clases que imparte este profesor
      const { data: impartes } = await supabase
        .from('imparte')
        .select('clase_id')
        .eq('profesor_id', profesor.id);
        
      const claseIds = impartes?.map(i => i.clase_id) || [];

      if (claseIds.length > 0) {
        // 1. Obtener datos de las clases
        const { data: clasesData } = await supabase
          .from('clase')
          .select('*')
          .in('id', claseIds);

        // 2. Obtener todas las alertas de esas clases
        const { data: alertasData } = await supabase
          .from('alerta')
          .select('*')
          .in('clase_id', claseIds)
          .order('severidad', { ascending: true }); // Ordenar para que salgan primero las altas

        if (alertasData && clasesData) {
          // Contamos las alertas por clase (excluyendo las descartadas para el conteo de la tarjeta)
          const clasesConConteo = clasesData.map(c => ({
            ...c,
            alertas_pendientes: alertasData.filter(a => a.clase_id === c.id && a.estado !== 'descartada').length
          }));
          setClases(clasesConConteo);

          // 3. FILTRAR LA LISTA PRINCIPAL: Ocultamos las alertas descartadas
          const alertasVisibles = alertasData.filter(a => a.estado !== 'descartada');
          setAlertas(alertasVisibles);
        }
      }
      setCargando(false);
    }
    fetchData();
  }, []);

  if (cargando) return <div className="p-8 text-center text-slate-500">Cargando tu panel...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      {/* CABECERA CON BOTÓN DE PRÓXIMAS INTERVENCIONES */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1>
        <Link 
          to="/intervenciones?tipo=intervencion"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium shadow-sm transition-colors"
        >
          Próximas intervenciones
        </Link>
      </div>

      {/* SECCIÓN MIS CLASES */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Mis clases</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {clases.map(c => (
          <Link key={c.id} to={`/clase/${c.id}`} className="p-5 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-center">
            <h3 className="text-xl font-bold text-slate-800">{c.curso}º {c.letra}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {c.alertas_pendientes} {c.alertas_pendientes === 1 ? 'alerta pendiente' : 'alertas pendientes'}
            </p>
          </Link>
        ))}
      </div>

      {/* SECCIÓN ALERTAS (CON BOTÓN DE DESCARTES EN MEDIO) */}
      <div className="flex items-end justify-between mb-4 border-b border-slate-200 pb-3">
        <h2 className="text-xl font-bold text-slate-800">
          Alertas de alumnos ({alertas.length})
        </h2>
        <Link 
          to="/intervenciones?tipo=descarte"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Ver descartes
        </Link>
      </div>

      <div className="space-y-4">
        {alertas.length === 0 ? (
          <p className="text-slate-500 italic">No hay alertas pendientes en tus clases en este momento.</p>
        ) : (
          alertas.map(alerta => (
            <TarjetaAlerta key={alerta.id} alerta={alerta} />
          ))
        )}
      </div>
      
    </div>
  );
}