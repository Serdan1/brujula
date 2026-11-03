"""
Brújula · data/load.py
Sube a Supabase los CSV de data/processed/tablas/ (generados por extend.py)
y crea los 4 usuarios de prueba enlazados con su fila de «profesor».

Necesita un archivo .env en la raíz del repositorio (NUNCA se sube a GitHub):
    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY=la_clave_secreta_service_role
    TEST_PASSWORD=una_contraseña_para_los_usuarios_de_prueba   (opcional)

Uso:  python data/load.py
Se puede ejecutar varias veces: usa upsert, así que no duplica filas.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

RAIZ = Path(__file__).resolve().parent.parent
TABLAS_DIR = RAIZ / "data" / "processed" / "tablas"
LOTE = 1000

# Orden obligatorio por las claves foráneas
ORDEN = ["escuela", "asignatura", "clase", "profesor", "imparte",
         "alumno", "rendimiento", "contexto_alumno"]

# Usuarios de prueba: correo -> id de la tabla profesor
# (ids que genera extend.py: GP profesores 1-5 y director 6; MS profesores 7-11 y director 12)
USUARIOS_PRUEBA = {
    "profesor.gp@example.com": 1,
    "profesor.ms@example.com": 7,
    "director.gp@example.com": 6,
    "director.ms@example.com": 12,
}


def registros(df: pd.DataFrame) -> list[dict]:
    """Convierte a JSON limpio: NaN -> null y tipos de numpy -> tipos de Python."""
    return json.loads(df.to_json(orient="records", force_ascii=False))


def subir(sb, tabla: str) -> None:
    df = pd.read_csv(TABLAS_DIR / f"{tabla}.csv")
    filas = registros(df)
    for i in range(0, len(filas), LOTE):
        sb.table(tabla).upsert(filas[i:i + LOTE]).execute()
    print(f"· {tabla:<16} {len(filas):>6} filas")


def crear_usuarios(sb, password: str) -> None:
    existentes = {u.email: u.id for u in sb.auth.admin.list_users()}
    for email, profesor_id in USUARIOS_PRUEBA.items():
        if email in existentes:
            user_id = existentes[email]
        else:
            res = sb.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
            })
            user_id = res.user.id
        sb.table("profesor").update({"user_id": user_id}).eq("id", profesor_id).execute()
        print(f"· usuario {email:<26} -> profesor {profesor_id}")


def main() -> None:
    load_dotenv(RAIZ / ".env")
    url = os.environ.get("SUPABASE_URL")
    clave = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not clave:
        raise SystemExit("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el archivo .env")
    password = os.environ.get("TEST_PASSWORD", "Brujula-2026!")

    sb = create_client(url, clave)
    print(f"Cargando en {url}")
    for tabla in ORDEN:
        subir(sb, tabla)
    crear_usuarios(sb, password)
    print("Listo.")


if __name__ == "__main__":
    main()
