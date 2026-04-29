import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { specialPredictions } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/utils";
import { ResolveSpecialForm } from "./resolve-form";

export const metadata = { title: "Especiales · Admin" };

export default async function AdminSpecialsPage() {
  const specials = await db
    .select()
    .from(specialPredictions)
    .orderBy(asc(specialPredictions.orderIndex));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Predicciones especiales"
        description="Cuando termine el torneo (o cierre cada especial), introduce el valor resuelto para que se otorguen los puntos a los usuarios. El recálculo se dispara automáticamente."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {specials.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[0.65rem] uppercase">
                    {s.type.replace(/_/g, " ")}
                  </Badge>
                  <CardTitle className="text-base">{s.question}</CardTitle>
                  <CardDescription>
                    Cierra: {formatDateTime(s.closesAt)}
                  </CardDescription>
                </div>
                {s.resolvedValueJson ? (
                  <Badge variant="success" className="text-[0.65rem]">
                    Resuelto
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[0.65rem]">
                    Pendiente
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ResolveSpecialForm
                special={{
                  id: s.id,
                  type: s.type,
                  optionsJson: s.optionsJson as unknown,
                  resolvedValueJson: s.resolvedValueJson as unknown,
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
