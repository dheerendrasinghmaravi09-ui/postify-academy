import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { format } from "date-fns";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  Search,
  ShieldBan,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { Course, UserProfile, UserProgress } from "../types";
import { UserStatus } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersPage,
});

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "blocked";

interface StatusDialogState {
  open: boolean;
  user: UserProfile | null;
  targetStatus: UserStatus;
  reason: string;
}

interface UserDetailState {
  open: boolean;
  userId: string | null;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4 px-5">
        <div className={`rounded-lg p-2 bg-muted/60 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold text-foreground">
            {value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── User Detail Sheet ────────────────────────────────────────────────────────
function UserDetailSheet({
  userId,
  open,
  onClose,
}: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [courseAccessMap, setCourseAccessMap] = useState<
    Record<string, boolean>
  >({});
  const [savingAccess, setSavingAccess] = useState(false);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["userDetail", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getUserDetail(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId && open,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [] as Course[];
      return actor.listCourses();
    },
    enabled: !!actor && !isFetching && open,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["userTransactions", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.listUserTransactions(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId && open,
  });

  const userProfile = detail ? detail[0] : null;
  const progressList: UserProgress[] = detail ? detail[1] : [];

  // Sync enrolled courses into local map on open
  useEffect(() => {
    if (userProfile && courses.length) {
      const map: Record<string, boolean> = {};
      for (const c of courses) {
        map[c.id.toString()] = userProfile.enrolledCourses.some(
          (id) => id.toString() === c.id.toString(),
        );
      }
      setCourseAccessMap(map);
    }
  }, [userProfile, courses]);

  const handleSaveAccess = async () => {
    if (!actor || !userId || !userProfile) return;
    setSavingAccess(true);
    const { Principal } = await import("@icp-sdk/core/principal");
    const principal = Principal.fromText(userId);
    const toGrant = courses.filter(
      (c) =>
        courseAccessMap[c.id.toString()] &&
        !userProfile.enrolledCourses.some(
          (id) => id.toString() === c.id.toString(),
        ),
    );
    const toRevoke = courses.filter(
      (c) =>
        !courseAccessMap[c.id.toString()] &&
        userProfile.enrolledCourses.some(
          (id) => id.toString() === c.id.toString(),
        ),
    );
    try {
      await Promise.all([
        ...toGrant.map((c) => actor.grantCourseAccess(principal, c.id)),
        ...toRevoke.map((c) => actor.revokeCourseAccess(principal, c.id)),
      ]);
      qc.invalidateQueries({ queryKey: ["userDetail", userId] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Course access updated");
    } catch {
      toast.error("Failed to update course access");
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
        data-ocid="users.detail.sheet"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="font-display text-lg">User Profile</SheetTitle>
          <SheetDescription>
            Full profile, course progress, and access controls
          </SheetDescription>
        </SheetHeader>

        {detailLoading || coursesLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-12 w-full" />
            ))}
          </div>
        ) : !userProfile ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
            <XCircle className="h-10 w-10 opacity-40" />
            <p>User not found</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Profile header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    {userProfile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-foreground text-lg truncate">
                      {userProfile.name}
                    </h3>
                    <Badge
                      variant={
                        userProfile.status === UserStatus.Active
                          ? "default"
                          : "destructive"
                      }
                    >
                      {userProfile.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {userProfile.email}
                  </p>
                  {userProfile.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {userProfile.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="font-semibold text-foreground text-sm">
                    {userProfile.enrolledCourses.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-accent" />
                  <p className="font-semibold text-foreground text-sm">
                    ₹{Number(userProfile.totalPurchases).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Purchased</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-semibold text-foreground text-sm">
                    {userProfile.lastLogin
                      ? format(
                          new Date(Number(userProfile.lastLogin) / 1_000_000),
                          "dd MMM",
                        )
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                </div>
              </div>

              <Separator />

              {/* Course Progress */}
              <div>
                <h4 className="font-display font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
                  Course Progress
                </h4>
                {progressList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No progress data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {progressList.map((p) => {
                      const course = courses.find(
                        (c) => c.id.toString() === p.courseId.toString(),
                      );
                      const pct = Math.min(100, Number(p.completionPercent));
                      const avgScore =
                        p.quizScores.length > 0
                          ? Math.round(
                              p.quizScores.reduce((a, b) => a + Number(b), 0) /
                                p.quizScores.length,
                            )
                          : null;
                      return (
                        <div
                          key={p.courseId.toString()}
                          className="rounded-lg border border-border p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {course?.title ?? `Course #${p.courseId}`}
                            </p>
                            <span className="text-xs font-semibold text-primary shrink-0">
                              {pct}%
                            </span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>
                              Study: {Math.round(Number(p.studyTime) / 60)} min
                            </span>
                            {avgScore !== null && (
                              <span>Avg Score: {avgScore}%</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Course Access Management */}
              <div>
                <h4 className="font-display font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
                  Course Access
                </h4>
                <div className="space-y-2 mb-4">
                  {courses.map((course) => {
                    const key = course.id.toString();
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/40 transition-colors"
                        data-ocid={`users.course_access.${key}`}
                      >
                        <Checkbox
                          id={`course-${key}`}
                          checked={!!courseAccessMap[key]}
                          onCheckedChange={(checked) =>
                            setCourseAccessMap((prev) => ({
                              ...prev,
                              [key]: !!checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor={`course-${key}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {course.title}
                        </Label>
                        {course.isFree ? (
                          <Badge variant="secondary" className="text-xs">
                            Free
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ₹{Number(course.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveAccess}
                  disabled={savingAccess}
                  data-ocid="users.save_access.button"
                  className="w-full"
                >
                  {savingAccess ? "Saving…" : "Save Access Changes"}
                </Button>
              </div>

              <Separator />

              {/* Purchase History */}
              <div>
                <h4 className="font-display font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
                  Purchase History
                </h4>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No transactions yet
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Course</TableHead>
                          <TableHead className="text-xs text-right">
                            Amount
                          </TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 10).map((tx) => {
                          const course = courses.find(
                            (c) => c.id.toString() === tx.courseId.toString(),
                          );
                          return (
                            <TableRow key={tx.id.toString()}>
                              <TableCell className="text-xs text-muted-foreground">
                                {format(
                                  new Date(Number(tx.date) / 1_000_000),
                                  "dd MMM yy",
                                )}
                              </TableCell>
                              <TableCell className="text-xs truncate max-w-[120px]">
                                {course?.title ?? `#${tx.courseId}`}
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium">
                                ₹{Number(tx.amount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    tx.status === "Completed"
                                      ? "default"
                                      : tx.status === "Refunded"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {tx.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Status Confirm Dialog ────────────────────────────────────────────────────
function StatusConfirmDialog({
  state,
  onClose,
  onConfirm,
  isPending,
}: {
  state: StatusDialogState;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const isBlock = state.targetStatus === UserStatus.Blocked;

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="users.status_dialog">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {isBlock ? (
              <ShieldBan className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
            {isBlock ? "Block User" : "Activate User"}
          </DialogTitle>
          <DialogDescription>
            {isBlock
              ? `Block "${state.user?.name}"? They will lose access to the platform.`
              : `Activate "${state.user?.name}"? They will regain full access.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="reason" className="text-sm font-medium">
            Reason{isBlock ? " (required)" : " (optional)"}
          </Label>
          <Textarea
            id="reason"
            ref={reasonRef}
            placeholder={
              isBlock
                ? "Explain why this user is being blocked..."
                : "Reason for reactivating account..."
            }
            className="resize-none h-20"
            data-ocid="users.status_reason.textarea"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="users.status_dialog.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant={isBlock ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => onConfirm(reasonRef.current?.value ?? "")}
            data-ocid="users.status_dialog.confirm_button"
          >
            {isPending ? "Saving…" : isBlock ? "Block User" : "Activate User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function UsersPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();

  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    user: null,
    targetStatus: UserStatus.Blocked,
    reason: "",
  });
  const [userDetail, setUserDetail] = useState<UserDetailState>({
    open: false,
    userId: null,
  });

  // Reset page on filter/search change
  const handleSearchChange = useCallback((val: string) => {
    setSearchRaw(val);
    setPage(0);
  }, []);
  const handleStatusFilterChange = useCallback((val: StatusFilter) => {
    setStatusFilter(val);
    setPage(0);
  }, []);

  const backendStatus =
    statusFilter === "active"
      ? UserStatus.Active
      : statusFilter === "blocked"
        ? UserStatus.Blocked
        : null;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", search, statusFilter, page],
    queryFn: async () => {
      if (!actor) return [] as UserProfile[];
      return actor.listUsers(
        search || null,
        backendStatus,
        BigInt(page * PAGE_SIZE),
        BigInt(PAGE_SIZE),
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  // Summary counts (no filter)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "", "all", 0],
    queryFn: async () => {
      if (!actor) return [] as UserProfile[];
      return actor.listUsers(null, null, 0n, 500n);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  const activeCount = allUsers.filter(
    (u) => u.status === UserStatus.Active,
  ).length;
  const blockedCount = allUsers.filter(
    (u) => u.status === UserStatus.Blocked,
  ).length;

  const setStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: import("../backend").UserId; status: UserStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setUserStatus(id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        statusDialog.targetStatus === UserStatus.Blocked
          ? "User blocked"
          : "User activated",
      );
      setStatusDialog((s) => ({ ...s, open: false }));
    },
    onError: () => toast.error("Failed to update user status"),
  });

  const openStatusDialog = (user: UserProfile, target: UserStatus) => {
    setStatusDialog({ open: true, user, targetStatus: target, reason: "" });
  };

  const confirmStatusChange = (reason: string) => {
    if (!statusDialog.user) return;
    setStatusMutation.mutate({
      id: statusDialog.user.id,
      status: statusDialog.targetStatus,
    });
    void reason; // reason is collected but shown in audit log in a real app
  };

  const hasMore = users.length === PAGE_SIZE;

  return (
    <Layout>
      <div className="space-y-6" data-ocid="users.page">
        {/* Page header */}
        <div>
          <Breadcrumbs items={[{ label: "Users" }]} />
          <div className="mt-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allUsers.length.toLocaleString()} total ·{" "}
              {activeCount.toLocaleString()} active ·{" "}
              {blockedCount.toLocaleString()} blocked
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={allUsers.length}
            icon={Users}
            colorClass="text-primary"
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={ShieldCheck}
            colorClass="text-emerald-600"
          />
          <StatCard
            label="Blocked"
            value={blockedCount}
            icon={ShieldBan}
            colorClass="text-destructive"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or email…"
              value={searchRaw}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              data-ocid="users.search_input"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => handleStatusFilterChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-40" data-ocid="users.status.select">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <UserTableSkeleton />
        ) : users.length === 0 ? (
          <Card className="py-14" data-ocid="users.empty_state">
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-muted/60 p-4">
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No users found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? `No results for "${search}"`
                    : "No users match the current filter"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div
            className="rounded-lg border border-border overflow-hidden shadow-sm"
            data-ocid="users.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground w-[260px]">
                    User
                  </TableHead>
                  <TableHead className="font-semibold text-foreground hidden md:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right hidden sm:table-cell">
                    Courses
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right hidden lg:table-cell">
                    Purchases
                  </TableHead>
                  <TableHead className="font-semibold text-foreground hidden xl:table-cell">
                    Joined
                  </TableHead>
                  <TableHead className="font-semibold text-foreground hidden xl:table-cell">
                    Last Login
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, i) => (
                  <UserRow
                    key={user.id.toString()}
                    user={user}
                    rowIndex={page * PAGE_SIZE + i + 1}
                    onView={() =>
                      setUserDetail({
                        open: true,
                        userId: user.id.toText(),
                      })
                    }
                    onToggleStatus={() =>
                      openStatusDialog(
                        user,
                        user.status === UserStatus.Active
                          ? UserStatus.Blocked
                          : UserStatus.Active,
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (page > 0 || hasMore) && (
          <div
            className="flex items-center justify-between pt-2"
            data-ocid="users.pagination"
          >
            <p className="text-sm text-muted-foreground">
              Page {page + 1} · showing {page * PAGE_SIZE + 1}–
              {page * PAGE_SIZE + users.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                data-ocid="users.pagination_prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
                data-ocid="users.pagination_next"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status confirm dialog */}
      <StatusConfirmDialog
        state={statusDialog}
        onClose={() => setStatusDialog((s) => ({ ...s, open: false }))}
        onConfirm={confirmStatusChange}
        isPending={setStatusMutation.isPending}
      />

      {/* User detail sheet */}
      <UserDetailSheet
        userId={userDetail.userId}
        open={userDetail.open}
        onClose={() => setUserDetail({ open: false, userId: null })}
      />
    </Layout>
  );
}

// ─── User Table Row ───────────────────────────────────────────────────────────
function UserRow({
  user,
  rowIndex,
  onView,
  onToggleStatus,
}: {
  user: UserProfile;
  rowIndex: number;
  onView: () => void;
  onToggleStatus: () => void;
}) {
  const isActive = user.status === UserStatus.Active;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TableRow
      className="group cursor-pointer hover:bg-muted/20 transition-colors"
      data-ocid={`users.item.${rowIndex}`}
    >
      <TableCell onClick={onView}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell
        className="text-sm text-muted-foreground hidden md:table-cell"
        onClick={onView}
      >
        {user.phone || "—"}
      </TableCell>
      <TableCell
        className="text-right text-sm hidden sm:table-cell"
        onClick={onView}
      >
        {user.enrolledCourses.length}
      </TableCell>
      <TableCell
        className="text-right text-sm hidden lg:table-cell"
        onClick={onView}
      >
        ₹{Number(user.totalPurchases).toLocaleString()}
      </TableCell>
      <TableCell
        className="text-sm text-muted-foreground hidden xl:table-cell"
        onClick={onView}
      >
        {user.createdAt
          ? format(new Date(Number(user.createdAt) / 1_000_000), "dd MMM yyyy")
          : "—"}
      </TableCell>
      <TableCell
        className="text-sm text-muted-foreground hidden xl:table-cell"
        onClick={onView}
      >
        {user.lastLogin
          ? format(new Date(Number(user.lastLogin) / 1_000_000), "dd MMM yyyy")
          : "—"}
      </TableCell>
      <TableCell onClick={onView}>
        <Badge
          variant={isActive ? "default" : "destructive"}
          className="text-xs"
        >
          {isActive ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 mr-1" />
          )}
          {user.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-60 group-hover:opacity-100 transition-opacity"
            aria-label="View user details"
            onClick={onView}
            data-ocid={`users.view.${rowIndex}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {isActive ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive opacity-60 group-hover:opacity-100 transition-opacity"
              aria-label="Block user"
              onClick={onToggleStatus}
              data-ocid={`users.block.${rowIndex}`}
            >
              <ShieldBan className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-emerald-600 hover:text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity"
              aria-label="Activate user"
              onClick={onToggleStatus}
              data-ocid={`users.activate.${rowIndex}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function UserTableSkeleton() {
  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      data-ocid="users.loading_state"
    >
      <div className="bg-muted/40 px-4 py-3 border-b border-border">
        <div className="flex gap-4">
          {(["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const).map(
            (k, n) => {
              const ws = [200, 120, 60, 80, 100, 100, 60, 60];
              return (
                <Skeleton key={k} className="h-4" style={{ width: ws[n] }} />
              );
            },
          )}
        </div>
      </div>
      {(["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"] as const).map((k) => (
        <div
          key={k}
          className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3.5 w-20 hidden md:block" />
          <Skeleton className="h-3.5 w-8 hidden sm:block" />
          <Skeleton className="h-3.5 w-16 hidden lg:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
}
