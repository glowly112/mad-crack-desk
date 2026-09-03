import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { PlantProvider } from "@/components/plant-provider";
import { PrefsProvider } from "@/components/prefs-provider";
import { AppShell } from "@/components/app-shell";
import { AppErrorComponent, AppNotFoundComponent } from "@/lib/error-component";
import appCss from "../styles.css?url";

const APP_NAME = "Mad Crack Lab";

const PREFS_BOOT = `(function(){try{var p=JSON.parse(localStorage.getItem("mcl.prefs")||"{}");var h=document.documentElement;var theme=p.theme||"charcoal";if(p.theme)h.setAttribute("data-theme",theme);if(p.font)h.setAttribute("data-font",p.font);if(p.size)h.setAttribute("data-size",p.size);var colors={charcoal:"#0a0a0b",paper:"#f7f0e3",night:"#06080f",lab:"#041208"};var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",colors[theme]||colors.charcoal);}catch(e){}})();`;

export const Route = createRootRoute({
  errorComponent: AppErrorComponent,
  notFoundComponent: AppNotFoundComponent,
  loader: async () => {
    const { loadPlant } = await import("@/lib/lab/load-plant.server.ts");
    const plant = await loadPlant();
    return { plant };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0a0a0b" },
      {
        name: "description",
        content: "Operator desk for the racing recipe plant. Production score first. Paper is not income.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://api.fontshare.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const { plant } = Route.useLoaderData();
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT }} />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <PrefsProvider>
            <PlantProvider initial={plant}>
              <AppShell>
                <Outlet />
              </AppShell>
            </PlantProvider>
          </PrefsProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
