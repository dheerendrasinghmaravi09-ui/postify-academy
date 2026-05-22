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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Edit2,
  Medal,
  MessageSquare,
  Plus,
  Target,
  Timer,
  Trash2,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { MockTest, Question, TestResult } from "../types/index";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tests",
  component: TestsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ViewMode =
  | { kind: "list" }
  | { kind: "questions"; test: MockTest }
  | { kind: "results"; test: MockTest };

function emptyTestForm() {
  return {
    id: "",
    title: "",
    description: "",
    courseId: "1",
    passingScore: "60",
    timerMinutes: "30",
    negativeMarking: false,
  };
}

function emptyQuestionForm() {
  return {
    id: "",
    text: "",
    option0: "",
    option1: "",
    option2: "",
    option3: "",
    correctIndex: "0",
    explanation: "",
  };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function TestsPage() {
  const [view, setView] = useState<ViewMode>({ kind: "list" });

  if (view.kind === "questions") {
    return (
      <Layout>
        <QuestionsView
          test={view.test}
          onBack={() => setView({ kind: "list" })}
        />
      </Layout>
    );
  }
  if (view.kind === "results") {
    return (
      <Layout>
        <ResultsView
          test={view.test}
          onBack={() => setView({ kind: "list" })}
        />
      </Layout>
    );
  }
  return (
    <Layout>
      <TestsListView
        onOpenQuestions={(t) => setView({ kind: "questions", test: t })}
        onOpenResults={(t) => setView({ kind: "results", test: t })}
      />
    </Layout>
  );
}

// ─── Tests List ────────────────────────────────────────────────────────────────

function TestsListView({
  onOpenQuestions,
  onOpenResults,
}: {
  onOpenQuestions: (t: MockTest) => void;
  onOpenResults: (t: MockTest) => void;
}) {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MockTest | null>(null);
  const [form, setForm] = useState(emptyTestForm());

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["mock-tests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMockTests();
    },
    enabled: !!actor && !isFetching,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTestForm());
    setDialogOpen(true);
  };

  const openEdit = (t: MockTest) => {
    setEditing(t);
    setForm({
      id: String(t.id),
      title: t.title,
      description: "",
      courseId: String(t.courseId),
      passingScore: String(t.passingScore),
      timerMinutes: String(t.timerMinutes),
      negativeMarking: t.negativeMarking,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const payload: MockTest = {
        id: editing ? editing.id : BigInt(0),
        title: form.title,
        courseId: BigInt(Number.parseInt(form.courseId) || 1),
        passingScore: BigInt(Number.parseInt(form.passingScore) || 60),
        timerMinutes: BigInt(Number.parseInt(form.timerMinutes) || 30),
        negativeMarking: form.negativeMarking,
      };
      if (editing) {
        return actor.updateMockTest(payload);
      }
      return actor.createMockTest(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mock-tests"] });
      setDialogOpen(false);
      toast.success(editing ? "Test updated" : "Test created");
    },
    onError: () => toast.error("Failed to save test"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMockTest(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mock-tests"] });
      toast.success("Test deleted");
    },
    onError: () => toast.error("Failed to delete test"),
  });

  return (
    <div className="space-y-6" data-ocid="tests.page">
      <div>
        <Breadcrumbs items={[{ label: "Mock Tests & Quizzes" }]} />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Mock Tests & Quizzes
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tests.length} test{tests.length !== 1 ? "s" : ""} · Create and
              manage student assessments
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="gap-2"
            data-ocid="tests.add_button"
          >
            <Plus className="h-4 w-4" />
            New Test
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0 divide-y divide-border">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <Card className="py-16" data-ocid="tests.empty_state">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">No tests yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first mock test to start assessing students
              </p>
            </div>
            <Button onClick={openCreate} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              Create First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Course</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Timer
                </TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Pass Score
                </TableHead>
                <TableHead className="hidden lg:table-cell">Marking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test, i) => (
                <TableRow
                  key={String(test.id)}
                  data-ocid={`tests.item.${i + 1}`}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => onOpenQuestions(test)}
                    >
                      {test.title}
                    </button>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      Course #{String(test.courseId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    <span className="flex items-center justify-end gap-1 text-sm">
                      <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                      {String(test.timerMinutes)} min
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    <span className="flex items-center justify-end gap-1 text-sm">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      {String(test.passingScore)}%
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {test.negativeMarking ? (
                      <Badge variant="destructive" className="text-xs">
                        Negative
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => onOpenQuestions(test)}
                        data-ocid={`tests.questions_button.${i + 1}`}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Questions</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => onOpenResults(test)}
                        data-ocid={`tests.results_button.${i + 1}`}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Results</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(test)}
                        aria-label="Edit test"
                        data-ocid={`tests.edit_button.${i + 1}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(test.id)}
                        aria-label="Delete test"
                        data-ocid={`tests.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="tests.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit Test" : "Create Mock Test"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="test-title">Test Title</Label>
              <Input
                id="test-title"
                placeholder="e.g. React Fundamentals Assessment"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                data-ocid="tests.title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="test-desc">Description (optional)</Label>
              <Textarea
                id="test-desc"
                placeholder="Briefly describe this test..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="resize-none"
                rows={2}
                data-ocid="tests.description_input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="test-course">Course ID</Label>
                <Input
                  id="test-course"
                  type="number"
                  min={1}
                  value={form.courseId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, courseId: e.target.value }))
                  }
                  data-ocid="tests.course_id_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test-timer">Duration (min)</Label>
                <Input
                  id="test-timer"
                  type="number"
                  min={1}
                  value={form.timerMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, timerMinutes: e.target.value }))
                  }
                  data-ocid="tests.timer_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test-pass">Pass Score (%)</Label>
                <Input
                  id="test-pass"
                  type="number"
                  min={1}
                  max={100}
                  value={form.passingScore}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, passingScore: e.target.value }))
                  }
                  data-ocid="tests.passing_score_input"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <Switch
                id="neg-marking"
                checked={form.negativeMarking}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, negativeMarking: v }))
                }
                data-ocid="tests.negative_marking_switch"
              />
              <div>
                <Label htmlFor="neg-marking" className="cursor-pointer">
                  Negative Marking
                </Label>
                <p className="text-xs text-muted-foreground">
                  Deduct marks for wrong answers
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="tests.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.title || saveMutation.isPending}
              data-ocid="tests.submit_button"
            >
              {saveMutation.isPending
                ? editing
                  ? "Saving..."
                  : "Creating..."
                : editing
                  ? "Save Changes"
                  : "Create Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Questions View ─────────────────────────────────────────────────────────────

function QuestionsView({
  test,
  onBack,
}: {
  test: MockTest;
  onBack: () => void;
}) {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [qForm, setQForm] = useState(emptyQuestionForm());

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions", String(test.id)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listQuestions(test.id);
    },
    enabled: !!actor && !isFetching,
  });

  const openAddQuestion = () => {
    setEditingQ(null);
    setQForm(emptyQuestionForm());
    setDialogOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQ(q);
    setQForm({
      id: String(q.id),
      text: q.text,
      option0: q.options[0] ?? "",
      option1: q.options[1] ?? "",
      option2: q.options[2] ?? "",
      option3: q.options[3] ?? "",
      correctIndex: String(q.correctIndex),
      explanation: q.explanation,
    });
    setDialogOpen(true);
  };

  const saveQuestion = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const payload: Question = {
        id: editingQ ? editingQ.id : BigInt(0),
        testId: test.id,
        text: qForm.text,
        options: [qForm.option0, qForm.option1, qForm.option2, qForm.option3],
        correctIndex: BigInt(Number.parseInt(qForm.correctIndex)),
        explanation: qForm.explanation,
      };
      if (editingQ) {
        return actor.updateQuestion(payload);
      }
      return actor.addQuestion(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions", String(test.id)] });
      setDialogOpen(false);
      toast.success(editingQ ? "Question updated" : "Question added");
    },
    onError: () => toast.error("Failed to save question"),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteQuestion(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions", String(test.id)] });
      toast.success("Question deleted");
    },
    onError: () => toast.error("Failed to delete question"),
  });

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6" data-ocid="questions.page">
      <div>
        <Breadcrumbs items={[{ label: "Mock Tests" }, { label: test.title }]} />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={onBack}
                aria-label="Back to tests"
                data-ocid="questions.back_button"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {test.title}
              </h1>
            </div>
            <p className="mt-0.5 ml-6 text-sm text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? "s" : ""} ·{" "}
              {String(test.timerMinutes)} min · Pass:{" "}
              {String(test.passingScore)}%
            </p>
          </div>
          <Button
            onClick={openAddQuestion}
            className="gap-2"
            data-ocid="questions.add_button"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card className="py-16" data-ocid="questions.empty_state">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">No questions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add MCQ questions to this test
              </p>
            </div>
            <Button onClick={openAddQuestion} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              Add First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={String(q.id)} data-ocid={`questions.item.${i + 1}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <CardTitle className="text-sm font-medium leading-relaxed text-foreground">
                      {q.text}
                    </CardTitle>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditQuestion(q)}
                      aria-label="Edit question"
                      data-ocid={`questions.edit_button.${i + 1}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteQuestion.mutate(q.id)}
                      aria-label="Delete question"
                      data-ocid={`questions.delete_button.${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <div
                      key={`q${String(q.id)}-opt${oi}`}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                        BigInt(oi) === q.correctIndex
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold shrink-0">
                        {optionLabels[oi]}.
                      </span>
                      <span className="truncate">{opt}</span>
                      {BigInt(oi) === q.correctIndex && (
                        <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    💡 {q.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Question Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="questions.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingQ ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Question Text</Label>
              <Textarea
                placeholder="Enter the question..."
                value={qForm.text}
                onChange={(e) =>
                  setQForm((f) => ({ ...f, text: e.target.value }))
                }
                className="resize-none"
                rows={3}
                data-ocid="questions.text_input"
              />
            </div>

            <div className="space-y-2">
              <Label>Answer Options</Label>
              <RadioGroup
                value={qForm.correctIndex}
                onValueChange={(v) =>
                  setQForm((f) => ({ ...f, correctIndex: v }))
                }
                data-ocid="questions.correct_answer_radio"
              >
                {(["0", "1", "2", "3"] as const).map((idx) => {
                  const label = optionLabels[Number(idx)];
                  const fieldKey = `option${idx}` as keyof typeof qForm;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <RadioGroupItem
                        value={idx}
                        id={`opt-${idx}`}
                        className="shrink-0"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-semibold text-muted-foreground w-5 shrink-0">
                          {label}.
                        </span>
                        <Input
                          placeholder={`Option ${label}`}
                          value={qForm[fieldKey] as string}
                          onChange={(e) =>
                            setQForm((f) => ({
                              ...f,
                              [fieldKey]: e.target.value,
                            }))
                          }
                          data-ocid={`questions.option_${idx}_input`}
                        />
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Select the radio button next to the correct answer
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Explanation (optional)</Label>
              <Textarea
                placeholder="Explain why the correct answer is right..."
                value={qForm.explanation}
                onChange={(e) =>
                  setQForm((f) => ({ ...f, explanation: e.target.value }))
                }
                className="resize-none"
                rows={2}
                data-ocid="questions.explanation_input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="questions.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveQuestion.mutate()}
              disabled={
                !qForm.text ||
                !qForm.option0 ||
                !qForm.option1 ||
                !qForm.option2 ||
                !qForm.option3 ||
                saveQuestion.isPending
              }
              data-ocid="questions.submit_button"
            >
              {saveQuestion.isPending
                ? "Saving..."
                : editingQ
                  ? "Save Question"
                  : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Results View ──────────────────────────────────────────────────────────────

function ResultsView({
  test,
  onBack,
}: {
  test: MockTest;
  onBack: () => void;
}) {
  const { actor, isFetching } = useBackend();
  const [reviewTarget, setReviewTarget] = useState<TestResult | null>(null);
  const [activeTab, setActiveTab] = useState("results");

  const { data: leaderboard = [], isLoading: loadingLB } = useQuery({
    queryKey: ["leaderboard", String(test.id)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTestLeaderboard(test.id);
    },
    enabled: !!actor && !isFetching,
  });

  if (reviewTarget) {
    return (
      <AnswerReview
        test={test}
        result={reviewTarget}
        onBack={() => setReviewTarget(null)}
      />
    );
  }

  return (
    <div className="space-y-6" data-ocid="results.page">
      <div>
        <Breadcrumbs
          items={[
            { label: "Mock Tests" },
            { label: test.title },
            { label: "Results" },
          ]}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-2"
            onClick={onBack}
            aria-label="Back to tests"
            data-ocid="results.back_button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {test.title} — Results
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Submissions · Leaderboard · Pass: {String(test.passingScore)}%
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        data-ocid="results.tabs"
      >
        <TabsList>
          <TabsTrigger value="results" data-ocid="results.results_tab">
            Submissions
          </TabsTrigger>
          <TabsTrigger value="leaderboard" data-ocid="results.leaderboard_tab">
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <SubmissionsTable
            leaderboard={leaderboard}
            isLoading={loadingLB}
            onReview={(r) => setReviewTarget(r)}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTable leaderboard={leaderboard} isLoading={loadingLB} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubmissionsTable({
  leaderboard,
  isLoading,
  onReview,
}: {
  leaderboard: TestResult[];
  isLoading: boolean;
  onReview: (r: TestResult) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  if (leaderboard.length === 0) {
    return (
      <Card className="py-12" data-ocid="results.empty_state">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">No submissions yet</p>
          <p className="text-sm text-muted-foreground">
            Results will appear here once students take the test
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Percentage
            </TableHead>
            <TableHead className="hidden md:table-cell text-right">
              Time Taken
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((r, i) => (
            <TableRow
              key={`${r.userId.toString()}-${i}`}
              data-ocid={`results.item.${i + 1}`}
            >
              <TableCell className="font-mono text-xs truncate max-w-[120px]">
                {r.userId.toString().slice(0, 12)}…
              </TableCell>
              <TableCell className="text-right font-semibold">
                {String(r.score)}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                {String(r.percentage)}%
              </TableCell>
              <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                {String(r.timeTaken)}s
              </TableCell>
              <TableCell>
                {r.passed ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Passed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onReview(r)}
                  data-ocid={`results.review_button.${i + 1}`}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function LeaderboardTable({
  leaderboard,
  isLoading,
}: {
  leaderboard: TestResult[];
  isLoading: boolean;
}) {
  const sorted = [...leaderboard].sort(
    (a, b) => Number(b.percentage) - Number(a.percentage),
  );

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return (
      <span className="text-xs font-bold text-muted-foreground w-4 text-center">
        {rank}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card className="py-12" data-ocid="leaderboard.empty_state">
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">No entries yet</p>
          <p className="text-sm text-muted-foreground">
            Leaderboard will populate after first submissions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Percentage
            </TableHead>
            <TableHead className="text-right hidden md:table-cell">
              Time
            </TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r, i) => (
            <TableRow
              key={`lb-${r.userId.toString()}-${i}`}
              data-ocid={`leaderboard.item.${i + 1}`}
              className={i < 3 ? "bg-accent/5" : ""}
            >
              <TableCell>
                <div className="flex items-center justify-center">
                  {rankIcon(i + 1)}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[120px]">
                {r.userId.toString().slice(0, 12)}…
              </TableCell>
              <TableCell className="text-right font-semibold">
                {String(r.score)}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell font-semibold text-primary">
                {String(r.percentage)}%
              </TableCell>
              <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                {String(r.timeTaken)}s
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {r.passed ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-xs">
                    Passed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Failed
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─── Answer Review ──────────────────────────────────────────────────────────────

function AnswerReview({
  test,
  result,
  onBack,
}: {
  test: MockTest;
  result: TestResult;
  onBack: () => void;
}) {
  const { actor, isFetching } = useBackend();

  // We'll re-fetch questions to display options
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions", String(test.id)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listQuestions(test.id);
    },
    enabled: !!actor && !isFetching,
  });

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6" data-ocid="review.page">
      <div>
        <Breadcrumbs
          items={[
            { label: "Mock Tests" },
            { label: test.title },
            { label: "Answer Review" },
          ]}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-2"
            onClick={onBack}
            aria-label="Back to results"
            data-ocid="review.back_button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Answer Review
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Score: {String(result.score)} · {String(result.percentage)}% ·{" "}
              {result.passed ? "Passed ✅" : "Failed ❌"}
            </p>
          </div>
        </div>
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {(
          [
            { label: "Score", value: String(result.score), icon: Target },
            {
              label: "Percentage",
              value: `${String(result.percentage)}%`,
              icon: Zap,
            },
            {
              label: "Time Taken",
              value: `${String(result.timeTaken)}s`,
              icon: Timer,
            },
            {
              label: "Status",
              value: result.passed ? "Passed" : "Failed",
              icon: result.passed ? CheckCircle2 : XCircle,
            },
          ] as const
        ).map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center py-3 gap-1 text-center">
              <Icon
                className={`h-5 w-5 ${result.passed ? "text-primary" : "text-destructive"}`}
              />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Question breakdown */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={String(q.id)} data-ocid={`review.item.${i + 1}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  <CardTitle className="text-sm font-medium leading-relaxed">
                    {q.text}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const isCorrect = BigInt(oi) === q.correctIndex;
                    return (
                      <div
                        key={`rev-q${String(q.id)}-opt${oi}`}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                          isCorrect
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span className="font-semibold shrink-0 w-4">
                          {optionLabels[oi]}.
                        </span>
                        <span className="truncate flex-1">{opt}</span>
                        {isCorrect && (
                          <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    💡 {q.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
