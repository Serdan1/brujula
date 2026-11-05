import { useEffect, useState } from 'react';
import { miProfesor } from '../datos';
import Inicio from './Inicio';
import InicioDirector from './InicioDirector';

// Muestra el inicio del director o el del profesor según el rol del usuario
export default function InicioSegunRol() {
  const [rol, setRol] = useState<string | null>(null);
  useEffect(() => {
    miProfesor().then((p) => setRol(p?.rol ?? 'profesor'));
  }, []);
  if (!rol) return <div className="p-8 text-gray-500">Cargando...</div>;
  return rol === 'director' ? <InicioDirector /> : <Inicio />;
}
