# Ficha del modelo — Brújula v1.0

*#hack4edu 2026 · Reto 13 «La escuela que aprende de sus datos» · v1.1 · 4 de noviembre de 2026*
*Responsable: Daniel Serrano (deep learning) · Código: `ml/` · Licencia MIT*

## 1. Qué hace y qué no hace

**Qué hace.** Al final del primer periodo, estima para cada alumno y asignatura:

- **Si podría necesitar apoyo** para aprobar (nota final por debajo de 10 sobre 20), con las variables que lo explican.
- **Su nota final estimada**, con un intervalo del 80 %.

Con esto se generan alertas por alumno, por clase y por asignatura que el profesorado revisa en la web.

**Qué no hace.**

- No toma decisiones: toda alerta la revisa una persona, que puede descartarla con un motivo.
- No asigna puntuaciones de riesgo visibles ni ordena a los alumnos de mejor a peor.
- No usa datos sensibles ni socioeconómicos como entrada.

**Usos previstos:** detectar pronto a quién conviene ofrecer apoyo, y en qué.

**Usos prohibidos:** calificar, sancionar, seleccionar, agrupar o excluir alumnos, o evaluar al profesorado.

## 2. Datos

| Origen | Contenido | Tipo |
|---|---|---|
| [UCI Student Performance](https://archive.ics.uci.edu/dataset/320/student+performance) (CC BY 4.0) | 395 alumnos de Matemáticas y 649 de Portugués de dos institutos portugueses (curso 2005-06): notas de 3 periodos (G1, G2, G3), faltas y contexto | Real |
| Ampliación del equipo (`data/extend.py`) | Clases, profesores, asignaturas de Inglés y Ciencias, nota de prácticas, participación en clase, asistencia y reparto de las faltas por periodo, correlacionados con las notas reales | Sintético |

Las tres variables sintéticas del periodo se calculan con fórmulas a partir de datos que el modelo ya tiene:

- **Nota de prácticas** ≈ 0,7 × nota del periodo + 3,5 + ajuste por tiempo de estudio − ajuste por faltas + ruido
- **Participación** ≈ 0,35 × nota del periodo + 1 + ajuste por tiempo de estudio − ajuste por faltas + ruido
- **Asistencia** = 100 × (1 − faltas del periodo / 40 sesiones)

Hacen que los datos de la demo sean coherentes, pero **no aportan información nueva** sobre el alumno (ver sección 4.1 y limitación 2).

- **674 alumnos únicos** (370 están en las dos asignaturas reales) en 28 clases.
- **Entrenamiento:** solo las asignaturas reales, con 1.044 filas alumno-asignatura.
- **Predicción:** las 4 asignaturas, con 2.392 filas.
- **Prevalencia:** el 22 % necesita apoyo. Incluye 53 abandonos (nota final 0 con nota en el primer periodo), que se tratan como «necesita apoyo» porque son los casos que más importa detectar.

## 3. Variables

**Entradas (16), todas conocidas al final del primer periodo:**

- Nota del primer periodo, nota de prácticas, participación en clase, asistencia y faltas del periodo 1 (estas últimas en logaritmo).
- Suspensos previos, tiempo de estudio, tiempo de trayecto y edad.
- Apoyo del centro, apoyo familiar, clases particulares, actividades extraescolares, intención de hacer estudios superiores e internet en casa.
- Asignatura.

**Excluidas a propósito:**

| Variables | Motivo |
|---|---|
| G2, G3 | No se conocen al final del primer periodo: usarlas haría trampa |
| Consumo de alcohol (`Dalc`, `Walc`), relación sentimental, relación familiar, situación de los padres, tutor legal | Sensibles: señalar a un alumno por ellas es estigmatizante |
| Estudios y trabajo de los padres | Socioeconómicas: reproducirían desigualdades de origen |
| Sexo, zona (urbana o rural), escuela | No entran al modelo; solo se usan para **auditar la equidad** |

El código de `features.py` impide por diseño que alguna de estas variables entre al modelo: si ocurre, el script se detiene con un error.

## 4. Modelos y validación

**Validación.** 5 particiones estratificadas **agrupadas por alumno** (`StratifiedGroupKFold`, semilla 42): un mismo alumno nunca está a la vez en entrenamiento y en validación. Todas las métricas se calculan con predicciones fuera de la partición de entrenamiento.

**Referencia mínima.** La regla «nota del primer periodo < 10». Un modelo que no la supere no aporta nada.

### 4.1 Alertas: «¿necesita apoyo?»

Se compararon 7 combinaciones de modelos fijando **el mismo recall que la regla G1 (0,835)**, es decir, detectando a los mismos alumnos para comparar cuántas falsas alarmas genera cada uno.

| Modelo | PR-AUC | Precisión | Alertas | Detectados que G1 no ve |
|---|---|---|---|---|
| **Logística + LightGBM (elegido)** | **0,799** | **0,699** | **276** | **14** |
| Logística | 0,798 | 0,687 | 281 | 9 |
| Red + logística + LightGBM | 0,796 | 0,645 | 299 | 12 |
| Red + logística | 0,794 | 0,652 | 296 | 10 |
| Red + LightGBM | 0,783 | 0,650 | 297 | 12 |
| Red neuronal | 0,770 | 0,601 | 321 | 13 |
| LightGBM | 0,749 | 0,661 | 292 | 17 |
| Regla G1 < 10 | — | 0,642 | 299 | — |

**Resultado.** El modelo elegido detecta a los mismos alumnos que la regla G1 con **23 falsas alarmas menos**, y encuentra a **14 alumnos que aprobaron el primer periodo pero acabarán necesitando apoyo**. El umbral de decisión es 0,511.

**¿Inflan los resultados las variables sintéticas?** Para medirlo, se reentrenó el modelo de alertas sin la nota de prácticas, la participación y la asistencia:

| Modelo de alertas | PR-AUC | Precisión | Alertas | Detectados que G1 no ve |
|---|---|---|---|---|
| Regla G1 < 10 | — | 0,642 | 299 | — |
| Logística + LightGBM **sin variables sintéticas** | 0,797 | 0,677 | 285 | 13 |
| Logística + LightGBM con variables sintéticas | 0,799 | 0,699 | 276 | 14 |

La mejora sobre la regla G1 se mantiene casi entera solo con datos reales: de las 23 falsas alarmas menos, 14 se consiguen sin ninguna variable sintética.

### 4.2 Nota final estimada

| Modelo | Error medio (MAE, puntos sobre 20) |
|---|---|
| **Red neuronal (elegida)** | **1,054** |
| Ridge | 1,083 |
| LightGBM | 1,113 |
| Regla «nota final = G1» | 1,132 |

**Intervalo del 80 %.** Cubre el valor real en el **80,4 %** de los casos, con un ancho medio de **3,4 puntos**.

### 4.3 Arquitectura de la red neuronal

- **Estructura:** perceptrón multicapa multitarea en PyTorch. Un tronco común de 64 y 32 neuronas (ReLU, dropout 0,2) y dos salidas: probabilidad de necesitar apoyo y nota final.
- **Pérdida de la clasificación:** entropía cruzada ponderada por el desequilibrio de clases.
- **Pérdida de la nota:** Huber sobre el **cambio respecto a G1**, estandarizado. Predecir el cambio en lugar de la nota absoluta redujo el error de 1,52 a 1,05 puntos.
- **Entrenamiento:** Adam (lr 0,001, weight decay 0,0001) con parada temprana sobre un 15 % de alumnos reservados (paciencia 30).
- **Incertidumbre:** MC Dropout con 50 pasadas, más el error residual de entrenamiento.

**Decisión.** La red se usa para la nota estimada, donde es el mejor modelo. Para las alertas se usa logística + LightGBM, que dio mejores resultados con estos datos. Se eligió comparando, no por preferencia de técnica.

## 5. Explicaciones

Cada alerta muestra hasta 3 motivos, calculados con **SHAP** (KernelExplainer) sobre la probabilidad del modelo de alertas. Solo se muestran motivos que cumplen todas estas reglas:

- **Accionables.** No se muestra la asignatura, porque el profesor no puede cambiarla.
- **Sin causalidad inversa.** No se muestran el apoyo del centro, el apoyo familiar ni las clases particulares: se dan a quien ya tiene dificultades, y mostrarlos sugeriría que el apoyo perjudica.
- **Coherentes con el sentido esperado de la variable.** Por ejemplo, «más faltas aumentan la necesidad de apoyo» o «más tiempo de estudio la reduce».
- **Con un peso mínimo** de 1 punto porcentual en la probabilidad.
- **En una alerta, solo los factores que la provocan.**

**Variables más importantes (global):** nota del primer periodo, asignatura, suspensos previos, nota de prácticas y participación en clase. La importancia de prácticas y participación refleja cómo se generaron estos datos sintéticos a partir de la nota (SHAP reparte entre ellas parte del peso de la nota del primer periodo), **no es un hallazgo sobre el aprendizaje**. Entre las variables reales, las que más pesan después de la nota son los suspensos previos, la edad y las faltas.

## 6. Equidad

Medida con el modelo de alertas elegido, con predicciones fuera de partición.

| Grupo | n | Recall | Falsas alarmas |
|---|---|---|---|
| Chicas | 591 | 0,848 | 9,7 % |
| Chicos | 453 | 0,829 | 10,9 % |
| Zona rural | 285 | 0,844 | **15,4 %** |
| Zona urbana | 759 | 0,837 | 8,4 % |
| Gabriel Pereira | 772 | 0,834 | 9,7 % |
| Mousinho da Silveira | 272 | 0,847 | 11,8 % |

**Lectura.**

- **Recall igualado.** Es parecido en todos los grupos (83–85 %): el modelo no deja escapar más alumnos de un grupo que de otro.
- **Más falsas alarmas en zona rural.** Hay unos 7 puntos más que en zona urbana. Allí hay más alumnos cerca del aprobado, y el modelo duda más.

**Mitigación.**

- **No se usan umbrales distintos por zona,** porque harían que la decisión dependa directamente de dónde vive el alumno.
- **La alerta nunca decide sola:** el profesor la revisa y puede descartarla con un motivo, que queda registrado.
- **La diferencia se muestra con transparencia** en la pantalla de Análisis completo y en esta ficha.
- **Se medirá de nuevo con cada versión del modelo.**

## 7. Artefactos detectados en los datos

- **Abandonos con 0 faltas.** Los alumnos que abandonaron tienen casi siempre 0 faltas registradas, seguramente porque dejaron de constar en el registro. El modelo asociaba «0 faltas» a riesgo. Esa explicación se bloquea para que nunca se muestre.
- **Edad.** Ser mayor que los compañeros se asocia a haber repetido. Solo se muestra como motivo cuando el alumno está por encima de la edad media.

## 8. Limitaciones

1. **Datos de hace 20 años** de dos institutos portugueses: los patrones pueden no trasladarse a otros contextos. Antes de usarlo en una escuela real hay que reentrenarlo con sus propios datos.
2. **Variables sintéticas derivadas de las reales.** La nota de prácticas, la participación y la asistencia se generaron con fórmulas a partir de la nota del periodo, el tiempo de estudio y las faltas. No aportan información nueva sobre el alumno, y su importancia en SHAP refleja cómo se construyeron, no un hallazgo sobre el aprendizaje. Reentrenado sin ellas, el modelo de alertas obtiene un PR-AUC de 0,797 frente a 0,799, y da 285 alertas frente a 276 con el mismo recall: la mayor parte de la mejora sobre la regla G1 se mantiene solo con datos reales. Con datos reales de una escuela, el peso de estas variables podría ser muy distinto. También son sintéticos el reparto de las faltas por periodo y las asignaturas de Inglés y Ciencias, cuyas predicciones extrapolan un modelo entrenado con Matemáticas y Portugués.
3. **El umbral de decisión** se fijó con las mismas predicciones fuera de partición con las que se evalúa, así que las métricas pueden ser ligeramente optimistas.
4. **La nota del primer periodo domina** las predicciones: el modelo complementa, no sustituye, el criterio del profesor.
5. **Diferencia de falsas alarmas en zona rural** (sección 6).
6. **Explicaciones SHAP aproximadas** (KernelExplainer con 200 muestras por alumno).

## 9. Cómo reproducirlo

Desde la raíz del repositorio:

```bash
python data/prepare_uci.py && python data/extend.py
```

Desde `ml/`:

```bash
python features.py && python baselines.py && python model.py
python combinar.py && python explain.py && python alerts.py && python publish.py
```

Todo usa semilla fija (42). Las credenciales de Supabase se leen de `ml/.env`, que no se sube al repositorio.

## 10. Versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v1.0 | 3 nov 2026 | Primera versión: modelo de alertas logística + LightGBM y nota estimada con red neuronal |
| v1.1 | 4 nov 2026 | Documentado cómo se generan las variables sintéticas y experimento de ablación sin ellas |
