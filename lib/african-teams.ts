/**
 * Selecciones de la confederación africana (CAF) clasificadas al Mundial 2026.
 * Se usan para resolver automáticamente el especial `africa_in_semis`.
 *
 * Mantener actualizada la lista cuando cambien los participantes (p. ej., si
 * en la repesca FIFA cae alguna selección africana o entra una nueva). El
 * `code` es el FIFA 3-letras que ya usamos en `teams.code`.
 */
export const AFRICAN_TEAM_CODES: ReadonlySet<string> = new Set([
  "DZA", // Argelia (clasificada)
  "EGY", // Egipto
  "MAR", // Marruecos
  "SEN", // Senegal
  "TUN", // Túnez
  "NGA", // Nigeria
  "GHA", // Ghana
  "CIV", // Costa de Marfil
  "CMR", // Camerún
  "RSA", // Sudáfrica
  "CPV", // Cabo Verde
]);

export function isAfricanTeam(code: string | null | undefined): boolean {
  if (!code) return false;
  return AFRICAN_TEAM_CODES.has(code.toUpperCase());
}
