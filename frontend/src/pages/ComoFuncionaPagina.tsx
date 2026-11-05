import { Link } from 'react-router-dom';
import ComoFunciona from '../components/ComoFunciona';
import { useIdioma } from '../i18n';

// Página propia para usuarios con sesión (enlazada desde el Análisis completo)
export default function ComoFuncionaPagina() {
  const { t } = useIdioma();
  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-5xl mx-auto">
      <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">{t.app.volverInicio}</Link>
      <ComoFunciona />
    </div>
  );
}
