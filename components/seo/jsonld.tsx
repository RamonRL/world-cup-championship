/**
 * Helpers de structured data JSON-LD. Cada componente renderiza un
 * <script type="application/ld+json"> en el HTML inicial (no se carga
 * vía next/script porque Google necesita verlo en el primer paint para
 * indexarlo bien). El payload se serializa con dangerouslySetInnerHTML
 * y se sanea (sin <, >, & ni separadores de línea raros).
 *
 * Cuando montes uno nuevo, valida con
 *   https://search.google.com/test/rich-results
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://quinielamundial.es";

function sanitize(json: unknown): string {
  return JSON.stringify(json)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/[\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

function Script({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitize(data) }}
    />
  );
}

export function OrganizationLD() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Quiniela Mundial",
        url: SITE_URL,
        logo: `${SITE_URL}/qm-mark.png`,
        description:
          "Quiniela del Mundial 2026 entre amigos. Predicciones, calendario y resultados.",
      }}
    />
  );
}

export function WebApplicationLD() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Quiniela Mundial 2026",
        url: SITE_URL,
        applicationCategory: "GameApplication",
        operatingSystem: "Web, iOS, Android",
        inLanguage: "es-ES",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        description:
          "App para hacer una quiniela del Mundial 2026 entre amigos. Calendario completo, predicciones por partido, ranking en vivo, bracket FIFA.",
      }}
    />
  );
}

export function SportsEventLD() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: "Copa Mundial de la FIFA 2026",
        alternateName: ["Mundial 2026", "FIFA World Cup 2026"],
        startDate: "2026-06-11",
        endDate: "2026-07-19",
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
        sport: "Soccer",
        organizer: {
          "@type": "SportsOrganization",
          name: "FIFA",
          url: "https://www.fifa.com",
        },
        location: [
          {
            "@type": "Country",
            name: "Estados Unidos",
            address: { "@type": "PostalAddress", addressCountry: "US" },
          },
          {
            "@type": "Country",
            name: "Canadá",
            address: { "@type": "PostalAddress", addressCountry: "CA" },
          },
          {
            "@type": "Country",
            name: "México",
            address: { "@type": "PostalAddress", addressCountry: "MX" },
          },
        ],
        description:
          "Mundial 2026. Primera edición con 48 selecciones, 12 grupos y 104 partidos en 16 sedes de Estados Unidos, Canadá y México.",
        url: SITE_URL,
      }}
    />
  );
}

type Match = {
  id: number;
  code: string;
  scheduledAt: Date | string;
  stage: string;
  venue: string | null;
  homeName: string | null;
  awayName: string | null;
};

export function MatchLD({ match, stageLabel }: { match: Match; stageLabel: string }) {
  const date =
    typeof match.scheduledAt === "string"
      ? match.scheduledAt
      : match.scheduledAt.toISOString();
  const home = match.homeName ?? "TBD";
  const away = match.awayName ?? "TBD";
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${home} vs ${away}`,
        description: `${home} contra ${away} · ${stageLabel} del Mundial 2026.`,
        sport: "Soccer",
        startDate: date,
        eventStatus: "https://schema.org/EventScheduled",
        location: match.venue
          ? { "@type": "Place", name: match.venue }
          : undefined,
        homeTeam: { "@type": "SportsTeam", name: home },
        awayTeam: { "@type": "SportsTeam", name: away },
        superEvent: {
          "@type": "SportsEvent",
          name: "Copa Mundial de la FIFA 2026",
          url: SITE_URL,
        },
        url: `${SITE_URL}/partido/${match.id}`,
      }}
    />
  );
}

type BreadcrumbItem = { name: string; href: string };

export function BreadcrumbLD({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.href.startsWith("http") ? it.href : `${SITE_URL}${it.href}`,
        })),
      }}
    />
  );
}

type Faq = { q: string; a: string };

export function FAQPageLD({ faqs }: { faqs: Faq[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}
