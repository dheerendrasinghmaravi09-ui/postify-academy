import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";

export function Header() {
  const { theme, setTheme } = useTheme();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { adminName, setLoggedOut } = useAuthStore();
  const { clear } = useInternetIdentity();

  const handleLogout = () => {
    clear();
    setLoggedOut();
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 shadow-subtle"
      data-ocid="header"
    >
      {/* Left: mobile menu + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          data-ocid="header.menu_toggle"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <p className="font-display text-sm font-semibold text-foreground">
            Postify Academy
          </p>
          <p className="text-xs text-muted-foreground">Admin Control Panel</p>
        </div>
      </div>

      {/* Right: theme toggle + user menu */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          data-ocid="header.theme_toggle"
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun
              className="h-4.5 w-4.5"
              style={{ width: "1.125rem", height: "1.125rem" }}
            />
          ) : (
            <Moon
              className="h-4.5 w-4.5"
              style={{ width: "1.125rem", height: "1.125rem" }}
            />
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-sm"
              data-ocid="header.user_menu"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline text-foreground font-medium">
                {adminName || "Super Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">
                {adminName || "Super Admin"}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
              data-ocid="header.logout_button"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
