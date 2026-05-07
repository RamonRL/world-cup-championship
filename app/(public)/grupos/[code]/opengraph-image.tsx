import { ImageResponse } from "next/og";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, teams } from "@/lib/db/schema";
import { circleFlagUrl } from "@/lib/flags";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const alt = "Grupo · Mundial 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function GroupOpenGraph({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.code, code))
    .limit(1);

  const groupName = group?.name ?? `Grupo ${code}`;
  const groupTeams = group
    ? await db
        .select()
        .from(teams)
        .where(eq(teams.groupId, group.id))
        .orderBy(asc(teams.name))
    : [];

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
          <span>Mundial 2026 · Fase de grupos</span>
        </div>

        <div
          style={{
            display: "flex",
            fontWeight: 900,
            fontSize: 130,
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          {groupName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {groupTeams.map((t) => {
            const flag = circleFlagUrl(t.code);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 22 }}>
                {flag ? (
                  <img
                    src={flag}
                    alt=""
                    width={56}
                    height={56}
                    style={{ width: 56, height: 56, borderRadius: 9999 }}
                  />
                ) : null}
                <div
                  style={{
                    display: "flex",
                    fontWeight: 700,
                    fontSize: 42,
                    letterSpacing: -1,
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginLeft: "auto",
                    fontWeight: 700,
                    fontSize: 22,
                    letterSpacing: 6,
                    textTransform: "uppercase",
                    color: "rgba(245, 239, 230, 0.5)",
                  }}
                >
                  {t.code}
                </div>
              </div>
            );
          })}
        </div>

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
          <span>{groupTeams.length} selecciones</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
