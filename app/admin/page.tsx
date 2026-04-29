import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Admin" };

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel admin"
        title="Control de la quiniela"
        description="Configura selecciones, calendario, resultados y reglas de puntuación. Cualquier cambio recalcula automáticamente los puntos."
      />
      <EmptyState
        icon={<ShieldCheck className="size-5" />}
        title="Próxima fase: CRUD del torneo"
        description="Las herramientas de administración (selecciones, jugadores, partidos, reglas, predicciones especiales) se construyen en la siguiente tarea."
      />
    </div>
  );
}
