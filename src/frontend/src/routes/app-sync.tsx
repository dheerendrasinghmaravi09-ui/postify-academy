import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createRoute } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  ExternalLink,
  Info,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SyncLogEntry, SyncStatus, SyncType } from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app-sync",
  component: AppSyncPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTimestamp(ts: bigint): string {
  return new Date(Number(ts)).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(ts: bigint): string {
  const diff = Date.now() - Number(ts);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Sync History Row ──────────────────────────────────────────────────────────

function SyncHistoryRow({
  entry,
  index,
}: { entry: SyncLogEntry; index: number }) {
  return (
    <tr
      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
      data-ocid={`app_sync.history_table.item.${index + 1}`}
    >
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {fmtTimestamp(entry.syncedAt)}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={
            entry.syncType === "Auto"
              ? "text-[10px] border-primary/40 text-primary bg-primary/5"
              : "text-[10px] border-accent/40 text-accent bg-accent/5"
          }
        >
          {entry.syncType === "Auto" ? (
            <Zap className="h-2.5 w-2.5 mr-1" />
          ) : (
            <RefreshCw className="h-2.5 w-2.5 mr-1" />
          )}
          {entry.syncType}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {entry.status === "Success" ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-chart-3">
            <CheckCircle2 className="h-3.5 w-3.5" /> Success
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <XCircle className="h-3.5 w-3.5" /> Failed
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
        {Number(entry.itemsSynced).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
        {entry.errorMessage ?? "—"}
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function AppSyncPage() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const [autoSync, setAutoSync] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingAppName, setEditingAppName] = useState(false);
  const [appNameInput, setAppNameInput] = useState("");

  const enabled = !!actor && !isFetching;

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: async () => {
      if (!actor) return [];
      const logs = await actor.listSyncLogs();
      return [...logs].sort((a, b) => Number(b.syncedAt) - Number(a.syncedAt));
    },
    enabled,
    refetchInterval: 30000,
  });

  const {
    data: allUsers = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["all-users-count"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers(null, null, BigInt(0), BigInt(10000));
    },
    enabled,
    refetchInterval: 30000,
  });

  const {
    data: allCourses = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled,
    refetchInterval: 30000,
  });

  const {
    data: revenueStats,
    isLoading: revenueLoading,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRevenueStats();
    },
    enabled,
    refetchInterval: 30000,
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalyticsSummary();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: contentFiles = [], isLoading: contentLoading } = useQuery({
    queryKey: ["content-files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listContentFiles();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: appBranding, isLoading: brandingLoading } = useQuery({
    queryKey: ["app-branding"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAppBranding();
    },
    enabled,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const clearLogsMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.clearSyncLogs();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
      toast.success("Activity log cleared");
    },
  });

  const updateAppNameMut = useMutation({
    mutationFn: async (newName: string) => {
      if (!actor) throw new Error("Not connected");
      const current = appBranding ?? {
        appName: "Postify Course App",
        tagline: "",
        primaryColor: "#3B82F6",
        accentColor: "#F97316",
        updatedAt: BigInt(Date.now()),
        logoUrl: undefined,
      };
      await actor.setAppBranding({
        ...current,
        appName: newName,
        updatedAt: BigInt(Date.now()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-branding"] });
      setEditingAppName(false);
      toast.success("App name updated!");
    },
    onError: () => toast.error("Failed to update app name"),
  });

  // ── Computed ───────────────────────────────────────────────────────────────
  const connectedAppName = appBranding?.appName ?? "Postify Course App";
  const totalCourses = allCourses.length;
  const publishedCourses = allCourses.filter((c) => c.isPublished).length;
  const totalStudents = allUsers.length;
  const totalTransactions = Number(revenueStats?.transactionCount ?? 0);
  const activeUsers = Number(analytics?.activeUsers ?? 0);

  const totalSyncs = syncLogs.length;
  const successCount = syncLogs.filter((l) => l.status === "Success").length;
  const successRate =
    totalSyncs > 0 ? Math.round((successCount / totalSyncs) * 100) : 100;
  const totalItemsSynced = syncLogs.reduce(
    (acc, l) => acc + Number(l.itemsSynced),
    0,
  );
  const lastSync = syncLogs[0]?.syncedAt;

  const healthIsLoading =
    usersLoading || coursesLoading || revenueLoading || analyticsLoading;
  const appCardLoading = coursesLoading || usersLoading || brandingLoading;

  // ── Refresh ────────────────────────────────────────────────────────────────
  async function handleRefreshAll() {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchCourses(),
        refetchRevenue(),
        refetchAnalytics(),
        queryClient.invalidateQueries({ queryKey: ["sync-logs"] }),
      ]);
      if (actor) {
        const entry: SyncLogEntry = {
          id: `refresh_${Date.now()}`,
          syncType: "Manual" as SyncType,
          status: "Success" as SyncStatus,
          itemsSynced: BigInt(totalStudents + totalCourses + totalTransactions),
          syncedAt: BigInt(Date.now()),
          errorMessage: undefined,
        };
        await actor.recordSyncLog(entry);
        queryClient.invalidateQueries({ queryKey: ["sync-logs"] });
      }
      toast.success("All data refreshed!");
    } catch {
      toast.error("Refresh failed. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function startEditAppName() {
    setAppNameInput(connectedAppName);
    setEditingAppName(true);
  }

  function cancelEditAppName() {
    setEditingAppName(false);
    setAppNameInput("");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="space-y-6" data-ocid="app_sync.page">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Breadcrumbs items={[{ label: "App Sync & Health" }]} />
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  App Sync & Health
                </h1>
                <p className="text-sm text-muted-foreground">
                  Connected app management & backend live status
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
              <Zap className="h-4 w-4 text-accent shrink-0" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Auto-refresh
              </span>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
                data-ocid="app_sync.autosync.toggle"
                aria-label="Enable auto-refresh"
              />
              {autoSync && (
                <Badge className="badge-accent text-[10px] py-0.5 px-2">
                  Active
                </Badge>
              )}
            </div>
            <Button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              data-ocid="app_sync.refresh_all_button"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh All
            </Button>
          </div>
        </div>

        {/* ── Connected App Hero Card ── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/5 shadow-md"
          data-ocid="app_sync.connected_app.card"
        >
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-accent/6 blur-2xl" />

          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8">
            {/* App Icon + Name */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Smartphone className="h-8 w-8" />
              </div>

              <div className="flex-1 min-w-0">
                {/* App name + status */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {appCardLoading ? (
                    <Skeleton className="h-7 w-44" />
                  ) : editingAppName ? (
                    <div
                      className="flex items-center gap-2"
                      data-ocid="app_sync.edit_appname.form"
                    >
                      <Input
                        value={appNameInput}
                        onChange={(e) => setAppNameInput(e.target.value)}
                        className="h-8 w-52 text-base font-bold"
                        placeholder="App name"
                        data-ocid="app_sync.edit_appname.input"
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            updateAppNameMut.mutate(appNameInput);
                          if (e.key === "Escape") cancelEditAppName();
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => updateAppNameMut.mutate(appNameInput)}
                        disabled={
                          updateAppNameMut.isPending || !appNameInput.trim()
                        }
                        data-ocid="app_sync.edit_appname.save_button"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={cancelEditAppName}
                        data-ocid="app_sync.edit_appname.cancel_button"
                        aria-label="Cancel edit"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-display text-xl font-bold text-foreground leading-tight">
                        {connectedAppName}
                      </h2>
                      <button
                        type="button"
                        onClick={startEditAppName}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                        data-ocid="app_sync.edit_appname.open_modal_button"
                        aria-label="Edit app name"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit name
                      </button>
                    </>
                  )}

                  {/* Connected badge */}
                  <span className="flex items-center gap-1.5 rounded-full border border-chart-3/40 bg-chart-3/10 px-2.5 py-0.5 text-[10px] font-semibold text-chart-3 dark:text-emerald-400 whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-chart-3 dark:bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                </div>

                {/* Same-backend note */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Same Backend · Always Synced · Internet Computer Canister
                  </span>
                </div>

                {/* Key Stats */}
                {appCardLoading ? (
                  <div className="mt-4 flex gap-5">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-5">
                    {[
                      {
                        label: "Total Courses",
                        value: totalCourses,
                        icon: BookOpen,
                        color: "text-primary",
                      },
                      {
                        label: "Published",
                        value: publishedCourses,
                        icon: CheckCircle2,
                        color: "text-chart-3",
                      },
                      {
                        label: "Total Students",
                        value: totalStudents,
                        icon: Users,
                        color: "text-accent",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <stat.icon
                          className={`h-4 w-4 shrink-0 ${stat.color}`}
                        />
                        <div>
                          <p
                            className={`font-display text-lg font-bold leading-tight ${stat.color}`}
                          >
                            {Number(stat.value).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Last sync */}
                {lastSync && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    Last activity: {fmtRelative(lastSync)}
                  </p>
                )}
              </div>
            </div>

            {/* Open Dashboard CTA */}
            <div className="shrink-0 flex flex-col gap-2 sm:items-end">
              <Link
                to="/connected-app-dashboard"
                data-ocid="app_sync.open_dashboard.link"
              >
                <Button
                  className="gap-2 shadow-sm font-semibold"
                  data-ocid="app_sync.open_dashboard_button"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-chart-3" />
                <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                  Same Backend · Always Synced
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Backend Health Stats ── */}
        <div data-ocid="app_sync.health_section">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">
                Backend Health
              </h2>
              <span className="badge-success text-[10px]">
                Live · 30s refresh
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="text-xs h-8"
              data-ocid="app_sync.health.refresh_button"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {healthIsLoading
              ? (["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"] as const).map(
                  (k) => (
                    <Skeleton key={k} className="h-20 w-full rounded-xl" />
                  ),
                )
              : [
                  {
                    label: "Total Users",
                    value: totalStudents,
                    icon: Users,
                    color: "text-primary",
                    bg: "bg-primary/10",
                    ocid: "app_sync.health.total_users",
                  },
                  {
                    label: "Active Users",
                    value: activeUsers,
                    icon: Activity,
                    color: "text-emerald-600 dark:text-emerald-400",
                    bg: "bg-emerald-50 dark:bg-emerald-950/30",
                    ocid: "app_sync.health.active_users",
                  },
                  {
                    label: "Total Courses",
                    value: totalCourses,
                    icon: BookOpen,
                    color: "text-accent",
                    bg: "bg-accent/10",
                    ocid: "app_sync.health.total_courses",
                  },
                  {
                    label: "Published",
                    value: publishedCourses,
                    icon: CheckCircle2,
                    color: "text-chart-3",
                    bg: "bg-chart-3/10",
                    ocid: "app_sync.health.published_courses",
                  },
                  {
                    label: "Transactions",
                    value: totalTransactions,
                    icon: DollarSign,
                    color: "text-purple-600 dark:text-purple-400",
                    bg: "bg-purple-50 dark:bg-purple-950/30",
                    ocid: "app_sync.health.transactions",
                  },
                  {
                    label: "Content Files",
                    value: contentLoading ? 0 : contentFiles.length,
                    icon: Database,
                    color: "text-indigo-600 dark:text-indigo-400",
                    bg: "bg-indigo-50 dark:bg-indigo-950/30",
                    ocid: "app_sync.health.content_files",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border border-border ${stat.bg} px-4 py-3 shadow-sm`}
                    data-ocid={stat.ocid}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                      <span className="text-[10px] text-muted-foreground font-medium truncate">
                        {stat.label}
                      </span>
                    </div>
                    <p
                      className={`font-display text-xl font-bold ${stat.color}`}
                    >
                      {Number(stat.value).toLocaleString()}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* ── Activity Summary Row ── */}
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          data-ocid="app_sync.stats.row"
        >
          {[
            {
              icon: Clock,
              label: "Last Activity",
              value: lastSync ? fmtRelative(lastSync) : "Just now",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: RefreshCw,
              label: "Total Refreshes",
              value: totalSyncs.toLocaleString(),
              color: "text-accent",
              bg: "bg-accent/10",
            },
            {
              icon: CheckCircle2,
              label: "Success Rate",
              value: `${successRate}%`,
              color: "text-chart-3",
              bg: "bg-chart-3/10",
            },
            {
              icon: Database,
              label: "Items Tracked",
              value: totalItemsSynced.toLocaleString(),
              color: "text-chart-5",
              bg: "bg-chart-5/10",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
              data-ocid={`app_sync.stats.item.${i + 1}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p
                  className={`font-display text-lg font-bold leading-tight ${stat.color}`}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sync Activity Log ── */}
        <Card
          className="border border-border bg-card shadow-sm"
          data-ocid="app_sync.history.card"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold text-foreground">
                Sync Activity Log
              </h2>
              {totalSyncs > 0 && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  {totalSyncs}
                </Badge>
              )}
              {/* Auto-synced note */}
              <span className="flex items-center gap-1 rounded-full border border-chart-3/30 bg-chart-3/8 px-2.5 py-0.5 text-[10px] font-medium text-chart-3 dark:text-emerald-400">
                <Zap className="h-2.5 w-2.5" />
                Auto-synced — changes reflect instantly
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive text-xs"
                  disabled={totalSyncs === 0}
                  data-ocid="app_sync.history.clear_button"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear Log
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="app_sync.clear_history.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Activity Log?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {totalSyncs} log entries.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="app_sync.clear_history.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearLogsMut.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-ocid="app_sync.clear_history.confirm_button"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {logsLoading ? (
            <div
              className="p-4 space-y-2"
              data-ocid="app_sync.history_table.loading_state"
            >
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : syncLogs.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-14 text-center"
              data-ocid="app_sync.history_table.empty_state"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Activity className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">
                  No activity logged yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click "Refresh All" to record a backend health check.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                data-ocid="app_sync.history_table.empty_state.sync_button"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Run Health Check
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="app_sync.history_table"
              >
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Timestamp
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Items
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log, i) => (
                    <SyncHistoryRow key={log.id} entry={log} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
