CREATE TYPE "public"."chat_scope" AS ENUM('global', 'match');--> statement-breakpoint
CREATE TYPE "public"."match_stage" AS ENUM('group', 'r32', 'r16', 'qf', 'sf', 'third', 'final');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TYPE "public"."points_source" AS ENUM('group_position', 'group_top2_swap', 'bracket_slot', 'tournament_top_scorer', 'match_exact_score', 'match_outcome', 'knockout_qualifier', 'knockout_pens_bonus', 'knockout_score_90', 'match_scorer', 'match_first_scorer', 'special_prediction');--> statement-breakpoint
CREATE TYPE "public"."special_prediction_type" AS ENUM('yes_no', 'single_choice', 'team_with_round', 'number_range', 'player');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"payload_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" "chat_scope" NOT NULL,
	"match_id" integer,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "group_standings" (
	"group_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"position" smallint NOT NULL,
	"played" smallint DEFAULT 0 NOT NULL,
	"won" smallint DEFAULT 0 NOT NULL,
	"drawn" smallint DEFAULT 0 NOT NULL,
	"lost" smallint DEFAULT 0 NOT NULL,
	"goals_for" smallint DEFAULT 0 NOT NULL,
	"goals_against" smallint DEFAULT 0 NOT NULL,
	"points" smallint DEFAULT 0 NOT NULL,
	"finalized_at" timestamp with time zone,
	CONSTRAINT "group_standings_group_id_team_id_pk" PRIMARY KEY("group_id","team_id"),
	CONSTRAINT "position_range" CHECK ("group_standings"."position" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "match_scorers" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"minute" smallint,
	"is_first_goal" boolean DEFAULT false NOT NULL,
	"is_own_goal" boolean DEFAULT false NOT NULL,
	"is_penalty" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchdays" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stage" "match_stage" NOT NULL,
	"prediction_deadline_at" timestamp with time zone NOT NULL,
	"order_index" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"stage" "match_stage" NOT NULL,
	"matchday_id" integer,
	"group_id" integer,
	"home_team_id" integer,
	"away_team_id" integer,
	"scheduled_at" timestamp with time zone NOT NULL,
	"venue" text,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" smallint,
	"away_score" smallint,
	"went_to_pens" boolean DEFAULT false NOT NULL,
	"home_score_pen" smallint,
	"away_score_pen" smallint,
	"winner_team_id" integer,
	CONSTRAINT "matches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"jersey_number" smallint,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "points_source" NOT NULL,
	"source_ref" jsonb NOT NULL,
	"source_key" text NOT NULL,
	"points" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "points_ledger_unique" UNIQUE("user_id","source","source_key")
);
--> statement-breakpoint
CREATE TABLE "pred_bracket_slot" (
	"user_id" uuid NOT NULL,
	"stage" "match_stage" NOT NULL,
	"slot_position" smallint NOT NULL,
	"predicted_team_id" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pred_bracket_slot_user_id_stage_slot_position_pk" PRIMARY KEY("user_id","stage","slot_position")
);
--> statement-breakpoint
CREATE TABLE "pred_group_ranking" (
	"user_id" uuid NOT NULL,
	"group_id" integer NOT NULL,
	"pos1_team_id" integer,
	"pos2_team_id" integer,
	"pos3_team_id" integer,
	"pos4_team_id" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pred_group_ranking_user_id_group_id_pk" PRIMARY KEY("user_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "pred_match_result" (
	"user_id" uuid NOT NULL,
	"match_id" integer NOT NULL,
	"home_score" smallint NOT NULL,
	"away_score" smallint NOT NULL,
	"will_go_to_pens" boolean DEFAULT false NOT NULL,
	"winner_team_id" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pred_match_result_user_id_match_id_pk" PRIMARY KEY("user_id","match_id")
);
--> statement-breakpoint
CREATE TABLE "pred_match_scorer" (
	"user_id" uuid NOT NULL,
	"match_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pred_match_scorer_user_id_match_id_pk" PRIMARY KEY("user_id","match_id")
);
--> statement-breakpoint
CREATE TABLE "pred_special" (
	"user_id" uuid NOT NULL,
	"special_id" integer NOT NULL,
	"value_json" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pred_special_user_id_special_id_pk" PRIMARY KEY("user_id","special_id")
);
--> statement-breakpoint
CREATE TABLE "pred_tournament_top_scorer" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"player_id" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nickname" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"banned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "scoring_rules" (
	"key" text PRIMARY KEY NOT NULL,
	"value_json" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "special_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"question" text NOT NULL,
	"type" "special_prediction_type" NOT NULL,
	"options_json" jsonb,
	"points_config_json" jsonb NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"resolved_value_json" jsonb,
	"resolved_at" timestamp with time zone,
	"order_index" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "special_predictions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"flag_url" text,
	"group_id" integer,
	CONSTRAINT "teams_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_deleted_by_profiles_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scorers" ADD CONSTRAINT "match_scorers_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scorers" ADD CONSTRAINT "match_scorers_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scorers" ADD CONSTRAINT "match_scorers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchday_id_matchdays_id_fk" FOREIGN KEY ("matchday_id") REFERENCES "public"."matchdays"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_bracket_slot" ADD CONSTRAINT "pred_bracket_slot_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_bracket_slot" ADD CONSTRAINT "pred_bracket_slot_predicted_team_id_teams_id_fk" FOREIGN KEY ("predicted_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_pos1_team_id_teams_id_fk" FOREIGN KEY ("pos1_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_pos2_team_id_teams_id_fk" FOREIGN KEY ("pos2_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_pos3_team_id_teams_id_fk" FOREIGN KEY ("pos3_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_group_ranking" ADD CONSTRAINT "pred_group_ranking_pos4_team_id_teams_id_fk" FOREIGN KEY ("pos4_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_result" ADD CONSTRAINT "pred_match_result_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_result" ADD CONSTRAINT "pred_match_result_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_result" ADD CONSTRAINT "pred_match_result_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ADD CONSTRAINT "pred_match_scorer_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ADD CONSTRAINT "pred_match_scorer_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_match_scorer" ADD CONSTRAINT "pred_match_scorer_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_special" ADD CONSTRAINT "pred_special_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_special" ADD CONSTRAINT "pred_special_special_id_special_predictions_id_fk" FOREIGN KEY ("special_id") REFERENCES "public"."special_predictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" ADD CONSTRAINT "pred_tournament_top_scorer_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pred_tournament_top_scorer" ADD CONSTRAINT "pred_tournament_top_scorer_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_scope_idx" ON "chat_messages" USING btree ("scope","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_match_idx" ON "chat_messages" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_scorers_match_idx" ON "match_scorers" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_scorers_player_idx" ON "match_scorers" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "matches_scheduled_idx" ON "matches" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "matches_stage_idx" ON "matches" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "matches_matchday_idx" ON "matches" USING btree ("matchday_id");--> statement-breakpoint
CREATE INDEX "matches_group_idx" ON "matches" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "players_team_idx" ON "players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "points_ledger_user_idx" ON "points_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "points_ledger_source_key_idx" ON "points_ledger" USING btree ("source","source_key");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "teams_group_idx" ON "teams" USING btree ("group_id");