import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  User as UserIcon,
  Menu,
  History,
  Bookmark,
  LogOut,
} from "lucide-react";
import { type User } from "firebase/auth";
import { logout } from "../services/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MobileAside({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const NAV_ITEMS = [
    { label: "Feed", to: "/", icon: History },
    { label: "Saved Channels", to: "/saved-channels", icon: Bookmark },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-75 sm:w-100 flex flex-col">
        <SheetHeader className="text-left pb-6 border-b">
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user.photoURL || ""} />
              <AvatarFallback className="bg-zinc-100 text-zinc-600">
                {user.displayName?.charAt(0) || (
                  <UserIcon className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-45">
                {user.displayName}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-45">
                {user.email}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 p-4 flex-1">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <Button
              key={to}
              variant="ghost"
              className="justify-start gap-3 w-full text-base"
              onClick={() => setOpen(false)}
              asChild
            >
              <Link to={to}>
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </Button>
          ))}
        </div>

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3  hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
