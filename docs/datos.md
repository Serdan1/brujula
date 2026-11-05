# Datos de Brújula

**Responsable:** Aarón · **Última actualización:** 4 de noviembre de 2026

Brújula usa un dataset **real** de alumnos de secundaria, ampliado con una capa **sintética** que
simula lo que tendría un centro de verdad (clases, profesores, más asignaturas, prácticas, participación
y asistencia). Todo se genera con scripts y una semilla fija, así que cualquiera puede reproducirlo.

## 1. Origen: dataset Student Performance (UCI)

- **Fuente:** UCI Machine Learning Repository, dataset n.º 320, «Student Performance».
- **Autores:** P. Cortez y A. Silva (2008), *Using Data Mining to Predict Secondary School Student Performance*.
- **DOI:** 10.24432/C5TG7T
- **Licencia:** CC BY 4.0 (uso permitido citando la fuente).
- **Contenido:** alumnos de dos institutos públicos portugueses, Gabriel Pereira (GP) y Mousinho da
  Silveira (MS). Dos ficheros: `student-mat.csv` (Matemáticas, 395 filas) y `student-por.csv`
  (Portugués, 649 filas), separados por `;`.

### Unión de los dos ficheros

Algunos alumnos aparecen en los dos ficheros. La propia UCI indica que se identifican cruzando 13
atributos: school, sex, age, address, famsize, Pstatus, Medu, Fedu, Mjob, Fjob, reason, nursery e internet.

Cuando varias filas comparten exactamente esos 13 atributos, el script las empareja **una a una por orden
de aparición**, para que ningún alumno quede duplicado.

| | Alumnos |
| --- | --- |
| En las dos asignaturas | 370 |
| Solo Matemáticas | 25 |
| Solo Portugués | 279 |
| **Total de alumnos únicos** | **674** |

La documentación de la UCI habla de 382 alumnos comunes. La diferencia se debe a que su método de unión
cuenta dos veces a los alumnos que comparten los 13 atributos. El emparejamiento uno a uno da 370, que es
la cifra correcta de personas distintas.

### Variables excluidas por ética

Estas variables se usan **solo para emparejar** los dos ficheros y después se eliminan. No llegan ni a los
CSV procesados ni a la base de datos:

Dalc, Walc (consumo de alcohol), romantic (relación sentimental), famrel (calidad de la relación familiar),
Pstatus (convivencia de los padres), guardian (tutor legal), Mjob, Fjob (trabajo de los padres),
Medu, Fedu (estudios de los padres).

Son datos sensibles o socioeconómicos. Usarlos para señalar a un alumno sería estigmatizante y no ayuda a
decidir qué apoyo necesita. Aplicamos el principio de **minimización de datos**: lo que no se usa, no se guarda.

### Particularidades del dataset original

- Hay alumnos con nota 0 en algún periodo (por ejemplo, G1 = 0 y G2 = 11). Vienen así de la UCI y se
  mantienen sin modificar.
- Las faltas (absences) son el total del curso en cada asignatura, no por periodo.

## 2. Qué es real y qué es sintético

| Tabla | Filas | Real (UCI) | Sintético |
| --- | --- | --- | --- |
| escuela | 2 | GP y MS | — |
| asignatura | 4 | Portugués, Matemáticas | Inglés, Ciencias |
| clase | 28 | — | Toda la tabla |
| profesor | 12 | — | Toda la tabla |
| imparte | 108 | — | Toda la tabla |
| alumno | 674 | Sexo, edad, zona (U/R), escuela | Nombre, clase |
| rendimiento | 7176 | Nota de examen y total de faltas en Portugués y Matemáticas | Reparto de faltas por periodo, asistencia, nota de prácticas, participación; Inglés y Ciencias completos |
| contexto_alumno | 2392 | Variables de contexto en Portugués y Matemáticas (1044 filas) | Inglés y Ciencias (1348 filas, copian el contexto real del alumno) |

**En resumen:** los 674 alumnos y sus notas de examen en Portugués y Matemáticas son reales. La
estructura del centro y las métricas de clase son sintéticas.

## 3. Cómo se generó la parte sintética

Todo está en `data/extend.py`, con **semilla 42** (NumPy y Faker).

### Clases

- El curso se deduce de la edad: 15 años o menos → 4.º; 16 → 5.º; 17 o más → 6.º de Primaria (en el dataset original son 10.º, 11.º y 12.º de secundaria portuguesa; se renombran para la demo)
  (secundaria portuguesa).
- Cada escuela y curso se divide en grupos de unos 25 alumnos (número de grupos = alumnos / 25,
  redondeado), con letras A, B, C… El reparto es aleatorio.
- Resultado: 28 clases de entre 21 y 29 alumnos (media 24).

### Profesores

- 5 profesores por escuela: dos de Portugués, uno de Matemáticas, uno de Inglés y uno de Ciencias.
- Cuando hay dos profesores de una asignatura, se reparten las clases de forma alterna.
- Un director por escuela.
- Una clase solo tiene profesor de Portugués o Matemáticas si alguno de sus alumnos cursa esa asignatura en la UCI.

### Nombres

Nombres y apellidos portugueses ficticios generados con Faker (`pt_PT`), según el sexo real del alumno.

### Inglés y Ciencias

Para cada alumno y periodo:

nota = media de sus notas reales en ese periodo + facilidad del alumno en la asignatura + ruido

- La facilidad es fija para cada alumno y asignatura (aleatoria, media 0, desviación 1,5).
- El ruido es aleatorio en cada periodo (media 0, desviación 1).
- La nota se redondea y se limita a 0–20.
- Las faltas son la media de sus faltas reales multiplicada por un factor aleatorio entre 0,6 y 1,4.

Así, un alumno al que le va bien en Portugués suele ir bien en Inglés, pero no siempre.

### Faltas y asistencia por periodo

- El total de faltas del curso se reparte al azar entre los 3 periodos (pesos aleatorios Dirichlet 2, 2, 2).
  Esto genera casos realistas de faltas que aumentan o disminuyen durante el curso.
- asistencia = 100 × (1 − faltas del periodo / 40), limitada a 0–100. Se suponen 40 clases por
  asignatura y periodo.

### Nota de prácticas (0–20)

prácticas = 0,7 × nota de examen + 3,5 + 0,8 × (tiempo de estudio − 2) − 0,08 × faltas del periodo + ruido

El ruido tiene media 0 y desviación 1,5. Se redondea a un decimal.

### Participación (0–10)

participación = 0,35 × nota de examen + 1 + 0,4 × (tiempo de estudio − 2) − 0,05 × faltas del periodo + ruido

El ruido tiene media 0 y desviación 1. Se redondea a un decimal.

## 4. Cómo reproducirlo

Desde la raíz del repositorio:

```
pip install pandas faker supabase python-dotenv
python data/prepare_uci.py   # descarga y une los CSV de la UCI
python data/extend.py        # genera la parte sintética y las tablas
python data/load.py          # sube todo a Supabase y crea los usuarios de prueba
```

Antes hay que aplicar las migraciones de `supabase/migrations/` y crear un archivo `.env` con
`SUPABASE_URL` y `SUPABASE_SERVICE_KEY`, que nunca se sube a GitHub.

Con la misma semilla, `extend.py` produce exactamente los mismos datos en cada ejecución.

## 5. Limitaciones

- **Las relaciones sintéticas están definidas por nosotros.** Prácticas, participación y asistencia
  dependen de la nota, el tiempo de estudio y las faltas porque así lo establecen las fórmulas anteriores.
  Si el modelo encuentra que esas variables son importantes, en parte está redescubriendo cómo se
  generaron. Los resultados sobre esas variables sirven para demostrar el funcionamiento de la
  herramienta, no como conclusiones sobre alumnos reales.
- **Las clases y los profesores no existen.** El reparto en grupos es aleatorio, así que las diferencias
  entre clases de una misma escuela y curso son, sobre todo, ruido.
- **Inglés y Ciencias imitan el rendimiento general del alumno** y no reflejan dificultades propias de
  cada asignatura.
- **El dataset es de 2005–2006 y de solo dos centros portugueses.** No representa a otros sistemas
  educativos ni a la población actual.
- **Ningún dato identifica a personas reales:** el dataset original es anónimo y los nombres son ficticios.
