# Brújula

**Alertas tempranas y explicables para que el profesorado sepa a tiempo qué alumnos podrían necesitar apoyo.**

\#hack4edu 2026 · Reto 13 «La escuela que aprende de sus datos»

Al acabar el primer trimestre, Brújula analiza las notas, la asistencia y la participación de cada alumno. Avisa al profesor de quién podría necesitar apoyo para aprobar **y explica por qué**, por ejemplo con «nota del primer periodo: 4,5» o «asistencia: 68 %». La decisión siempre es del profesor: Brújula sugiere, no etiqueta.

---

## Probarla en 5 minutos

Solo hace falta **[Node.js](https://nodejs.org) 22 o superior** (la versión LTS). La base de datos ya está en la nube con datos de demostración, así que no hay que instalar nada más.

```bash
git clone https://github.com/Serdan1/brujula.git
cd brujula/frontend
cp .env.example .env        # en Windows (cmd): copy .env.example .env
npm install
npm run dev
```

Abre **http://localhost:5173** en el navegador.

## Usuarios de prueba

La contraseña es la misma para todos: **`Brujula-2026!`**

| Correo | Qué ve |
| --- | --- |
| `profesor.gp@example.com` | Profesor de Portugués · Escuela GP |
| `profesor.ms@example.com` | Profesor de Portugués · Escuela MS |
| `director.gp@example.com` | Director · Escuela GP |
| `director.ms@example.com` | Director · Escuela MS |

Todos los alumnos y nombres son ficticios.

---

## Recorrido recomendado (10 minutos)

**Como profesor** (`profesor.gp@example.com`):

1. **Inicio.** Muestra un resumen de las alertas pendientes y de las acciones que tienes en marcha.
2. **Portugués → una clase** (por ejemplo, *4.º Primaria C*). Aquí ves la lista de alumnos con sus notas y las alertas del grupo. Cada alerta dice **por qué** ha saltado.
3. **Pulsa en un alumno.** Verás su ficha: cómo va frente a la media de la clase, su nota final estimada con un margen y su contexto.
4. **En una alerta, pulsa «Registrar acción»** (por ejemplo, una tutoría) **o «Descartar con motivo».** Así se cierra el ciclo: el profesor revisa y decide.
5. **«Análisis completo de la clase →».** Muestra qué variables pesan más en las alertas de esa clase.
6. **Importar un trimestre.** En la clase *6.º Primaria G*, baja hasta el apartado de datos de un trimestre. Elige el **3.º trimestre**, pulsa **Importar .csv** y selecciona [`docs/demo/6G-portugues-trimestre3.csv`](docs/demo/6G-portugues-trimestre3.csv). Brújula enseña una vista previa y revisa los datos antes de guardarlos. Al guardar aparecen alertas nuevas (por ejemplo, de bajada de notas) y se actualiza la gráfica de evolución. También está el archivo del [2.º trimestre](docs/demo/6G-portugues-trimestre2.csv).

**Como director** (`director.gp@example.com`):

7. **Inicio del director.** Muestra la visión del centro: clases, notas medias, asistencia y alertas por asignatura.
8. **«Informe del centro (PDF)».** Descarga un informe listo para imprimir. Cada clase tiene también su propio PDF.

**Sin iniciar sesión:** la portada y las páginas «El modelo», «Pocos recursos» y «Cómo llega» explican el proyecto a cualquier visitante.

---

## Cómo funciona

```
Datos del centro  →  Modelo de IA  →  Alertas explicadas  →  El profesor decide  →  Seguimiento
(notas, asistencia)   (Python)         (web + PDF)           (acción o descarte)    (trimestres 2 y 3)
```

- **Datos:** usamos el dataset público *Student Performance* de la UCI, con alumnos reales y anónimos de dos institutos portugueses, ampliado con datos sintéticos. Las variables sintéticas se marcan con un asterisco (\*).
- **Modelo:** combina una regresión logística y LightGBM para la alerta, y una red neuronal para la nota estimada. Cada alerta incluye las variables que la explican (SHAP).
- **Ética:** nunca se muestra una probabilidad ni una «puntuación de riesgo» de un alumno. No se usan datos de salud, ocio ni familia. Cada profesor solo ve a sus alumnos, y eso lo garantiza la propia base de datos, no solo la web.
- **Escala:** en la web las notas van **sobre 10**. El dataset original va sobre 20, y la conversión se hace al mostrarlas.

Más detalle en [la ficha del modelo](docs/ficha-del-modelo.md) y en [la descripción de los datos](docs/datos.md).

## Qué hay en el repositorio

| Carpeta | Contenido |
| --- | --- |
| [`frontend/`](frontend/) | Web en React + Vite. **Es lo único que hay que ejecutar para probar la demo.** |
| [`ml/`](ml/) | Entrenamiento del modelo, explicaciones y publicación de alertas (Python). |
| [`data/`](data/) | Preparación del dataset y generación de los datos sintéticos. |
| [`reports/`](reports/) | Generación de los informes PDF. |
| [`supabase/`](supabase/) | Base de datos: tablas, reglas de seguridad (RLS) y pruebas. |
| [`docs/`](docs/) | Ficha del modelo, diagramas, wireframes y archivos de demo. |

Tecnologías: React, TypeScript, Tailwind, Supabase (PostgreSQL), Python (scikit-learn, LightGBM, PyTorch, SHAP) y GitHub Actions.

---

## Si algo falla

| Problema | Solución |
| --- | --- |
| `npm: command not found` | Instala [Node.js](https://nodejs.org) (LTS) y abre una terminal nueva. |
| La página sale en blanco | Falta el archivo `frontend/.env`. Repite el paso `cp .env.example .env`. |
| El puerto 5173 está ocupado | Vite usará otro (5174, 5175…). Mira la URL que aparece en la terminal. |
| No puedo entrar | Revisa la contraseña: `Brujula-2026!`, con mayúscula y exclamación. |

## Licencia

[MIT](LICENSE)
