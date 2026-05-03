-- Pospone la predicción especial "¿Habrá alguna tanda de penaltis en
-- octavos?" hasta que termine la fase de grupos y publiquemos un nuevo
-- bloque de especiales sobre la fase final. Idempotente: si ya no
-- existe en la DB, no hace nada.
--
-- Las predicciones de usuarios (pred_special) caen en cascada por la
-- FK ON DELETE CASCADE, así que no hay filas huérfanas.
DELETE FROM "special_predictions" WHERE "key" = 'pens_in_r16';
