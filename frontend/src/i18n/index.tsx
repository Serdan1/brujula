// Idiomas de la web: español (referencia), portugués de Portugal, inglés y francés.
// Uso en un componente:   const { t, num } = useIdioma();   <h1>{t.portada.titulo}</h1>
// Los diccionarios están en ./es.tsx, ./pt.tsx, ./en.tsx y ./fr.tsx. Los cuatro tienen el tipo de
// es.tsx, así que si falta una clave en un idioma, TypeScript no compila.
import { Fragment, createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import es from './es';
import pt from './pt';
import en from './en';
import fr from './fr';

export type Diccionario = typeof es;
export type Idioma = 'es' | 'pt' | 'en' | 'fr';

export const IDIOMAS: { codigo: Idioma; nombre: string; locale: string }[] = [
  { codigo: 'es', nombre: 'Español', locale: 'es-ES' },
  { codigo: 'pt', nombre: 'Português', locale: 'pt-PT' },
  { codigo: 'en', nombre: 'English', locale: 'en-GB' },
  { codigo: 'fr', nombre: 'Français', locale: 'fr-FR' },
];

const DICCIONARIOS: Record<Idioma, Diccionario> = { es, pt, en, fr };
const CLAVE = 'brujula-idioma';

// Idioma guardado en este navegador; si no hay, el del navegador; si no es uno de los cuatro, español
function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado && guardado in DICCIONARIOS) return guardado as Idioma;
  } catch { /* sin almacenamiento */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'es').slice(0, 2);
  return (nav in DICCIONARIOS ? nav : 'es') as Idioma;
}

type Contexto = {
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
  t: Diccionario;
  locale: string;
  // Número con el formato del idioma (coma o punto decimal)
  num: (v: number, decimales?: number) => string;
};

const IdiomaContext = createContext<Contexto | null>(null);

// Idioma actual para el código que no es un componente (src/datos.ts, validación del CSV...).
// Al cambiar de idioma, el proveedor vuelve a montar la web entera (key={idioma}), así que
// todo lo que se dibuja lee ya el idioma nuevo.
let actual: Idioma = 'es';
export const tActual = (): Diccionario => DICCIONARIOS[actual];
export const localeActual = (): string => IDIOMAS.find((i) => i.codigo === actual)!.locale;

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial);
  actual = idioma;
  const locale = IDIOMAS.find((i) => i.codigo === idioma)!.locale;

  useEffect(() => {
    document.documentElement.lang = idioma;
    try { localStorage.setItem(CLAVE, idioma); } catch { /* sin almacenamiento */ }
  }, [idioma]);

  const num = (v: number, decimales = 1) =>
    v.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: decimales });

  return (
    <IdiomaContext.Provider value={{ idioma, setIdioma, t: DICCIONARIOS[idioma], locale, num }}>
      <Fragment key={idioma}>{children}</Fragment>
    </IdiomaContext.Provider>
  );
}

export function useIdioma(): Contexto {
  const c = useContext(IdiomaContext);
  if (!c) throw new Error('useIdioma necesita <IdiomaProvider> (está en main.tsx)');
  return c;
}

// Selector de idioma: un desplegable nativo (accesible y cómodo en el móvil)
export function SelectorIdioma({ className = '' }: { className?: string }) {
  const { idioma, setIdioma, t } = useIdioma();
  return (
    <label className={`inline-flex items-center gap-1 text-sm ${className}`}>
      <span className="sr-only">{t.comun.idioma}</span>
      <span aria-hidden="true">🌐</span>
      <select
        value={idioma}
        onChange={(e) => setIdioma(e.target.value as Idioma)}
        className="bg-transparent rounded-md border border-[#CBD5D4] px-1.5 py-1 text-sm cursor-pointer"
      >
        {IDIOMAS.map((i) => (
          <option key={i.codigo} value={i.codigo}>{i.nombre}</option>
        ))}
      </select>
    </label>
  );
}
