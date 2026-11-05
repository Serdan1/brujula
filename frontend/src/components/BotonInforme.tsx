import { useState } from 'react';
import { supabase } from '../supabase';
import { useIdioma } from '../i18n';

// Abre un informe PDF del bucket privado «informes» con un enlace temporal (5 minutos).
// Las reglas de Supabase Storage solo permiten abrir los informes que el usuario puede ver.
// Los PDF están en español.
export default function BotonInforme({ ruta, texto }: { ruta: string; texto?: string }) {
  const { t } = useIdioma();
  const [cargando, setCargando] = useState(false);

  async function abrir() {
    // La ventana se abre antes de la espera para que el navegador no la bloquee
    const ventana = window.open('about:blank', '_blank');
    setCargando(true);
    const { data, error } = await supabase.storage.from('informes').createSignedUrl(ruta, 300);
    setCargando(false);
    if (error || !data?.signedUrl) {
      ventana?.close();
      alert(t.errores.informe);
      return;
    }
    if (ventana) ventana.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  return (
    <button
      onClick={abrir}
      disabled={cargando}
      className="px-4 py-2 rounded border border-[#0f3d4c] text-[#0f3d4c] bg-white hover:bg-gray-50 disabled:opacity-60"
    >
      {cargando ? t.informe.abriendo : texto ?? t.informe.descargar}
    </button>
  );
}
