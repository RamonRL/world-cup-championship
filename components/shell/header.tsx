import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./user-menu";

type Props = {
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function AppHeader({ email, nickname, avatarUrl, isAdmin }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_88%,transparent)] px-4 backdrop-blur-md lg:px-8">
      <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
        <Image
          src="/logo.png"
          alt="Mundial 26"
          width={36}
          height={36}
          priority
          className="size-9 rounded-md object-cover"
        />
        <span className="leading-tight">
          <span className="block font-display text-xl tracking-tight">Mundial 26</span>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Quiniela
          </span>
        </span>
      </Link>
      <div className="hidden items-center gap-3 lg:flex">
        <span className="size-2 rounded-full bg-[var(--color-success)]" />
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          En vivo · Canadá / México / USA
        </span>
      </div>
      <UserMenu email={email} nickname={nickname} avatarUrl={avatarUrl} isAdmin={isAdmin} />
    </header>
  );
}
