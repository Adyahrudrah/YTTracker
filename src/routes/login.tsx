import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { auth, signInWithGoogle } from "../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Youtube, Zap, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) navigate({ to: "/" });
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* Hero Section - Hidden on Mobile, Flex on Desktop */}
      <div className="relative hidden lg:flex w-full lg:w-1/2 xl:w-3/5 flex-col justify-center bg-zinc-950 p-16 text-white overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 max-w-2xl">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 border border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-widest">
              v2.0 is Live
            </span>
          </div>

          <h1 className="mb-6 text-6xl font-bold tracking-tight xl:text-7xl">
            Focus on the <br />
            <span className="text-zinc-500 italic">Content.</span>
          </h1>

          <p className="mb-12 text-xl text-zinc-400 leading-relaxed max-w-lg">
            The minimalist dashboard for YouTube power users. No distractions,
            no comments, just your favorite creators.
          </p>

          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
                <LayoutDashboard className="h-6 w-6 text-zinc-100" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Clean Feed</h3>
                <p className="text-sm text-zinc-500">
                  A noise-free chronological timeline.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
                <Zap className="h-6 w-6 text-zinc-100" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Instant Access</h3>
                <p className="text-sm text-zinc-500">
                  Zero loading screens between videos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Section - Full width on Mobile */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header - Only visible on Mobile */}
          <div className="flex flex-col items-center text-center lg:hidden space-y-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 shadow-xl">
              <Youtube className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                TubeFocus
              </h2>
              <p className="text-zinc-500 text-sm max-w-62.5">
                Your distraction-free YouTube workspace
              </p>
            </div>
          </div>

          <div className="bg-white lg:border-none lg:shadow-none p-0 sm:p-8 rounded-3xl sm:border sm:shadow-sm">
            <div className="hidden lg:block mb-10">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                Sign in
              </h2>
              <p className="mt-3 text-zinc-500">
                Welcome back! Pick up where you left off.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-zinc-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
