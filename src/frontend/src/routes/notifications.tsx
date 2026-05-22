import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { NotificationAudience } from "../backend";
import type { UserId } from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { Notification } from "../types";
import { NotificationStatus } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

/* ─── helpers ─────────────────────────────────────────── */
const EMOJI_OPTIONS = [
  "🔔",
  "🚀",
  "📚",
  "🎯",
  "🏆",
  "💡",
  "⚡",
  "🎓",
  "📢",
  "🌟",
];

const AUDIENCE_LABELS: Record<string, string> = {
  All: "All Users",
  Course: "Specific Course",
  Individual: "Individual User",
};

const statusConfig: Record<
  NotificationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  [NotificationStatus.Sent]: { label: "Sent", variant: "default" },
  [NotificationStatus.Draft]: { label: "Draft", variant: "secondary" },
  [NotificationStatus.Scheduled]: { label: "Scheduled", variant: "outline" },
  [NotificationStatus.Failed]: { label: "Failed", variant: "destructive" },
};

function audienceLabel(audience: NotificationAudience): string {
  if (audience.__kind__ === "All") return "All Users";
  if (audience.__kind__ === "Course") return `Course #${audience.Course}`;
  return `User: ${String(audience.Individual).slice(0, 8)}…`;
}

function formatDate(ts?: bigint): string {
  if (!ts) return "—";
  return new Date(Number(ts) / 1_000_000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── compose form state ───────────────────────────────── */
interface ComposeForm {
  title: string;
  body: string;
  ctaUrl: string;
  icon: string;
  audienceKind: "All" | "Course" | "Individual";
  courseId: string;
  individualId: string;
  scheduleKind: "now" | "later";
  scheduledDate: string;
  scheduledTime: string;
}

const defaultForm = (): ComposeForm => ({
  title: "",
  body: "",
  ctaUrl: "",
  icon: "🔔",
  audienceKind: "All",
  courseId: "",
  individualId: "",
  scheduleKind: "now",
  scheduledDate: "",
  scheduledTime: "",
});

function buildAudience(form: ComposeForm): NotificationAudience {
  if (form.audienceKind === "Course" && form.courseId) {
    return { __kind__: "Course", Course: BigInt(form.courseId) };
  }
  if (form.audienceKind === "Individual" && form.individualId) {
    return {
      __kind__: "Individual",
      Individual: form.individualId as unknown as UserId,
    };
  }
  return { __kind__: "All", All: null };
}

/* ─── sub-components ───────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} shrink-0`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold font-display text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationCard({
  n,
  index,
  onSend,
  onCancel,
  onDelete,
  onView,
  isSending,
  isDeleting,
}: {
  n: Notification;
  index: number;
  onSend?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  isSending?: boolean;
  isDeleting?: boolean;
}) {
  const cfg = statusConfig[n.status];
  return (
    <Card
      className="card-hover cursor-pointer"
      onClick={onView}
      onKeyDown={(e) => e.key === "Enter" && onView?.()}
      data-ocid={`notifications.item.${index}`}
    >
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 text-xl select-none">
          {n.title.match(/^\p{Emoji}/u)?.[0] ?? "🔔"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {n.title}
            </h3>
            <Badge variant={cfg.variant} className="text-xs shrink-0">
              {cfg.label}
            </Badge>
            <Badge variant="outline" className="text-xs shrink-0">
              <Users className="h-3 w-3 mr-1" />
              {audienceLabel(n.audience)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
            {n.sentAt && (
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" />
                Sent {formatDate(n.sentAt)}
              </span>
            )}
            {n.scheduledAt && n.status === NotificationStatus.Scheduled && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Scheduled {formatDate(n.scheduledAt)}
              </span>
            )}
            {n.ctaUrl && (
              <span className="truncate max-w-[200px]">CTA: {n.ctaUrl}</span>
            )}
          </div>
        </div>
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {n.status === NotificationStatus.Draft && onSend && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={onSend}
              disabled={isSending}
              data-ocid={`notifications.send_button.${index}`}
            >
              <Send className="h-3 w-3" />
              Send Now
            </Button>
          )}
          {n.status === NotificationStatus.Scheduled && onCancel && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={onCancel}
              data-ocid={`notifications.cancel_button.${index}`}
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          )}
          {n.status === NotificationStatus.Scheduled && onSend && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={onSend}
              disabled={isSending}
              data-ocid={`notifications.mark_sent_button.${index}`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Mark Sent
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete notification"
              data-ocid={`notifications.delete_button.${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── compose dialog ───────────────────────────────────── */
function ComposeDialog({
  open,
  onOpenChange,
  courses,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courses: { id: bigint; title: string }[];
  onSave: (form: ComposeForm, sendNow: boolean) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<ComposeForm>(defaultForm);
  const [sendConfirm, setSendConfirm] = useState(false);

  const update = <K extends keyof ComposeForm>(k: K, v: ComposeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.title.trim() &&
    form.body.trim() &&
    (form.audienceKind !== "Course" || form.courseId) &&
    (form.audienceKind !== "Individual" || form.individualId) &&
    (form.scheduleKind !== "later" ||
      (form.scheduledDate && form.scheduledTime));

  const handleClose = () => {
    setForm(defaultForm());
    setSendConfirm(false);
    onOpenChange(false);
  };

  if (sendConfirm) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="notifications.confirm_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Confirm Send</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground">
              You are about to send{" "}
              <span className="font-medium text-foreground">
                "{form.title}"
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {AUDIENCE_LABELS[form.audienceKind]}
              </span>
              .
            </p>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendConfirm(false)}
              data-ocid="notifications.back_button"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                onSave(form, true);
                handleClose();
              }}
              disabled={isSaving}
              data-ocid="notifications.confirm_button"
            >
              {isSaving ? "Sending…" : "Confirm Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="notifications.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Compose Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* icon + title row */}
          <div className="flex gap-3 items-start">
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <select
                className="h-10 w-16 rounded-md border border-input bg-background px-2 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.icon}
                onChange={(e) => update("icon", e.target.value)}
                data-ocid="notifications.icon_select"
              >
                {EMOJI_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="notif-title">Title *</Label>
              <Input
                id="notif-title"
                placeholder="e.g. New course available!"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                data-ocid="notifications.title_input"
              />
            </div>
          </div>

          {/* body */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-body">Message *</Label>
            <Textarea
              id="notif-body"
              placeholder="Write your notification message…"
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              rows={3}
              data-ocid="notifications.body_textarea"
            />
          </div>

          {/* CTA */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-cta">CTA URL (optional)</Label>
            <Input
              id="notif-cta"
              placeholder="https://…"
              type="url"
              value={form.ctaUrl}
              onChange={(e) => update("ctaUrl", e.target.value)}
              data-ocid="notifications.cta_input"
            />
          </div>

          {/* audience */}
          <div className="space-y-2">
            <Label>Audience *</Label>
            <div className="flex flex-wrap gap-2">
              {(["All", "Course", "Individual"] as const).map((k) => (
                <Button
                  key={k}
                  type="button"
                  variant={form.audienceKind === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("audienceKind", k)}
                  data-ocid={`notifications.audience_${k.toLowerCase()}`}
                >
                  {AUDIENCE_LABELS[k]}
                </Button>
              ))}
            </div>
            {form.audienceKind === "Course" && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-course">Course</Label>
                <select
                  id="notif-course"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.courseId}
                  onChange={(e) => update("courseId", e.target.value)}
                  data-ocid="notifications.course_select"
                >
                  <option value="">— Select course —</option>
                  {courses.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {form.audienceKind === "Individual" && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-user">User Principal</Label>
                <Input
                  id="notif-user"
                  placeholder="2vxsx-fae…"
                  value={form.individualId}
                  onChange={(e) => update("individualId", e.target.value)}
                  data-ocid="notifications.user_input"
                />
              </div>
            )}
          </div>

          {/* schedule */}
          <div className="space-y-2">
            <Label>Send time</Label>
            <div className="flex gap-2">
              {(["now", "later"] as const).map((k) => (
                <Button
                  key={k}
                  type="button"
                  variant={form.scheduleKind === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("scheduleKind", k)}
                  data-ocid={`notifications.schedule_${k}`}
                >
                  {k === "now" ? (
                    <>
                      <Send className="h-3 w-3 mr-1.5" />
                      Send Now
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3 w-3 mr-1.5" />
                      Schedule
                    </>
                  )}
                </Button>
              ))}
            </div>
            {form.scheduleKind === "later" && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                  className="flex-1"
                  data-ocid="notifications.schedule_date"
                />
                <Input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => update("scheduledTime", e.target.value)}
                  className="w-32"
                  data-ocid="notifications.schedule_time"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            data-ocid="notifications.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={!valid || isSaving}
            onClick={() => {
              onSave(form, false);
              handleClose();
            }}
            data-ocid="notifications.save_draft_button"
          >
            Save as Draft
          </Button>
          <Button
            disabled={!valid || isSaving}
            onClick={() => {
              if (form.scheduleKind === "now") {
                setSendConfirm(true);
              } else {
                onSave(form, false);
                handleClose();
              }
            }}
            data-ocid="notifications.submit_button"
          >
            {form.scheduleKind === "now" ? "Send Now" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── detail dialog ────────────────────────────────────── */
function DetailDialog({
  notification,
  onClose,
}: {
  notification: Notification | null;
  onClose: () => void;
}) {
  if (!notification) return null;
  const cfg = statusConfig[notification.status];
  return (
    <Dialog open={!!notification} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="notifications.detail_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <span className="text-xl">
              {notification.title.match(/^\p{Emoji}/u)?.[0] ?? "🔔"}
            </span>
            {notification.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {audienceLabel(notification.audience)}
            </Badge>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm text-foreground leading-relaxed">
            {notification.body}
          </div>
          {notification.ctaUrl && (
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                CTA Link
              </p>
              <a
                href={notification.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {notification.ctaUrl}
              </a>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {notification.sentAt && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Sent At</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(notification.sentAt)}
                </p>
              </div>
            )}
            {notification.scheduledAt && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Scheduled At
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(notification.scheduledAt)}
                </p>
              </div>
            )}
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-0.5">
                Notification ID
              </p>
              <p className="text-sm font-medium text-foreground font-mono">
                #{String(notification.id)}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="notifications.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── loading skeleton ─────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ─── page ─────────────────────────────────────────────── */
function NotificationsPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [detailNotif, setDetailNotif] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const enabled = !!actor && !isFetching;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => (actor ? actor.listNotifications() : []),
    enabled,
  });

  const { data: sentNotifications = [] } = useQuery({
    queryKey: ["notifications", "sent"],
    queryFn: () => (actor ? actor.getSentNotifications() : []),
    enabled,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => (actor ? actor.listCourses() : []),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { n: Notification; sendNow: boolean }) => {
      if (!actor) throw new Error("Not connected");
      const id = await actor.createNotification(payload.n);
      if (payload.sendNow) await actor.sendNotification(id);
      return id;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        vars.sendNow ? "Notification sent!" : "Notification saved as draft",
      );
    },
    onError: () => toast.error("Failed to create notification"),
  });

  const sendMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendNotification(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification sent successfully");
    },
    onError: () => toast.error("Failed to send notification"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteNotification(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
    onError: () => toast.error("Failed to delete notification"),
  });

  const handleSave = (form: ComposeForm, sendNow: boolean) => {
    let scheduledAt: bigint | undefined;
    if (
      form.scheduleKind === "later" &&
      form.scheduledDate &&
      form.scheduledTime
    ) {
      const dt = new Date(`${form.scheduledDate}T${form.scheduledTime}`);
      scheduledAt = BigInt(dt.getTime()) * BigInt(1_000_000);
    }
    const n: Notification = {
      id: BigInt(0),
      title: `${form.icon} ${form.title}`,
      body: form.body,
      ctaUrl: form.ctaUrl,
      status:
        form.scheduleKind === "later"
          ? NotificationStatus.Scheduled
          : NotificationStatus.Draft,
      audience: buildAudience(form),
      scheduledAt,
    };
    createMutation.mutate({ n, sendNow });
  };

  const allList = notifications;
  const draftList = notifications.filter(
    (n) => n.status === NotificationStatus.Draft,
  );
  const scheduledList = notifications.filter(
    (n) => n.status === NotificationStatus.Scheduled,
  );

  const sentCount =
    sentNotifications.length +
    notifications.filter((n) => n.status === NotificationStatus.Sent).length;
  const draftCount = draftList.length;
  const scheduledCount = scheduledList.length;

  const tabData: Record<string, Notification[]> = {
    all: allList,
    drafts: draftList,
    scheduled: scheduledList,
    sent: sentNotifications,
  };

  return (
    <Layout>
      <div className="space-y-6" data-ocid="notifications.page">
        {/* header */}
        <div>
          <Breadcrumbs items={[{ label: "Notifications" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Compose and manage push notifications for your students
              </p>
            </div>
            <Button
              onClick={() => setShowCompose(true)}
              className="gap-2 shrink-0"
              data-ocid="notifications.add_button"
            >
              <Plus className="h-4 w-4" />
              Compose Notification
            </Button>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={Bell}
            label="Total"
            value={notifications.length}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={Send}
            label="Sent"
            value={sentCount}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={Clock}
            label="Scheduled"
            value={scheduledCount}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Drafts"
            value={draftCount}
            color="bg-muted text-muted-foreground"
          />
        </div>

        {/* tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          data-ocid="notifications.tabs"
        >
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="all" data-ocid="notifications.tab.all">
              All
              {allList.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary font-medium">
                  {allList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" data-ocid="notifications.tab.drafts">
              Drafts
            </TabsTrigger>
            <TabsTrigger
              value="scheduled"
              data-ocid="notifications.tab.scheduled"
            >
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="sent" data-ocid="notifications.tab.sent">
              Sent
            </TabsTrigger>
          </TabsList>

          {(["all", "drafts", "scheduled", "sent"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : tabData[tab].length === 0 ? (
                <Card
                  className="py-14"
                  data-ocid={`notifications.${tab}.empty_state`}
                >
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30" />
                    <div>
                      <p className="font-medium text-foreground">
                        No {tab} notifications
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tab === "all"
                          ? "Compose your first notification to get started"
                          : tab === "drafts"
                            ? "No drafts saved yet"
                            : tab === "scheduled"
                              ? "No upcoming scheduled notifications"
                              : "No notifications have been sent yet"}
                      </p>
                    </div>
                    {tab === "all" && (
                      <Button
                        onClick={() => setShowCompose(true)}
                        className="mt-2 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Compose Notification
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tab === "scheduled" && (
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {scheduledList.length} notification
                          {scheduledList.length !== 1 ? "s" : ""} pending
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  )}
                  {tabData[tab].map((n, i) => (
                    <NotificationCard
                      key={String(n.id)}
                      n={n}
                      index={i + 1}
                      onView={() => setDetailNotif(n)}
                      onSend={
                        n.status === NotificationStatus.Draft ||
                        n.status === NotificationStatus.Scheduled
                          ? () => sendMutation.mutate(n.id)
                          : undefined
                      }
                      onCancel={
                        n.status === NotificationStatus.Scheduled
                          ? () => deleteMutation.mutate(n.id)
                          : undefined
                      }
                      onDelete={
                        n.status !== NotificationStatus.Sent
                          ? () => deleteMutation.mutate(n.id)
                          : undefined
                      }
                      isSending={sendMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <ComposeDialog
          open={showCompose}
          onOpenChange={setShowCompose}
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
          onSave={handleSave}
          isSaving={createMutation.isPending}
        />

        <DetailDialog
          notification={detailNotif}
          onClose={() => setDetailNotif(null)}
        />
      </div>
    </Layout>
  );
}
