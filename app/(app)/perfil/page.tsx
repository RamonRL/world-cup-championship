import { PageHeader } from "@/components/shell/page-header";
import { requireUser } from "@/lib/auth/guards";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const me = await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cuenta"
        title="Mi perfil"
        description="Personaliza tu apodo y avatar para que el resto de participantes te identifique."
      />
      <ProfileForm
        email={me.email}
        nickname={me.nickname}
        avatarUrl={me.avatarUrl}
      />
    </div>
  );
}
