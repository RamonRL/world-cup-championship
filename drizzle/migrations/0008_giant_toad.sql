-- Performance indexes for dashboard/leaderboard hot paths.
-- En prod con tablas grandes, considera ejecutar manualmente con
-- `CREATE INDEX CONCURRENTLY` desde Supabase SQL editor para evitar
-- locks de escritura. Drizzle no soporta CONCURRENTLY dentro de su
-- runner, así que aquí van como CREATE INDEX bloqueantes (rápidos
-- ahora porque las tablas aún están vacías o muy pequeñas).
CREATE INDEX "points_ledger_league_user_idx" ON "points_ledger" USING btree ("league_id","user_id");--> statement-breakpoint
CREATE INDEX "points_ledger_user_league_computed_idx" ON "points_ledger" USING btree ("user_id","league_id","computed_at");--> statement-breakpoint
CREATE INDEX "pred_match_result_match_user_league_idx" ON "pred_match_result" USING btree ("match_id","user_id","league_id");--> statement-breakpoint
CREATE INDEX "pred_match_scorer_match_user_league_idx" ON "pred_match_scorer" USING btree ("match_id","user_id","league_id");