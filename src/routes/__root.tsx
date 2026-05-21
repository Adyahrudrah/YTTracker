import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
// import { TanStackDevtools } from "@tanstack/react-devtools";
import Header from "../components/Header";

import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";

// import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import type { QueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import MobileAside from "#/components/Footer";
import { auth } from "#/services/firebase";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "YTTracker",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]">
        <TanStackQueryProvider>
          {/* This layout container locks the viewport structure */}
          <div className="flex h-screen flex-col overflow-hidden">
            {/* Header stays pinned naturally */}
            {user && <Header />}

            {/* Scroll container: Only the main content scrolls */}
            <main className="flex-1 overflow-y-auto min-h-0 [webkit-overflow-scrolling:touch]">
              {children}
            </main>

            {/* Footer stays structurally at the bottom, no 'fixed' issues */}
            {user && (
              <div className="z-50 shrink-0">
                <MobileAside user={user} />
              </div>
            )}
          </div>
        </TanStackQueryProvider>
        <Toaster position="top-center" richColors theme="system" />
        <Scripts />
      </body>
    </html>
  );
}
