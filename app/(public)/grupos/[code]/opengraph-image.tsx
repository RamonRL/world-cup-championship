import { ImageResponse } from "next/og";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, teams } from "@/lib/db/schema";
import { circleFlagUrl } from "@/lib/flags";

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
          Mundial 2026 · Fase de grupos
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 30,
            fontWeight: 800,
            fontSize: 144,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          {groupName}
        </div>

        {/* Teams list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 36,
          }}
        >
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
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 44,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "monospace",
                    fontSize: 22,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "rgba(245, 239, 230, 0.5)",
                  }}
                >
                  {t.code}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div
          style={{
            position: "absolute",
            left: 90,
            bottom: 50,
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
          <span>{groupTeams.length} selecciones</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
