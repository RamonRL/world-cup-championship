"use client";

import { useState, useTransition } from "react";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  closeGroupStage,
  closeKnockoutStage,
  closeTopScorer,
  recomputeEverything,
  resetAllPoints,
  resetGroupStage,
  type FormState,
} from "./actions";

export function OperationsActions() {
  const [pending, start] = useTransition();
  const [stageKey, setStageKey] = useState<"r16" | "qf" | "sf" | "final" | "champion">("r16");

  function run(fn: () => Promise<FormState>, label: string, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message ?? `${label} ejecutada.`);
      else toast.error(res.error ?? "Error.");
    });
  }

  function runWithFormData(
    fn: (fd: FormData) => Promise<FormState>,
    fd: FormData,
    label: string,
    confirmText: string,
  ) {
    if (!window.confirm(confirmText)) return;
    start(async () => {
      const res = await fn(fd);
      if (res.ok) toast.success(res.message ?? `${label} ejecutada.`);
      else toast.error(res.error ?? "Error.");
    });
  }

  const KO_LABEL: Record<typeof stageKey, string> = {
    r16: "octavos",
    qf: "cuartos",
    sf: "semifinales",
    final: "la final",
    champion: "el campeón",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cerrar fase de grupos</CardTitle>
          <CardDescription>
            Calcula la clasificación final de cada grupo a partir de los partidos finalizados y
            otorga los puntos de la categoría de &ldquo;posiciones&rdquo;.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() =>
              run(
                closeGroupStage,
                "Cierre fase grupos",
                "Vas a cerrar la fase de grupos y otorgar los puntos de \"posiciones\" a todos los participantes. ¿Continuar?",
              )
            }
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            Cerrar y puntuar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cerrar ronda eliminatoria</CardTitle>
          <CardDescription>
            Para cada ronda, otorga los puntos del bracket a los participantes que acertaron qué
            equipos avanzan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={stageKey} onValueChange={(v) => setStageKey(v as typeof stageKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="r16">Octavos (cierra R32)</SelectItem>
              <SelectItem value="qf">Cuartos (cierra octavos)</SelectItem>
              <SelectItem value="sf">Semifinales (cierra cuartos)</SelectItem>
              <SelectItem value="final">Final (cierra semis)</SelectItem>
              <SelectItem value="champion">Campeón (cierra la final)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              const fd = new FormData();
              fd.set("stageKey", stageKey);
              runWithFormData(
                closeKnockoutStage,
                fd,
                "Cierre ronda",
                `Vas a otorgar los puntos del bracket de ${KO_LABEL[stageKey]}. ¿Continuar?`,
              );
            }}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            Cerrar y puntuar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finalizar Bota de Oro</CardTitle>
          <CardDescription>
            Calcula el ranking de goleadores a partir de los goles registrados (excluye en
            propia) y otorga los puntos correspondientes.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() =>
              run(
                closeTopScorer,
                "Bota de Oro",
                "Vas a finalizar la Bota de Oro y otorgar los puntos del top de goleadores. Sólo deberías hacerlo cuando el torneo haya terminado. ¿Continuar?",
              )
            }
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            Calcular y puntuar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recalcular todo</CardTitle>
          <CardDescription>
            Reaplica todas las funciones de puntuación sobre el estado actual del torneo. Útil
            tras editar reglas o si algo está desincronizado.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="secondary"
            onClick={() =>
              run(
                recomputeEverything,
                "Recalcular todo",
                "Esto borra y reescribe todas las entradas de puntos del torneo aplicando las reglas actuales. La operación es idempotente pero puede tardar unos segundos. ¿Continuar?",
              )
            }
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            Recalcular
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_3%,var(--color-surface))]">
        <CardHeader>
          <CardTitle className="text-[var(--color-danger)]">
            Resetear fase de grupos
          </CardTitle>
          <CardDescription>
            Vacía la tabla de clasificación calculada (`group_standings`) y
            borra del ledger los puntos de la categoría &ldquo;Posiciones de
            grupo&rdquo;. El resto del ledger (bracket, marcadores, goleadores,
            especiales) queda intacto. La clasificación se regenera al guardar
            cualquier resultado de grupos o con &ldquo;Recalcular todo&rdquo;.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] hover:text-[var(--color-danger)]"
            onClick={() =>
              run(
                resetGroupStage,
                "Reset fase grupos",
                "Vas a borrar la clasificación calculada de los grupos y los puntos de \"Posiciones de grupo\". El resto del ledger no se toca. ¿Continuar?",
              )
            }
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Resetear fase grupos
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_3%,var(--color-surface))]">
        <CardHeader>
          <CardTitle className="text-[var(--color-danger)]">
            Resetear puntuaciones
          </CardTitle>
          <CardDescription>
            Pone TODAS las puntuaciones a cero borrando el `points_ledger`. Las
            predicciones se mantienen — sólo se borran los puntos. Útil para
            arrancar limpio antes de un torneo de prueba o resetear una
            simulación. Después, &quot;Recalcular todo&quot; reaplica los
            resultados ya guardados.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] hover:text-[var(--color-danger)]"
            onClick={() =>
              run(
                resetAllPoints,
                "Reset puntuaciones",
                "Vas a poner TODAS las puntuaciones a cero. Se borran las entradas del points_ledger; las predicciones de los participantes se conservan. ¿Seguro?",
              )
            }
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Resetear a cero
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
