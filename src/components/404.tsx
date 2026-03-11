import { Link, useRouter } from "@tanstack/react-router";
import { Home, ArrowLeft, VideoOff, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function DefaultNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
      <Card className="max-w-md w-full p-8 border-none bg-accent/5 backdrop-blur-md text-center shadow-2xl overflow-hidden relative border border-white/5">
        {/* Thematic Glow effects */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-red-600/10 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-muted/50 p-4 rounded-full mb-6 ring-1 ring-white/10">
            <VideoOff className="h-12 w-12 text-muted-foreground" />
          </div>

          <h1 className="text-6xl font-bold tracking-tighter mb-2 bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Video not found
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            The content you're looking for might have been moved, deleted, or
            perhaps you've followed a broken link in the feed.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => router.history.back()}
              className="flex items-center gap-2 border-white/10 bg-white/5 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>

            <Button asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
          <p className="text-[12px] text-muted-foreground flex items-center justify-center gap-2 opacity-70">
            <Search className="h-3 w-3" />
            Try checking your saved channels instead.
          </p>
        </div>
      </Card>
    </div>
  );
}
