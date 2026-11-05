import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BellRing, Database, UserCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { useIdioma } from '../i18n';

// Portada pública: se muestra antes de iniciar sesión. No consulta datos; la tarjeta es un ejemplo fijo.
// El resto de apartados están en pages/publico/ y comparten cabecera y pie (Marco.tsx).
// Los textos están en src/i18n (portada.*).

const ICONOS_PASOS = [Database, BellRing, UserCheck];

export default function Portada() {
  const { t } = useIdioma();
  const p = t.portada;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const correo = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Si se llega desde "Entrar" o "Probar la demo", poner el foco en el correo
  useEffect(() => {
    if ((location.state as { entrar?: boolean } | null)?.entrar) correo.current?.focus();
  }, [location]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <section className="pt-10 pb-14 grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#174A55] leading-tight">{p.titulo}</h1>
          <p className="mt-5 text-lg max-w-xl">{p.intro}</p>

          {/* Ejemplo ilustrativo: ventana de la app con datos inventados, sin conexión a la base de datos */}
          <div className="mt-8 rounded-2xl border border-[#CBD5D4] bg-white shadow-sm overflow-hidden" aria-label={p.ejemplo.aria}>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#CBD5D4] bg-[#F7F4ED]" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5D4]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5D4]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5D4]" />
              <span className="ml-2 text-xs text-[#64777A]">{p.ejemplo.ventana}</span>
            </div>
            <div className="p-4">
              <div className="rounded-xl border border-[#E9B45C] bg-[#F9E9C9] p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E9B45C] text-[#24343A]">{p.ejemplo.prioridadAlta}</span>
                  <span className="text-xs text-[#78541B]">{p.ejemplo.podriaApoyo}</span>
                </div>
                <p className="font-semibold text-[#174A55]">{p.ejemplo.titulo}</p>
                <p className="text-sm text-[#64777A]">{p.ejemplo.alumna}</p>
                <p className="mt-2 text-sm">{p.ejemplo.porQue}</p>
                <ul className="text-sm list-disc pl-5">
                  <li>{p.ejemplo.notaPrimer}: <strong>{p.ejemplo.nota}</strong></li>
                  <li>{p.ejemplo.asistencia}: <strong>68 %</strong></li>
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3" aria-hidden="true">
                  <span className="text-xs px-3 py-1 rounded-lg bg-[#174A55] text-white">{p.ejemplo.registrar}</span>
                  <span className="text-xs text-[#64777A]">{p.ejemplo.descartar}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          id="entrar"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(false);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(true);
          }}
          className="bg-white p-6 rounded-xl border border-[#CBD5D4] flex flex-col gap-3"
        >
          <h2 className="text-lg font-semibold text-[#174A55]">{p.acceso.titulo}</h2>
          <label className="text-sm font-medium flex flex-col gap-1">
            {p.acceso.correo}
            <input ref={correo} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="border border-[#CBD5D4] rounded-lg p-2 font-normal focus:outline-2 focus:outline-[#174A55]" />
          </label>
          <label className="text-sm font-medium flex flex-col gap-1">
            {p.acceso.contrasena}
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="border border-[#CBD5D4] rounded-lg p-2 font-normal focus:outline-2 focus:outline-[#174A55]" />
          </label>
          {error && <p className="text-sm text-red-700">{p.acceso.error}</p>}
          <button type="submit" className="bg-[#174A55] text-white p-2 rounded-lg font-medium hover:opacity-90">{t.comun.entrar}</button>
          <p className="text-xs text-[#64777A]">{p.acceso.pista}</p>
        </form>
      </section>

      <section aria-labelledby="como-funciona" className="pb-16">
        <h2 id="como-funciona" className="text-2xl sm:text-3xl font-bold text-[#174A55]">
          {p.comoFunciona} <span className="text-[#64777A]">{p.comoFuncionaSub}</span>
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {p.pasos.map(({ titulo, texto }, i) => {
            const Icono = ICONOS_PASOS[i];
            return (
              <li key={i} className="bg-white rounded-xl border border-[#CBD5D4] p-6 flex flex-col items-center text-center">
                <span className="w-14 h-14 rounded-full bg-[#174A55]/10 flex items-center justify-center">
                  <Icono aria-hidden="true" className="w-7 h-7 text-[#174A55]" />
                </span>
                <h3 className="mt-4 font-semibold"><span className="text-[#174A55]">{i + 1}.</span> {titulo}</h3>
                <p className="mt-1 text-sm text-[#64777A]">{texto}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
