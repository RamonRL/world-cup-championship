"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Subscription = {
  /** Public table to listen on (e.g. "chat_messages") */
  table: string;
  /** Optional Supabase Realtime filter, e.g. "match_id=eq.42" */
  filter?: string;
};

/**
 * Coalesce de ráfagas: si llegan varios eventos en < `DEBOUNCE_MS`, solo
 * disparamos un `router.refresh()`. Sin esto, un partido con 3 cambios
 * (cambio de score + 1 goleador + status update) en menos de un segundo
 * provocaba 3 re-renders SSR encadenados — multiplicado por N usuarios
 * mirando, eso saturaba el pool de Postgres.
 */
const DEBOUNCE_MS = 400;

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
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`refresher:${channelKey}`);

    const scheduleRefresh = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        router.refresh();
      }, DEBOUNCE_MS);
    };

    for (const sub of subscriptions) {
      const config: Record<string, unknown> = {
        event: "*",
        schema: "public",
        table: sub.table,
      };
      if (sub.filter) config.filter = sub.filter;
      channel.on("postgres_changes" as never, config as never, scheduleRefresh);
    }

    channel.subscribe();
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [channelKey, JSON.stringify(subscriptions), router]);

  return null;
}
