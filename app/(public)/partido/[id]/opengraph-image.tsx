import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams } from "@/lib/db/schema";
import { circleFlagUrl } from "@/lib/flags";

export const runtime = "nodejs";
export const alt = "Partido · Mundial 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAGE_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(d);
}

export default async function MatchOpenGraph({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  const [match] = Number.isFinite(matchId)
    ? await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
    : [];

  const [home, away] = await Promise.all([
    match?.homeTeamId
      ? db.select().from(teams).where(eq(teams.id, match.homeTeamId)).limit(1)
      : Promise.resolve([]),
    match?.awayTeamId
      ? db.select().from(teams).where(eq(teams.id, match.awayTeamId)).limit(1)
      : Promise.resolve([]),
  ]);
  const homeTeam = home[0] ?? null;
  const awayTeam = away[0] ?? null;

  const stageLabel = match ? STAGE_LABEL[match.stage] ?? match.stage : "Partido";
  const dateLabel = match ? formatDate(match.scheduledAt) : "";
  const venue = match?.venue ?? null;

  const homeName = homeTeam?.name ?? "TBD";
  const awayName = awayTeam?.name ?? "TBD";
  const homeFlag = homeTeam ? circleFlagUrl(homeTeam.code) : null;
  const awayFlag = awayTeam ? circleFlagUrl(awayTeam.code) : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #1a1d24 0%, #2a1f15 60%, #3d2914 100%)",
          color: "#f5efe6",
          padding: "55px 70px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#d97742",
          }}
        >
          <div style={{ display: "flex", height: 3, width: 60, background: "#d97742" }} />
          <span>Mundial 2026 · {stageLabel}</span>
        </div>

        {/* Match: home vs away */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
          }}
        >
          <Side name={homeName} flag={homeFlag} />

          <div
            style={{
              display: "flex",
              fontWeight: 800,
              fontSize: 50,
              letterSpacing: 3,
              color: "#d97742",
            }}
          >
            VS
          </div>

          <Side name={awayName} flag={awayFlag} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(245, 239, 230, 0.7)",
          }}
        >
          <span>quinielamundial.es</span>
          <div style={{ display: "flex", gap: 18 }}>
            {dateLabel ? <span>{dateLabel}</span> : null}
            {venue ? (
              <>
                <span style={{ color: "#d97742" }}>·</span>
                <span>{venue}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Side({ name, flag }: { name: string; flag: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        flex: 1,
      }}
    >
      {flag ? (
        <img
          src={flag}
          alt=""
          width={210}
          height={210}
          style={{
            width: 210,
            height: 210,
            borderRadius: 9999,
            boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 210,
            height: 210,
            borderRadius: 9999,
            background: "rgba(245, 239, 230, 0.08)",
            fontWeight: 700,
            fontSize: 44,
            color: "rgba(245, 239, 230, 0.4)",
          }}
        >
          TBD
        </div>
      )}
      <div
        style={{
          display: "flex",
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.1,
          letterSpacing: -1,
          textAlign: "center",
        }}
      >
        {name}
      </div>
    </div>
  );
}
