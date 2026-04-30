import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, matches, matchdays, teams } from "@/lib/db/schema";

/**
 * Carga las 48 selecciones del Mundial 2026 y los 104 partidos según el
 * calendario oficial publicado por FIFA / Wikipedia.
 *
 * Las banderas NO se descargan ni almacenan en Supabase: el front-end
 * (`<TeamFlag />`) las renderiza directamente desde HatScripts circle-flags
 * usando el código FIFA del equipo. La columna `flag_url` se mantiene como
 * override opcional para banderas custom subidas por el admin.
 *
 * Idempotente: si una selección o un partido ya existen (por code), los
 * actualiza en lugar de duplicar.
 *
 * Requiere:
 *  - .env.local con DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL.
 *  - 9 jornadas creadas (corre `pnpm db:seed-fixtures` antes).
 */

// ─────────────────── selecciones ───────────────────

type TeamSeed = {
  code: string;
  name: string;
  flagSlug: string; // ISO-2 o gb-sct/gb-eng (flagcdn)
  groupCode: string;
};

const TEAMS: TeamSeed[] = [
  // A
  { code: "MEX", name: "México", flagSlug: "mx", groupCode: "A" },
  { code: "KOR", name: "Corea del Sur", flagSlug: "kr", groupCode: "A" },
  { code: "RSA", name: "Sudáfrica", flagSlug: "za", groupCode: "A" },
  { code: "CZE", name: "República Checa", flagSlug: "cz", groupCode: "A" },
  // B
  { code: "CAN", name: "Canadá", flagSlug: "ca", groupCode: "B" },
  { code: "SUI", name: "Suiza", flagSlug: "ch", groupCode: "B" },
  { code: "QAT", name: "Qatar", flagSlug: "qa", groupCode: "B" },
  { code: "BIH", name: "Bosnia y Herzegovina", flagSlug: "ba", groupCode: "B" },
  // C
  { code: "BRA", name: "Brasil", flagSlug: "br", groupCode: "C" },
  { code: "MAR", name: "Marruecos", flagSlug: "ma", groupCode: "C" },
  { code: "SCO", name: "Escocia", flagSlug: "gb-sct", groupCode: "C" },
  { code: "HAI", name: "Haití", flagSlug: "ht", groupCode: "C" },
  // D
  { code: "USA", name: "Estados Unidos", flagSlug: "us", groupCode: "D" },
  { code: "PAR", name: "Paraguay", flagSlug: "py", groupCode: "D" },
  { code: "AUS", name: "Australia", flagSlug: "au", groupCode: "D" },
  { code: "TUR", name: "Turquía", flagSlug: "tr", groupCode: "D" },
  // E
  { code: "GER", name: "Alemania", flagSlug: "de", groupCode: "E" },
  { code: "ECU", name: "Ecuador", flagSlug: "ec", groupCode: "E" },
  { code: "CIV", name: "Costa de Marfil", flagSlug: "ci", groupCode: "E" },
  { code: "CUW", name: "Curazao", flagSlug: "cw", groupCode: "E" },
  // F
  { code: "NED", name: "Países Bajos", flagSlug: "nl", groupCode: "F" },
  { code: "JPN", name: "Japón", flagSlug: "jp", groupCode: "F" },
  { code: "TUN", name: "Túnez", flagSlug: "tn", groupCode: "F" },
  { code: "SWE", name: "Suecia", flagSlug: "se", groupCode: "F" },
  // G
  { code: "BEL", name: "Bélgica", flagSlug: "be", groupCode: "G" },
  { code: "IRN", name: "Irán", flagSlug: "ir", groupCode: "G" },
  { code: "EGY", name: "Egipto", flagSlug: "eg", groupCode: "G" },
  { code: "NZL", name: "Nueva Zelanda", flagSlug: "nz", groupCode: "G" },
  // H
  { code: "ESP", name: "España", flagSlug: "es", groupCode: "H" },
  { code: "URU", name: "Uruguay", flagSlug: "uy", groupCode: "H" },
  { code: "KSA", name: "Arabia Saudí", flagSlug: "sa", groupCode: "H" },
  { code: "CPV", name: "Cabo Verde", flagSlug: "cv", groupCode: "H" },
  // I
  { code: "FRA", name: "Francia", flagSlug: "fr", groupCode: "I" },
  { code: "SEN", name: "Senegal", flagSlug: "sn", groupCode: "I" },
  { code: "NOR", name: "Noruega", flagSlug: "no", groupCode: "I" },
  { code: "IRQ", name: "Irak", flagSlug: "iq", groupCode: "I" },
  // J
  { code: "ARG", name: "Argentina", flagSlug: "ar", groupCode: "J" },
  { code: "ALG", name: "Argelia", flagSlug: "dz", groupCode: "J" },
  { code: "AUT", name: "Austria", flagSlug: "at", groupCode: "J" },
  { code: "JOR", name: "Jordania", flagSlug: "jo", groupCode: "J" },
  // K
  { code: "POR", name: "Portugal", flagSlug: "pt", groupCode: "K" },
  { code: "COL", name: "Colombia", flagSlug: "co", groupCode: "K" },
  { code: "UZB", name: "Uzbekistán", flagSlug: "uz", groupCode: "K" },
  { code: "COD", name: "RD Congo", flagSlug: "cd", groupCode: "K" },
  // L
  { code: "ENG", name: "Inglaterra", flagSlug: "gb-eng", groupCode: "L" },
  { code: "CRO", name: "Croacia", flagSlug: "hr", groupCode: "L" },
  { code: "GHA", name: "Ghana", flagSlug: "gh", groupCode: "L" },
  { code: "PAN", name: "Panamá", flagSlug: "pa", groupCode: "L" },
];

// ─────────────────── partidos ───────────────────

const VENUE_OFFSET: Record<string, number> = {
  // Mexico CST (sin DST desde 2023)
  "Estadio Azteca": -6,
  "Estadio Akron": -6,
  "Estadio BBVA": -6,
  // EDT (Toronto, Boston/Foxborough, NYC area, Atlanta, Miami, Filadelfia)
  "BMO Field": -4,
  "Gillette Stadium": -4,
  "MetLife Stadium": -4,
  "Lincoln Financial Field": -4,
  "Mercedes-Benz Stadium": -4,
  "Hard Rock Stadium": -4,
  // CDT (Houston, Kansas City, Arlington/Dallas)
  "NRG Stadium": -5,
  "Arrowhead Stadium": -5,
  "AT&T Stadium": -5,
  // PDT (LA, Bay Area, Seattle, Vancouver)
  "SoFi Stadium": -7,
  "Levi's Stadium": -7,
  "Lumen Field": -7,
  "BC Place": -7,
};

const VENUE_CITY: Record<string, string> = {
  "Estadio Azteca": "Ciudad de México",
  "Estadio Akron": "Zapopan",
  "Estadio BBVA": "Guadalupe",
  "BMO Field": "Toronto",
  "Gillette Stadium": "Foxborough",
  "MetLife Stadium": "East Rutherford",
  "Lincoln Financial Field": "Filadelfia",
  "Mercedes-Benz Stadium": "Atlanta",
  "Hard Rock Stadium": "Miami Gardens",
  "NRG Stadium": "Houston",
  "Arrowhead Stadium": "Kansas City",
  "AT&T Stadium": "Arlington",
  "SoFi Stadium": "Inglewood",
  "Levi's Stadium": "Santa Clara",
  "Lumen Field": "Seattle",
  "BC Place": "Vancouver",
};

function utc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  venue: string,
): Date {
  const offset = VENUE_OFFSET[venue];
  if (offset === undefined) throw new Error(`Unknown venue: ${venue}`);
  // local = UTC + offset → UTC = local - offset (offset is negative, so subtract)
  return new Date(Date.UTC(year, month - 1, day, hour - offset, minute, 0));
}

type GroupMatchSeed = {
  code: string;
  groupCode: string;
  date: string; // YYYY-MM-DD
  hour: number;
  minute: number;
  homeCode: string;
  awayCode: string;
  venue: string;
};

const GROUP_MATCHES: GroupMatchSeed[] = [
  // Jornada 1 (M01–M24)
  { code: "M01", groupCode: "A", date: "2026-06-11", hour: 13, minute: 0, homeCode: "MEX", awayCode: "RSA", venue: "Estadio Azteca" },
  { code: "M02", groupCode: "A", date: "2026-06-11", hour: 20, minute: 0, homeCode: "KOR", awayCode: "CZE", venue: "Estadio Akron" },
  { code: "M03", groupCode: "B", date: "2026-06-12", hour: 15, minute: 0, homeCode: "CAN", awayCode: "BIH", venue: "BMO Field" },
  { code: "M04", groupCode: "D", date: "2026-06-12", hour: 18, minute: 0, homeCode: "USA", awayCode: "PAR", venue: "SoFi Stadium" },
  { code: "M05", groupCode: "C", date: "2026-06-13", hour: 21, minute: 0, homeCode: "HAI", awayCode: "SCO", venue: "Gillette Stadium" },
  { code: "M06", groupCode: "D", date: "2026-06-13", hour: 21, minute: 0, homeCode: "AUS", awayCode: "TUR", venue: "BC Place" },
  { code: "M07", groupCode: "C", date: "2026-06-13", hour: 18, minute: 0, homeCode: "BRA", awayCode: "MAR", venue: "MetLife Stadium" },
  { code: "M08", groupCode: "B", date: "2026-06-13", hour: 12, minute: 0, homeCode: "QAT", awayCode: "SUI", venue: "Levi's Stadium" },
  { code: "M09", groupCode: "E", date: "2026-06-14", hour: 19, minute: 0, homeCode: "CIV", awayCode: "ECU", venue: "Lincoln Financial Field" },
  { code: "M10", groupCode: "E", date: "2026-06-14", hour: 12, minute: 0, homeCode: "GER", awayCode: "CUW", venue: "NRG Stadium" },
  { code: "M11", groupCode: "F", date: "2026-06-14", hour: 15, minute: 0, homeCode: "NED", awayCode: "JPN", venue: "AT&T Stadium" },
  { code: "M12", groupCode: "F", date: "2026-06-14", hour: 20, minute: 0, homeCode: "SWE", awayCode: "TUN", venue: "Estadio BBVA" },
  { code: "M13", groupCode: "H", date: "2026-06-15", hour: 18, minute: 0, homeCode: "KSA", awayCode: "URU", venue: "Hard Rock Stadium" },
  { code: "M14", groupCode: "H", date: "2026-06-15", hour: 12, minute: 0, homeCode: "ESP", awayCode: "CPV", venue: "Mercedes-Benz Stadium" },
  { code: "M15", groupCode: "G", date: "2026-06-15", hour: 18, minute: 0, homeCode: "IRN", awayCode: "NZL", venue: "SoFi Stadium" },
  { code: "M16", groupCode: "G", date: "2026-06-15", hour: 12, minute: 0, homeCode: "BEL", awayCode: "EGY", venue: "Lumen Field" },
  { code: "M17", groupCode: "I", date: "2026-06-16", hour: 15, minute: 0, homeCode: "FRA", awayCode: "SEN", venue: "MetLife Stadium" },
  { code: "M18", groupCode: "I", date: "2026-06-16", hour: 18, minute: 0, homeCode: "IRQ", awayCode: "NOR", venue: "Gillette Stadium" },
  { code: "M19", groupCode: "J", date: "2026-06-16", hour: 20, minute: 0, homeCode: "ARG", awayCode: "ALG", venue: "Arrowhead Stadium" },
  { code: "M20", groupCode: "J", date: "2026-06-16", hour: 21, minute: 0, homeCode: "AUT", awayCode: "JOR", venue: "Levi's Stadium" },
  { code: "M21", groupCode: "L", date: "2026-06-17", hour: 19, minute: 0, homeCode: "GHA", awayCode: "PAN", venue: "BMO Field" },
  { code: "M22", groupCode: "L", date: "2026-06-17", hour: 15, minute: 0, homeCode: "ENG", awayCode: "CRO", venue: "AT&T Stadium" },
  { code: "M23", groupCode: "K", date: "2026-06-17", hour: 12, minute: 0, homeCode: "POR", awayCode: "COD", venue: "NRG Stadium" },
  { code: "M24", groupCode: "K", date: "2026-06-17", hour: 20, minute: 0, homeCode: "UZB", awayCode: "COL", venue: "Estadio Azteca" },

  // Jornada 2 (M25–M48)
  { code: "M25", groupCode: "A", date: "2026-06-18", hour: 12, minute: 0, homeCode: "CZE", awayCode: "RSA", venue: "Mercedes-Benz Stadium" },
  { code: "M26", groupCode: "B", date: "2026-06-18", hour: 12, minute: 0, homeCode: "SUI", awayCode: "BIH", venue: "SoFi Stadium" },
  { code: "M27", groupCode: "B", date: "2026-06-18", hour: 15, minute: 0, homeCode: "CAN", awayCode: "QAT", venue: "BC Place" },
  { code: "M28", groupCode: "A", date: "2026-06-18", hour: 19, minute: 0, homeCode: "MEX", awayCode: "KOR", venue: "Estadio Akron" },
  { code: "M29", groupCode: "C", date: "2026-06-19", hour: 20, minute: 30, homeCode: "BRA", awayCode: "HAI", venue: "Lincoln Financial Field" },
  { code: "M30", groupCode: "C", date: "2026-06-19", hour: 18, minute: 0, homeCode: "SCO", awayCode: "MAR", venue: "Gillette Stadium" },
  { code: "M31", groupCode: "D", date: "2026-06-19", hour: 20, minute: 0, homeCode: "TUR", awayCode: "PAR", venue: "Levi's Stadium" },
  { code: "M32", groupCode: "D", date: "2026-06-19", hour: 12, minute: 0, homeCode: "USA", awayCode: "AUS", venue: "Lumen Field" },
  { code: "M33", groupCode: "E", date: "2026-06-20", hour: 16, minute: 0, homeCode: "GER", awayCode: "CIV", venue: "BMO Field" },
  { code: "M34", groupCode: "E", date: "2026-06-20", hour: 19, minute: 0, homeCode: "ECU", awayCode: "CUW", venue: "Arrowhead Stadium" },
  { code: "M35", groupCode: "F", date: "2026-06-20", hour: 12, minute: 0, homeCode: "NED", awayCode: "SWE", venue: "NRG Stadium" },
  { code: "M36", groupCode: "F", date: "2026-06-20", hour: 22, minute: 0, homeCode: "TUN", awayCode: "JPN", venue: "Estadio BBVA" },
  { code: "M37", groupCode: "H", date: "2026-06-21", hour: 18, minute: 0, homeCode: "URU", awayCode: "CPV", venue: "Hard Rock Stadium" },
  { code: "M38", groupCode: "H", date: "2026-06-21", hour: 12, minute: 0, homeCode: "ESP", awayCode: "KSA", venue: "Mercedes-Benz Stadium" },
  { code: "M39", groupCode: "G", date: "2026-06-21", hour: 12, minute: 0, homeCode: "BEL", awayCode: "IRN", venue: "SoFi Stadium" },
  { code: "M40", groupCode: "G", date: "2026-06-21", hour: 18, minute: 0, homeCode: "NZL", awayCode: "EGY", venue: "BC Place" },
  { code: "M41", groupCode: "I", date: "2026-06-22", hour: 20, minute: 0, homeCode: "NOR", awayCode: "SEN", venue: "MetLife Stadium" },
  { code: "M42", groupCode: "I", date: "2026-06-22", hour: 17, minute: 0, homeCode: "FRA", awayCode: "IRQ", venue: "Lincoln Financial Field" },
  { code: "M43", groupCode: "J", date: "2026-06-22", hour: 12, minute: 0, homeCode: "ARG", awayCode: "AUT", venue: "AT&T Stadium" },
  { code: "M44", groupCode: "J", date: "2026-06-22", hour: 20, minute: 0, homeCode: "JOR", awayCode: "ALG", venue: "Levi's Stadium" },
  { code: "M45", groupCode: "L", date: "2026-06-23", hour: 16, minute: 0, homeCode: "ENG", awayCode: "GHA", venue: "Gillette Stadium" },
  { code: "M46", groupCode: "L", date: "2026-06-23", hour: 19, minute: 0, homeCode: "PAN", awayCode: "CRO", venue: "BMO Field" },
  { code: "M47", groupCode: "K", date: "2026-06-23", hour: 12, minute: 0, homeCode: "POR", awayCode: "UZB", venue: "NRG Stadium" },
  { code: "M48", groupCode: "K", date: "2026-06-23", hour: 20, minute: 0, homeCode: "COL", awayCode: "COD", venue: "Estadio Akron" },

  // Jornada 3 (M49–M72)
  { code: "M49", groupCode: "C", date: "2026-06-24", hour: 18, minute: 0, homeCode: "SCO", awayCode: "BRA", venue: "Hard Rock Stadium" },
  { code: "M50", groupCode: "C", date: "2026-06-24", hour: 18, minute: 0, homeCode: "MAR", awayCode: "HAI", venue: "Mercedes-Benz Stadium" },
  { code: "M51", groupCode: "B", date: "2026-06-24", hour: 12, minute: 0, homeCode: "SUI", awayCode: "CAN", venue: "BC Place" },
  { code: "M52", groupCode: "B", date: "2026-06-24", hour: 12, minute: 0, homeCode: "BIH", awayCode: "QAT", venue: "Lumen Field" },
  { code: "M53", groupCode: "A", date: "2026-06-24", hour: 19, minute: 0, homeCode: "CZE", awayCode: "MEX", venue: "Estadio Azteca" },
  { code: "M54", groupCode: "A", date: "2026-06-24", hour: 19, minute: 0, homeCode: "RSA", awayCode: "KOR", venue: "Estadio BBVA" },
  { code: "M55", groupCode: "E", date: "2026-06-25", hour: 16, minute: 0, homeCode: "CUW", awayCode: "CIV", venue: "Lincoln Financial Field" },
  { code: "M56", groupCode: "E", date: "2026-06-25", hour: 16, minute: 0, homeCode: "ECU", awayCode: "GER", venue: "MetLife Stadium" },
  { code: "M57", groupCode: "F", date: "2026-06-25", hour: 18, minute: 0, homeCode: "JPN", awayCode: "SWE", venue: "AT&T Stadium" },
  { code: "M58", groupCode: "F", date: "2026-06-25", hour: 18, minute: 0, homeCode: "TUN", awayCode: "NED", venue: "Arrowhead Stadium" },
  { code: "M59", groupCode: "D", date: "2026-06-25", hour: 19, minute: 0, homeCode: "TUR", awayCode: "USA", venue: "SoFi Stadium" },
  { code: "M60", groupCode: "D", date: "2026-06-25", hour: 19, minute: 0, homeCode: "PAR", awayCode: "AUS", venue: "Levi's Stadium" },
  { code: "M61", groupCode: "I", date: "2026-06-26", hour: 15, minute: 0, homeCode: "NOR", awayCode: "FRA", venue: "Gillette Stadium" },
  { code: "M62", groupCode: "I", date: "2026-06-26", hour: 15, minute: 0, homeCode: "SEN", awayCode: "IRQ", venue: "BMO Field" },
  { code: "M63", groupCode: "G", date: "2026-06-26", hour: 20, minute: 0, homeCode: "EGY", awayCode: "IRN", venue: "Lumen Field" },
  { code: "M64", groupCode: "G", date: "2026-06-26", hour: 20, minute: 0, homeCode: "NZL", awayCode: "BEL", venue: "BC Place" },
  { code: "M65", groupCode: "H", date: "2026-06-26", hour: 19, minute: 0, homeCode: "CPV", awayCode: "KSA", venue: "NRG Stadium" },
  { code: "M66", groupCode: "H", date: "2026-06-26", hour: 18, minute: 0, homeCode: "URU", awayCode: "ESP", venue: "Estadio Akron" },
  { code: "M67", groupCode: "L", date: "2026-06-27", hour: 17, minute: 0, homeCode: "PAN", awayCode: "ENG", venue: "MetLife Stadium" },
  { code: "M68", groupCode: "L", date: "2026-06-27", hour: 17, minute: 0, homeCode: "CRO", awayCode: "GHA", venue: "Lincoln Financial Field" },
  { code: "M69", groupCode: "J", date: "2026-06-27", hour: 21, minute: 0, homeCode: "ALG", awayCode: "AUT", venue: "Arrowhead Stadium" },
  { code: "M70", groupCode: "J", date: "2026-06-27", hour: 21, minute: 0, homeCode: "JOR", awayCode: "ARG", venue: "AT&T Stadium" },
  { code: "M71", groupCode: "K", date: "2026-06-27", hour: 19, minute: 30, homeCode: "COL", awayCode: "POR", venue: "Hard Rock Stadium" },
  { code: "M72", groupCode: "K", date: "2026-06-27", hour: 19, minute: 30, homeCode: "COD", awayCode: "UZB", venue: "Mercedes-Benz Stadium" },
];

type KOMatchSeed = {
  code: string;
  stage: "r32" | "r16" | "qf" | "sf" | "third" | "final";
  date: string;
  hour: number;
  minute: number;
  venue: string;
};

const KO_MATCHES: KOMatchSeed[] = [
  // R32 (M73–M88)
  { code: "M73", stage: "r32", date: "2026-06-28", hour: 12, minute: 0, venue: "SoFi Stadium" },
  { code: "M74", stage: "r32", date: "2026-06-29", hour: 16, minute: 30, venue: "Gillette Stadium" },
  { code: "M75", stage: "r32", date: "2026-06-29", hour: 19, minute: 0, venue: "Estadio BBVA" },
  { code: "M76", stage: "r32", date: "2026-06-29", hour: 12, minute: 0, venue: "NRG Stadium" },
  { code: "M77", stage: "r32", date: "2026-06-30", hour: 17, minute: 0, venue: "MetLife Stadium" },
  { code: "M78", stage: "r32", date: "2026-06-30", hour: 12, minute: 0, venue: "AT&T Stadium" },
  { code: "M79", stage: "r32", date: "2026-06-30", hour: 19, minute: 0, venue: "Estadio Azteca" },
  { code: "M80", stage: "r32", date: "2026-07-01", hour: 12, minute: 0, venue: "Mercedes-Benz Stadium" },
  { code: "M81", stage: "r32", date: "2026-07-01", hour: 17, minute: 0, venue: "Levi's Stadium" },
  { code: "M82", stage: "r32", date: "2026-07-01", hour: 13, minute: 0, venue: "Lumen Field" },
  { code: "M83", stage: "r32", date: "2026-07-02", hour: 19, minute: 0, venue: "BMO Field" },
  { code: "M84", stage: "r32", date: "2026-07-02", hour: 12, minute: 0, venue: "SoFi Stadium" },
  { code: "M85", stage: "r32", date: "2026-07-02", hour: 20, minute: 0, venue: "BC Place" },
  { code: "M86", stage: "r32", date: "2026-07-03", hour: 18, minute: 0, venue: "Hard Rock Stadium" },
  { code: "M87", stage: "r32", date: "2026-07-03", hour: 20, minute: 30, venue: "Arrowhead Stadium" },
  { code: "M88", stage: "r32", date: "2026-07-03", hour: 13, minute: 0, venue: "AT&T Stadium" },

  // R16 (M89–M96) — sin hora oficial concreta, uso 16:00 local default
  { code: "M89", stage: "r16", date: "2026-07-04", hour: 16, minute: 0, venue: "Lincoln Financial Field" },
  { code: "M90", stage: "r16", date: "2026-07-04", hour: 16, minute: 0, venue: "NRG Stadium" },
  { code: "M91", stage: "r16", date: "2026-07-05", hour: 16, minute: 0, venue: "MetLife Stadium" },
  { code: "M92", stage: "r16", date: "2026-07-05", hour: 16, minute: 0, venue: "Estadio Azteca" },
  { code: "M93", stage: "r16", date: "2026-07-06", hour: 16, minute: 0, venue: "AT&T Stadium" },
  { code: "M94", stage: "r16", date: "2026-07-06", hour: 16, minute: 0, venue: "Lumen Field" },
  { code: "M95", stage: "r16", date: "2026-07-07", hour: 16, minute: 0, venue: "Mercedes-Benz Stadium" },
  { code: "M96", stage: "r16", date: "2026-07-07", hour: 16, minute: 0, venue: "BC Place" },

  // QF (M97–M100)
  { code: "M97", stage: "qf", date: "2026-07-09", hour: 16, minute: 0, venue: "Gillette Stadium" },
  { code: "M98", stage: "qf", date: "2026-07-10", hour: 16, minute: 0, venue: "SoFi Stadium" },
  { code: "M99", stage: "qf", date: "2026-07-11", hour: 16, minute: 0, venue: "Hard Rock Stadium" },
  { code: "M100", stage: "qf", date: "2026-07-11", hour: 16, minute: 0, venue: "Arrowhead Stadium" },

  // SF (M101–M102)
  { code: "M101", stage: "sf", date: "2026-07-14", hour: 16, minute: 0, venue: "AT&T Stadium" },
  { code: "M102", stage: "sf", date: "2026-07-15", hour: 16, minute: 0, venue: "Mercedes-Benz Stadium" },

  // 3rd place
  { code: "M103", stage: "third", date: "2026-07-18", hour: 16, minute: 0, venue: "Hard Rock Stadium" },

  // Final
  { code: "M104", stage: "final", date: "2026-07-19", hour: 15, minute: 0, venue: "MetLife Stadium" },
];

// ─────────────────── main ───────────────────

async function main() {
  console.log("→ Verificando jornadas…");
  const allMatchdays = await db
    .select()
    .from(matchdays)
    .orderBy(asc(matchdays.orderIndex));
  if (allMatchdays.length === 0) {
    console.error(
      "× No hay jornadas. Corre `pnpm db:seed-fixtures` primero para crearlas.",
    );
    process.exit(1);
  }

  // Map matchdays by stage & order. Para fase de grupos, hay 3 (J1/J2/J3).
  const groupDays = allMatchdays
    .filter((m) => m.stage === "group")
    .sort((a, b) => a.orderIndex - b.orderIndex);
  if (groupDays.length < 3) {
    console.error("× Faltan jornadas de fase de grupos (necesitan 3).");
    process.exit(1);
  }
  const matchdayByStage = (stage: string) =>
    allMatchdays.find((m) => m.stage === stage);

  console.log("→ Verificando grupos…");
  const allGroups = await db.select().from(groups).orderBy(asc(groups.code));
  if (allGroups.length < 12) {
    console.error("× Faltan grupos. Corre `pnpm db:seed` primero.");
    process.exit(1);
  }
  const groupByCode = new Map(allGroups.map((g) => [g.code, g]));

  console.log("→ Cargando selecciones (descargando banderas)…");
  for (const seed of TEAMS) {
    const group = groupByCode.get(seed.groupCode);
    if (!group) {
      console.warn(`  ⚠ grupo ${seed.groupCode} no encontrado para ${seed.code}`);
      continue;
    }

    const [existing] = await db
      .select()
      .from(teams)
      .where(eq(teams.code, seed.code))
      .limit(1);

    if (existing) {
      await db
        .update(teams)
        .set({
          name: seed.name,
          groupId: group.id,
        })
        .where(eq(teams.id, existing.id));
    } else {
      await db.insert(teams).values({
        code: seed.code,
        name: seed.name,
        groupId: group.id,
        flagUrl: null,
      });
    }
  }
  console.log(`✓ ${TEAMS.length} selecciones cargadas.`);

  // Re-leer team ids para el mapeo en partidos.
  const allTeams = await db.select().from(teams);
  const teamByCode = new Map(allTeams.map((t) => [t.code, t]));

  console.log("→ Cargando partidos…");
  const matchdayForCode = (code: string): number | null => {
    const num = Number(code.slice(1));
    if (num >= 1 && num <= 24) return groupDays[0].id;
    if (num >= 25 && num <= 48) return groupDays[1].id;
    if (num >= 49 && num <= 72) return groupDays[2].id;
    if (num >= 73 && num <= 88) return matchdayByStage("r32")?.id ?? null;
    if (num >= 89 && num <= 96) return matchdayByStage("r16")?.id ?? null;
    if (num >= 97 && num <= 100) return matchdayByStage("qf")?.id ?? null;
    if (num >= 101 && num <= 102) return matchdayByStage("sf")?.id ?? null;
    if (num === 103) return matchdayByStage("third")?.id ?? null;
    if (num === 104) return matchdayByStage("final")?.id ?? null;
    return null;
  };

  // Group matches
  for (const m of GROUP_MATCHES) {
    const home = teamByCode.get(m.homeCode);
    const away = teamByCode.get(m.awayCode);
    const group = groupByCode.get(m.groupCode);
    if (!home || !away || !group) {
      console.warn(`  ⚠ datos faltantes para ${m.code}`);
      continue;
    }
    const [y, mo, d] = m.date.split("-").map(Number);
    const scheduledAt = utc(y, mo, d, m.hour, m.minute, m.venue);
    const data = {
      code: m.code,
      stage: "group" as const,
      matchdayId: matchdayForCode(m.code),
      groupId: group.id,
      homeTeamId: home.id,
      awayTeamId: away.id,
      scheduledAt,
      venue: `${m.venue} · ${VENUE_CITY[m.venue]}`,
    };
    const [existing] = await db
      .select()
      .from(matches)
      .where(eq(matches.code, m.code))
      .limit(1);
    if (existing) {
      await db.update(matches).set(data).where(eq(matches.id, existing.id));
    } else {
      await db.insert(matches).values(data);
    }
  }
  console.log(`✓ ${GROUP_MATCHES.length} partidos de fase de grupos.`);

  for (const m of KO_MATCHES) {
    const [y, mo, d] = m.date.split("-").map(Number);
    const scheduledAt = utc(y, mo, d, m.hour, m.minute, m.venue);
    const data = {
      code: m.code,
      stage: m.stage,
      matchdayId: matchdayForCode(m.code),
      groupId: null,
      homeTeamId: null,
      awayTeamId: null,
      scheduledAt,
      venue: `${m.venue} · ${VENUE_CITY[m.venue]}`,
    };
    const [existing] = await db
      .select()
      .from(matches)
      .where(eq(matches.code, m.code))
      .limit(1);
    if (existing) {
      await db.update(matches).set(data).where(eq(matches.id, existing.id));
    } else {
      await db.insert(matches).values(data);
    }
  }
  console.log(`✓ ${KO_MATCHES.length} partidos de eliminatorias (sin equipos asignados).`);

  console.log("\n✓ Seed del torneo completado.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed-tournament failed:", err);
  process.exit(1);
});
