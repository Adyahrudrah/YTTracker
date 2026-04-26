import { Link } from "@tanstack/react-router";
import type { User } from "firebase/auth";
import { Bookmark, Home, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout } from "../services/firebase";

export default function BottomNav({ user }: { user: User }) {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const NAV_ITEMS = [
    { label: "Feed", to: "/", icon: Home },
    { label: "Saved", to: "/saved-channels", icon: Bookmark },
  ] as const;

  return (
    <nav className="bg-background/80 backdrop-blur-md border-t pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="h-5 w-5 transition-all"
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </Link>
        ))}

        {user && (
          <Sheet>
            <SheetTrigger className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground">
              <Avatar className="h-6 w-6 border">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback className="text-[10px]">
                  {user.displayName?.charAt(0) || (
                    <UserIcon className="h-3 w-3" />
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium">Profile</span>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-[20px] px-6 pb-10">
              <SheetHeader className="text-left py-4">
                <SheetTitle className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={user.photoURL || ""} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold">
                      {user.displayName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-2 mt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
