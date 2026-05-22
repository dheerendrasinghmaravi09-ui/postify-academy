import { Toaster } from "@/components/ui/sonner";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

export const Route = createRootRoute({
  component: RootComponent,
});

// Named export for child routes to import
export const rootRoute = Route;

function RootComponent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Outlet />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
