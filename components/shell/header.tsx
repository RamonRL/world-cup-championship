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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_88%,transparent)] px-4 backdrop-blur-md lg:px-8">
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
          className="h-7 w-auto"
        />
      </Link>
      <div className="flex flex-1 justify-center">
        <LeagueSwitcher memberships={memberships} activeLeagueId={activeLeagueId} />
      </div>
      <div className="flex items-center gap-3">
        <UserMenu email={email} nickname={nickname} avatarUrl={avatarUrl} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
