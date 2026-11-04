# Brújula — Guía de estilo visual v1.0

**Responsable:** Alex · **Destinatario:** Iván (frontend) · **Proyecto:** Hack4Edu 2026, Reto 13

## 1. Paleta

| Token | HEX | Uso |
|---|---|---|
| `primary` | `#174A55` | Navegación, títulos, botones principales |
| `background` | `#F7F4ED` | Fondo general |
| `warning` | `#E9B45C` | Indicadores de aviso |
| `surface` | `#FFFFFF` | Tarjetas y formularios |
| `chart-secondary` | `#A7C5C7` | Series secundarias |
| `text` | `#24343A` | Texto principal |
| `muted` | `#64777A` | Texto secundario |
| `border` | `#CBD5D4` | Bordes y divisores |
| `warning-surface` | `#F9E9C9` | Fondo de alertas |
| `warning-text` | `#78541B` | Texto de alertas |

**Accesibilidad:** usar texto oscuro sobre ámbar y fondo arena; texto blanco sobre azul petróleo. No depender solo del color para distinguir alertas: añadir etiqueta de severidad, motivo y explicación. Comprobar contraste WCAG en la implementación.

## 2. Tipografía

- Familia: **Inter**, con alternativas `system-ui, sans-serif`.
- Título de página: 30 px / 700.
- Título de sección: 24 px / 600.
- Título de tarjeta: 18 px / 600.
- Texto: 16 px / 400.
- Etiquetas y tablas: 14 px / 500.
- Texto auxiliar: 12–13 px / 400.
- Interlineado del cuerpo: 1.5.

## 3. Componentes

- Fondo general arena; tarjetas blancas con borde `#CBD5D4` y esquinas de 10–12 px.
- Botón primario: azul petróleo, texto blanco, esquinas de 8 px.
- Botón secundario: fondo blanco, borde azul petróleo, texto azul petróleo.
- Alertas: fondo `#F9E9C9`, texto `#78541B`, etiqueta «Alta» o «Media» y motivo legible.
- Campos de formulario: etiqueta visible, borde suave, indicador de foco perceptible.
- Espaciado: escala de 8 px; mínimo 16 px dentro de tarjetas.
- Tablas: encabezados visibles, filas separadas sutilmente, nombres de columnas explícitos.

## 4. Gráficos

- **Barras:** comparar asistencia, notas agregadas o alertas por motivo.
- **Líneas:** evolución temporal de indicadores.
- **Barras horizontales:** variables explicativas SHAP, con nombres comprensibles.
- **Intervalos:** mostrar nota estimada junto con su incertidumbre, sin presentar el modelo como certeza.
- Usar azul petróleo para serie principal, azul suave para comparación y ámbar solo para avisos.
- Etiquetar ejes, unidades, periodos y origen de datos; mostrar estados de carga, vacío y error.
- Evitar gráficos 3D, paletas arcoíris y colores que impliquen juicios sobre alumnos.

## 5. Reglas éticas del producto

- No ordenar alumnos de «mejor» a «peor» ni publicar rankings.
- No mostrar porcentajes individuales de riesgo.
- Ordenar alertas por severidad y motivo; explicar siempre las variables relevantes.
- Presentar predicciones como apoyo a la decisión del profesor, no como diagnósticos.
- El director solo debe ver información agregada conforme a los permisos acordados.

## 6. Aplicación en pantallas

1. **Inicio:** tarjetas de asignaturas y alertas prioritarias.
2. **Asignatura:** tarjetas o tabla de clases con indicadores agregados.
3. **Clase:** tabla legible con notas, prácticas, participación y asistencia; alertas explicadas.
4. **Análisis completo:** SHAP, comparación de modelos, equidad e intervalos.
5. **Registrar acción:** formulario con tipo, descripción y fecha de revisión.
