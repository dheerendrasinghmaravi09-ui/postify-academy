import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  Download,
  Info,
  KeyRound,
  Moon,
  Shield,
  Sun,
  UserCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../hooks/useAuth";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { AuditLogEntry } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleString();
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  UPDATE: "bg-primary/10 text-primary border-primary/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
  LOGIN: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  LOGOUT: "bg-muted text-muted-foreground border-border",
  PUBLISH: "bg-accent/15 text-accent border-accent/30",
  BLOCK: "bg-chart-5/15 text-chart-5 border-chart-5/30",
};

function actionBadgeClass(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toUpperCase().includes(k),
  );
  return key
    ? ACTION_COLORS[key]
    : "bg-secondary text-secondary-foreground border-border";
}

function exportCSV(entries: AuditLogEntry[]) {
  const header = "Timestamp,Action,Resource,Details,Admin\n";
  const rows = entries
    .map((e) => {
      const ts = formatTs(e.timestamp);
      const [resource, ...rest] = e.details.split(":").map((s) => s.trim());
      const detail = rest.join(":").trim() || e.details;
      return `"${ts}","${e.action}","${resource}","${detail}","${e.userId.toText()}"`;
    })
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { identity, adminName, adminEmail, setAdminIdentity } = useAuth();

  // Admin Identity fields
  const [editName, setEditName] = useState(adminName);
  const [editEmail, setEditEmail] = useState(adminEmail);
  const [identitySaved, setIdentitySaved] = useState(false);

  // Keep local fields in sync if store changes externally (e.g. on first mount)
  useEffect(() => {
    setEditName(adminName);
  }, [adminName]);
  useEffect(() => {
    setEditEmail(adminEmail);
  }, [adminEmail]);

  const principalText = identity?.getPrincipal().toText() ?? "Not connected";
  const loginSince = useMemo(() => new Date().toLocaleString(), []);

  const handleIdentitySave = () => {
    if (!editName.trim() || !editEmail.trim()) return;
    setAdminIdentity(editName.trim(), editEmail.trim());
    setIdentitySaved(true);
    setTimeout(() => setIdentitySaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* ── Admin Identity ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            Admin Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Display Name</Label>
              <Input
                id="admin-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Super Admin"
                data-ocid="settings.identity.name_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Display Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="e.g. admin@postify.academy"
                data-ocid="settings.identity.email_input"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            These values appear in the sidebar and header. They are stored
            locally and do not affect your Internet Identity login.
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleIdentitySave}
              disabled={!editName.trim() || !editEmail.trim()}
              data-ocid="settings.identity.save_button"
            >
              {identitySaved ? "Saved!" : "Save Changes"}
            </Button>
            {identitySaved && (
              <span
                className="text-xs text-chart-3 font-medium"
                data-ocid="settings.identity.success_state"
              >
                Identity updated — changes are live.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Admin Profile (read-only context) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Principal ID</Label>
            <div className="flex items-center gap-2">
              <Input
                value={principalText}
                readOnly
                className="font-mono text-xs bg-muted/30"
                data-ocid="settings.profile.principal_input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(principalText)}
                data-ocid="settings.profile.copy_principal.button"
              >
                Copy
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <div className="flex items-center gap-2 h-9">
              <Badge className="bg-primary/10 text-primary border-primary/30 border text-sm px-3 py-1">
                Super Admin
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Session Information ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Session Status
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-chart-3 shrink-0" />
                <p className="text-sm font-semibold text-foreground">Active</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Session Started
              </p>
              <p className="text-sm font-semibold text-foreground">
                {loginSince}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Secured via Internet Identity. Sign out and back in with a
                different anchor to switch accounts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({
  isDark,
  onToggleTheme,
}: { isDark: boolean; onToggleTheme: () => void }) {
  return (
    <div className="space-y-5">
      {/* Internet Identity notice */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Secured by Internet Identity
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This admin panel uses Internet Identity for authentication — a
                decentralized, passwordless system backed by cryptographic keys
                on your device (biometrics, passkey, or hardware key). No
                passwords are stored or required.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                To change your authentication device or manage delegations,
                visit{" "}
                <a
                  href="https://identity.ic0.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  identity.ic0.app
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
            {isDark ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Sun className="h-4 w-4 text-accent" />
            )}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark theme
              </p>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={onToggleTheme}
              data-ocid="settings.security.dark_mode.switch"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

const ACTION_TYPES = [
  "All",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PUBLISH",
  "BLOCK",
];
const PAGE_SIZE = 20;

function AuditLogTab() {
  const { actor, isFetching } = useBackend();
  const [actionFilter, setActionFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const { data: entries = [], isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ["auditLog"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAuditLog();
    },
    enabled: !!actor && !isFetching,
  });

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchAction =
        actionFilter === "All" || e.action.toUpperCase().includes(actionFilter);
      const ts = Number(e.timestamp / 1_000_000n);
      const matchFrom = !dateFrom || ts >= new Date(dateFrom).getTime();
      const matchTo = !dateTo || ts <= new Date(`${dateTo}T23:59:59`).getTime();
      return matchAction && matchFrom && matchTo;
    });
  }, [entries, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = useCallback((v: string) => {
    setActionFilter(v);
    setPage(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="audit-from">From Date</Label>
              <Input
                id="audit-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="w-36"
                data-ocid="settings.audit.date_from_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-to">To Date</Label>
              <Input
                id="audit-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="w-36"
                data-ocid="settings.audit.date_to_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Action Type</Label>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFilterChange(type)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      actionFilter === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                    data-ocid={`settings.audit.filter_${type.toLowerCase()}.tab`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(filtered)}
                disabled={filtered.length === 0}
                className="flex items-center gap-1.5"
                data-ocid="settings.audit.export_csv.button"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-6 space-y-3"
              data-ocid="settings.audit.loading_state"
            >
              {(["r1", "r2", "r3", "r4", "r5", "r6"] as const).map((k) => (
                <Skeleton key={k} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="settings.audit.empty_state"
            >
              <Shield className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No audit entries found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try adjusting your filters or date range
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Resource</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                    <TableHead className="text-xs">Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((entry, i) => {
                    const [resource, ...rest] = entry.details
                      .split(":")
                      .map((s) => s.trim());
                    const detail = rest.join(":").trim() || "—";
                    const principalShort =
                      entry.userId.toText().length > 14
                        ? `${entry.userId.toText().slice(0, 7)}…${entry.userId.toText().slice(-5)}`
                        : entry.userId.toText();
                    return (
                      <TableRow
                        key={Number(entry.id)}
                        className="text-xs hover:bg-muted/20 transition-colors"
                        data-ocid={`settings.audit.item.${i + 1}`}
                      >
                        <TableCell className="text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                          {formatTs(entry.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0.5 ${actionBadgeClass(entry.action)}`}
                          >
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {resource}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[220px] truncate">
                          {detail}
                        </TableCell>
                        <TableCell
                          className="font-mono text-[11px] text-muted-foreground"
                          title={entry.userId.toText()}
                        >
                          {principalShort}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="settings.audit.pagination_prev"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="settings.audit.pagination_next"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl" data-ocid="settings.page">
        <div>
          <Breadcrumbs items={[{ label: "Settings" }]} />
          <div className="mt-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your admin profile, security, and audit trail
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" data-ocid="settings.tabs">
          <TabsList className="mb-6 bg-muted/50 border border-border">
            <TabsTrigger value="profile" data-ocid="settings.tab.profile">
              <UserCircle className="h-3.5 w-3.5 mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" data-ocid="settings.tab.security">
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="audit" data-ocid="settings.tab.audit">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab isDark={isDark} onToggleTheme={toggleTheme} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
