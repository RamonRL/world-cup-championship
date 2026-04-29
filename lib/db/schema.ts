import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const matchStage = pgEnum("match_stage", [
  "group",
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
]);

export const matchStatus = pgEnum("match_status", ["scheduled", "live", "finished"]);

export const chatScope = pgEnum("chat_scope", ["global", "match"]);

export const specialPredictionType = pgEnum("special_prediction_type", [
  "yes_no",
  "single_choice",
  "team_with_round",
  "number_range",
  "player",
]);

export const pointsSource = pgEnum("points_source", [
  "group_position",
  "group_top2_swap",
  "bracket_slot",
  "tournament_top_scorer",
  "match_exact_score",
  "match_outcome",
  "knockout_qualifier",
  "knockout_pens_bonus",
  "knockout_score_90",
  "match_scorer",
  "match_first_scorer",
  "special_prediction",
]);

// ───────────────────────── identidad ─────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    nickname: text("nickname"),
    avatarUrl: text("avatar_url"),
    role: userRole("role").notNull().default("user"),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profiles_role_idx").on(t.role)],
);

// ───────────────────────── torneo ─────────────────────────

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    flagUrl: text("flag_url"),
    groupId: integer("group_id").references(() => groups.id, { onDelete: "set null" }),
  },
  (t) => [index("teams_group_idx").on(t.groupId)],
);

export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: text("position"),
    jerseyNumber: smallint("jersey_number"),
    photoUrl: text("photo_url"),
  },
  (t) => [index("players_team_idx").on(t.teamId)],
);

export const matchdays = pgTable("matchdays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stage: matchStage("stage").notNull(),
  predictionDeadlineAt: timestamp("prediction_deadline_at", { withTimezone: true }).notNull(),
  orderIndex: smallint("order_index").notNull().default(0),
});

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    stage: matchStage("stage").notNull(),
    matchdayId: integer("matchday_id").references(() => matchdays.id, { onDelete: "set null" }),
    groupId: integer("group_id").references(() => groups.id, { onDelete: "set null" }),
    homeTeamId: integer("home_team_id").references(() => teams.id, { onDelete: "set null" }),
    awayTeamId: integer("away_team_id").references(() => teams.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    venue: text("venue"),
    status: matchStatus("status").notNull().default("scheduled"),
    homeScore: smallint("home_score"),
    awayScore: smallint("away_score"),
    wentToPens: boolean("went_to_pens").notNull().default(false),
    homeScorePen: smallint("home_score_pen"),
    awayScorePen: smallint("away_score_pen"),
    winnerTeamId: integer("winner_team_id").references(() => teams.id, { onDelete: "set null" }),
  },
  (t) => [
    index("matches_scheduled_idx").on(t.scheduledAt),
    index("matches_stage_idx").on(t.stage),
    index("matches_matchday_idx").on(t.matchdayId),
    index("matches_group_idx").on(t.groupId),
  ],
);

export const matchScorers = pgTable(
  "match_scorers",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    minute: smallint("minute"),
    isFirstGoal: boolean("is_first_goal").notNull().default(false),
    isOwnGoal: boolean("is_own_goal").notNull().default(false),
    isPenalty: boolean("is_penalty").notNull().default(false),
  },
  (t) => [
    index("match_scorers_match_idx").on(t.matchId),
    index("match_scorers_player_idx").on(t.playerId),
  ],
);

// Posición final de cada equipo en su grupo (relleno por trigger explícito al cerrar fase grupos).
export const groupStandings = pgTable(
  "group_standings",
  {
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    played: smallint("played").notNull().default(0),
    won: smallint("won").notNull().default(0),
    drawn: smallint("drawn").notNull().default(0),
    lost: smallint("lost").notNull().default(0),
    goalsFor: smallint("goals_for").notNull().default(0),
    goalsAgainst: smallint("goals_against").notNull().default(0),
    points: smallint("points").notNull().default(0),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.teamId] }),
    check("position_range", sql`${t.position} between 1 and 4`),
  ],
);

// ───────────────────────── predicciones ─────────────────────────

export const predGroupRanking = pgTable(
  "pred_group_ranking",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    pos1TeamId: integer("pos1_team_id").references(() => teams.id, { onDelete: "set null" }),
    pos2TeamId: integer("pos2_team_id").references(() => teams.id, { onDelete: "set null" }),
    pos3TeamId: integer("pos3_team_id").references(() => teams.id, { onDelete: "set null" }),
    pos4TeamId: integer("pos4_team_id").references(() => teams.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.groupId] })],
);

export const predBracketSlot = pgTable(
  "pred_bracket_slot",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    stage: matchStage("stage").notNull(),
    slotPosition: smallint("slot_position").notNull(),
    predictedTeamId: integer("predicted_team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.stage, t.slotPosition] })],
);

export const predTournamentTopScorer = pgTable("pred_tournament_top_scorer", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  playerId: integer("player_id").references(() => players.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const predMatchResult = pgTable(
  "pred_match_result",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    homeScore: smallint("home_score").notNull(),
    awayScore: smallint("away_score").notNull(),
    willGoToPens: boolean("will_go_to_pens").notNull().default(false),
    winnerTeamId: integer("winner_team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.matchId] })],
);

export const predMatchScorer = pgTable(
  "pred_match_scorer",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.matchId] })],
);

export const specialPredictions = pgTable("special_predictions", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  question: text("question").notNull(),
  type: specialPredictionType("type").notNull(),
  optionsJson: jsonb("options_json"),
  pointsConfigJson: jsonb("points_config_json").notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  resolvedValueJson: jsonb("resolved_value_json"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  orderIndex: smallint("order_index").notNull().default(0),
});

export const predSpecial = pgTable(
  "pred_special",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    specialId: integer("special_id")
      .notNull()
      .references(() => specialPredictions.id, { onDelete: "cascade" }),
    valueJson: jsonb("value_json").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.specialId] })],
);

// ───────────────────────── puntuación ─────────────────────────

export const scoringRules = pgTable("scoring_rules", {
  key: text("key").primaryKey(),
  valueJson: jsonb("value_json").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    source: pointsSource("source").notNull(),
    sourceRef: jsonb("source_ref").notNull(),
    sourceKey: text("source_key").notNull(),
    points: integer("points").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("points_ledger_unique").on(t.userId, t.source, t.sourceKey),
    index("points_ledger_user_idx").on(t.userId),
    index("points_ledger_source_key_idx").on(t.source, t.sourceKey),
  ],
);

// ───────────────────────── social ─────────────────────────

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    scope: chatScope("scope").notNull(),
    matchId: integer("match_id").references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => profiles.id, { onDelete: "set null" }),
  },
  (t) => [
    index("chat_messages_scope_idx").on(t.scope, t.createdAt),
    index("chat_messages_match_idx").on(t.matchId),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    adminId: uuid("admin_id").references(() => profiles.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    payloadJson: jsonb("payload_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);
