# Estado de la implementación

Última actualización: 2026-04-29 (sesión 2).

## Resumen

La web app está **funcionalmente completa** para el ciclo del Mundial: registro, predicciones de las 6 categorías, admin para introducir todos los datos, scoring engine que se dispara al guardar resultados, ranking en tiempo real, chat global y por partido. Falta sólo el polish visual fino y el despliegue.

- ✅ Build de Next.js limpio (`pnpm build`) → 39 rutas
- ✅ 32 tests verdes del scoring engine (`pnpm test`)
- ✅ Typecheck limpio (`pnpm typecheck`)

## Lo que ya funciona

### Infraestructura
- Next.js 15 + TypeScript + Tailwind 4 + shadcn/ui-style primitives.
- Supabase (auth + Postgres + Storage helpers).
- Drizzle ORM + migración generada (`drizzle/migrations/0000_brave_klaw.sql`).
- Vitest config con tests del motor de puntuación.
- Build production listo.

### Autenticación & roles
- Login con magic link (Supabase OTP) en `/login`.
- Callback `/auth/callback` que crea/actualiza el perfil.
- `requireUser` y `requireAdmin` con redirect.
- Rol admin determinado por la variable `ADMIN_EMAILS`.
- Logout en POST `/logout`.

### Shell
- Sidebar de escritorio + bottom-nav móvil (en `(app)`).
- Sidebar admin separada bajo `/admin`.
- Cabecera con avatar y dropdown.

### Admin (vertical funcional)
- **Selecciones**: CRUD con upload de bandera a Supabase Storage.
- **Jugadores**: CRUD por selección + **importador en bulk** (CSV/TSV/lista pegada).
- **Calendario**: jornadas + partidos.
- **Partidos / resultados**: edición de marcador, decisión por penaltis, goleadores con minuto. Al guardar como "finalizado" se dispara `recomputeMatchScoringForAllUsers`.
- **Reglas de puntuación**: editor visual; al guardar recalcula todo el sistema.
- **Predicciones especiales**: resolver valores en JSON; al guardar recalcula puntos.
- **Operaciones**: cerrar fase de grupos (calcula clasificaciones + puntos), cerrar cada ronda eliminatoria, cerrar Bota de Oro, recalcular todo.
- **Usuarios**: lista de participantes con rol.
- **Moderación de chat**: soft-delete y baneo.
- **Auditoría**: log de acciones admin.

### Público (login required)
- `/dashboard`: stats reales, posición, próximo cierre, resultados recientes, checklist pre-torneo.
- `/calendario`: lista por jornada con marcador.
- `/grupos`: 12 grupos con tablas de clasificación.
- `/goleadores`: ranking de goleadores leído de `match_scorers`.
- `/ranking`: leaderboard global con tiebreakers.
- `/bracket`: vista del cuadro eliminatorio con tus picks superpuestos.
- `/estadisticas`: cifras agregadas (goles totales, empates, penaltis, …).
- `/comparar`: compara tus predicciones con las de otro participante.
- `/partido/[id]`: detalle con marcador, goleadores y **chat por partido**.
- `/perfil`: editar nickname y avatar.
- `/chat`: hilo global con mensajes, eliminación admin.

### Predicciones
- `/predicciones`: hub.
- `/predicciones/grupos`: drag-and-drop para ordenar 4 selecciones por grupo.
- `/predicciones/bracket`: builder por etapas (R16 → QF → SF → Final → Campeón).
- `/predicciones/goleador-torneo`: selector con buscador.
- `/predicciones/especiales`: form dinámico que renderiza según tipo (yes_no, single_choice, team_with_round, number_range, player).
- `/predicciones/jornada/[id]`: marcadores exactos por jornada con flags de penaltis y clasificado en knockout.
- `/predicciones/partido/[matchId]`: selector de jugador para "goleador del partido", organizado por equipo y con buscador.

### Motor de puntuación (lib/scoring/)
- Funciones puras (32 tests verdes) para las 6 categorías + tiebreakers.
- Capa de persistencia idempotente (delete + insert) sobre `points_ledger`.
- Recálculos disparados por cada acción admin relevante.

### Chat
- Hilo global en `/chat` y por-partido en `/partido/[id]`.
- Server actions para enviar/eliminar/banear.
- Soft-delete preserva el mensaje (tachado).

## Siguientes pasos (no bloqueantes)

### Polish
- [ ] Aplicar `frontend-design` skill para refinar hero del login, dashboard, ranking y bracket. La identidad visual está definida en `app/globals.css` y los componentes están listos.
- [ ] Notificaciones in-app: badge en bottom-nav móvil con cierres pendientes.
- [ ] Loading states (Skeleton) en lugar de empty states durante cargas.

### Realtime
- [ ] Conectar Supabase Realtime para que el chat refresque sin recargar.
- [ ] Subscribir a cambios de `matches` para que el ranking se actualice cuando admin guarde un resultado.

### Admin (mejoras)
- [ ] CRUD completo de predicciones especiales (no sólo resolver). Ahora la creación se hace vía seed; la edición desde admin es solo para resolver el valor final.
- [ ] Acciones de baneo/promoción más visibles en `/admin/usuarios` (hoy se hacen desde la lista del chat).

### Despliegue
1. Crear proyecto en Supabase, copiar las claves a Vercel env vars.
2. `pnpm db:push` apuntando al `DATABASE_DIRECT_URL` de prod.
3. Ejecutar `supabase/setup.sql` en el SQL editor de Supabase (RLS + buckets).
4. `pnpm db:seed` para cargar reglas + grupos + especiales.
5. Cargar las 48 selecciones, sus banderas, sus jugadores (bulk import) y las 104 partidos.
6. Compartir el link con tus amigos.

### Pendiente menor
- [ ] El `/admin/jugadores` no permite asignar `groupId` a equipos sin grupo (eso se hace en `/admin/selecciones`).
- [ ] El bracket builder permite picks libres por etapa; idealmente debería forzar consistencia (los QF deben venir de los R16 picks). Actualmente la consistencia es opcional pero recomendada en la UI.

## Comandos útiles

```bash
pnpm dev          # desarrollo
pnpm typecheck    # TS
pnpm test         # tests del scoring
pnpm build        # producción
pnpm db:generate  # nueva migración a partir de schema.ts
pnpm db:push      # aplica schema (dev rápido)
pnpm db:seed      # carga reglas + grupos + especiales por defecto
pnpm db:studio    # Drizzle Studio para mirar/editar la DB
```

## Schema-as-truth

- `lib/db/schema.ts` es la fuente de verdad de la base de datos.
- `lib/scoring/defaults.ts` contiene los valores iniciales de las reglas de puntuación y de las predicciones especiales.
- `supabase/setup.sql` describe la configuración de RLS y Realtime que hay que aplicar tras `db:push`.
