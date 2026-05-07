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
          background:
            "linear-gradient(135deg, #1a1d24 0%, #2a1f15 60%, #3d2914 100%)",
          color: "#f5efe6",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#d97742",
          }}
        >
          <span style={{ display: "block", height: 3, width: 60, background: "#d97742" }} />
          Mundial 2026 · {stageLabel}
        </div>

        {/* Match: home vs away */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
            marginTop: 20,
          }}
        >
          {/* Home */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              flex: 1,
            }}
          >
            {homeFlag ? (
              <img
                src={homeFlag}
                alt=""
                width={220}
                height={220}
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 9999,
                  boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 9999,
                  background: "rgba(245, 239, 230, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 48,
                  color: "rgba(245, 239, 230, 0.4)",
                }}
              >
                TBD
              </div>
            )}
            <div
              style={{
                fontWeight: 800,
                fontSize: 60,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                textAlign: "center",
              }}
            >
              {homeName}
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 56,
              letterSpacing: "0.18em",
              color: "#d97742",
              fontWeight: 700,
            }}
          >
            VS
          </div>

          {/* Away */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              flex: 1,
            }}
          >
            {awayFlag ? (
              <img
                src={awayFlag}
                alt=""
                width={220}
                height={220}
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 9999,
                  boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 9999,
                  background: "rgba(245, 239, 230, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 48,
                  color: "rgba(245, 239, 230, 0.4)",
                }}
              >
                TBD
              </div>
            )}
            <div
              style={{
                fontWeight: 800,
                fontSize: 60,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                textAlign: "center",
              }}
            >
              {awayName}
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(245, 239, 230, 0.65)",
          }}
        >
          <span>quinielamundial.es</span>
          <span style={{ display: "flex", gap: 18 }}>
            {dateLabel ? <span>{dateLabel}</span> : null}
            {venue ? (
              <>
                <span style={{ color: "#d97742" }}>·</span>
                <span>{venue}</span>
              </>
            ) : null}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
