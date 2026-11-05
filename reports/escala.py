"""
Escala de notas de los informes.

Supabase y el modelo guardan las notas sobre 20 (como el dataset original).
Los informes, igual que la web, las muestran sobre 10.
"""

import re

ESCALA = 2
NOTA_MAX = 10

VARIABLES_NOTA = {"G1", "nota_examen", "nota_practicas"}

_NUMERO = r"\d+(?:[.,]\d+)?"


def sobre10(valor, decimales=2):
    """Nota guardada (sobre 20) -> nota mostrada (sobre 10). Deja pasar None."""
    if valor is None:
        return None
    return round(float(valor) / ESCALA, decimales)


def _mitad(numero: str) -> str:
    return f"{float(numero.replace(',', '.')) / ESCALA:g}"


def _mitades(texto: str) -> str:
    return re.sub(_NUMERO, lambda m: _mitad(m.group(0)), texto)


def valor_nota(variable, valor) -> str:
    """Valor de un motivo de alerta, pasado a sobre 10 si es una nota."""
    texto = str(valor)
    return _mitades(texto) if variable in VARIABLES_NOTA else texto


def texto_sobre10(texto):
    """Reescribe sobre 10 los textos de alerta generados con notas sobre 20."""
    if not texto:
        return texto
    patron = (r"(nota (?:del primer periodo|de prácticas|de examen)(?: baja)?(?::| de) )"
              rf"({_NUMERO})(?: a ({_NUMERO}))?")
    texto = re.sub(
        patron,
        lambda m: m.group(1) + _mitad(m.group(2)) + (f" a {_mitad(m.group(3))}" if m.group(3) else ""),
        texto,
        flags=re.IGNORECASE,
    )
    return texto.replace("sobre 20", "sobre 10")
