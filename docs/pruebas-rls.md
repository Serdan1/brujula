# Pruebas de seguridad (RLS) y auditoría

**Fecha:** 4 de noviembre de 2026 · **Proyecto:** brujula-dev · **Responsable:** Aarón

Las pruebas simulan a cada usuario de prueba dentro del SQL Editor de Supabase
(rol `authenticated` con su `user_id`) y cuentan lo que puede leer.
El script está en `supabase/tests/pruebas_rls.sql`.

## Reglas que se comprueban

- Un **profesor** solo ve las clases que imparte y, dentro de ellas, solo los datos de sus asignaturas.
- Un **director** ve los datos de su escuela y nada de la otra.
- **Sin sesión** no se ve nada.
- Las vistas agregadas solo resumen lo que el usuario puede ver y ocultan los grupos de menos de 5 alumnos.
- Cada acción registrada y cada cambio de estado de una alerta queda en `auditoria` con el usuario que lo hizo.

## Resultados de lectura

| Usuario | Clases | Alumnos | Asignaturas | Filas de rendimiento | Escuelas | Filas de la vista |
| --- | --- | --- | --- | --- | --- | --- |
| profesor.gp (Portugués, GP) | 9 | 224 | 1 | 651 | 1 | 27 (v_clase_resumen) |
| profesor.ms (Portugués, MS) | 5 | 119 | 1 | 345 | 1 | 15 (v_clase_resumen) |
| director.gp | 18 | 441 | 4 | 4962 | 1 | 12 (v_asignatura_resumen) |
| director.ms | 10 | 233 | 4 | 2214 | 1 | 12 (v_asignatura_resumen) |
| Sin sesión (anon) | 0 | 0 | — | 0 | — | — |

**Comprobación cruzada:** entre los dos directores suman 28 clases, 674 alumnos y 7176 filas de
rendimiento, exactamente el total de la base de datos. Ninguno ve datos de la otra escuela.

**Profesores:** cada uno ve solo Portugués. En sus clases aparecen algunos alumnos que no cursan
Portugués (224 alumnos frente a 217 con notas): ve su nombre porque están en su clase, pero no sus notas.

## Resultado de auditoría

Como profesor.gp se marcó una alerta de prueba como revisada y se registró una acción sobre ella.

| Tabla | Operación | ¿Se guardó el usuario? |
| --- | --- | --- |
| accion | INSERT | Sí |
| alerta | UPDATE | Sí |

La alerta y la acción de prueba se borraron después.

## Conclusión

Todas las pruebas pasan. La clave pública (la que usa la web) no da acceso a ningún dato sin iniciar
sesión, y cada usuario ve solo lo que le corresponde. La clave de servicio, usada por el pipeline de ML
y por `data/load.py`, se salta estas reglas y solo está en el `.env` local y en GitHub Secrets.
