CREATE TABLE "minigame_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_key" text NOT NULL,
	"user_id" uuid,
	"guest_nickname" text,
	"identity_key" text NOT NULL,
	"display_name" text NOT NULL,
	"best_score" integer NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "minigame_scores_identity" UNIQUE("game_key","identity_key")
);
--> statement-breakpoint
ALTER TABLE "minigame_scores" ADD CONSTRAINT "minigame_scores_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "minigame_scores_game_score_idx" ON "minigame_scores" USING btree ("game_key","best_score");