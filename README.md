# World Cup Championship

Quiniela del Mundial 2026 entre amigos. Web app con seguimiento del torneo y motor de competición basado en predicciones.

## Stack

- **Next.js 15** App Router + **TypeScript** + **React 19**
- **Tailwind CSS v4** + **shadcn/ui**-style primitives
- **Supabase** (Postgres + Auth + Storage)
- **Drizzle ORM** + **zod**
- **Vercel** deployment

## Setup local

```bash
pnpm install
cp .env.example .env.local
# rellena las variables — ver más abajo
pnpm db:push        # crea las tablas en tu Supabase remoto
pnpm db:seed        # carga scoring rules + 12 grupos vacíos + predicciones especiales
pnpm dev
```

Abrir http://localhost:3000.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service-role (solo server) |
| `DATABASE_URL` | Postgres URL para runtime (transaction pooler) |
| `DATABASE_DIRECT_URL` | Postgres URL para migraciones (session pooler) |
| `ADMIN_EMAILS` | Lista separada por comas de emails con rol admin |
| `NEXT_PUBLIC_APP_NAME` | Nombre visible de la app |
| `NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT` | Fecha ISO del kickoff del Mundial |

## Scripts

- `pnpm dev` — desarrollo con turbo
- `pnpm build` / `pnpm start` — producción
- `pnpm typecheck` — TypeScript noEmit
- `pnpm lint` — ESLint
- `pnpm test` — Vitest (motor de puntuación)
- `pnpm db:generate` — genera SQL desde schema.ts
- `pnpm db:push` — aplica schema directamente (dev)
- `pnpm db:migrate` — aplica migraciones pendientes (prod)
- `pnpm db:studio` — Drizzle Studio
- `pnpm db:seed` — carga datos iniciales

## Despliegue

Vercel:
1. Importar el repo en Vercel.
2. Configurar las variables anteriores en Project Settings → Environment.
3. Crear los buckets `flags`, `players`, `avatars` en Supabase Storage (públicos).
4. Ejecutar `pnpm db:push` apuntando al `DATABASE_DIRECT_URL` de prod.
5. Deploy.

Supabase free tier (500 MB DB, 1 GB storage) y Vercel Hobby son suficientes para un grupo de amigos.
