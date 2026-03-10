import { useNavigate, Link } from "@tanstack/react-router";
import { User as UserIcon, Menu, History, Bookmark } from "lucide-react";
import { type User } from "firebase/auth";
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
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-75 sm:w-100">
        <SheetHeader className="text-left pb-6 border-b hover:bg-background/30 cursor-pointer">
          <SheetTitle
            className="flex items-center gap-3"
            onClick={() => navigate({ to: "/login" })}
          >
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="bg-red-50 text-red-600">
                {user?.displayName?.charAt(0) || <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-45">
                {user?.displayName || "Guest User"}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-45">
                {user?.email}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 p-4">
          <Button
            variant="ghost"
            className="justify-start gap-3 w-full"
            asChild
          >
            <Link to="/">
              <History className="h-4 w-4" />
              Feed
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="justify-start gap-3 w-full"
            asChild
          >
            <Link to="/saved-channels">
              <Bookmark className="h-4 w-4" />
              Saved Channels
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
