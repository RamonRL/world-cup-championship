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
    // Grid 1fr_auto_1fr: las dos columnas laterales reparten ancho a partes
    // iguales, así el LeagueSwitcher central queda en el centro geométrico
    // de la barra independientemente de lo ancho que sea el UserMenu.
    // Antes era flex flex-1 justify-center y el switcher se desplazaba a la
    // izquierda compensando el avatar de la derecha — y eso desalineaba con
    // el logo FWC26 que sí está centrado en la columna de contenido.
    <header className="sticky top-0 z-20 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_88%,transparent)] px-4 backdrop-blur-md lg:px-8">
      {/* Columna izquierda: logo mobile o vacía en desktop. */}
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
      <div className="flex justify-center">
        <LeagueSwitcher memberships={memberships} activeLeagueId={activeLeagueId} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <UserMenu email={email} nickname={nickname} avatarUrl={avatarUrl} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
