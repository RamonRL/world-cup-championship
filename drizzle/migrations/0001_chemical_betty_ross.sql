CREATE TABLE "leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"invite_token" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_slug_unique" UNIQUE("slug"),
	CONSTRAINT "leagues_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "league_id" integer;--> statement-breakpoint
CREATE INDEX "leagues_invite_token_idx" ON "leagues" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "leagues_is_public_idx" ON "leagues" USING btree ("is_public");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_league_idx" ON "profiles" USING btree ("league_id");--> statement-breakpoint
-- Seed: liga principal pública, asigna todos los perfiles existentes a ella
-- (excepto admins, que viven sin liga fija para poder alternar contexto).
INSERT INTO "leagues" ("slug", "name", "description", "invite_token", "is_public", "created_at")
VALUES (
  'liga-principal',
  'Liga principal',
  'Liga pública. Cualquiera con el enlace de la web entra aquí por defecto.',
  'PUBLIC',
  true,
  now()
)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
UPDATE "profiles"
SET "league_id" = (SELECT "id" FROM "leagues" WHERE "slug" = 'liga-principal')
WHERE "league_id" IS NULL AND "role" <> 'admin';