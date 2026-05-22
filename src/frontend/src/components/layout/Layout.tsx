import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUIStore } from "../../store/uiStore";
import { Header } from "./Header";
import { SidebarContent } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-60 p-0 bg-card border-r border-border [&>button:last-of-type]:hidden"
          data-ocid="sidebar.sheet"
        >
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
