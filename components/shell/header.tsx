import Link from "next/link";
import { Trophy } from "lucide-react";
import { UserMenu } from "./user-menu";

type Props = {
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function AppHeader({ email, nickname, avatarUrl, isAdmin }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_85%,transparent)] px-4 backdrop-blur-md lg:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <span className="grid size-8 place-items-center rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
          <Trophy className="size-3.5" />
        </span>
        <span className="font-display text-lg leading-none">Mundial 26</span>
      </Link>
      <div className="hidden lg:block" />
      <UserMenu email={email} nickname={nickname} avatarUrl={avatarUrl} isAdmin={isAdmin} />
    </header>
  );
}
