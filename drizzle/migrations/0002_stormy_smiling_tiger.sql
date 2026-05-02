CREATE TABLE "league_memberships" (
	"user_id" uuid NOT NULL,
	"league_id" integer NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_memberships_user_id_league_id_pk" PRIMARY KEY("user_id","league_id")
);
--> statement-breakpoint
ALTER TABLE "leagues" ADD COLUMN "join_code" varchar(4);--> statement-breakpoint
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_memberships_league_idx" ON "league_memberships" USING btree ("league_id");--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_join_code_unique" UNIQUE("join_code");--> statement-breakpoint

-- ──────────── BACKFILL ────────────
-- 1) Cada profile con liga asignada hoy → membership directa.
INSERT INTO "league_memberships" ("user_id", "league_id")
SELECT "id", "league_id" FROM "profiles" WHERE "league_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- 2) TODOS los profiles (incluido admin con leagueId NULL) reciben la
-- membresía pública implícita. Si la pública ya estaba, el ON CONFLICT salta.
INSERT INTO "league_memberships" ("user_id", "league_id")
SELECT "p"."id", "l"."id"
FROM "profiles" "p", "leagues" "l"
WHERE "l"."is_public" = true
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- 3) Admins con leagueId NULL pasan a tener la pública como liga activa.
UPDATE "profiles"
SET "league_id" = (SELECT "id" FROM "leagues" WHERE "is_public" = true LIMIT 1)
WHERE "league_id" IS NULL;