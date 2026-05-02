-- Picks per (user, league): añade league_id a las 6 pred_* y al points_ledger.
-- Orden: 1) add column nullable, 2) backfill desde profiles.league_id,
-- 3) set NOT NULL, 4) drop old PK/unique, 5) add FK + new PK/unique + indices.

-- ─────────── 1. add nullable ───────────
ALTER TABLE "pred_group_ranking" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "pred_bracket_slot" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "pred_match_result" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "pred_special" ADD COLUMN "league_id" integer;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD COLUMN "league_id" integer;--> statement-breakpoint

-- ─────────── 2. backfill desde profiles.league_id ───────────
-- (la liga activa de cada usuario al hacer la migración).
UPDATE "pred_group_ranking" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "pred_group_ranking"."user_id");--> statement-breakpoint
UPDATE "pred_bracket_slot" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "pred_bracket_slot"."user_id");--> statement-breakpoint
UPDATE "pred_tournament_top_scorer" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "pred_tournament_top_scorer"."user_id");--> statement-breakpoint
UPDATE "pred_match_result" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "pred_match_result"."user_id");--> statement-breakpoint
UPDATE "pred_match_scorer" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "pred_match_scorer"."user_id");--> statement-breakpoint
UPDATE "pred_special" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "pred_special"."user_id");--> statement-breakpoint
UPDATE "points_ledger" SET "league_id" = (SELECT "league_id" FROM "profiles" WHERE "profiles"."id" = "points_ledger"."user_id");--> statement-breakpoint

-- Borra picks/ledger huérfanos (usuarios sin league_id en profiles, p.ej.
-- admins sin liga antes de la 0002 — la 0002 los pasa a pública, así que
-- aquí no debería quedar nada, pero por seguridad limpiamos NULLs).
DELETE FROM "pred_group_ranking" WHERE "league_id" IS NULL;--> statement-breakpoint
DELETE FROM "pred_bracket_slot" WHERE "league_id" IS NULL;--> statement-breakpoint
DELETE FROM "pred_tournament_top_scorer" WHERE "league_id" IS NULL;--> statement-breakpoint
DELETE FROM "pred_match_result" WHERE "league_id" IS NULL;--> statement-breakpoint
DELETE FROM "pred_match_scorer" WHERE "league_id" IS NULL;--> statement-breakpoint
DELETE FROM "pred_special" WHERE "league_id" IS NULL;--> statement-breakpoint
DELETE FROM "points_ledger" WHERE "league_id" IS NULL;--> statement-breakpoint

-- ─────────── 3. set NOT NULL ───────────
ALTER TABLE "pred_group_ranking" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_bracket_slot" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_match_result" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pred_special" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "points_ledger" ALTER COLUMN "league_id" SET NOT NULL;--> statement-breakpoint

-- ─────────── 4. drop old PKs/uniques ───────────
ALTER TABLE "points_ledger" DROP CONSTRAINT "points_ledger_unique";--> statement-breakpoint
ALTER TABLE "pred_bracket_slot" DROP CONSTRAINT "pred_bracket_slot_user_id_stage_slot_position_pk";--> statement-breakpoint
ALTER TABLE "pred_group_ranking" DROP CONSTRAINT "pred_group_ranking_user_id_group_id_pk";--> statement-breakpoint
ALTER TABLE "pred_match_result" DROP CONSTRAINT "pred_match_result_user_id_match_id_pk";--> statement-breakpoint
ALTER TABLE "pred_match_scorer" DROP CONSTRAINT "pred_match_scorer_user_id_match_id_pk";--> statement-breakpoint
ALTER TABLE "pred_special" DROP CONSTRAINT "pred_special_user_id_special_id_pk";--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" DROP CONSTRAINT "pred_tournament_top_scorer_pkey";--> statement-breakpoint

-- ─────────── 5. add FK + new PKs/uniques + indices ───────────
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_bracket_slot" ADD CONSTRAINT "pred_bracket_slot_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" ADD CONSTRAINT "pred_tournament_top_scorer_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_result" ADD CONSTRAINT "pred_match_result_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ADD CONSTRAINT "pred_match_scorer_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_special" ADD CONSTRAINT "pred_special_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "pred_bracket_slot" ADD CONSTRAINT "pred_bracket_slot_user_id_league_id_stage_slot_position_pk" PRIMARY KEY("user_id","league_id","stage","slot_position");--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_user_id_league_id_group_id_pk" PRIMARY KEY("user_id","league_id","group_id");--> statement-breakpoint
ALTER TABLE "pred_match_result" ADD CONSTRAINT "pred_match_result_user_id_league_id_match_id_pk" PRIMARY KEY("user_id","league_id","match_id");--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ADD CONSTRAINT "pred_match_scorer_user_id_league_id_match_id_pk" PRIMARY KEY("user_id","league_id","match_id");--> statement-breakpoint
ALTER TABLE "pred_special" ADD CONSTRAINT "pred_special_user_id_league_id_special_id_pk" PRIMARY KEY("user_id","league_id","special_id");--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" ADD CONSTRAINT "pred_tournament_top_scorer_user_id_league_id_pk" PRIMARY KEY("user_id","league_id");--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_unique" UNIQUE("user_id","league_id","source","source_key");--> statement-breakpoint

CREATE INDEX "points_ledger_league_idx" ON "points_ledger" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pred_bracket_slot_league_idx" ON "pred_bracket_slot" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pred_group_ranking_league_idx" ON "pred_group_ranking" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pred_match_result_league_idx" ON "pred_match_result" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pred_match_scorer_league_idx" ON "pred_match_scorer" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pred_special_league_idx" ON "pred_special" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "pred_tournament_top_scorer_league_idx" ON "pred_tournament_top_scorer" USING btree ("league_id");
