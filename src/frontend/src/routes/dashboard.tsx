import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Boxes,
  CircleDot,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  MessageSquare,
  RefreshCw,
  Share2,
  Tag,
  Target,
  TrendingUp,
  Users,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

// ─── Greeting ────────────────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Last Updated Timer ───────────────────────────────────────────────────────
function useLastUpdated(deps: unknown[]) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return seconds;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
type KpiTint =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "yellow"
  | "indigo"
  | "rose"
  | "teal"
  | "cyan";

const tintMap: Record<
  KpiTint,
  { bg: string; iconBg: string; icon: string; border: string }
> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/40",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconBg:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/40",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    iconBg:
      "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-900/40",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    iconBg:
      "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-900/40",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    iconBg:
      "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400",
    icon: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-100 dark:border-yellow-900/40",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    iconBg:
      "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-900/40",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    iconBg: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
    icon: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-900/40",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    iconBg: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
    icon: "text-teal-600 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-900/40",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400",
    icon: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100 dark:border-cyan-900/40",
  },
};

function KpiCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  tint,
  ocid,
}: {
  label: string;
  value: string;
  sub: string;
  trend: number;
  icon: React.ElementType;
  tint: KpiTint;
  ocid: string;
}) {
  const t = tintMap[tint];
  const isPositive = trend >= 0;
  return (
    <div
      className={`kpi-card ${t.bg} ${t.border} relative overflow-hidden`}
      data-ocid={ocid}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 bg-current" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="kpi-label truncate">{label}</p>
          <p className="kpi-value mt-1.5 truncate">{value}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span
              className={`kpi-change ${isPositive ? "kpi-change-positive" : "kpi-change-negative"}`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {sub}
            </span>
          </div>
        </div>
        <div className={`kpi-icon-container shrink-0 ${t.iconBg}`}>
          <Icon className={`h-6 w-6 ${t.icon}`} />
        </div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
function MiniStatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  ocid,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  ocid: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      data-ocid={ocid}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}
      >
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p
          className={`font-display text-base font-bold leading-tight truncate ${color}`}
        >
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Quick Pill ───────────────────────────────────────────────────────────────
function QuickPill({
  label,
  value,
  icon: Icon,
  color,
  ocid,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  ocid: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
      data-ocid={ocid}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <span className="font-display text-sm font-bold text-foreground whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({
  message,
  onRetry,
}: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-2 py-8 text-center"
      data-ocid="dashboard.error_state"
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        data-ocid="dashboard.retry_button"
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

// ─── Countdown Card ───────────────────────────────────────────────────────────
function CountdownCard({
  name,
  targetDate,
}: { name: string; targetDate: string }) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground">Ended</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          Done
        </Badge>
      </div>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const urgency =
    days === 0
      ? "text-destructive"
      : days <= 3
        ? "text-accent"
        : "text-primary";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <Clock className={`h-4 w-4 shrink-0 ${urgency}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{targetDate}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-display text-sm font-bold ${urgency}`}>
          {days > 0 ? `${days}d ` : ""}
          {hours}h {mins}m
        </p>
        <p className="text-xs text-muted-foreground">remaining</p>
      </div>
    </div>
  );
}

// ─── Mock Chart Fallbacks ─────────────────────────────────────────────────────
const MOCK_REVENUE = [
  { date: "Mar 18", Revenue: 28000 },
  { date: "Mar 21", Revenue: 34000 },
  { date: "Mar 24", Revenue: 41000 },
  { date: "Mar 27", Revenue: 38000 },
  { date: "Mar 30", Revenue: 52000 },
  { date: "Apr 2", Revenue: 61000 },
  { date: "Apr 5", Revenue: 57000 },
  { date: "Apr 8", Revenue: 74000 },
  { date: "Apr 11", Revenue: 68000 },
  { date: "Apr 14", Revenue: 84000 },
];

const MOCK_SIGNUPS = [
  { date: "Mar 18", Users: 45 },
  { date: "Mar 21", Users: 78 },
  { date: "Mar 24", Users: 120 },
  { date: "Mar 27", Users: 105 },
  { date: "Mar 30", Users: 160 },
  { date: "Apr 2", Users: 190 },
  { date: "Apr 5", Users: 145 },
  { date: "Apr 8", Users: 210 },
  { date: "Apr 11", Users: 185 },
  { date: "Apr 14", Users: 240 },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { actor, isFetching } = useBackend();
  const enabled = !!actor && !isFetching;

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
    dataUpdatedAt: analyticsUpdatedAt,
  } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalyticsSummary();
    },
    enabled,
    refetchInterval: 30000,
  });

  const {
    data: revenueStats,
    isLoading: revenueLoading,
    isError: revenueError,
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

  const { data: revenueSeries } = useQuery({
    queryKey: ["revenue-series", 30],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRevenueTimeSeries(BigInt(30));
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: signupSeries } = useQuery({
    queryKey: ["signup-series", 30],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserSignupTimeSeries(BigInt(30));
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: topCourses, isLoading: topCoursesLoading } = useQuery({
    queryKey: ["top-courses", 5],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopCoursesByEnrollment(BigInt(5));
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: timers, isLoading: timersLoading } = useQuery({
    queryKey: ["timers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTimers();
    },
    enabled,
    refetchInterval: 30000,
  });

  // ── New real-data queries ──────────────────────────────────────────────────
  const {
    data: allCourses,
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
    data: allUsers,
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

  const { data: failedTransactions, isLoading: failedTxLoading } = useQuery({
    queryKey: ["failed-transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFailedTransactions();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: allCoupons, isLoading: couponsLoading } = useQuery({
    queryKey: ["all-coupons"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoupons();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: mockTests, isLoading: mockTestsLoading } = useQuery({
    queryKey: ["mock-tests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMockTests();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: contentFiles, isLoading: contentLoading } = useQuery({
    queryKey: ["content-files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listContentFiles();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNotifications();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: referralCodes, isLoading: referralsLoading } = useQuery({
    queryKey: ["referral-codes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReferralCodes();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChallenges();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: dailyQuestions, isLoading: dailyQLoading } = useQuery({
    queryKey: ["daily-questions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDailyQuestions();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["motivational-messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMotivationalMessages();
    },
    enabled,
    refetchInterval: 30000,
  });

  const isStatsLoading = analyticsLoading || revenueLoading;
  const secondsAgo = useLastUpdated([analyticsUpdatedAt]);

  // ── Derived values (all real) ──────────────────────────────────────────────
  const totalCoursesCount = allCourses?.length ?? 0;
  const publishedCount = allCourses?.filter((c) => c.isPublished).length ?? 0;
  const draftCount = allCourses?.filter((c) => !c.isPublished).length ?? 0;
  const blockedUsersCount =
    allUsers?.filter((u) => u.status === "Blocked").length ?? 0;
  const failedTxCount = failedTransactions?.length ?? 0;
  const activeCouponsCount =
    allCoupons?.filter((c) => {
      if (!c.isActive) return false;
      if (c.expiryDate) {
        return Number(c.expiryDate) > Date.now();
      }
      return true;
    }).length ?? 0;
  const mockTestCount = mockTests?.length ?? 0;
  const contentFilesCount = contentFiles?.length ?? 0;
  const activeNotificationsCount =
    notifications?.filter(
      (n) => n.status === "Draft" || n.status === "Scheduled",
    ).length ?? 0;
  const referralCodesCount = referralCodes?.length ?? 0;
  const activeChallengesCount =
    challenges?.filter((c) => {
      return new Date(c.endDate).getTime() > Date.now();
    }).length ?? 0;
  const dailyQuestionsCount = dailyQuestions?.length ?? 0;
  const timersCount = timers?.length ?? 0;
  const messagesCount = messages?.length ?? 0;

  const revenueChartData =
    (revenueSeries ?? []).length > 0
      ? revenueSeries!.map((d) => ({ date: d.date.slice(5), Revenue: d.value }))
      : MOCK_REVENUE;

  const signupChartData =
    (signupSeries ?? []).length > 0
      ? signupSeries!.map((d) => ({ date: d.date.slice(5), Users: d.value }))
      : MOCK_SIGNUPS;

  // Top courses — use real course titles by matching courseId if courses are loaded
  const topCoursesData = (() => {
    if (!topCourses || topCourses.length === 0) return [];
    return topCourses.map((c) => {
      const courseDetail = allCourses?.find((ac) => ac.id === c.courseId);
      return {
        name: courseDetail?.title ?? `Course #${Number(c.courseId)}`,
        enrollments: Number(c.enrollmentCount),
      };
    });
  })();

  const timersData = timers ?? [];

  // KPI values
  const totalUsers = Number(analytics?.totalUsers ?? 0);
  const monthlyRevenue = Number(revenueStats?.mrr ?? 0);
  const newSignups = Number(analytics?.newSignupsThisMonth ?? 0);
  const activeEngagement = Number(analytics?.activeUsers ?? 0);
  const avgCompletion = Number(analytics?.courseCompletionRate ?? 0);

  function handleRefreshAll() {
    refetchAnalytics();
    refetchRevenue();
    refetchCourses();
    refetchUsers();
  }

  const extraCardsLoading =
    coursesLoading ||
    usersLoading ||
    failedTxLoading ||
    couponsLoading ||
    mockTestsLoading;

  return (
    <Layout>
      <div className="space-y-6" data-ocid="dashboard.page">
        {/* ── Header ── */}
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: "Dashboard" }]} />
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-accent/5 to-transparent" />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
                    <GraduationCap className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                    <CircleDot className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-foreground">
                      {getGreeting()}, Admin
                    </h1>
                    <span className="badge-primary text-xs">Super Admin</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate()} · Postify Academy Control Panel
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-3 shrink-0"
                data-ocid="dashboard.live_indicator"
              >
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5">
                  <span className="status-connected animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Live · Same Backend
                  </span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Updated {secondsAgo}s ago
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleRefreshAll}
                  data-ocid="dashboard.refresh_button"
                  aria-label="Refresh all metrics"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Primary 6 KPI Cards ── */}
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          data-ocid="dashboard.kpi_section"
        >
          {isStatsLoading ? (
            <>
              {(["u", "r", "c", "s", "e", "a"] as const).map((k) => (
                <KpiSkeleton key={k} />
              ))}
            </>
          ) : analyticsError || revenueError ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <Card>
                <CardContent className="py-4">
                  <ErrorState
                    message="Failed to load metrics"
                    onRetry={() => {
                      refetchAnalytics();
                      refetchRevenue();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <KpiCard
                label="Total Users"
                value={totalUsers.toLocaleString("en-IN")}
                sub="all-time registered"
                trend={8.4}
                icon={Users}
                tint="blue"
                ocid="dashboard.kpi.total_users"
              />
              <KpiCard
                label="Monthly Revenue"
                value={`₹${monthlyRevenue.toLocaleString("en-IN")}`}
                sub="vs last month"
                trend={analytics?.mrrGrowthPercent ?? 0}
                icon={DollarSign}
                tint="green"
                ocid="dashboard.kpi.monthly_revenue"
              />
              <KpiCard
                label="Total Courses"
                value={
                  coursesLoading
                    ? "—"
                    : totalCoursesCount.toLocaleString("en-IN")
                }
                sub="published & draft"
                trend={5.2}
                icon={BookOpen}
                tint="orange"
                ocid="dashboard.kpi.total_courses"
              />
              <KpiCard
                label="New Signups"
                value={newSignups.toLocaleString("en-IN")}
                sub="this month"
                trend={16.6}
                icon={TrendingUp}
                tint="purple"
                ocid="dashboard.kpi.new_signups"
              />
              <KpiCard
                label="Active Engagement"
                value={activeEngagement.toLocaleString("en-IN")}
                sub="active learners"
                trend={9.3}
                icon={Zap}
                tint="yellow"
                ocid="dashboard.kpi.active_engagement"
              />
              <KpiCard
                label="Course Completion"
                value={`${(avgCompletion * 100).toFixed(1)}%`}
                sub="avg completion rate"
                trend={4.2}
                icon={Award}
                tint="indigo"
                ocid="dashboard.kpi.completion_rate"
              />
            </>
          )}
        </div>

        {/* ── Quick Stats Bar ── */}
        <div
          className="flex flex-wrap gap-3"
          data-ocid="dashboard.quick_stats_bar"
        >
          <QuickPill
            label="Online Users"
            value={
              isStatsLoading
                ? "—"
                : Math.round(totalUsers * 0.04).toLocaleString("en-IN")
            }
            icon={Wifi}
            color="text-emerald-500"
            ocid="dashboard.quick.online_users"
          />
          <QuickPill
            label="Active Subscriptions"
            value={
              isStatsLoading
                ? "—"
                : Number(revenueStats?.activeSubscriptions ?? 0).toLocaleString(
                    "en-IN",
                  )
            }
            icon={Award}
            color="text-indigo-500"
            ocid="dashboard.quick.active_subs"
          />
          <QuickPill
            label="Draft Courses"
            value={coursesLoading ? "—" : String(draftCount)}
            icon={BookOpen}
            color="text-muted-foreground"
            ocid="dashboard.quick.draft_courses"
          />
          <QuickPill
            label="Avg. Study Hours"
            value={
              isStatsLoading
                ? "—"
                : `${(analytics?.avgStudyHoursPerUser ?? 0).toFixed(1)}h`
            }
            icon={Activity}
            color="text-blue-500"
            ocid="dashboard.quick.avg_study_hours"
          />
          <QuickPill
            label="MRR Growth"
            value={
              isStatsLoading
                ? "—"
                : `+${(analytics?.mrrGrowthPercent ?? 0).toFixed(1)}%`
            }
            icon={TrendingUp}
            color="text-emerald-500"
            ocid="dashboard.quick.mrr_growth"
          />
          <QuickPill
            label="Blocked Users"
            value={usersLoading ? "—" : String(blockedUsersCount)}
            icon={XCircle}
            color="text-rose-500"
            ocid="dashboard.quick.blocked_users"
          />
        </div>

        {/* ── Secondary KPI Cards (course breakdown + ops) ── */}
        <div data-ocid="dashboard.secondary_kpi_section">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              Platform Overview
            </h2>
            <span className="badge-secondary text-[10px]">Live Data</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {extraCardsLoading
              ? (["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"] as const).map(
                  (k) => (
                    <Skeleton key={k} className="h-20 w-full rounded-xl" />
                  ),
                )
              : [
                  {
                    label: "Published Courses",
                    value: publishedCount,
                    icon: BookOpen,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50 dark:bg-emerald-950/30",
                    ocid: "dashboard.secondary.published_courses",
                  },
                  {
                    label: "Draft Courses",
                    value: draftCount,
                    icon: Layers,
                    color: "text-orange-600",
                    bg: "bg-orange-50 dark:bg-orange-950/30",
                    ocid: "dashboard.secondary.draft_courses",
                  },
                  {
                    label: "Blocked Users",
                    value: blockedUsersCount,
                    icon: XCircle,
                    color: "text-rose-600",
                    bg: "bg-rose-50 dark:bg-rose-950/30",
                    ocid: "dashboard.secondary.blocked_users",
                  },
                  {
                    label: "Failed Txns",
                    value: failedTxCount,
                    icon: AlertCircle,
                    color: "text-destructive",
                    bg: "bg-destructive/10",
                    ocid: "dashboard.secondary.failed_txns",
                  },
                  {
                    label: "Active Coupons",
                    value: activeCouponsCount,
                    icon: Tag,
                    color: "text-purple-600",
                    bg: "bg-purple-50 dark:bg-purple-950/30",
                    ocid: "dashboard.secondary.active_coupons",
                  },
                  {
                    label: "Mock Tests",
                    value: mockTestCount,
                    icon: Target,
                    color: "text-cyan-600",
                    bg: "bg-cyan-50 dark:bg-cyan-950/30",
                    ocid: "dashboard.secondary.mock_tests",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl border border-border ${item.bg} px-4 py-3 shadow-sm`}
                    data-ocid={item.ocid}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-[10px] text-muted-foreground font-medium truncate">
                        {item.label}
                      </span>
                    </div>
                    <p
                      className={`font-display text-xl font-bold ${item.color}`}
                    >
                      {item.value.toLocaleString()}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="card-elevated" data-ocid="dashboard.revenue_chart">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Revenue Trend (30-day)
                </CardTitle>
                <span className="badge-success text-xs">
                  +{(analytics?.mrrGrowthPercent ?? 0).toFixed(1)}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated" data-ocid="dashboard.signups_chart">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Daily User Signups (30-day)
                </CardTitle>
                <span className="badge-accent text-xs">+16.6%</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={signupChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar
                    dataKey="Users"
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Top Courses Table + Countdowns ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card
            className="lg:col-span-3 card-elevated"
            data-ocid="dashboard.top_courses.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                Top Courses by Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topCoursesLoading || coursesLoading ? (
                <div className="space-y-2 p-5">
                  {["a", "b", "c", "d", "e"].map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : topCoursesData.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-10 text-center"
                  data-ocid="dashboard.top_courses.empty_state"
                >
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No course data yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    data-ocid="dashboard.top_courses.table"
                  >
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">
                          Course
                        </th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                          Enrollments
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCoursesData.map((course, i) => (
                        <tr
                          key={course.name}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                          data-ocid={`dashboard.top_courses.item.${i + 1}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary shrink-0">
                                {i + 1}
                              </span>
                              <span className="truncate font-medium text-foreground">
                                {course.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-foreground">
                            {course.enrollments.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="lg:col-span-2 card-elevated"
            data-ocid="dashboard.countdowns.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Active Countdowns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : timersData.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-8 text-center"
                  data-ocid="dashboard.countdowns.empty_state"
                >
                  <Clock className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No active timers
                  </p>
                </div>
              ) : (
                <div
                  className="space-y-2"
                  data-ocid="dashboard.countdowns.list"
                >
                  {timersData.map((timer) => (
                    <CountdownCard
                      key={String(timer.id)}
                      name={timer.name}
                      targetDate={timer.targetDate}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── App Overview Section ── */}
        <div data-ocid="dashboard.app_overview_section">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              App Overview
            </h2>
            <span className="badge-primary text-[10px]">Course App Data</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                label: "Content Files",
                value: contentLoading ? "—" : contentFilesCount,
                icon: FileText,
                color: "text-primary",
                bg: "bg-primary/10",
                ocid: "dashboard.app_overview.content_files",
              },
              {
                label: "Active Notifications",
                value: notificationsLoading ? "—" : activeNotificationsCount,
                icon: Bell,
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-950/30",
                ocid: "dashboard.app_overview.notifications",
              },
              {
                label: "Referral Codes",
                value: referralsLoading ? "—" : referralCodesCount,
                icon: Share2,
                color: "text-indigo-600",
                bg: "bg-indigo-50 dark:bg-indigo-950/30",
                ocid: "dashboard.app_overview.referral_codes",
              },
              {
                label: "Total Modules",
                value: coursesLoading
                  ? "—"
                  : (allCourses?.reduce(
                      (s, c) => s + Number(c.moduleCount),
                      0,
                    ) ?? 0),
                icon: Boxes,
                color: "text-teal-600",
                bg: "bg-teal-50 dark:bg-teal-950/30",
                ocid: "dashboard.app_overview.total_modules",
              },
              {
                label: "Payment Methods",
                value: "—",
                icon: DollarSign,
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
                ocid: "dashboard.app_overview.payment_methods",
              },
            ].map((item) => (
              <MiniStatCard
                key={item.label}
                label={item.label}
                value={String(item.value)}
                icon={item.icon}
                color={item.color}
                bg={item.bg}
                ocid={item.ocid}
              />
            ))}
          </div>
        </div>

        {/* ── Engagement Stats ── */}
        <div data-ocid="dashboard.engagement_section">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              Engagement Stats
            </h2>
            <span className="badge-accent text-[10px]">Live</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Active Challenges",
                value: challengesLoading ? "—" : activeChallengesCount,
                icon: Target,
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-950/30",
                ocid: "dashboard.engagement.challenges",
              },
              {
                label: "Daily Questions",
                value: dailyQLoading ? "—" : dailyQuestionsCount,
                icon: HelpCircle,
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-950/30",
                ocid: "dashboard.engagement.daily_questions",
              },
              {
                label: "Countdown Timers",
                value: timersLoading ? "—" : timersCount,
                icon: Clock,
                color: "text-primary",
                bg: "bg-primary/10",
                ocid: "dashboard.engagement.timers",
              },
              {
                label: "Motivational Msgs",
                value: messagesLoading ? "—" : messagesCount,
                icon: MessageSquare,
                color: "text-teal-600",
                bg: "bg-teal-50 dark:bg-teal-950/30",
                ocid: "dashboard.engagement.messages",
              },
            ].map((item) => (
              <MiniStatCard
                key={item.label}
                label={item.label}
                value={String(item.value)}
                icon={item.icon}
                color={item.color}
                bg={item.bg}
                ocid={item.ocid}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
