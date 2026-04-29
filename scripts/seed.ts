import { db } from "@/lib/db";
import { groups, scoringRules, specialPredictions } from "@/lib/db/schema";
import {
  DEFAULT_GROUPS,
  DEFAULT_SCORING_RULES,
  DEFAULT_SPECIAL_PREDICTIONS,
} from "@/lib/scoring/defaults";

async function main() {
  console.log("→ Seeding scoring_rules…");
  await db
    .insert(scoringRules)
    .values(
      Object.entries(DEFAULT_SCORING_RULES).map(([key, value]) => ({
        key,
        valueJson: value as unknown,
        description: value.description,
      })),
    )
    .onConflictDoNothing();

  console.log("→ Seeding groups…");
  await db
    .insert(groups)
    .values(DEFAULT_GROUPS.map((g) => ({ code: g.code, name: g.name })))
    .onConflictDoNothing();

  console.log("→ Seeding special_predictions…");
  // Default closesAt = tournament kickoff
  const kickoff = new Date(
    process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z",
  );
  await db
    .insert(specialPredictions)
    .values(
      DEFAULT_SPECIAL_PREDICTIONS.map((s) => ({
        key: s.key,
        question: s.question,
        type: s.type,
        optionsJson: s.optionsJson as unknown,
        pointsConfigJson: s.pointsConfigJson as unknown,
        closesAt: kickoff,
        orderIndex: s.orderIndex,
      })),
    )
    .onConflictDoNothing();

  console.log("✓ Seed completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
