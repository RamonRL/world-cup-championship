import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";
import { LeagueSwitcher } from "./league-switcher";
import type { Membership } from "@/lib/leagues";

type Props = {
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  memberships: Membership[];
  activeLeagueId: number | null;
};

export function AppHeader({
  email,
  nickname,
  avatarUrl,
  isAdmin,
  memberships,
  activeLeagueId,
}: Props) {
  return (
    // Mobile: flex con LeagueSwitcher en flex-1 → se centra en el espacio
    //   entre logo y UserMenu (no en el centro geométrico de la pantalla).
    //   Comportamiento original; el desfase con el FWC26 da igual aquí.
    // Desktop (lg+): grid 1fr_auto_1fr → centro geométrico para alinear
    //   con el logo FWC26 que vive centrado en la columna de contenido.
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_88%,transparent)] px-4 backdrop-blur-md lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
      <div className="flex items-center">
        <Link
          href="/dashboard"
          aria-label="Quiniela Mundial"
          className="block transition-opacity hover:opacity-80 lg:hidden"
        >
          <Image
            src="/hlogo.png"
            alt="Quiniela Mundial"
            width={1919}
            height={660}
            priority
            className="h-9 w-auto"
          />
        </Link>
      </div>
      <div className="flex flex-1 justify-center lg:flex-initial">
        <LeagueSwitcher memberships={memberships} activeLeagueId={activeLeagueId} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <UserMenu email={email} nickname={nickname} avatarUrl={avatarUrl} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
