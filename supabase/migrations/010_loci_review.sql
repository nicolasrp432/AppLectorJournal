-- Repaso espaciado (SM-2) por palacio de memoria.
-- Espeja el esquema de programación ya usado en `flashcards` (003) para
-- planificar cuándo conviene volver a recorrer cada palacio. El cálculo lo
-- hace el cliente con `lib/sm2.ts` (mismo motor que las flashcards) y persiste
-- aquí el resultado. La RLS de `user_memory_palaces` ya existe (006), no se toca.

alter table public.user_memory_palaces add column if not exists interval         int         not null default 0;
alter table public.user_memory_palaces add column if not exists repetitions      int         not null default 0;
alter table public.user_memory_palaces add column if not exists ease_factor      float       not null default 2.5;
alter table public.user_memory_palaces add column if not exists next_due         timestamptz not null default now();
alter table public.user_memory_palaces add column if not exists last_reviewed_at timestamptz;

-- Índice para listar rápidamente los palacios "a repasar hoy" de cada usuario.
create index if not exists idx_palaces_user_due on public.user_memory_palaces (user_id, next_due asc);
