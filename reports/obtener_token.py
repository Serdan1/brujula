
import os
from pathlib import Path
from getpass import getpass

from dotenv import load_dotenv
from supabase import create_client


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

url = os.getenv("SUPABASE_URL")
clave = os.getenv("SUPABASE_PUBLISHABLE_KEY")

if not url or not clave:
    raise ValueError("Configura primero Supabase en reports/.env")

supabase = create_client(url, clave)

correo = input("Correo del usuario de prueba: ")
password = getpass("Contraseña: ")

respuesta = supabase.auth.sign_in_with_password({
    "email": correo,
    "password": password
})

if not respuesta.session:
    raise ValueError("No se ha obtenido una sesión.")

token = respuesta.session.access_token

print("Autenticación correcta.")
print("Token obtenido. No lo compartas ni lo subas a GitHub.")

# Guardar el token para la prueba local
ruta_token = BASE_DIR / ".token"
ruta_token.write_text(token, encoding="utf-8")

print("Token guardado en reports/.token")
