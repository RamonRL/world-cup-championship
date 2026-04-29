"use client";

import { useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";
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
  type FormState,
} from "./actions";

export function OperationsActions() {
  const [pending, start] = useTransition();
  const [stageKey, setStageKey] = useState<"r16" | "qf" | "sf" | "final" | "champion">("r16");

  function run(fn: () => Promise<FormState>, label: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message ?? `${label} ejecutada.`);
      else toast.error(res.error ?? "Error.");
    });
  }

  function runWithFormData(fn: (fd: FormData) => Promise<FormState>, fd: FormData, label: string) {
    start(async () => {
      const res = await fn(fd);
      if (res.ok) toast.success(res.message ?? `${label} ejecutada.`);
      else toast.error(res.error ?? "Error.");
    });
  }

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
          <Button onClick={() => run(closeGroupStage, "Cierre fase grupos")} disabled={pending}>
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
              runWithFormData(closeKnockoutStage, fd, "Cierre ronda");
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
          <Button onClick={() => run(closeTopScorer, "Bota de Oro")} disabled={pending}>
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
            onClick={() => run(recomputeEverything, "Recalcular todo")}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Play />}
            Recalcular
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
