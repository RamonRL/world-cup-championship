CREATE INDEX "profiles_country_code_idx" ON "profiles" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "profiles_last_seen_idx" ON "profiles" USING btree ("last_seen_at");