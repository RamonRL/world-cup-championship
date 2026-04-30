/**
 * FIFA 3-letter code → ISO-2 (or special "gb-eng" / "gb-sct") slug used by
 * HatScripts circle-flags. Source: https://github.com/HatScripts/circle-flags
 *
 * Circular SVG flags load full-bleed inside any container (no whitespace,
 * no aspect-ratio mismatch) and are rendered as the source of truth via
 * `<TeamFlag code="MEX" />`. The DB column `flag_url` is no longer read on
 * the front-end; admins do not need to upload an image to get a flag.
 */
export const FLAG_SLUG_BY_CODE: Record<string, string> = {
  // Group A
  MEX: "mx",
  KOR: "kr",
  RSA: "za",
  CZE: "cz",
  // Group B
  CAN: "ca",
  SUI: "ch",
  QAT: "qa",
  BIH: "ba",
  // Group C
  BRA: "br",
  MAR: "ma",
  SCO: "gb-sct",
  HAI: "ht",
  // Group D
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  // Group E
  GER: "de",
  ECU: "ec",
  CIV: "ci",
  CUW: "cw",
  // Group F
  NED: "nl",
  JPN: "jp",
  TUN: "tn",
  SWE: "se",
  // Group G
  BEL: "be",
  IRN: "ir",
  EGY: "eg",
  NZL: "nz",
  // Group H
  ESP: "es",
  URU: "uy",
  KSA: "sa",
  CPV: "cv",
  // Group I
  FRA: "fr",
  SEN: "sn",
  NOR: "no",
  IRQ: "iq",
  // Group J
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  // Group K
  POR: "pt",
  COL: "co",
  UZB: "uz",
  COD: "cd",
  // Group L
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
};

/**
 * Returns the public URL for a circle-flag SVG given a FIFA code. Falls back
 * to the lowercased ISO-2 best-guess if the code is not in the map (good
 * enough for new selecciones the admin adds without us shipping a code).
 */
export function circleFlagUrl(code: string | null | undefined): string | null {
  if (!code) return null;
  const slug = FLAG_SLUG_BY_CODE[code.toUpperCase()] ?? code.toLowerCase();
  return `https://hatscripts.github.io/circle-flags/flags/${slug}.svg`;
}
