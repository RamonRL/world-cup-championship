import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, teams } from "@/lib/db/schema";
import { circleFlagUrl } from "@/lib/flags";

// next/og + Drizzle/postgres-js requieren node runtime (no edge).
export const runtime = "nodejs";
export const alt = "Selección · Mundial 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TeamOpenGraph({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.code, code))
    .limit(1);

  const teamName = team?.name ?? code;
  const [group] = team?.groupId
    ? await db.select().from(groups).where(eq(groups.id, team.groupId)).limit(1)
    : [];
  const groupName = group?.name ?? null;
  const flagUrl = circleFlagUrl(code) ?? "";

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
          padding: "70px 90px",
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
          Mundial 2026 · Selección
        </div>

        {/* Body: flag + name */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 56,
            marginTop: 30,
          }}
        >
          {flagUrl ? (
            <img
              src={flagUrl}
              alt=""
              width={300}
              height={300}
              style={{
                width: 300,
                height: 300,
                borderRadius: 9999,
                boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(245, 239, 230, 0.6)",
              }}
            >
              {code}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 124,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
              }}
            >
              {teamName}
            </div>
            {groupName ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 14,
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "rgba(217, 119, 66, 0.18)",
                  color: "#d97742",
                  fontFamily: "monospace",
                  fontSize: 22,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  width: "fit-content",
                }}
              >
                {groupName}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(245, 239, 230, 0.6)",
          }}
        >
          <span>quinielamundial.es</span>
          <span style={{ display: "block", height: 6, width: 6, background: "#d97742", borderRadius: 6 }} />
          <span>Calendario · Plantilla · Estadísticas</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
