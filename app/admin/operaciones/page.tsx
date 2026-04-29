import { PageHeader } from "@/components/shell/page-header";
import { OperationsActions } from "./operations-actions";

export const metadata = { title: "Operaciones · Admin" };

export default function AdminOperationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Operaciones del torneo"
        description="Acciones puntuales que disparan el cálculo de puntos: cerrar fase de grupos, cerrar rondas eliminatorias, finalizar la Bota de Oro, recalcular todo."
      />
      <OperationsActions />
    </div>
  );
}
