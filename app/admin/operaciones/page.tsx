import { PageHeader } from "@/components/shell/page-header";
import { OperationsActions } from "./operations-actions";

export const metadata = { title: "Operaciones · Admin" };

export default function AdminOperationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Operaciones del torneo"
        description="Cierres y recálculos puntuales."
      />
      <OperationsActions />
    </div>
  );
}
