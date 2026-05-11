-- Añade tracking básico de país y última conexión al perfil:
--   * country_code  → ISO-3166-1 alpha-2 capturado en el primer login
--                     leyendo `x-vercel-ip-country`. Inmutable después.
--   * last_seen_at  → timestamp de la última actividad del usuario,
--                     actualizado con throttling de 5 min en
--                     getCurrentUser().
ALTER TABLE "profiles" ADD COLUMN "country_code" text;
ALTER TABLE "profiles" ADD COLUMN "last_seen_at" timestamp with time zone;
