import { useEffect, useState } from 'react';
import { miProfesor } from '../datos';
import { useIdioma } from '../i18n';
import Inicio from './Inicio';
import InicioDirector from './InicioDirector';

// Muestra el inicio del director o el del profesor según el rol del usuario
export default function InicioSegunRol() {
  const { t } = useIdioma();
  const [rol, setRol] = useState<string | null>(null);
  useEffect(() => {
    miProfesor().then((p) => setRol(p?.rol ?? 'profesor'));
  }, []);
  if (!rol) return <div className="p-8 text-gray-500">{t.app.cargando}</div>;
  return rol === 'director' ? <InicioDirector /> : <Inicio />;
}
