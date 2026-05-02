"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Barra de progreso top-of-page tipo NProgress. Se activa al hacer click en
 * cualquier <a href="/..."> interno, sube progresivamente hasta ~85% y se
 * completa cuando `usePathname()` cambia (señal fiable de que la ruta nueva
 * ya está en pantalla).
 *
 * Ventajas vs un spinner global:
 *   - No tapa contenido.
 *   - Da feedback inmediato (en cuanto el browser intercepta el click).
 *   - El glow arena es coherente con el resto del branding.
 *
 * Edge cases cubiertos:
 *   - Modificadores (cmd/ctrl/shift/alt) y target="_blank" no disparan.
 *   - Anchors a la misma página (#section) no disparan.
 *   - Si la navegación tarda mucho, sube a un máximo del 85% y se queda ahí
 *     (evita "completar" antes de tiempo).
 *   - Si el usuario interrumpe con back/forward, el cambio de pathname
 *     completa la barra normalmente.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  // Cuando cambia el pathname, completar la barra y desvanecer.
  useEffect(() => {
    if (!isNavigatingRef.current) return;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setProgress(100);
    if (fadeOutRef.current) clearTimeout(fadeOutRef.current);
    fadeOutRef.current = setTimeout(() => {
      setProgress(null);
      isNavigatingRef.current = false;
    }, 280);
  }, [pathname]);

  // Listener global de clicks para detectar arranque de navegación.
  useEffect(() => {
    function startProgress() {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      if (fadeOutRef.current) {
        clearTimeout(fadeOutRef.current);
        fadeOutRef.current = null;
      }
      let p = 12;
      setProgress(p);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        // Curva logarítmica: rápido al principio, lento cerca del 85%.
        p = Math.min(85, p + (90 - p) * 0.09);
        setProgress(p);
      }, 90);
    }

    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const target = (e.target as HTMLElement | null)?.closest("a") as
        | HTMLAnchorElement
        | null;
      if (!target) return;
      if (target.target === "_blank") return;
      if (target.hasAttribute("download")) return;
      const href = target.getAttribute("href");
      if (!href) return;
      // Solo internos.
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Mismo path → ignorar (anchor interno o re-click).
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname && !url.search) return;
      startProgress();
    }

    function onSubmit(e: SubmitEvent) {
      // Forms con action a una ruta interna o con server action: a falta de
      // mejor señal, mostramos la barra y la cerramos cuando vuelva el
      // pathname change o tras un timeout máximo.
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      // Skip si parece un form local (ej. logout — no queremos doble bar).
      const action = form.getAttribute("action");
      if (action && /^https?:\/\//i.test(action)) return;
      startProgress();
      // Si en 2.5s no cambió el path, completar igualmente para no quedar pinned.
      setTimeout(() => {
        if (isNavigatingRef.current) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          setProgress(100);
          fadeOutRef.current = setTimeout(() => {
            setProgress(null);
            isNavigatingRef.current = false;
          }, 280);
        }
      }, 2500);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      if (tickRef.current) clearInterval(tickRef.current);
      if (fadeOutRef.current) clearTimeout(fadeOutRef.current);
    };
  }, [pathname]);

  if (progress == null) return null;
  const visible = progress < 100;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
    >
      <div
        className="h-full bg-[var(--color-arena)] transition-[width,opacity] duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow:
            "0 0 8px color-mix(in oklch, var(--color-arena) 80%, transparent), 0 0 16px color-mix(in oklch, var(--color-arena) 40%, transparent)",
        }}
      />
    </div>
  );
}
