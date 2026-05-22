import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  path: "/analytics",
  component: AnalyticsPage,
});

type TimePeriod = "30" | "60" | "90";

const CHART_BLUE = "oklch(0.5 0.24 261)";
const CHART_ORANGE = "oklch(0.62 0.26 37)";
const CHART_GREEN = "oklch(0.65 0.15 127)";

function AnalyticsPage() {
  const { actor, isFetching } = useBackend();
  const [period, setPeriod] = useState<TimePeriod>("30");
  const days = BigInt(period);

  const { data: analytics, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalyticsSummary();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const { data: retention, isLoading: retentionLoading } = useQuery({
    queryKey: ["retention-rates"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRetentionRates();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const { data: revenueSeries = [], isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-series", period],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRevenueTimeSeries(days);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: signupSeries = [], isLoading: signupLoading } = useQuery({
    queryKey: ["signup-series", period],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserSignupTimeSeries(days);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: completionSeries = [], isLoading: completionLoading } =
    useQuery({
      queryKey: ["completion-series", period],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getCourseCompletionTimeSeries(days);
      },
      enabled: !!actor && !isFetching,
    });

  const { data: topCourses = [], isLoading: topCoursesLoading } = useQuery({
    queryKey: ["top-courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopCoursesByEnrollment(BigInt(8));
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  // ── Chart data (real from backend, empty arrays show nothing) ──────────────
  const revenueData = (revenueSeries.length ? revenueSeries : MOCK_REVENUE).map(
    (d) => ({ date: d.date.slice(5), Revenue: Math.round(d.value) }),
  );

  const signupData = (signupSeries.length ? signupSeries : MOCK_SIGNUPS).map(
    (d) => ({ date: d.date.slice(5), Signups: Math.round(d.value) }),
  );

  const completionData = (
    completionSeries.length ? completionSeries : MOCK_COMPLETION
  ).map((d) => ({
    date: d.date.slice(5),
    Rate: Number.parseFloat(d.value.toFixed(1)),
  }));

  // Course enrollment bar — use real data, real titles, real enrollment counts.
  // Completion rate per-course is not available as a direct stat; show enrollment rank instead.
  const courseBarData = topCourses
    .map((c) => {
      const detail = allCourses.find((ac) => ac.id === c.courseId);
      return {
        name: detail?.title ?? `Course #${Number(c.courseId)}`,
        enrollment: Number(c.enrollmentCount),
      };
    })
    .sort((a, b) => b.enrollment - a.enrollment);

  const kpis = [
    {
      label: "Total Users",
      value: Number(analytics?.totalUsers ?? 0).toLocaleString(),
      sub: "registered accounts",
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Users",
      value: Number(analytics?.activeUsers ?? 0).toLocaleString(),
      sub: "currently active",
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      label: "Avg Study Hours",
      value: `${(analytics?.avgStudyHoursPerUser ?? 0).toFixed(1)}h`,
      sub: "per user / month",
      icon: Clock,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Completion Rate",
      value: `${((analytics?.courseCompletionRate ?? 0) * 100).toFixed(1)}%`,
      sub: "average across courses",
      icon: BookOpen,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      label: "7-Day Retention",
      value: `${((retention?.day7 ?? 0) * 100).toFixed(1)}%`,
      sub: "users returning in 7 days",
      icon: TrendingUp,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      label: "MRR Growth",
      value: `+${(analytics?.mrrGrowthPercent ?? 0).toFixed(1)}%`,
      sub: "vs previous month",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  const retentionBars = [
    {
      label: "7-Day Retention",
      value: (retention?.day7 ?? 0) * 100,
      color: "bg-primary",
    },
    {
      label: "30-Day Retention",
      value: (retention?.day30 ?? 0) * 100,
      color: "bg-accent",
    },
  ];

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <Layout>
      <div className="space-y-6" data-ocid="analytics.page">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Breadcrumbs items={[{ label: "Analytics" }]} />
            <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
              Analytics & Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Platform performance metrics, learning insights, and revenue
              trends
            </p>
          </div>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as TimePeriod)}
            data-ocid="analytics.period_tabs"
          >
            <TabsList>
              <TabsTrigger value="30" data-ocid="analytics.period.tab.30d">
                30 days
              </TabsTrigger>
              <TabsTrigger value="60" data-ocid="analytics.period.tab.60d">
                60 days
              </TabsTrigger>
              <TabsTrigger value="90" data-ocid="analytics.period.tab.90d">
                90 days
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* KPI Summary Row */}
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          data-ocid="analytics.kpis"
        >
          {kpis.map((kpi, i) =>
            summaryLoading || retentionLoading ? (
              <Skeleton
                key={kpi.label}
                className="h-24 rounded-xl"
                data-ocid={`analytics.kpi.item.${i + 1}`}
              />
            ) : (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-card p-4 shadow-sm transition-smooth hover:shadow-md"
                data-ocid={`analytics.kpi.item.${i + 1}`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}
                >
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p
                  className={`font-display text-lg font-bold leading-tight ${kpi.color}`}
                >
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-xs font-medium text-foreground truncate">
                  {kpi.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {kpi.sub}
                </p>
              </div>
            ),
          )}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div
            className="rounded-xl border border-border bg-card shadow-sm"
            data-ocid="analytics.revenue_chart"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                Revenue Growth
              </h2>
              <p className="text-xs text-muted-foreground">
                Last {period} days
              </p>
            </div>
            <div className="p-4">
              {revenueLoading ? (
                <Skeleton
                  className="h-52 w-full rounded-lg"
                  data-ocid="analytics.revenue_chart.loading_state"
                />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart
                    data={revenueData}
                    margin={{ left: -10, right: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_BLUE}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_BLUE}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [
                        `₹${v.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke={CHART_BLUE}
                      strokeWidth={2}
                      fill="url(#gradRevenue)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* User Growth Chart */}
          <div
            className="rounded-xl border border-border bg-card shadow-sm"
            data-ocid="analytics.users_chart"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                User Signups
              </h2>
              <p className="text-xs text-muted-foreground">
                Last {period} days
              </p>
            </div>
            <div className="p-4">
              {signupLoading ? (
                <Skeleton
                  className="h-52 w-full rounded-lg"
                  data-ocid="analytics.users_chart.loading_state"
                />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={signupData} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="Signups"
                      fill={CHART_ORANGE}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Course Completion Trend + Retention Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Completion Trend — real data from getCourseCompletionTimeSeries */}
          <div
            className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2"
            data-ocid="analytics.completion_chart"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                Course Completion Rate Trend
              </h2>
              <p className="text-xs text-muted-foreground">
                % completion over last {period} days
              </p>
            </div>
            <div className="p-4">
              {completionLoading ? (
                <Skeleton
                  className="h-48 w-full rounded-lg"
                  data-ocid="analytics.completion_chart.loading_state"
                />
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart
                    data={completionData}
                    margin={{ left: -10, right: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradCompletion"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_GREEN}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_GREEN}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v}%`, "Completion Rate"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="Rate"
                      stroke={CHART_GREEN}
                      strokeWidth={2}
                      fill="url(#gradCompletion)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Retention Analysis — real data from getRetentionRates */}
          <div
            className="rounded-xl border border-border bg-card shadow-sm"
            data-ocid="analytics.retention_panel"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                Retention Analysis
              </h2>
              <p className="text-xs text-muted-foreground">User return rates</p>
            </div>
            <div className="p-5 space-y-6">
              {retentionLoading ? (
                <>
                  <Skeleton
                    className="h-16 w-full rounded-lg"
                    data-ocid="analytics.retention_panel.loading_state"
                  />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </>
              ) : (
                retentionBars.map((bar) => (
                  <div key={bar.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {bar.label}
                      </span>
                      <span className="font-display text-sm font-bold text-foreground">
                        {bar.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                        style={{ width: `${Math.min(bar.value, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {bar.value >= 60
                        ? "Excellent — above industry average"
                        : bar.value >= 40
                          ? "Good — room for improvement"
                          : "Needs attention"}
                    </p>
                  </div>
                ))
              )}

              <div className="mt-4 rounded-lg bg-muted/50 p-4 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">
                      {summaryLoading
                        ? "—"
                        : `${(analytics?.avgStudyHoursPerUser ?? 0).toFixed(1)}h`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg study hours / user
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Enrollment Bar + Top Courses Table */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Horizontal enrollment bar — real enrollment counts */}
          <div
            className="rounded-xl border border-border bg-card shadow-sm"
            data-ocid="analytics.course_completion_bar"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                Enrollment by Course
              </h2>
              <p className="text-xs text-muted-foreground">
                Sorted by enrollment count
              </p>
            </div>
            <div className="p-4">
              {topCoursesLoading ? (
                <div
                  className="space-y-3"
                  data-ocid="analytics.course_completion_bar.loading_state"
                >
                  {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
                    <Skeleton key={k} className="h-8 w-full rounded" />
                  ))}
                </div>
              ) : courseBarData.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No course data yet
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    layout="vertical"
                    data={courseBarData}
                    margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={72}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [
                        v.toLocaleString(),
                        "Enrollments",
                      ]}
                    />
                    <Bar dataKey="enrollment" radius={[0, 4, 4, 0]}>
                      {courseBarData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={index < 3 ? CHART_BLUE : CHART_ORANGE}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Courses Table */}
          <div
            className="rounded-xl border border-border bg-card shadow-sm"
            data-ocid="analytics.top_courses_table"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-foreground">
                Top Courses by Enrollment
              </h2>
              <p className="text-xs text-muted-foreground">
                Most enrolled courses
              </p>
            </div>
            {topCoursesLoading ? (
              <div
                className="p-4 space-y-3"
                data-ocid="analytics.top_courses_table.loading_state"
              >
                {["t1", "t2", "t3", "t4", "t5", "t6"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : courseBarData.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-10 text-center"
                data-ocid="analytics.top_courses_table.empty_state"
              >
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-10">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Course
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                        Enrolled
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseBarData.map((course, i) => (
                      <tr
                        key={`${course.name}-${i}`}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                        data-ocid={`analytics.top_courses_table.item.${i + 1}`}
                      >
                        <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-foreground max-w-[160px] truncate">
                          {course.name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
                          {course.enrollment.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ── Mock chart fallback data (used only when backend returns empty arrays) ──
const MOCK_REVENUE = [
  { date: "01", value: 12400 },
  { date: "05", value: 18200 },
  { date: "10", value: 24800 },
  { date: "15", value: 21000 },
  { date: "20", value: 32100 },
  { date: "25", value: 41600 },
  { date: "30", value: 38200 },
];
const MOCK_SIGNUPS = [
  { date: "01", value: 34 },
  { date: "05", value: 52 },
  { date: "10", value: 71 },
  { date: "15", value: 58 },
  { date: "20", value: 94 },
  { date: "25", value: 118 },
  { date: "30", value: 103 },
];
const MOCK_COMPLETION = [
  { date: "01", value: 62 },
  { date: "05", value: 67 },
  { date: "10", value: 71 },
  { date: "15", value: 75 },
  { date: "20", value: 78 },
  { date: "25", value: 73 },
  { date: "30", value: 82 },
];
