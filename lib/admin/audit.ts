import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export async function logAdminAction(args: {
  adminId: string;
  action: string;
  payload?: unknown;
}) {
  await db.insert(auditLog).values({
    adminId: args.adminId,
    action: args.action,
    payloadJson: (args.payload ?? null) as unknown,
  });
}
