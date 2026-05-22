import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  RefreshCw,
  Save,
  Search,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Course, CourseStats, StudentProgress } from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/course-app-dashboard",
  component: CourseAppDashboardPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: bigint, isFree: boolean) {
  if (isFree) return "Free";
  return `₹${(Number(price) / 100).toLocaleString("en-IN")}`;
}

function completionColor(pct: number): string {
  if (pct >= 75) return "text-primary";
  if (pct >= 25) return "text-warning dark:text-warning";
  return "text-destructive";
}

function completionBg(pct: number): string {
  if (pct >= 75) return "bg-primary/10 text-primary";
  if (pct >= 25) return "bg-warning/10 text-warning dark:text-warning";
  return "bg-destructive/10 text-destructive";
}

function truncatePrincipal(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}...${id.slice(-5)}`;
}

function formatDate(ns: bigint): string {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sync Status Pill ─────────────────────────────────────────────────────────
type SyncState = "live" | "syncing" | "stale";

function SyncPill({
  state,
  secondsAgo,
}: { state: SyncState; secondsAgo: number }) {
  const config = {
    live: {
      label: "Live",
      cls: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500 animate-pulse",
    },
    syncing: {
      label: "Syncing",
      cls: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400",
      dot: "bg-yellow-500 animate-pulse",
    },
    stale: {
      label: "Stale",
      cls: "bg-muted border-border text-muted-foreground",
      dot: "bg-muted-foreground",
    },
  }[state];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.cls}`}
        data-ocid="course_app_dashboard.sync_pill"
      >
        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Last synced: {secondsAgo}s ago
      </span>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  tintBg,
  tintIcon,
  ocid,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tintBg: string;
  tintIcon: string;
  ocid: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border ${tintBg} px-5 py-4 flex items-center gap-4`}
      data-ocid={ocid}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tintIcon}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">
          {label}
        </p>
        <p className="font-display text-2xl font-bold text-foreground mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Inline Edit Row ──────────────────────────────────────────────────────────
interface EditFormState {
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  status: "published" | "draft";
}

function InlineEditPanel({
  course,
  onSave,
  onCancel,
  isPending,
}: {
  course: Course;
  onSave: (form: EditFormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<EditFormState>({
    title: course.title,
    description: course.description,
    price: course.isFree ? "" : String(Number(course.price) / 100),
    isFree: course.isFree,
    status: course.isPublished ? "published" : "draft",
  });
  const set = <K extends keyof EditFormState>(k: K, v: EditFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="border-t border-border bg-muted/20 px-6 py-4 space-y-4"
      data-ocid="course_app_dashboard.edit_panel"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Course Title</Label>
          <Input
            id="edit-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            data-ocid="course_app_dashboard.edit_title_input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.isFree ? "" : form.price}
              disabled={form.isFree}
              onChange={(e) => set("price", e.target.value)}
              data-ocid="course_app_dashboard.edit_price_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as "published" | "draft")}
            >
              <SelectTrigger data-ocid="course_app_dashboard.edit_status_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-desc">Description</Label>
        <Textarea
          id="edit-desc"
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          data-ocid="course_app_dashboard.edit_description_input"
        />
      </div>
      <div className="flex items-center gap-3 justify-end border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          data-ocid="course_app_dashboard.edit_cancel_button"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(form)}
          disabled={!form.title.trim() || isPending}
          data-ocid="course_app_dashboard.edit_save_button"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ─── Student Progress Drawer ──────────────────────────────────────────────────
function StudentDrawer({
  course,
  stats,
  open,
  onClose,
}: {
  course: Course;
  stats: CourseStats | null | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const progress: StudentProgress[] = stats?.studentProgress ?? [];
  const incomplete = progress.filter((s) => s.completionPercent < 25);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-card shrink-0">
          <div className="flex items-start gap-3">
            {course.thumbnailBlob.getDirectURL() ? (
              <img
                src={course.thumbnailBlob.getDirectURL()}
                alt={course.title}
                className="h-14 w-20 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-14 w-20 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
            <div className="min-w-0">
              <SheetTitle className="font-display text-base leading-tight line-clamp-2">
                {course.title}
              </SheetTitle>
              <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {progress.length} students
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {(stats?.avgCompletionPercent ?? 0).toFixed(1)}% avg
                  completion
                </span>
                {incomplete.length > 0 && (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-3 w-3" />
                    {incomplete.length} at risk
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* Student Progress Table */}
            <div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-3">
                Student Progress
              </h3>
              {progress.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-2 py-10 text-center rounded-xl border border-border bg-muted/20"
                  data-ocid="course_app_dashboard.students.empty_state"
                >
                  <Users className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No enrolled students yet
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs">Student ID</TableHead>
                        <TableHead className="text-xs">Enrolled</TableHead>
                        <TableHead className="text-xs text-right">
                          Completion
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          <Video className="h-3.5 w-3.5 inline" /> Videos
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          <FileText className="h-3.5 w-3.5 inline" /> PDFs
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          Lessons
                        </TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progress.map((s, i) => {
                        const pct = s.completionPercent;
                        return (
                          <TableRow
                            key={`${s.studentId.toString()}-${i}`}
                            className="hover:bg-muted/20"
                            data-ocid={`course_app_dashboard.student.item.${i + 1}`}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {truncatePrincipal(s.studentId.toString())}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(s.enrolledAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`font-display font-bold text-sm ${completionColor(pct)}`}
                              >
                                {pct.toFixed(0)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {Number(s.videosWatched)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {Number(s.pdfsDownloaded)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {s.lessonsCompleted.length}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${completionBg(pct)}`}
                              >
                                {pct >= 75
                                  ? "On Track"
                                  : pct >= 25
                                    ? "In Progress"
                                    : "At Risk"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Incomplete Students Section */}
            {incomplete.length > 0 && (
              <div data-ocid="course_app_dashboard.incomplete_section">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <h3 className="font-display font-semibold text-sm text-foreground">
                    Incomplete Students
                  </h3>
                  <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 text-xs">
                    {incomplete.length}
                  </Badge>
                </div>
                <div className="rounded-xl border border-rose-200 dark:border-rose-900 overflow-hidden bg-rose-50/40 dark:bg-rose-950/20">
                  <div className="divide-y divide-rose-100 dark:divide-rose-900/50">
                    {incomplete.map((s, i) => (
                      <div
                        key={`incomplete-${s.studentId.toString()}-${i}`}
                        className="flex items-center gap-3 px-4 py-2.5"
                        data-ocid={`course_app_dashboard.incomplete.item.${i + 1}`}
                      >
                        <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground flex-1 min-w-0 truncate">
                          {truncatePrincipal(s.studentId.toString())}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Last active: {formatDate(s.lastActivity)}
                        </span>
                        <span className="font-display font-bold text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {s.completionPercent.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "published" | "draft" | "archived";

function CourseAppDashboardPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const enabled = !!actor && !isFetching;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [drawerCourse, setDrawerCourse] = useState<Course | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastFetchedAt = useRef<number>(Date.now());

  // ── Data Queries ──────────────────────────────────────────────────────────
  const {
    data: courses = [],
    isLoading: coursesLoading,
    isFetching: coursesFetching,
    dataUpdatedAt: coursesUpdatedAt,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled,
    refetchInterval: 30000,
  });

  const {
    data: allStats = [],
    isLoading: statsLoading,
    isFetching: statsFetching,
    dataUpdatedAt: statsUpdatedAt,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["course-stats-all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourseStats();
    },
    enabled,
    refetchInterval: 30000,
  });

  // Stats for the open drawer course
  const { data: drawerStats } = useQuery({
    queryKey: ["course-stats", drawerCourse ? String(drawerCourse.id) : null],
    queryFn: async () => {
      if (!actor || !drawerCourse) return null;
      return actor.getCourseStats(String(drawerCourse.id));
    },
    enabled: !!actor && !isFetching && !!drawerCourse,
    refetchInterval: 30000,
  });

  // ── Timer: seconds since last sync ────────────────────────────────────────
  useEffect(() => {
    lastFetchedAt.current = Math.max(coursesUpdatedAt, statsUpdatedAt);
    setSecondsAgo(0);
  }, [coursesUpdatedAt, statsUpdatedAt]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const isAnyFetching = coursesFetching || statsFetching;
  const syncState: SyncState = isAnyFetching
    ? "syncing"
    : secondsAgo > 300
      ? "stale"
      : "live";

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateCourse = useMutation({
    mutationFn: async ({
      course,
      form,
    }: { course: Course; form: EditFormState }) => {
      if (!actor) throw new Error("Not connected");
      const price = form.isFree
        ? BigInt(0)
        : BigInt(Math.round(Number.parseFloat(form.price || "0") * 100));
      return actor.updateCourse({
        ...course,
        title: form.title,
        description: form.description,
        price,
        isFree: form.isFree,
        isPublished: form.status === "published",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["course-stats-all"] });
      setExpandedEditId(null);
      toast.success("Course updated successfully");
    },
    onError: () => toast.error("Failed to update course"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, publish }: { id: bigint; publish: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.publishCourse(id, publish);
    },
    onSuccess: (_, { publish }) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success(publish ? "Course published" : "Course unpublished");
    },
    onError: () => toast.error("Failed to update course status"),
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const statsMap = new Map<string, CourseStats>(
    allStats.map((s) => [s.courseId, s]),
  );

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const totalEnrollments = courses.reduce(
    (acc, c) => acc + Number(c.enrollmentCount),
    0,
  );
  const avgCompletion =
    allStats.length > 0
      ? allStats.reduce((acc, s) => acc + s.avgCompletionPercent, 0) /
        allStats.length
      : 0;

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && c.isPublished) ||
      (statusFilter === "draft" && !c.isPublished) ||
      statusFilter === "archived"; // archived not in current data model, show none
    return matchSearch && matchStatus;
  });

  const isLoading = coursesLoading || statsLoading;

  function handleRefresh() {
    refetchCourses();
    refetchStats();
  }

  return (
    <Layout>
      <div className="space-y-6" data-ocid="course_app_dashboard.page">
        {/* ── Header ── */}
        <div className="space-y-3">
          <Breadcrumbs items={[{ label: "Course App Dashboard" }]} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Course App Dashboard
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 ml-0.5">
                Manage and monitor what students see in the course app
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <SyncPill state={syncState} secondsAgo={secondsAgo} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isAnyFetching}
                data-ocid="course_app_dashboard.refresh_button"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${isAnyFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          data-ocid="course_app_dashboard.kpi_section"
        >
          {isLoading ? (
            <>
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-24 w-full rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <KpiCard
                label="Published Courses"
                value={publishedCount.toLocaleString("en-IN")}
                icon={BookOpen}
                tintBg="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40"
                tintIcon="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                ocid="course_app_dashboard.kpi.published_courses"
              />
              <KpiCard
                label="Total Enrolled Students"
                value={totalEnrollments.toLocaleString("en-IN")}
                icon={Users}
                tintBg="bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40"
                tintIcon="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                ocid="course_app_dashboard.kpi.total_students"
              />
              <KpiCard
                label="Avg Completion Rate"
                value={`${avgCompletion.toFixed(1)}%`}
                icon={TrendingUp}
                tintBg="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40"
                tintIcon="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                ocid="course_app_dashboard.kpi.avg_completion"
              />
            </>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="course_app_dashboard.search_input"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "published", "draft", "archived"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f)}
                className="capitalize"
                data-ocid={`course_app_dashboard.filter.${f}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Main Table ── */}
        {isLoading ? (
          <Card data-ocid="course_app_dashboard.loading_state">
            <CardContent className="p-0">
              <div className="space-y-0 divide-y divide-border">
                {[1, 2, 3, 4, 5].map((k) => (
                  <div key={k} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="h-12 w-16 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent
              className="flex flex-col items-center gap-3 py-20 text-center"
              data-ocid="course_app_dashboard.empty_state"
            >
              <BookOpen className="h-14 w-14 text-muted-foreground/30" />
              <div>
                <p className="font-display font-semibold text-foreground">
                  {search || statusFilter !== "all"
                    ? "No courses match your filters"
                    : "No courses found"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? "Try changing your search or filter"
                    : "Create courses from the Courses section"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="pb-0 pt-4 px-5 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  All Courses
                  <Badge variant="secondary" className="text-xs ml-1">
                    {filtered.length}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                data-ocid="course_app_dashboard.table"
              >
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">
                      Enrolled
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">
                      Avg Completion
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs hidden md:table-cell">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((course, i) => {
                    const courseStats = statsMap.get(String(course.id));
                    const avgPct = courseStats?.avgCompletionPercent ?? 0;
                    const isEditOpen = expandedEditId === String(course.id);

                    return (
                      <React.Fragment key={String(course.id)}>
                        <tr
                          className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                          onClick={() => {
                            if (expandedEditId === String(course.id)) return;
                            setDrawerCourse(course);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              if (expandedEditId === String(course.id)) return;
                              setDrawerCourse(course);
                            }
                          }}
                          tabIndex={0}
                          aria-label={`View students for ${course.title}`}
                          data-ocid={`course_app_dashboard.item.${i + 1}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {course.thumbnailBlob.getDirectURL() ? (
                                <img
                                  src={course.thumbnailBlob.getDirectURL()}
                                  alt={course.title}
                                  className="h-10 w-14 rounded-md object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-14 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                                  <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate max-w-[180px]">
                                  {course.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatPrice(course.price, course.isFree)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                course.isPublished ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-display font-semibold text-foreground text-sm">
                              {Number(course.enrollmentCount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${avgPct >= 75 ? "bg-primary" : avgPct >= 25 ? "bg-warning" : "bg-destructive"}`}
                                  style={{ width: `${Math.min(avgPct, 100)}%` }}
                                />
                              </div>
                              <span
                                className={`font-display font-bold text-sm ${completionColor(avgPct)}`}
                              >
                                {avgPct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {courseStats
                                ? `₹${courseStats.totalRevenue.toLocaleString("en-IN")}`
                                : "—"}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title={
                                  course.isPublished ? "Unpublish" : "Publish"
                                }
                                onClick={() =>
                                  togglePublish.mutate({
                                    id: course.id,
                                    publish: !course.isPublished,
                                  })
                                }
                                data-ocid={`course_app_dashboard.toggle.${i + 1}`}
                              >
                                {course.isPublished ? (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5 text-primary" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Preview students"
                                onClick={() => setDrawerCourse(course)}
                                data-ocid={`course_app_dashboard.preview.${i + 1}`}
                              >
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant={isEditOpen ? "default" : "ghost"}
                                size="icon"
                                className="h-7 w-7"
                                title="Edit course"
                                onClick={() =>
                                  setExpandedEditId(
                                    isEditOpen ? null : String(course.id),
                                  )
                                }
                                data-ocid={`course_app_dashboard.edit_button.${i + 1}`}
                              >
                                {isEditOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isEditOpen && (
                          <tr
                            key={`edit-${String(course.id)}`}
                            className="border-b border-border"
                          >
                            <td colSpan={6} className="p-0">
                              <InlineEditPanel
                                course={course}
                                onSave={(form) =>
                                  updateCourse.mutate({ course, form })
                                }
                                onCancel={() => setExpandedEditId(null)}
                                isPending={updateCourse.isPending}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Student Progress Drawer ── */}
        {drawerCourse && (
          <StudentDrawer
            course={drawerCourse}
            stats={drawerStats ?? statsMap.get(String(drawerCourse.id))}
            open={!!drawerCourse}
            onClose={() => setDrawerCourse(null)}
          />
        )}
      </div>
    </Layout>
  );
}
