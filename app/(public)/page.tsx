import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, gte, inArray } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  Clipboard,
  Crown,
  Goal,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { matches, teams } from "@/lib/db/schema";
import { TeamFlag } from "@/components/brand/team-flag";
import { getCurrentUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";
import { FAQPageLD, SportsEventLD } from "@/components/seo/jsonld";

const KICKOFF = new Date(
  process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z",
);

// FAQ usadas también para JSON-LD FAQPage. Cada pregunta apunta a una
// keyword objetivo en español ("quiniela mundial gratis", "código de
// invitación", "android iOS", "máximo participantes").
const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Cómo funciona Quiniela Mundial 2026?",
    a: "Te unes a una quiniela (la pública o una privada con código de 4 dígitos), predices las posiciones de los 12 grupos, el bracket completo, los goleadores, los marcadores partido a partido y otras predicciones especiales. Vas sumando puntos según aciertes. Hay ranking general y por liga.",
  },
  {
    q: "¿Es gratis hacer una quiniela?",
    a: "Sí. La app es gratuita. Puedes crear hasta 5 quinielas privadas con tus amigos sin coste y participar siempre en la Quiniela Pública.",
  },
  {
    q: "¿Hay app para iPhone y Android?",
    a: "Funciona como Progressive Web App: desde Safari (iPhone/iPad) o Chrome (Android) puedes 'Añadir a pantalla de inicio' y se comporta como una app nativa, en pantalla completa y con su icono propio.",
  },
  {
    q: "¿Cuándo y dónde se juega el Mundial 2026?",
    a: "Del 11 de junio al 19 de julio de 2026 en Estados Unidos, Canadá y México. Es la primera edición con 48 selecciones, 12 grupos, 104 partidos y 16 sedes repartidas entre los tres países anfitriones.",
  },
  {
    q: "¿Cómo me uno a la quiniela de mis amigos?",
    a: "Pídele al creador el código de 4 dígitos o el enlace de invitación. Lo introduces en la pantalla de unirme y entras al instante. Cada usuario puede pertenecer a la pública más 5 quinielas privadas.",
  },
  {
    q: "¿Puedo cambiar mi predicción después?",
    a: "Sí, mientras no se haya cerrado la jornada o la fase. Cada categoría tiene su deadline (la fase de grupos cierra en el kickoff del primer partido de la jornada; los marcadores cierran al inicio de cada partido).",
  },
  {
    q: "¿Quién organiza el torneo y publica los partidos?",
    a: "El Mundial 2026 lo organiza la FIFA. Esta web no está afiliada — es solo una herramienta de predicciones. Toda la información de calendario, grupos y sedes refleja la programación oficial publicada por FIFA.",
  },
  {
    q: "¿Cuántas quinielas privadas puedo crear o unirme?",
    a: "Hasta 5 privadas por usuario, además de la Quiniela Pública (siempre activa). Puedes ser creador de unas y simple participante en otras; cada una con su propio ranking.",
  },
];

export default async function HomePage() {
  // Si hay sesión, mantenemos el comportamiento previo: ir directo al
  // dashboard. Solo los visitantes ven la landing pública SEO.
  const me = await getCurrentUser();
  if (me) redirect("/dashboard");

  // Próximos 6 partidos para el destacado del calendario. Si la base
  // está vacía (entorno fresco), simplemente no se renderiza la sección.
  const now = new Date();
  const featuredMatches = await db
    .select()
    .from(matches)
    .where(gte(matches.scheduledAt, now))
    .orderBy(asc(matches.scheduledAt))
    .limit(6);
  const teamIds = Array.from(
    new Set(
      featuredMatches.flatMap((m) =>
        [m.homeTeamId, m.awayTeamId].filter((x): x is number => x != null),
      ),
    ),
  );
  const teamRows =
    teamIds.length > 0
      ? await db.select().from(teams).where(inArray(teams.id, teamIds))
      : [];
  const teamMap = new Map(teamRows.map((t) => [t.id, t]));

  const daysToKickoff = Math.max(
    0,
    Math.ceil((KICKOFF.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="space-y-20">
      <SportsEventLD />
      <FAQPageLD faqs={FAQS} />

      {/* ───────── HERO ───────── */}
      <section className="relative -mx-4 overflow-hidden border-b border-[var(--color-border)] px-4 pb-20 pt-8 sm:pt-14 lg:-mx-8 lg:px-8">
        <div
          aria-hidden
          className="halftone pointer-events-none absolute inset-0 opacity-[0.05]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--color-arena) 28%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--color-arena)]" />
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-arena)]">
                Mundial 2026 · 11 jun – 19 jul · Canadá · México · USA
              </p>
            </div>
            <h1 className="font-display text-5xl leading-[0.92] tracking-tight sm:text-7xl">
              Quiniela Mundial 2026 — predice los 104 partidos con tus amigos
            </h1>
            <p className="max-w-2xl font-editorial text-lg italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-xl">
              Calendario completo, grupos, bracket FIFA, goleadores y predicciones
              colaborativas. Crea tu liga privada en 30 segundos o únete a una con
              un código de 4 dígitos. Gratis.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login?next=%2Fonboarding"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-arena)] bg-[var(--color-arena)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[var(--shadow-arena)] transition hover:opacity-90"
              >
                Crear quiniela
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition hover:border-[var(--color-arena)]/40"
              >
                Unirme con código
              </Link>
            </div>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              T-{daysToKickoff.toString().padStart(2, "0")} días al kickoff · 48 selecciones · 12 grupos · 16 sedes
            </p>
          </div>
          <div className="hidden flex-col items-center gap-2 lg:flex">
            <Image
              src="/fwc26.png"
              alt="FIFA World Cup 26"
              width={1500}
              height={1500}
              priority
              className="h-44 w-auto"
            />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Copa Mundial de la FIFA 2026
            </p>
          </div>
        </div>
      </section>

      {/* ───────── CÓMO FUNCIONA ───────── */}
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Cómo funciona
          </p>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Te unes, predices, comparas, ganas
          </h2>
          <p className="max-w-3xl font-editorial text-base italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
            Una quiniela del Mundial entre amigos sin Excel ni grupos de WhatsApp
            con capturas: la app guarda las predicciones, calcula los puntos en
            tiempo real y muestra el ranking en cada momento del torneo.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StepCard
            n={1}
            icon={<Users className="size-5" />}
            title="Crea o únete"
            text="Crea tu quiniela privada y reparte el código de 4 dígitos, o únete con el de tus amigos."
          />
          <StepCard
            n={2}
            icon={<ListChecks className="size-5" />}
            title="Predice"
            text="Posiciones de los 12 grupos, bracket completo FIFA, Bota de Oro y marcadores partido a partido."
          />
          <StepCard
            n={3}
            icon={<Trophy className="size-5" />}
            title="Compite"
            text="Conforme se juegan los partidos, los puntos se suman al instante. El ranking se actualiza en vivo."
          />
          <StepCard
            n={4}
            icon={<Crown className="size-5" />}
            title="Gana"
            text="El que mejor lea el torneo gana. Premio: la gloria, lo que pacten los amigos, o ambas."
          />
        </div>
      </section>

      {/* ───────── EL TORNEO ───────── */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="space-y-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            El torneo
          </p>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Primera edición a 48 selecciones
          </h2>
          <p className="font-editorial text-base italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
            El Mundial 2026 estrena formato: <strong className="not-italic font-semibold">12 grupos</strong> de
            cuatro equipos, top 2 + los 8 mejores terceros pasan a una nueva
            ronda de dieciseisavos (R32). Después: octavos, cuartos,
            semifinales y final el <strong className="not-italic font-semibold">19 de julio en Nueva York-NJ</strong>.
            Un total de <strong className="not-italic font-semibold">104 partidos en 39 días</strong> repartidos
            entre Estados Unidos, Canadá y México.
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <FactRow icon={<CalendarDays className="size-4" />} label="11 jun – 19 jul 2026" />
            <FactRow icon={<MapPin className="size-4" />} label="3 países, 16 sedes" />
            <FactRow icon={<Users className="size-4" />} label="48 selecciones, 12 grupos" />
            <FactRow icon={<Goal className="size-4" />} label="104 partidos en total" />
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/calendario"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-[var(--color-arena)]/40"
            >
              Ver calendario completo
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/grupos"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-[var(--color-arena)]/40"
            >
              Los 12 grupos
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/equipos"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition hover:border-[var(--color-arena)]/40"
            >
              48 selecciones
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div
            aria-hidden
            className="pitch-grid absolute inset-0 opacity-25"
          />
          <div className="relative space-y-4">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
              Próximos partidos destacados
            </p>
            {featuredMatches.length === 0 ? (
              <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                Calendario pendiente de publicar.
              </p>
            ) : (
              <ul className="space-y-2">
                {featuredMatches.map((m) => {
                  const home = m.homeTeamId ? teamMap.get(m.homeTeamId) : null;
                  const away = m.awayTeamId ? teamMap.get(m.awayTeamId) : null;
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/partido/${m.id}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 transition hover:border-[var(--color-arena)]/40"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <TeamFlag code={home?.code} size={20} />
                          <span className="truncate text-sm font-medium">
                            {home?.name ?? "TBD"} <span className="text-[var(--color-muted-foreground)]">·</span> {away?.name ?? "TBD"}
                          </span>
                          <TeamFlag code={away?.code} size={20} />
                        </span>
                        <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                          {formatDateTime(m.scheduledAt, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ───────── 6 CATEGORÍAS DE PREDICCIÓN ───────── */}
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Las 6 categorías
          </p>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Seis formas de sumar puntos
          </h2>
          <p className="max-w-3xl font-editorial text-base italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
            La quiniela no se limita a marcadores. Combinas predicciones a largo
            plazo (grupos, bracket, goleador del torneo) con apuestas más
            inmediatas (marcador exacto y goleador de cada partido).
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CategoryCard
            icon={<Users className="size-5" />}
            title="Posiciones por grupo"
            text="Ordenas los 4 equipos de cada uno de los 12 grupos. Cierra al inicio del torneo."
          />
          <CategoryCard
            icon={<Swords className="size-5" />}
            title="Bracket FIFA completo"
            text="R32, octavos, cuartos, semifinales y final. Predices la cruz entera y al campeón."
          />
          <CategoryCard
            icon={<Target className="size-5" />}
            title="Goleador del torneo"
            text="Tu Bota de Oro. Si tu jugador acaba como máximo goleador, set de puntos extra."
          />
          <CategoryCard
            icon={<Goal className="size-5" />}
            title="Marcadores partido a partido"
            text="Predices el resultado exacto de cada partido. Bonus por acertar marcador y ganador."
          />
          <CategoryCard
            icon={<Sparkles className="size-5" />}
            title="Goleador por partido"
            text="Eliges quién marca en cada uno de los 104 enfrentamientos."
          />
          <CategoryCard
            icon={<ShieldCheck className="size-5" />}
            title="Predicciones especiales"
            text="Preguntas estilo '¿habrá tanda de penales en cuartos?'. Sorpresas con peso."
          />
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Preguntas frecuentes
          </p>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Lo que la gente pregunta
          </h2>
        </header>
        <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {FAQS.map((f, i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3 list-none">
                <span className="font-display text-lg tracking-tight">{f.q}</span>
                <span
                  aria-hidden
                  className="font-mono text-xs text-[var(--color-arena)] transition group-open:rotate-45"
                >
                  ＋
                </span>
              </summary>
              <p className="pt-3 font-editorial text-sm italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────── CTA FINAL ───────── */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,var(--color-surface))] p-8 text-center sm:p-12">
        <div
          aria-hidden
          className="halftone pointer-events-none absolute inset-0 opacity-[0.05]"
        />
        <div className="relative space-y-4">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Tu quiniela del Mundial está a un click
          </h2>
          <p className="mx-auto max-w-2xl font-editorial text-base italic text-[var(--color-muted-foreground)] sm:text-lg">
            Crea la tuya, comparte el código con los tuyos y que empiece la pelea.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/login?next=%2Fonboarding"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-arena)] bg-[var(--color-arena)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[var(--shadow-arena)]"
            >
              Empezar gratis
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/calendario"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition hover:border-[var(--color-arena)]/40"
            >
              Explorar el calendario
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER LINKS ───────── */}
      <footer className="border-t border-[var(--color-border)] pt-8 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/qm-mark.png"
              alt="Quiniela Mundial"
              width={940}
              height={973}
              className="size-10 object-contain"
            />
            <div>
              <p className="font-display text-base tracking-tight">Quiniela Mundial 2026</p>
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                quinielamundial.es
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
            <Link href="/calendario" className="hover:text-[var(--color-arena)]">Calendario</Link>
            <Link href="/grupos" className="hover:text-[var(--color-arena)]">Grupos</Link>
            <Link href="/bracket" className="hover:text-[var(--color-arena)]">Bracket</Link>
            <Link href="/goleadores" className="hover:text-[var(--color-arena)]">Goleadores</Link>
            <Link href="/equipos" className="hover:text-[var(--color-arena)]">Selecciones</Link>
            <Link href="/sedes" className="hover:text-[var(--color-arena)]">Sedes</Link>
            <Link href="/login" className="hover:text-[var(--color-arena)]">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// ─────────── Helpers ───────────

function StepCard({
  n,
  icon,
  title,
  text,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <span className="absolute -right-3 -top-3 font-display text-7xl leading-none tracking-tighter text-[var(--color-arena)]/10">
        {n.toString().padStart(2, "0")}
      </span>
      <div className="relative space-y-2.5">
        <span className="grid size-9 place-items-center rounded-md bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)]">
          {icon}
        </span>
        <h3 className="font-display text-xl tracking-tight">{title}</h3>
        <p className="font-editorial text-sm italic leading-relaxed text-[var(--color-muted-foreground)]">
          {text}
        </p>
      </div>
    </article>
  );
}

function CategoryCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center gap-2.5 pb-2">
        <span className="grid size-8 place-items-center rounded-md border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] text-[var(--color-arena)]">
          {icon}
        </span>
        <h3 className="font-display text-lg tracking-tight">{title}</h3>
      </div>
      <p className="font-editorial text-sm italic leading-relaxed text-[var(--color-muted-foreground)]">
        {text}
      </p>
    </article>
  );
}

function FactRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <span className="text-[var(--color-arena)]">{icon}</span>
      <span className="font-medium">{label}</span>
    </li>
  );
}

void Clipboard;
