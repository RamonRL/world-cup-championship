import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, teams } from "@/lib/db/schema";
import { circleFlagUrl } from "@/lib/flags";
import { ogFonts } from "@/lib/og-fonts";

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

  const fonts = await ogFonts();
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
          padding: "60px 80px",
          fontFamily: "Inter",
        }}
      >
        {/* Eyebrow */}
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
          <span>Mundial 2026 · Selección</span>
        </div>

        {/* Body */}
        <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
          {flagUrl ? (
            <img
              src={flagUrl}
              alt=""
              width={280}
              height={280}
              style={{
                width: 280,
                height: 280,
                borderRadius: 9999,
                boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "rgba(245, 239, 230, 0.6)",
              }}
            >
              {code}
            </div>
            <div
              style={{
                display: "flex",
                fontWeight: 900,
                fontSize: 110,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              {teamName}
            </div>
            {groupName ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 14,
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "rgba(217, 119, 66, 0.18)",
                  color: "#d97742",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                }}
              >
                {groupName}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(245, 239, 230, 0.65)",
          }}
        >
          <span>quinielamundial.es</span>
          <div style={{ display: "flex", height: 6, width: 6, background: "#d97742", borderRadius: 6 }} />
          <span>Calendario · Plantilla · Estadísticas</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
