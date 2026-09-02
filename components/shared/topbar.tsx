import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/utils";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({
  title,
  subtitle,
  userName,
  avatarUrl,
}: {
  title: string;
  subtitle?: string;
  userName: string;
  avatarUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Bildirimler">
          <Bell className="h-5 w-5" />
        </Button>
        <ThemeToggle />
        <Avatar className="h-9 w-9">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
          <AvatarFallback>{initials(userName)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
