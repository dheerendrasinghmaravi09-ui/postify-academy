import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BanknoteIcon,
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Palette,
  RefreshCw,
  Settings,
  Share2,
  Smartphone,
  Tag,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useUIStore } from "../../store/uiStore";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Courses", path: "/courses", icon: BookOpen },
  {
    label: "Course App Dashboard",
    path: "/course-app-dashboard",
    icon: LayoutGrid,
  },
  { label: "Users", path: "/users", icon: Users },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Tests & Quizzes", path: "/tests", icon: Zap },
  { label: "Engagement", path: "/engagement", icon: MessageSquare },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Referrals", path: "/referrals", icon: Share2 },
  { label: "Content", path: "/content", icon: FileText },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
] as const;

const configItems = [
  { label: "Coupons", path: "/coupons", icon: Tag },
  { label: "Payment Methods", path: "/payment-methods", icon: Wallet },
  { label: "App Branding", path: "/app-branding", icon: Palette },
  { label: "App Sync", path: "/app-sync", icon: RefreshCw },
  {
    label: "Connected App",
    path: "/connected-app-dashboard",
    icon: Smartphone,
  },
] as const;

const paymentsItems = [
  { label: "Withdrawals", path: "/withdrawals", icon: BanknoteIcon },
  { label: "Razorpay", path: "/razorpay-settings", icon: CreditCard },
] as const;

type NavItem =
  | (typeof navItems)[number]
  | (typeof configItems)[number]
  | (typeof paymentsItems)[number];

function NavLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick?: () => void;
}) {
  const router = useRouterState();
  const isActive = router.location.pathname.startsWith(item.path);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      data-ocid={`sidebar.${item.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-smooth",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">
              P
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-foreground leading-tight">
              Postify
            </p>
            <p className="text-xs text-accent font-medium leading-tight">
              Academy Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Main Menu
        </p>
        {navItems.slice(0, 5).map((item) => (
          <NavLink key={item.path} item={item} onClick={onClose} />
        ))}
        <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Management
        </p>
        {navItems.slice(5, 10).map((item) => (
          <NavLink key={item.path} item={item} onClick={onClose} />
        ))}
        <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Reports & Config
        </p>
        {navItems.slice(10).map((item) => (
          <NavLink key={item.path} item={item} onClick={onClose} />
        ))}
        <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Config &amp; Integrations
        </p>
        {configItems.map((item) => (
          <NavLink key={item.path} item={item} onClick={onClose} />
        ))}
        <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Payments &amp; Finance
        </p>
        {paymentsItems.map((item) => (
          <NavLink key={item.path} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
