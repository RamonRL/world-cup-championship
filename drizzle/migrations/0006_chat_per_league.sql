-- Migración: chat por liga.
--
-- Eliminamos el chat por partido (los hilos por match no aportaban señal vs
-- ruido) y reemplazamos el chat global compartido por un hilo independiente
-- por cada liga: la quiniela pública mantiene un hilo "global" para todos
-- sus miembros y cada quiniela privada estrena su propio chat.
--
-- Truncamos chat_messages antes de cambiar las columnas porque:
--   1) Las filas con scope='match' apuntan a un partido y deben desaparecer
--      junto con el feature.
--   2) Las filas con scope='global' no tienen un league_id natural —
--      asignarlas a la pública sería arbitrario y los chats viejos son
--      efímeros.
TRUNCATE TABLE "chat_messages";

DROP INDEX IF EXISTS "chat_messages_scope_idx";
DROP INDEX IF EXISTS "chat_messages_match_idx";

ALTER TABLE "chat_messages" DROP COLUMN "scope";
ALTER TABLE "chat_messages" DROP COLUMN "match_id";

DROP TYPE IF EXISTS "chat_scope";

ALTER TABLE "chat_messages"
  ADD COLUMN "league_id" integer NOT NULL
  REFERENCES "leagues"("id") ON DELETE CASCADE;

CREATE INDEX "chat_messages_league_idx"
  ON "chat_messages" ("league_id", "created_at");
