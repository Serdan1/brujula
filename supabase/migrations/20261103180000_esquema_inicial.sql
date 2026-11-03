-- =====================================================================
-- Brújula · Migración inicial · Esquema del contrato
-- Autor: Aarón · 3 nov 2026
-- Ejecutar en el SQL Editor de Supabase (brujula-dev) o con la CLI.
-- Los id de las tablas de datos los asigna Python (data/load.py),
-- así la carga es reproducible con la semilla fija.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Estructura del centro
-- ---------------------------------------------------------------------

create table escuela (
  id      integer primary key,
  nombre  text not null unique            -- 'GP' o 'MS'
);

create table profesor (
  id          integer primary key,
  user_id     uuid unique references auth.users (id) on delete set null,
  nombre      text not null,
  escuela_id  integer not null references escuela (id),
  rol         text not null check (rol in ('profesor', 'director'))
);
create index on profesor (escuela_id);

create table asignatura (
  id      integer primary key,
  nombre  text not null unique            -- Portugués, Matemáticas + sintéticas
);

create table clase (
  id          integer primary key,
  escuela_id  integer not null references escuela (id),
  curso       smallint not null,
  letra       char(1) not null,
  unique (escuela_id, curso, letra)
);

create table imparte (
  profesor_id    integer not null references profesor (id) on delete cascade,
  asignatura_id  integer not null references asignatura (id),
  clase_id       integer not null references clase (id) on delete cascade,
  primary key (profesor_id, asignatura_id, clase_id),
  unique (asignatura_id, clase_id)        -- una clase tiene un solo profesor por asignatura
);
create index on imparte (clase_id);

-- ---------------------------------------------------------------------
-- 2. Alumnos y datos
-- ---------------------------------------------------------------------

create table alumno (
  id        integer primary key,
  clase_id  integer not null references clase (id) on delete cascade,
  nombre    text not null,                -- ficticio (Faker pt_PT)
  sexo      char(1) not null check (sexo in ('F', 'M')),
  edad      smallint not null check (edad between 14 and 22),
  zona      char(1) not null check (zona in ('U', 'R'))
);
create index on alumno (clase_id);

create table rendimiento (
  alumno_id       integer  not null references alumno (id) on delete cascade,
  asignatura_id   integer  not null references asignatura (id),
  periodo         smallint not null check (periodo between 1 and 3),
  nota_examen     numeric(4,2) check (nota_examen between 0 and 20),
  nota_practicas  numeric(4,2) check (nota_practicas between 0 and 20),
  participacion   numeric(3,1) check (participacion between 0 and 10),
  asistencia      numeric(5,2) check (asistencia between 0 and 100),
  faltas          smallint check (faltas >= 0),
  primary key (alumno_id, asignatura_id, periodo)
);
create index on rendimiento (asignatura_id, periodo);

-- Variables originales de la UCI que el modelo puede usar.
-- Van por alumno Y asignatura porque en la UCI studytime, failures, paid,
-- activities, higher, traveltime, etc. pueden ser distintos en Mat y Por.
-- Las variables excluidas por ética (Dalc, Walc, romantic, famrel, Pstatus,
-- guardian, Mjob, Fjob, Medu, Fedu) NO se guardan: minimización de datos.
create table contexto_alumno (
  alumno_id      integer  not null references alumno (id) on delete cascade,
  asignatura_id  integer  not null references asignatura (id),
  famsize        text     check (famsize in ('LE3', 'GT3')),
  reason         text,
  nursery        boolean,
  traveltime     smallint check (traveltime between 1 and 4),
  studytime      smallint check (studytime between 1 and 4),
  failures       smallint check (failures between 0 and 4),
  schoolsup      boolean,
  famsup         boolean,
  paid           boolean,
  activities     boolean,
  higher         boolean,
  internet       boolean,
  freetime       smallint check (freetime between 1 and 5),
  goout          smallint check (goout between 1 and 5),
  health         smallint check (health between 1 and 5),
  primary key (alumno_id, asignatura_id)
);

-- ---------------------------------------------------------------------
-- 3. Salidas del modelo (escribe Daniel)
-- ---------------------------------------------------------------------

create table prediccion (
  alumno_id            integer  not null references alumno (id) on delete cascade,
  asignatura_id        integer  not null references asignatura (id),
  periodo              smallint not null check (periodo between 1 and 3),
  prob_apoyo           numeric(5,4) not null check (prob_apoyo between 0 and 1),
  nota_final_estimada  numeric(4,2) check (nota_final_estimada between 0 and 20),
  ic_inf               numeric(4,2),
  ic_sup               numeric(4,2),
  modelo_version       text not null,
  creado_en            timestamptz not null default now(),
  primary key (alumno_id, asignatura_id, periodo, modelo_version),
  check (ic_inf <= ic_sup)
);
create index on prediccion (asignatura_id);

create table explicacion (
  id             bigint generated by default as identity primary key,
  alumno_id      integer references alumno (id) on delete cascade,
  clase_id       integer references clase (id) on delete cascade,
  asignatura_id  integer not null references asignatura (id),
  variable       text not null,
  valor_shap     double precision not null,
  valor_real     text,
  orden          smallint not null check (orden >= 1),
  check (num_nonnulls(alumno_id, clase_id) = 1)   -- o de un alumno o de una clase
);
create index on explicacion (alumno_id, asignatura_id);
create index on explicacion (clase_id, asignatura_id);

create table alerta (
  id               bigint generated by default as identity primary key,
  nivel            text not null check (nivel in ('asignatura', 'clase', 'alumno')),
  escuela_id       integer not null references escuela (id),   -- necesario para RLS del director
  asignatura_id    integer not null references asignatura (id),
  clase_id         integer references clase (id) on delete cascade,
  alumno_id        integer references alumno (id) on delete cascade,
  motivo           text not null check (motivo in (
                     'faltas_en_aumento',
                     'bajada_de_notas',
                     'practicas_por_debajo',
                     'baja_participacion',
                     'riesgo_de_suspenso',
                     'grupo_por_debajo_de_la_media')),
  severidad        text not null check (severidad in ('alta', 'media')),
  titulo           text not null,
  descripcion      text not null,
  variables        jsonb not null default '[]'::jsonb,
  estado           text not null default 'nueva'
                     check (estado in ('nueva', 'revisada', 'descartada')),
  motivo_descarte  text,                                       -- para «Descartar con motivo»
  creada_en        timestamptz not null default now(),
  -- coherencia entre nivel y los id rellenos
  check (
    (nivel = 'alumno'     and alumno_id is not null and clase_id is not null) or
    (nivel = 'clase'      and alumno_id is null     and clase_id is not null) or
    (nivel = 'asignatura' and alumno_id is null     and clase_id is null)
  )
);
create index on alerta (escuela_id);
create index on alerta (asignatura_id, severidad);
create index on alerta (clase_id);
create index on alerta (alumno_id);
create index on alerta (estado);

create table analisis_clase (
  clase_id        integer not null references clase (id) on delete cascade,
  asignatura_id   integer not null references asignatura (id),
  resumen         jsonb not null,
  actualizado_en  timestamptz not null default now(),
  primary key (clase_id, asignatura_id)
);

-- ---------------------------------------------------------------------
-- 4. Acciones del profesor (escribe la web de Iván)
-- ---------------------------------------------------------------------

create table accion (
  id              bigint generated by default as identity primary key,
  alerta_id       bigint  not null references alerta (id) on delete cascade,
  profesor_id     integer not null references profesor (id),
  tipo            text not null,
  descripcion     text,
  fecha_inicio    date not null default current_date,
  fecha_revision  date,
  resultado       text,
  creada_en       timestamptz not null default now(),
  check (fecha_revision is null or fecha_revision >= fecha_inicio)
);
create index on accion (alerta_id);
create index on accion (profesor_id);

-- ---------------------------------------------------------------------
-- 5. Auditoría (el trigger se añade mañana, 4 nov)
-- ---------------------------------------------------------------------

create table auditoria (
  id             bigint generated by default as identity primary key,
  tabla          text not null,
  operacion      text not null,
  registro_id    bigint,
  usuario        uuid default auth.uid(),
  datos_antes    jsonb,
  datos_despues  jsonb,
  fecha          timestamptz not null default now()
);
