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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { Audience, DailyQuestion, StudyChallenge } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engagement",
  component: EngagementPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAudience(val: string, courseId: string): Audience {
  if (val === "all") return { __kind__: "All", All: null };
  // For CourseAudience, we use BigInt from courseId
  return {
    __kind__: "CourseAudience",
    CourseAudience: BigInt(courseId || "0"),
  };
}

function audienceLabel(a: Audience): string {
  if (a.__kind__ === "All") return "All Users";
  if (a.__kind__ === "CourseAudience")
    return `Course #${String(a.CourseAudience)}`;
  return "Individual";
}

function formatCountdown(targetDate: string): {
  label: string;
  expired: boolean;
} {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { label: "Expired", expired: true };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  if (days > 0) return { label: `${days}d ${hours}h ${mins}m`, expired: false };
  if (hours > 0)
    return { label: `${hours}h ${mins}m ${secs}s`, expired: false };
  return { label: `${mins}m ${secs}s`, expired: false };
}

// ─── Live Countdown ───────────────────────────────────────────────────────────

function LiveCountdown({ targetDate }: { targetDate: string }) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastSecRef = useRef(-1);

  useEffect(() => {
    function loop() {
      const sec = Math.floor(Date.now() / 1000);
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec;
        setTick((t) => t + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // tick is only used to trigger re-renders
  void tick;
  const { label, expired } = formatCountdown(targetDate);
  return (
    <span
      className={
        expired
          ? "text-destructive font-mono text-xs"
          : "font-mono text-xs text-primary"
      }
    >
      {label}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ocid,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  ocid: string;
}) {
  return (
    <Card className="py-14" data-ocid={ocid}>
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ─── Audience Selector ────────────────────────────────────────────────────────

function AudienceSelector({
  value,
  courseId,
  onValueChange,
  onCourseChange,
  courses,
  ocidPrefix,
}: {
  value: string;
  courseId: string;
  onValueChange: (v: string) => void;
  onCourseChange: (v: string) => void;
  courses: Array<{ id: bigint; title: string }>;
  ocidPrefix: string;
}) {
  return (
    <div className="space-y-2">
      <Label>Audience</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger data-ocid={`${ocidPrefix}.audience_select`}>
          <SelectValue placeholder="Select audience" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> All Users
            </span>
          </SelectItem>
          <SelectItem value="course">
            <span className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Specific Course
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {value === "course" && (
        <Select value={courseId} onValueChange={onCourseChange}>
          <SelectTrigger data-ocid={`${ocidPrefix}.course_select`}>
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={String(c.id)} value={String(c.id)}>
                {c.title}
              </SelectItem>
            ))}
            {courses.length === 0 && (
              <SelectItem value="0" disabled>
                No courses available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type DialogMode =
  | { type: "daily-add" }
  | { type: "daily-edit"; item: DailyQuestion }
  | { type: "challenge-add" }
  | { type: "challenge-edit"; item: StudyChallenge }
  | { type: "timer-add" }
  | { type: "message-add" };

function EngagementPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [tab, setTab] = useState("daily");
  const [dialog, setDialog] = useState<DialogMode | null>(null);

  // Daily Question form
  const [dqForm, setDqForm] = useState({
    text: "",
    correctAnswer: "",
    scheduledDate: "",
    audience: "all",
    courseId: "",
  });

  // Challenge form
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    endDate: "",
    rewardPoints: "100",
    goalCount: "10",
    audience: "all",
    courseId: "",
  });

  // Timer form
  const [timerForm, setTimerForm] = useState({ name: "", targetDate: "" });

  // Message form
  const [msgForm, setMsgForm] = useState({
    text: "",
    audience: "all",
    courseId: "",
  });

  // Queries
  const { data: dailyQuestions = [], isLoading: dqLoading } = useQuery({
    queryKey: ["daily-questions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDailyQuestions();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChallenges();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: timers = [], isLoading: timersLoading } = useQuery({
    queryKey: ["timers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTimers();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["motivational-messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMotivationalMessages();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["challenge-leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChallengeLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });

  // Reset helpers
  function resetDqForm() {
    setDqForm({
      text: "",
      correctAnswer: "",
      scheduledDate: "",
      audience: "all",
      courseId: "",
    });
  }
  function resetChallengeForm() {
    setChallengeForm({
      title: "",
      description: "",
      endDate: "",
      rewardPoints: "100",
      goalCount: "10",
      audience: "all",
      courseId: "",
    });
  }
  function resetTimerForm() {
    setTimerForm({ name: "", targetDate: "" });
  }
  function resetMsgForm() {
    setMsgForm({ text: "", audience: "all", courseId: "" });
  }

  // Open dialog helpers
  function openEditDq(item: DailyQuestion) {
    setDqForm({
      text: item.text,
      correctAnswer: item.correctAnswer,
      scheduledDate: item.scheduledDate,
      audience: item.audience.__kind__ === "All" ? "all" : "course",
      courseId:
        item.audience.__kind__ === "CourseAudience"
          ? String(item.audience.CourseAudience)
          : "",
    });
    setDialog({ type: "daily-edit", item });
  }
  function openEditChallenge(item: StudyChallenge) {
    setChallengeForm({
      title: item.title,
      description: item.description,
      endDate: item.endDate,
      rewardPoints: String(item.rewardPoints),
      goalCount: String(item.goalCount),
      audience: "all",
      courseId: "",
    });
    setDialog({ type: "challenge-edit", item });
  }

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addDailyQuestion = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.addDailyQuestion({
        id: BigInt(0),
        text: dqForm.text,
        correctAnswer: dqForm.correctAnswer,
        scheduledDate: dqForm.scheduledDate,
        audience: makeAudience(dqForm.audience, dqForm.courseId),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-questions"] });
      setDialog(null);
      resetDqForm();
      toast.success("Daily question added");
    },
    onError: () => toast.error("Failed to add question"),
  });

  const updateDailyQuestion = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateDailyQuestion({
        id,
        text: dqForm.text,
        correctAnswer: dqForm.correctAnswer,
        scheduledDate: dqForm.scheduledDate,
        audience: makeAudience(dqForm.audience, dqForm.courseId),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-questions"] });
      setDialog(null);
      resetDqForm();
      toast.success("Question updated");
    },
    onError: () => toast.error("Failed to update question"),
  });

  const deleteDailyQuestion = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      return actor.deleteDailyQuestion(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-questions"] });
      toast.success("Question deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const addChallenge = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.addChallenge({
        id: BigInt(0),
        title: challengeForm.title,
        description: challengeForm.description,
        endDate: challengeForm.endDate,
        rewardPoints: BigInt(Number.parseInt(challengeForm.rewardPoints) || 0),
        goalCount: BigInt(Number.parseInt(challengeForm.goalCount) || 0),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      setDialog(null);
      resetChallengeForm();
      toast.success("Challenge created");
    },
    onError: () => toast.error("Failed to add challenge"),
  });

  const updateChallenge = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateChallenge({
        id,
        title: challengeForm.title,
        description: challengeForm.description,
        endDate: challengeForm.endDate,
        rewardPoints: BigInt(Number.parseInt(challengeForm.rewardPoints) || 0),
        goalCount: BigInt(Number.parseInt(challengeForm.goalCount) || 0),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      setDialog(null);
      resetChallengeForm();
      toast.success("Challenge updated");
    },
    onError: () => toast.error("Failed to update challenge"),
  });

  const deleteChallenge = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      return actor.deleteChallenge(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenges"] });
      toast.success("Challenge deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const addTimer = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.addTimer({
        id: BigInt(0),
        name: timerForm.name,
        targetDate: timerForm.targetDate,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timers"] });
      setDialog(null);
      resetTimerForm();
      toast.success("Timer added");
    },
    onError: () => toast.error("Failed to add timer"),
  });

  const deleteTimer = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      return actor.deleteTimer(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timers"] });
      toast.success("Timer deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const addMessage = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.addMotivationalMessage({
        id: BigInt(0),
        text: msgForm.text,
        audience: makeAudience(msgForm.audience, msgForm.courseId),
        scheduledAt: BigInt(Date.now() * 1_000_000),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motivational-messages"] });
      setDialog(null);
      resetMsgForm();
      toast.success("Message added");
    },
    onError: () => toast.error("Failed to add message"),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      return actor.deleteMotivationalMessage(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motivational-messages"] });
      toast.success("Message deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  // ─── Dialog content resolver ────────────────────────────────────────────────

  function renderDialogContent() {
    if (!dialog) return null;

    if (dialog.type === "daily-add" || dialog.type === "daily-edit") {
      const isEdit = dialog.type === "daily-edit";
      const isPending = isEdit
        ? updateDailyQuestion.isPending
        : addDailyQuestion.isPending;
      return (
        <>
          <DialogHeader>
            <DialogTitle className="font-display">
              {isEdit ? "Edit Daily Question" : "Add Daily Question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="dq-text">Question Text</Label>
              <Textarea
                id="dq-text"
                placeholder="What is the primary purpose of React's useEffect hook?"
                value={dqForm.text}
                onChange={(e) =>
                  setDqForm((f) => ({ ...f, text: e.target.value }))
                }
                rows={3}
                data-ocid="engagement.dq_text_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dq-answer">Correct Answer</Label>
              <Input
                id="dq-answer"
                placeholder="e.g. To handle side effects in functional components"
                value={dqForm.correctAnswer}
                onChange={(e) =>
                  setDqForm((f) => ({ ...f, correctAnswer: e.target.value }))
                }
                data-ocid="engagement.dq_answer_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dq-date">Scheduled Date</Label>
              <Input
                id="dq-date"
                type="date"
                value={dqForm.scheduledDate}
                onChange={(e) =>
                  setDqForm((f) => ({ ...f, scheduledDate: e.target.value }))
                }
                data-ocid="engagement.dq_date_input"
              />
            </div>
            <AudienceSelector
              value={dqForm.audience}
              courseId={dqForm.courseId}
              onValueChange={(v) => setDqForm((f) => ({ ...f, audience: v }))}
              onCourseChange={(v) => setDqForm((f) => ({ ...f, courseId: v }))}
              courses={courses}
              ocidPrefix="engagement.dq"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              data-ocid="engagement.dq.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isEdit) {
                  updateDailyQuestion.mutate(dialog.item.id);
                } else {
                  addDailyQuestion.mutate();
                }
              }}
              disabled={!dqForm.text || !dqForm.correctAnswer || isPending}
              data-ocid="engagement.dq.submit_button"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (dialog.type === "challenge-add" || dialog.type === "challenge-edit") {
      const isEdit = dialog.type === "challenge-edit";
      const isPending = isEdit
        ? updateChallenge.isPending
        : addChallenge.isPending;
      return (
        <>
          <DialogHeader>
            <DialogTitle className="font-display">
              {isEdit ? "Edit Challenge" : "Create Challenge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="ch-title">Title</Label>
              <Input
                id="ch-title"
                placeholder="7-Day Learning Challenge"
                value={challengeForm.title}
                onChange={(e) =>
                  setChallengeForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="engagement.challenge_title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ch-desc">Description</Label>
              <Textarea
                id="ch-desc"
                placeholder="Complete 7 lessons in 7 days to earn your badge..."
                value={challengeForm.description}
                onChange={(e) =>
                  setChallengeForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={2}
                data-ocid="engagement.challenge_desc_input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ch-date">End Date</Label>
                <Input
                  id="ch-date"
                  type="date"
                  value={challengeForm.endDate}
                  onChange={(e) =>
                    setChallengeForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  data-ocid="engagement.challenge_date_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-points">Reward Pts</Label>
                <Input
                  id="ch-points"
                  type="number"
                  min="0"
                  value={challengeForm.rewardPoints}
                  onChange={(e) =>
                    setChallengeForm((f) => ({
                      ...f,
                      rewardPoints: e.target.value,
                    }))
                  }
                  data-ocid="engagement.challenge_points_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-goal">Goal Count</Label>
                <Input
                  id="ch-goal"
                  type="number"
                  min="1"
                  value={challengeForm.goalCount}
                  onChange={(e) =>
                    setChallengeForm((f) => ({
                      ...f,
                      goalCount: e.target.value,
                    }))
                  }
                  data-ocid="engagement.challenge_goal_input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              data-ocid="engagement.challenge.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isEdit) {
                  updateChallenge.mutate(dialog.item.id);
                } else {
                  addChallenge.mutate();
                }
              }}
              disabled={!challengeForm.title || isPending}
              data-ocid="engagement.challenge.submit_button"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Challenge"}
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (dialog.type === "timer-add") {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Countdown Timer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Timer Name</Label>
              <Input
                id="tm-name"
                placeholder="Final Exam Countdown"
                value={timerForm.name}
                onChange={(e) =>
                  setTimerForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="engagement.timer_name_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-date">Target Date & Time</Label>
              <Input
                id="tm-date"
                type="datetime-local"
                value={timerForm.targetDate}
                onChange={(e) =>
                  setTimerForm((f) => ({ ...f, targetDate: e.target.value }))
                }
                data-ocid="engagement.timer_date_input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              data-ocid="engagement.timer.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addTimer.mutate()}
              disabled={
                !timerForm.name || !timerForm.targetDate || addTimer.isPending
              }
              data-ocid="engagement.timer.submit_button"
            >
              {addTimer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Timer
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (dialog.type === "message-add") {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Motivational Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="msg-text">Message</Label>
              <Textarea
                id="msg-text"
                placeholder="Every expert was once a beginner. Keep pushing forward! 🚀"
                value={msgForm.text}
                onChange={(e) =>
                  setMsgForm((f) => ({ ...f, text: e.target.value }))
                }
                rows={3}
                data-ocid="engagement.message_input"
              />
            </div>
            <AudienceSelector
              value={msgForm.audience}
              courseId={msgForm.courseId}
              onValueChange={(v) => setMsgForm((f) => ({ ...f, audience: v }))}
              onCourseChange={(v) => setMsgForm((f) => ({ ...f, courseId: v }))}
              courses={courses}
              ocidPrefix="engagement.msg"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              data-ocid="engagement.message.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => addMessage.mutate()}
              disabled={!msgForm.text || addMessage.isPending}
              data-ocid="engagement.message.submit_button"
            >
              {addMessage.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Message
            </Button>
          </DialogFooter>
        </>
      );
    }

    return null;
  }

  function getAddButtonLabel() {
    if (tab === "daily") return "Add Question";
    if (tab === "challenges") return "New Challenge";
    if (tab === "timers") return "Add Timer";
    return "Add Message";
  }

  function handleAdd() {
    if (tab === "daily") {
      resetDqForm();
      setDialog({ type: "daily-add" });
    } else if (tab === "challenges") {
      resetChallengeForm();
      setDialog({ type: "challenge-add" });
    } else if (tab === "timers") {
      resetTimerForm();
      setDialog({ type: "timer-add" });
    } else {
      resetMsgForm();
      setDialog({ type: "message-add" });
    }
  }

  return (
    <Layout>
      <div className="space-y-6" data-ocid="engagement.page">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: "Engagement" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Engagement Engine
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Daily questions, study challenges, countdown timers &amp;
                motivational messages
              </p>
            </div>
            <Button
              onClick={handleAdd}
              className="gap-2 shrink-0"
              data-ocid="engagement.add_button"
            >
              <Plus className="h-4 w-4" />
              {getAddButtonLabel()}
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Daily Questions",
              value: dailyQuestions.length,
              icon: MessageSquare,
              color: "text-primary",
            },
            {
              label: "Challenges",
              value: challenges.length,
              icon: Trophy,
              color: "text-accent",
            },
            {
              label: "Active Timers",
              value: timers.filter(
                (t) => !formatCountdown(t.targetDate).expired,
              ).length,
              icon: Clock,
              color: "text-chart-3",
            },
            {
              label: "Messages",
              value: messages.length,
              icon: Sparkles,
              color: "text-chart-2",
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} data-ocid="engagement.tabs">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger
              value="daily"
              className="gap-1.5 flex-1 sm:flex-none"
              data-ocid="engagement.daily.tab"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Daily Questions</span>
              <span className="sm:hidden">Questions</span>
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {dailyQuestions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="gap-1.5 flex-1 sm:flex-none"
              data-ocid="engagement.challenges.tab"
            >
              <Trophy className="h-3.5 w-3.5" />
              Challenges
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {challenges.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="timers"
              className="gap-1.5 flex-1 sm:flex-none"
              data-ocid="engagement.timers.tab"
            >
              <Clock className="h-3.5 w-3.5" />
              Timers
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {timers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="gap-1.5 flex-1 sm:flex-none"
              data-ocid="engagement.messages.tab"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Messages
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {messages.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── Daily Questions ─────────────────────────────────────────── */}
          <TabsContent value="daily" className="mt-4">
            {dqLoading ? (
              <div
                className="flex items-center justify-center py-16 text-muted-foreground"
                data-ocid="engagement.daily.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading
                questions…
              </div>
            ) : dailyQuestions.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No daily questions yet"
                subtitle="Add questions to keep students engaged and test their knowledge every day"
                ocid="engagement.daily.empty_state"
              />
            ) : (
              <div className="space-y-3">
                {dailyQuestions.map((dq, i) => (
                  <Card
                    key={String(dq.id)}
                    className="card-hover"
                    data-ocid={`engagement.dq.item.${i + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="gap-1 text-xs shrink-0"
                            >
                              <Calendar className="h-3 w-3" />
                              {dq.scheduledDate || "No date"}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs shrink-0"
                            >
                              {audienceLabel(dq.audience)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {dq.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                            <span className="truncate">{dq.correctAnswer}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDq(dq)}
                            aria-label="Edit question"
                            data-ocid={`engagement.dq.edit_button.${i + 1}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteDailyQuestion.mutate(dq.id)}
                            aria-label="Delete question"
                            data-ocid={`engagement.dq.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Study Challenges ─────────────────────────────────────────── */}
          <TabsContent value="challenges" className="mt-4">
            {challengesLoading ? (
              <div
                className="flex items-center justify-center py-16 text-muted-foreground"
                data-ocid="engagement.challenges.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading
                challenges…
              </div>
            ) : challenges.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No challenges yet"
                subtitle="Create study challenges to motivate students and boost learning outcomes"
                ocid="engagement.challenges.empty_state"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {challenges.map((c, i) => (
                  <Card
                    key={String(c.id)}
                    className="card-hover"
                    data-ocid={`engagement.challenge.item.${i + 1}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate">
                            {c.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditChallenge(c)}
                            aria-label="Edit challenge"
                            data-ocid={`engagement.challenge.edit_button.${i + 1}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteChallenge.mutate(c.id)}
                            aria-label="Delete challenge"
                            data-ocid={`engagement.challenge.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {c.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Star className="h-3 w-3 text-accent" />
                          {String(c.rewardPoints)} pts
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Zap className="h-3 w-3" />
                          Goal: {String(c.goalCount)}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {c.endDate}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="mt-6">
                <Separator className="mb-4" />
                <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" /> Challenge
                  Leaderboard
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {leaderboard.slice(0, 10).map((entry, i) => (
                        <div
                          key={`${entry[0]}-${i}`}
                          className="flex items-center justify-between px-4 py-2.5"
                          data-ocid={`engagement.leaderboard.item.${i + 1}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 text-center text-xs font-bold ${i === 0 ? "text-accent" : "text-muted-foreground"}`}
                            >
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {entry[0]}
                            </span>
                          </div>
                          <Badge
                            variant={i === 0 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {String(entry[1])} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Countdown Timers ─────────────────────────────────────────── */}
          <TabsContent value="timers" className="mt-4">
            {timersLoading ? (
              <div
                className="flex items-center justify-center py-16 text-muted-foreground"
                data-ocid="engagement.timers.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading
                timers…
              </div>
            ) : timers.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No countdown timers"
                subtitle="Add timers for upcoming exams, assignment deadlines, or special events"
                ocid="engagement.timers.empty_state"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {timers.map((t, i) => {
                  const { expired } = formatCountdown(t.targetDate);
                  return (
                    <Card
                      key={String(t.id)}
                      className={`card-hover ${expired ? "opacity-70 border-destructive/30" : ""}`}
                      data-ocid={`engagement.timer.item.${i + 1}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`rounded-full p-2 mt-0.5 ${expired ? "bg-destructive/10" : "bg-primary/10"}`}
                            >
                              <Clock
                                className={`h-4 w-4 ${expired ? "text-destructive" : "text-primary"}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {t.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t.targetDate}
                              </p>
                              <div className="mt-1.5">
                                {expired ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs gap-1"
                                  >
                                    <AlertCircle className="h-3 w-3" /> Expired
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <Badge
                                      variant="outline"
                                      className="text-xs gap-1 border-primary/30"
                                    >
                                      <Zap className="h-3 w-3 text-primary" />
                                      <LiveCountdown
                                        targetDate={t.targetDate}
                                      />
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                            onClick={() => deleteTimer.mutate(t.id)}
                            aria-label="Delete timer"
                            data-ocid={`engagement.timer.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Motivational Messages ─────────────────────────────────────── */}
          <TabsContent value="messages" className="mt-4">
            {messagesLoading ? (
              <div
                className="flex items-center justify-center py-16 text-muted-foreground"
                data-ocid="engagement.messages.loading_state"
              >
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading
                messages…
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No motivational messages yet"
                subtitle="Add inspiring messages to keep students motivated throughout their learning journey"
                ocid="engagement.messages.empty_state"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {messages.map((msg, i) => (
                  <Card
                    key={String(msg.id)}
                    className="card-hover"
                    data-ocid={`engagement.message.item.${i + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                          <div className="min-w-0 space-y-1.5">
                            <p className="text-sm text-foreground leading-relaxed">
                              {msg.text}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {audienceLabel(msg.audience)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                          onClick={() => deleteMessage.mutate(msg.id)}
                          aria-label="Delete message"
                          data-ocid={`engagement.message.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog */}
        <Dialog
          open={dialog !== null}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
        >
          <DialogContent className="sm:max-w-md" data-ocid="engagement.dialog">
            {renderDialogContent()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
