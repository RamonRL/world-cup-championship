-- Renombrar la liga pública: "Liga principal" → "Quiniela pública".
-- El slug y el id permanecen iguales (slug es la clave que usan los
-- helpers para localizarla; el name es solo display).
UPDATE "leagues"
SET "name" = 'Quiniela pública'
WHERE "slug" = 'liga-principal';
