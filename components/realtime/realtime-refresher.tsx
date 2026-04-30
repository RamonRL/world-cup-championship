"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Subscription = {
  /** Public table to listen on (e.g. "chat_messages") */
  table: string;
  /** Optional Supabase Realtime filter, e.g. "match_id=eq.42" */
  filter?: string;
};

/**
 * Drop-in client component that subscribes to Supabase Realtime row events on
 * the given tables and triggers `router.refresh()` whenever something changes.
 * Used to make pages "live" without writing custom diffing logic — the server
 * re-renders with fresh data and React reconciles.
 */
export function RealtimeRefresher({
  channelKey,
  subscriptions,
}: {
  /** Stable identifier — different values give different channels */
  channelKey: string;
  subscriptions: Subscription[];
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`refresher:${channelKey}`);

    for (const sub of subscriptions) {
      const config: Record<string, unknown> = {
        event: "*",
        schema: "public",
        table: sub.table,
      };
      if (sub.filter) config.filter = sub.filter;
      channel.on(
        "postgres_changes" as never,
        config as never,
        () => {
          router.refresh();
        },
      );
    }

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelKey, JSON.stringify(subscriptions), router]);

  return null;
}
