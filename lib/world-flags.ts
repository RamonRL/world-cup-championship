/**
 * Catálogo mundial de banderas usado por el minijuego "Adivina la bandera".
 *
 * Cobertura: 193 estados miembro de la ONU + Estado de Palestina, Ciudad
 * del Vaticano, Taiwán y Kosovo (los 4 estados con reconocimiento amplio
 * fuera del cupo ONU). Total: 197 banderas reconocidas internacionalmente.
 *
 * Códigos: ISO 3166-1 alpha-2 en minúsculas.
 * Nombres en español: derivados con `Intl.DisplayNames("es")`, que cubre
 * todos los códigos válidos sin que tengamos que mantener una lista a mano.
 *
 * Banderas servidas por flagcdn.com (SVG rectangular). No requiere
 * configuración en `next.config.ts` porque consumimos el SVG con `<img>`
 * (no pasa por el optimizador de Next).
 */

const ISO_CODES = [
  // A
  "af", "al", "dz", "ad", "ao", "ag", "ar", "am", "au", "at", "az",
  // B
  "bs", "bh", "bd", "bb", "by", "be", "bz", "bj", "bt", "bo", "ba", "bw", "br", "bn", "bg", "bf", "bi",
  // C
  "cv", "kh", "cm", "ca", "cf", "td", "cl", "cn", "co", "km", "cg", "cd", "cr", "ci", "hr", "cu", "cy", "cz",
  // D-E
  "dk", "dj", "dm", "do",
  "ec", "eg", "sv", "gq", "er", "ee", "sz", "et",
  // F-G
  "fj", "fi", "fr",
  "ga", "gm", "ge", "de", "gh", "gr", "gd", "gt", "gn", "gw", "gy",
  // H-I
  "ht", "hn", "hu",
  "is", "in", "id", "ir", "iq", "ie", "il", "it",
  // J-K-L
  "jm", "jp", "jo",
  "kz", "ke", "ki", "kp", "kr", "kw", "kg",
  "la", "lv", "lb", "ls", "lr", "ly", "li", "lt", "lu",
  // M
  "mg", "mw", "my", "mv", "ml", "mt", "mh", "mr", "mu", "mx", "fm", "md", "mc", "mn", "me", "ma", "mz", "mm",
  // N-O
  "na", "nr", "np", "nl", "nz", "ni", "ne", "ng", "mk", "no",
  "om",
  // P-Q
  "pk", "pw", "pa", "pg", "py", "pe", "ph", "pl", "pt",
  "qa",
  // R-S
  "ro", "ru", "rw",
  "kn", "lc", "vc", "ws", "sm", "st", "sa", "sn", "rs", "sc", "sl", "sg", "sk", "si", "sb", "so", "za", "ss", "es", "lk", "sd", "sr", "se", "ch", "sy",
  // T-U
  "tj", "tz", "th", "tl", "tg", "to", "tt", "tn", "tr", "tm", "tv",
  "ug", "ua", "ae", "gb", "us", "uy", "uz",
  // V-Z
  "vu", "ve", "vn",
  "ye",
  "zm", "zw",
  // Observers + de facto independientes
  "va", "ps", "tw", "xk",
] as const;

export type CountryEntry = {
  code: string;
  name: string;
};

const displayNames = new Intl.DisplayNames(["es"], { type: "region" });

/**
 * Nombres "oficiales" en español que sobreescriben lo que devuelve
 * `Intl.DisplayNames` cuando éste resulta ambiguo o poco natural para
 * un juego (e.g., "Estados Unidos de América" → "Estados Unidos").
 */
const NAME_OVERRIDES: Record<string, string> = {
  us: "Estados Unidos",
  gb: "Reino Unido",
  kp: "Corea del Norte",
  kr: "Corea del Sur",
  va: "Ciudad del Vaticano",
  tw: "Taiwán",
  xk: "Kosovo",
  cd: "República Democrática del Congo",
  cg: "República del Congo",
  cf: "República Centroafricana",
  do: "República Dominicana",
  st: "Santo Tomé y Príncipe",
  cv: "Cabo Verde",
  ci: "Costa de Marfil",
  sz: "Esuatini",
  ae: "Emiratos Árabes Unidos",
  tt: "Trinidad y Tobago",
  ag: "Antigua y Barbuda",
  kn: "San Cristóbal y Nieves",
  vc: "San Vicente y las Granadinas",
  ba: "Bosnia y Herzegovina",
  mk: "Macedonia del Norte",
  tl: "Timor Oriental",
  ps: "Palestina",
  bn: "Brunéi",
  mm: "Birmania",
  la: "Laos",
  sy: "Siria",
  sj: "Esuatini",
};

export const WORLD_COUNTRIES: readonly CountryEntry[] = ISO_CODES.map((code) => ({
  code,
  name: NAME_OVERRIDES[code] ?? displayNames.of(code.toUpperCase()) ?? code.toUpperCase(),
})).sort((a, b) => a.name.localeCompare(b.name, "es"));

export const COUNTRY_BY_CODE: ReadonlyMap<string, CountryEntry> = new Map(
  WORLD_COUNTRIES.map((c) => [c.code, c]),
);

/**
 * URL de la bandera rectangular. flagcdn.com sirve SVG estáticos en
 * `/{code}.svg` para cualquier ISO 3166-1 alpha-2.
 */
export function worldFlagUrl(code: string): string {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}
