import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, profiles } from "@/lib/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { requireUser } from "@/lib/auth/guards";
import { ChatThread } from "./chat-thread";

export const metadata = { title: "Chat" };

export default async function ChatPage() {
  const me = await requireUser();
  const messages = await db
    .select({
      id: chatMessages.id,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
      userId: chatMessages.userId,
      deletedAt: chatMessages.deletedAt,
      authorEmail: profiles.email,
      authorNickname: profiles.nickname,
      authorAvatar: profiles.avatarUrl,
    })
    .from(chatMessages)
    .leftJoin(profiles, eq(chatMessages.userId, profiles.id))
    .where(eq(chatMessages.scope, "global"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(200);
  void isNull;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comunidad"
        title="Hilo global"
        description="Anuncios, banter y comentarios. El admin puede eliminar mensajes que se pasen de raya."
      />
      <ChatThread
        scope="global"
        currentUserId={me.id}
        isAdmin={me.role === "admin"}
        messages={messages.reverse().map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          userId: m.userId,
          deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
          author: {
            email: m.authorEmail ?? "",
            nickname: m.authorNickname,
            avatarUrl: m.authorAvatar,
          },
        }))}
      />
    </div>
  );
}
