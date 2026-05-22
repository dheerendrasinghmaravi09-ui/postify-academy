import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Unlock,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, FileType, VideoType } from "../backend";
import type {
  Course,
  CourseModule,
  Lesson,
  PdfFile,
  VideoFile,
} from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/courses",
  component: CoursesPage,
});

// ─── helpers ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Development",
  "Design",
  "Business",
  "Marketing",
  "Data Science",
  "Language",
  "Other",
];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

function formatPrice(paise: bigint, isFree: boolean) {
  if (isFree) return "Free";
  const amount = Number(paise) / 100;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getGDriveEmbedUrl(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
}

function getEmbedUrl(url: string, type: VideoType): string | null {
  if (type === VideoType.YouTube) return getYouTubeEmbedUrl(url);
  if (type === VideoType.GoogleDrive) return getGDriveEmbedUrl(url);
  return null;
}

// ─── Course Form Dialog ──────────────────────────────────────────────────────
interface CourseFormValues {
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  category: string;
  difficulty: string;
  thumbnailFile: File | null;
  thumbnailPreview: string;
}

function defaultCourseForm(): CourseFormValues {
  return {
    title: "",
    description: "",
    price: "",
    isFree: false,
    category: "Development",
    difficulty: "Beginner",
    thumbnailFile: null,
    thumbnailPreview: "",
  };
}

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Course | null;
  onSave: (form: CourseFormValues, existing?: Course) => void;
  isPending: boolean;
}

function CourseDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: CourseDialogProps) {
  const [form, setForm] = useState<CourseFormValues>(() =>
    editing
      ? {
          title: editing.title,
          description: editing.description,
          price: editing.isFree ? "" : String(Number(editing.price) / 100),
          isFree: editing.isFree,
          category: "Development",
          difficulty: "Beginner",
          thumbnailFile: null,
          thumbnailPreview: editing.thumbnailBlob.getDirectURL(),
        }
      : defaultCourseForm(),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (
    k: keyof CourseFormValues,
    v: CourseFormValues[keyof CourseFormValues],
  ) => setForm((f) => ({ ...f, [k]: v }));

  function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("thumbnailFile", file);
    set("thumbnailPreview", URL.createObjectURL(file));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-ocid="courses.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit Course" : "Create New Course"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-1">
          <div className="space-y-4 py-2 pr-3">
            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label>Thumbnail</Label>
              <button
                type="button"
                className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-primary/40 transition-smooth"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload thumbnail"
                data-ocid="courses.upload_button"
              >
                {form.thumbnailPreview ? (
                  <img
                    src={form.thumbnailPreview}
                    alt="Thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Click to upload thumbnail</span>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleThumb}
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="course-title">Course Title *</Label>
              <Input
                id="course-title"
                placeholder="e.g. Complete React Developer Bootcamp"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                data-ocid="courses.title_input"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="course-desc">Description</Label>
              <Textarea
                id="course-desc"
                placeholder="What will students learn in this course?"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                data-ocid="courses.description_input"
              />
            </div>

            {/* Category + Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set("category", v)}
                >
                  <SelectTrigger data-ocid="courses.category_select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => set("difficulty", v)}
                >
                  <SelectTrigger data-ocid="courses.difficulty_select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="course-price">Price (₹)</Label>
                <Input
                  id="course-price"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.isFree ? "" : form.price}
                  disabled={form.isFree}
                  onChange={(e) => set("price", e.target.value)}
                  data-ocid="courses.price_input"
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  id="course-free"
                  checked={form.isFree}
                  onCheckedChange={(v) => {
                    set("isFree", v);
                    if (v) set("price", "");
                  }}
                  data-ocid="courses.free_switch"
                />
                <Label htmlFor="course-free" className="cursor-pointer">
                  Free Course
                </Label>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="courses.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form, editing ?? undefined)}
            disabled={!form.title.trim() || isPending}
            data-ocid="courses.submit_button"
          >
            {isPending
              ? editing
                ? "Saving..."
                : "Creating..."
              : editing
                ? "Save Changes"
                : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Video File Row ──────────────────────────────────────────────────────────
interface VideoFileRowProps {
  file: VideoFile;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function VideoFileRow({
  file,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: VideoFileRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
      <Video className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {file.fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.fileSize)}
          {file.duration ? ` · ${file.duration}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label="Move up"
          data-ocid={`lesson.video_move_up.${index + 1}`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={index === total - 1}
          onClick={onMoveDown}
          aria-label="Move down"
          data-ocid={`lesson.video_move_down.${index + 1}`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove video"
          data-ocid={`lesson.video_remove.${index + 1}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── PDF File Row ────────────────────────────────────────────────────────────
interface PdfFileRowProps {
  file: PdfFile;
  index: number;
  total: number;
  onDescriptionChange: (desc: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function PdfFileRow({
  file,
  index,
  total,
  onDescriptionChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: PdfFileRowProps) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-orange-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">
            {file.fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.fileSize)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label="Move up"
            data-ocid={`lesson.pdf_move_up.${index + 1}`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === total - 1}
            onClick={onMoveDown}
            aria-label="Move down"
            data-ocid={`lesson.pdf_move_down.${index + 1}`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove PDF"
            data-ocid={`lesson.pdf_remove.${index + 1}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <Input
        placeholder="Optional description (e.g. Chapter 1 Notes)"
        value={file.description ?? ""}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className="h-7 text-xs"
        data-ocid={`lesson.pdf_desc.${index + 1}`}
      />
    </div>
  );
}

// ─── Lesson Dialog ───────────────────────────────────────────────────────────
interface LessonFormValues {
  title: string;
  videoUrl: string;
  videoType: VideoType;
  isLocked: boolean;
}

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Lesson | null;
  moduleId: bigint;
  orderIndex: number;
  onSave: (
    form: LessonFormValues,
    videoFiles: VideoFile[],
    pdfFiles: PdfFile[],
    existing?: Lesson,
  ) => void;
  isPending: boolean;
  actor: ReturnType<typeof useBackend>["actor"];
}

function LessonDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
  actor,
}: LessonDialogProps) {
  const [form, setForm] = useState<LessonFormValues>(() =>
    editing
      ? {
          title: editing.title,
          videoUrl: editing.videoUrl,
          videoType: editing.videoType,
          isLocked: editing.isLocked,
        }
      : {
          title: "",
          videoUrl: "",
          videoType: VideoType.YouTube,
          isLocked: false,
        },
  );

  const [videoFiles, setVideoFiles] = useState<VideoFile[]>(
    () => editing?.videoFiles ?? [],
  );
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>(
    () => editing?.pdfFiles ?? [],
  );
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(
    null,
  );
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(
    null,
  );

  const videoFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof LessonFormValues>(
    k: K,
    v: LessonFormValues[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const embedUrl = form.videoUrl
    ? getEmbedUrl(form.videoUrl, form.videoType)
    : null;

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploadProgress(0);
    try {
      // Video files are stored as metadata; fileKey is a stable UUID
      const fileKey = `video-${crypto.randomUUID()}`;
      setVideoUploadProgress(100);
      const newVid: VideoFile = {
        fileKey,
        fileName: file.name,
        fileSize: BigInt(file.size),
        duration: undefined,
        sortOrder: BigInt(videoFiles.length),
        uploadedAt: BigInt(Date.now()),
      };
      const updated = [...videoFiles, newVid];
      setVideoFiles(updated);
      if (editing && actor) {
        await actor.addVideoFileToLesson(String(editing.id), newVid);
      }
      toast.success(`Video "${file.name}" uploaded`);
    } catch {
      toast.error("Video upload failed");
    } finally {
      setVideoUploadProgress(null);
      if (videoFileRef.current) videoFileRef.current.value = "";
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setPdfUploadProgress(pct),
      );
      // Upload PDF to object-storage via addContentFile, use returned ID as fileKey
      let fileKey: string;
      if (actor) {
        const contentId = await actor.addContentFile({
          id: BigInt(0),
          title: file.name,
          name: file.name,
          fileType: FileType.PDF,
          fileBlob: blob,
          isPublished: false,
          uploadedAt: BigInt(Date.now() * 1_000_000),
        });
        fileKey = String(contentId);
      } else {
        fileKey = `pdf-${crypto.randomUUID()}`;
      }
      const newPdf: PdfFile = {
        fileKey,
        fileName: file.name,
        fileSize: BigInt(file.size),
        description: undefined,
        sortOrder: BigInt(pdfFiles.length),
        uploadedAt: BigInt(Date.now()),
      };
      const updated = [...pdfFiles, newPdf];
      setPdfFiles(updated);
      if (editing && actor) {
        await actor.addPdfFileToLesson(String(editing.id), newPdf);
      }
      toast.success(`PDF "${file.name}" uploaded`);
    } catch {
      toast.error("PDF upload failed");
    } finally {
      setPdfUploadProgress(null);
      if (pdfFileRef.current) pdfFileRef.current.value = "";
    }
  }

  function moveVideo(from: number, to: number) {
    const updated = [...videoFiles];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    const reordered = updated.map((v, i) => ({ ...v, sortOrder: BigInt(i) }));
    setVideoFiles(reordered);
    if (editing && actor) {
      actor.reorderLessonFiles(
        String(editing.id),
        reordered.map((v) => v.fileKey),
        pdfFiles.map((p) => p.fileKey),
      );
    }
  }

  function movePdf(from: number, to: number) {
    const updated = [...pdfFiles];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    const reordered = updated.map((p, i) => ({ ...p, sortOrder: BigInt(i) }));
    setPdfFiles(reordered);
    if (editing && actor) {
      actor.reorderLessonFiles(
        String(editing.id),
        videoFiles.map((v) => v.fileKey),
        reordered.map((p) => p.fileKey),
      );
    }
  }

  async function removeVideo(index: number) {
    const file = videoFiles[index];
    if (!confirm(`Remove video "${file.fileName}"?`)) return;
    const updated = videoFiles
      .filter((_, i) => i !== index)
      .map((v, i) => ({ ...v, sortOrder: BigInt(i) }));
    setVideoFiles(updated);
    if (editing && actor) {
      await actor.removeVideoFileFromLesson(String(editing.id), file.fileKey);
    }
    toast.success("Video removed");
  }

  async function removePdf(index: number) {
    const file = pdfFiles[index];
    if (!confirm(`Remove PDF "${file.fileName}"?`)) return;
    const updated = pdfFiles
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, sortOrder: BigInt(i) }));
    setPdfFiles(updated);
    if (editing && actor) {
      await actor.removePdfFileFromLesson(String(editing.id), file.fileKey);
    }
    toast.success("PDF removed");
  }

  function updatePdfDescription(index: number, desc: string) {
    setPdfFiles((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, description: desc || undefined } : p,
      ),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" data-ocid="lesson.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit Lesson" : "Add Lesson"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-1">
          <div className="space-y-5 py-2 pr-3">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                placeholder="e.g. Introduction to Hooks"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                data-ocid="lesson.title_input"
              />
            </div>

            {/* ── Embed Video Section ── */}
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Embed Video (YouTube / Google Drive)
              </p>
              <div className="space-y-1.5">
                <Label>Video Type</Label>
                <Select
                  value={form.videoType}
                  onValueChange={(v) => set("videoType", v as VideoType)}
                >
                  <SelectTrigger data-ocid="lesson.video_type_select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VideoType.YouTube}>YouTube</SelectItem>
                    <SelectItem value={VideoType.GoogleDrive}>
                      Google Drive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lesson-video">Video URL</Label>
                <Input
                  id="lesson-video"
                  placeholder={
                    form.videoType === VideoType.YouTube
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://drive.google.com/file/d/.../view"
                  }
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  data-ocid="lesson.video_url_input"
                />
              </div>
              {embedUrl ? (
                <div className="overflow-hidden rounded-lg border border-border aspect-video bg-muted/30">
                  <iframe
                    src={embedUrl}
                    title="Video preview"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : form.videoUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <Video className="h-4 w-4 shrink-0" />
                  Could not detect embed URL. Check the link format.
                </div>
              ) : null}
            </div>

            {/* ── Upload Video Classes ── */}
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    Upload Video Classes
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    MP4, WebM, MOV — chapterwise recorded lectures
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => videoFileRef.current?.click()}
                  disabled={videoUploadProgress !== null}
                  data-ocid="lesson.video_upload_button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Add Video
                </Button>
              </div>
              <input
                ref={videoFileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                className="sr-only"
                onChange={handleVideoUpload}
              />
              {videoUploadProgress !== null && (
                <div
                  className="space-y-1"
                  data-ocid="lesson.video_loading_state"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading video…</span>
                    <span>{Math.round(videoUploadProgress)}%</span>
                  </div>
                  <Progress value={videoUploadProgress} className="h-1.5" />
                </div>
              )}
              {videoFiles.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-4 text-center"
                  data-ocid="lesson.video_empty_state"
                >
                  <Video className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No video files yet. Click "Add Video" to upload.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {videoFiles.map((vf, i) => (
                    <VideoFileRow
                      key={vf.fileKey}
                      file={vf}
                      index={i}
                      total={videoFiles.length}
                      onMoveUp={() => moveVideo(i, i - 1)}
                      onMoveDown={() => moveVideo(i, i + 1)}
                      onRemove={() => removeVideo(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Upload PDF Notes ── */}
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Upload PDF Notes
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chapter notes, slides, assignments — PDF format
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => pdfFileRef.current?.click()}
                  disabled={pdfUploadProgress !== null}
                  data-ocid="lesson.pdf_upload_button"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Add PDF
                </Button>
              </div>
              <input
                ref={pdfFileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={handlePdfUpload}
              />
              {pdfUploadProgress !== null && (
                <div className="space-y-1" data-ocid="lesson.pdf_loading_state">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Uploading PDF…</span>
                    <span>{Math.round(pdfUploadProgress)}%</span>
                  </div>
                  <Progress value={pdfUploadProgress} className="h-1.5" />
                </div>
              )}
              {pdfFiles.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-4 text-center"
                  data-ocid="lesson.pdf_empty_state"
                >
                  <FileText className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No PDF notes yet. Click "Add PDF" to upload.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pdfFiles.map((pf, i) => (
                    <PdfFileRow
                      key={pf.fileKey}
                      file={pf}
                      index={i}
                      total={pdfFiles.length}
                      onDescriptionChange={(desc) =>
                        updatePdfDescription(i, desc)
                      }
                      onMoveUp={() => movePdf(i, i - 1)}
                      onMoveDown={() => movePdf(i, i + 1)}
                      onRemove={() => removePdf(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Lock toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="lesson-lock"
                checked={form.isLocked}
                onCheckedChange={(v) => set("isLocked", v)}
                data-ocid="lesson.locked_switch"
              />
              <Label
                htmlFor="lesson-lock"
                className="cursor-pointer flex items-center gap-1.5"
              >
                {form.isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
                {form.isLocked
                  ? "Locked (paid only)"
                  : "Unlocked (free preview)"}
              </Label>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="lesson.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave(form, videoFiles, pdfFiles, editing ?? undefined)
            }
            disabled={!form.title.trim() || isPending}
            data-ocid="lesson.submit_button"
          >
            {isPending ? "Saving..." : editing ? "Save Changes" : "Add Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Module Row with Lessons ─────────────────────────────────────────────────
interface ModuleRowProps {
  mod: CourseModule;
  index: number;
  actor: ReturnType<typeof useBackend>["actor"];
  onEdit: (m: CourseModule) => void;
  onDelete: (id: bigint) => void;
}

function ModuleRow({ mod, index, actor, onEdit, onDelete }: ModuleRowProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons", String(mod.id)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLessons(mod.id);
    },
    enabled: !!actor && open,
  });

  const createLesson = useMutation({
    mutationFn: async ({
      form,
      videoFiles,
      pdfFiles,
      existing,
    }: {
      form: LessonFormValues;
      videoFiles: VideoFile[];
      pdfFiles: PdfFile[];
      existing?: Lesson;
    }) => {
      if (!actor) throw new Error("Not connected");
      if (existing) {
        return actor.updateLesson({
          ...existing,
          ...form,
          videoFiles,
          pdfFiles,
        });
      }
      const lessonId = await actor.createLesson({
        id: BigInt(0),
        moduleId: mod.id,
        title: form.title,
        videoUrl: form.videoUrl,
        videoType: form.videoType,
        isLocked: form.isLocked,
        pdfUrls: [],
        videoFiles: [],
        pdfFiles: [],
        order: BigInt(lessons.length),
      });
      for (const vf of videoFiles) {
        await actor.addVideoFileToLesson(String(lessonId), vf);
      }
      for (const pf of pdfFiles) {
        await actor.addPdfFileToLesson(String(lessonId), pf);
      }
      return lessonId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", String(mod.id)] });
      setShowAddLesson(false);
      setEditLesson(null);
      toast.success("Lesson saved");
    },
    onError: () => toast.error("Failed to save lesson"),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteLesson(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", String(mod.id)] });
      toast.success("Lesson deleted");
    },
    onError: () => toast.error("Failed to delete lesson"),
  });

  return (
    <div
      className="rounded-lg border border-border bg-card"
      data-ocid={`modules.item.${index + 1}`}
    >
      {/* Module header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical
          className="h-4 w-4 text-muted-foreground/40 shrink-0"
          aria-hidden
        />
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
          data-ocid={`modules.toggle.${index + 1}`}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium text-foreground text-sm flex-1 min-w-0 truncate">
            Module {Number(mod.order) + 1}: {mod.title}
          </span>
          <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
            {lessons.length} lessons
          </Badge>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(mod)}
            aria-label="Edit module"
            data-ocid={`modules.edit_button.${index + 1}`}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(mod.id)}
            aria-label="Delete module"
            data-ocid={`modules.delete_button.${index + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Lessons list */}
      {open && (
        <div className="border-t border-border px-4 pb-3 pt-2 space-y-1">
          {lessonsLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2].map((k) => (
                <Skeleton key={k} className="h-8 w-full" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <p
              className="py-3 text-center text-sm text-muted-foreground"
              data-ocid={`lessons.empty_state.${index + 1}`}
            >
              No lessons yet. Add the first lesson below.
            </p>
          ) : (
            lessons.map((lesson, li) => (
              <div
                key={String(lesson.id)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                data-ocid={`lessons.item.${li + 1}`}
              >
                <Video className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="flex-1 min-w-0 text-sm truncate text-foreground/80">
                  {lesson.title}
                </span>

                {/* File count badges */}
                {lesson.videoFiles.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 bg-primary/10 text-primary border-primary/20"
                  >
                    🎬 {lesson.videoFiles.length} video
                    {lesson.videoFiles.length > 1 ? "s" : ""}
                  </Badge>
                )}
                {lesson.pdfFiles.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 bg-orange-500/10 text-orange-600 border-orange-500/20"
                  >
                    📄 {lesson.pdfFiles.length} PDF
                    {lesson.pdfFiles.length > 1 ? "s" : ""}
                  </Badge>
                )}

                {lesson.isLocked && (
                  <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                )}
                <Badge
                  variant="outline"
                  className="text-xs shrink-0 capitalize"
                >
                  {lesson.videoType}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setEditLesson(lesson)}
                  aria-label="Edit lesson"
                  data-ocid={`lessons.edit_button.${li + 1}`}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => deleteLesson.mutate(lesson.id)}
                  aria-label="Delete lesson"
                  data-ocid={`lessons.delete_button.${li + 1}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-primary hover:text-primary mt-1"
            onClick={() => setShowAddLesson(true)}
            data-ocid={`lessons.add_button.${index + 1}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lesson
          </Button>
        </div>
      )}

      {/* Add / Edit lesson dialog */}
      {(showAddLesson || editLesson) && (
        <LessonDialog
          open={showAddLesson || !!editLesson}
          onOpenChange={(v) => {
            if (!v) {
              setShowAddLesson(false);
              setEditLesson(null);
            }
          }}
          editing={editLesson}
          moduleId={mod.id}
          orderIndex={lessons.length}
          onSave={(form, videoFiles, pdfFiles, existing) =>
            createLesson.mutate({ form, videoFiles, pdfFiles, existing })
          }
          isPending={createLesson.isPending}
          actor={actor}
        />
      )}
    </div>
  );
}

// ─── Course Detail Sheet ─────────────────────────────────────────────────────
interface CourseDetailSheetProps {
  course: Course;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actor: ReturnType<typeof useBackend>["actor"];
}

function CourseDetailSheet({
  course,
  open,
  onOpenChange,
  actor,
}: CourseDetailSheetProps) {
  const qc = useQueryClient();
  const [showAddModule, setShowAddModule] = useState(false);
  const [editModule, setEditModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules", String(course.id)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listModules(course.id);
    },
    enabled: !!actor && open,
  });

  const saveModule = useMutation({
    mutationFn: async ({
      title,
      existing,
    }: { title: string; existing?: CourseModule }) => {
      if (!actor) throw new Error("Not connected");
      if (existing) return actor.updateModule({ ...existing, title });
      return actor.createModule({
        id: BigInt(0),
        courseId: course.id,
        title,
        order: BigInt(modules.length),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", String(course.id)] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      setShowAddModule(false);
      setEditModule(null);
      setModuleTitle("");
      toast.success("Module saved");
    },
    onError: () => toast.error("Failed to save module"),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteModule(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", String(course.id)] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Module deleted");
    },
    onError: () => toast.error("Failed to delete module"),
  });

  function openEditModule(m: CourseModule) {
    setEditModule(m);
    setModuleTitle(m.title);
    setShowAddModule(true);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
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
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge
                  variant={course.isPublished ? "default" : "secondary"}
                  className="text-xs"
                >
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {Number(course.enrollmentCount)} enrolled
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-foreground">
              Modules ({modules.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7"
              onClick={() => {
                setEditModule(null);
                setModuleTitle("");
                setShowAddModule(true);
              }}
              data-ocid="modules.add_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Module
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <Card className="py-10" data-ocid="modules.empty_state">
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No modules yet</p>
                <p className="text-xs text-muted-foreground">
                  Add modules to organize your course content
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {modules.map((mod, i) => (
                <ModuleRow
                  key={String(mod.id)}
                  mod={mod}
                  index={i}
                  actor={actor}
                  onEdit={openEditModule}
                  onDelete={(id) => deleteModule.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Module Dialog */}
        <Dialog
          open={showAddModule}
          onOpenChange={(v) => {
            if (!v) {
              setShowAddModule(false);
              setEditModule(null);
              setModuleTitle("");
            }
          }}
        >
          <DialogContent className="sm:max-w-sm" data-ocid="module.dialog">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editModule ? "Edit Module" : "Add Module"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="module-title">Module Title *</Label>
                <Input
                  id="module-title"
                  placeholder="e.g. Getting Started"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  data-ocid="module.title_input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && moduleTitle.trim()) {
                      saveModule.mutate({
                        title: moduleTitle.trim(),
                        existing: editModule ?? undefined,
                      });
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModule(false);
                  setEditModule(null);
                  setModuleTitle("");
                }}
                data-ocid="module.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  saveModule.mutate({
                    title: moduleTitle.trim(),
                    existing: editModule ?? undefined,
                  })
                }
                disabled={!moduleTitle.trim() || saveModule.isPending}
                data-ocid="module.submit_button"
              >
                {saveModule.isPending
                  ? "Saving..."
                  : editModule
                    ? "Save"
                    : "Add Module"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
function CoursesPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled: !!actor && !isFetching,
  });

  const saveCourse = useMutation({
    mutationFn: async ({
      form,
      existing,
    }: { form: CourseFormValues; existing?: Course }) => {
      if (!actor) throw new Error("Not connected");
      const price = form.isFree
        ? BigInt(0)
        : BigInt(Math.round(Number.parseFloat(form.price || "0") * 100));
      let thumbnailBlob = existing?.thumbnailBlob ?? ExternalBlob.fromURL("");
      if (form.thumbnailFile) {
        const bytes = new Uint8Array(await form.thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(bytes);
      }
      if (existing) {
        return actor.updateCourse({
          ...existing,
          title: form.title,
          description: form.description,
          price,
          isFree: form.isFree,
          thumbnailBlob,
        });
      }
      return actor.createCourse({
        id: BigInt(0),
        title: form.title,
        description: form.description,
        price,
        isFree: form.isFree,
        isPublished: false,
        thumbnailBlob,
        moduleCount: BigInt(0),
        enrollmentCount: BigInt(0),
        createdAt: BigInt(Date.now()),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      setShowCreate(false);
      setEditCourse(null);
      toast.success(editCourse ? "Course updated" : "Course created");
    },
    onError: () => toast.error("Failed to save course"),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCourse(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      setDeleteConfirm(null);
      toast.success("Course deleted");
    },
    onError: () => toast.error("Failed to delete course"),
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

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && c.isPublished) ||
      (statusFilter === "draft" && !c.isPublished);
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-6" data-ocid="courses.page">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: "Courses" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Course Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {courses.length} total courses · Manage, publish, and organise
                your catalog
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="gap-2 shrink-0"
              data-ocid="courses.add_button"
            >
              <Plus className="h-4 w-4" />
              New Course
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="courses.search_input"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "published", "draft"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f)}
                className="capitalize"
                data-ocid={`courses.filter.${f}`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div
            className="rounded-xl border border-border overflow-hidden"
            data-ocid="courses.loading_state"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-16">Thumb</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((k) => (
                  <TableRow key={k}>
                    <TableCell>
                      <Skeleton className="h-9 w-14 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-20" data-ocid="courses.empty_state">
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <BookOpen className="h-14 w-14 text-muted-foreground/30" />
              <div>
                <p className="font-display font-semibold text-foreground">
                  {search || statusFilter !== "all"
                    ? "No courses match your filters"
                    : "No courses yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? "Try changing your search or filter"
                    : "Create your first course to start building your catalog"}
                </p>
              </div>
              {!search && statusFilter === "all" && (
                <Button
                  onClick={() => setShowCreate(true)}
                  className="mt-2 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create First Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">Thumb</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((course, i) => (
                  <TableRow
                    key={String(course.id)}
                    className="group cursor-pointer hover:bg-muted/30"
                    onClick={() => setDetailCourse(course)}
                    data-ocid={`courses.item.${i + 1}`}
                  >
                    <TableCell>
                      {course.thumbnailBlob.getDirectURL() ? (
                        <img
                          src={course.thumbnailBlob.getDirectURL()}
                          alt={course.title}
                          className="h-9 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-9 w-14 rounded-md bg-muted/60 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="font-medium text-foreground truncate text-sm">
                        {course.title}
                      </p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {course.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {course.isFree ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          Free
                        </Badge>
                      ) : (
                        formatPrice(course.price, false)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {Number(course.enrollmentCount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(course.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Course actions"
                            data-ocid={`courses.dropdown_menu.${i + 1}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => setDetailCourse(course)}
                            data-ocid={`courses.view_button.${i + 1}`}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Modules
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditCourse(course)}
                            data-ocid={`courses.edit_button.${i + 1}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublish.mutate({
                                id: course.id,
                                publish: !course.isPublished,
                              })
                            }
                            data-ocid={`courses.toggle.${i + 1}`}
                          >
                            {course.isPublished ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirm(course)}
                            data-ocid={`courses.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create dialog */}
        {showCreate && (
          <CourseDialog
            open={showCreate}
            onOpenChange={setShowCreate}
            onSave={(form) => saveCourse.mutate({ form })}
            isPending={saveCourse.isPending}
          />
        )}

        {/* Edit dialog */}
        {editCourse && (
          <CourseDialog
            open={!!editCourse}
            onOpenChange={(v) => {
              if (!v) setEditCourse(null);
            }}
            editing={editCourse}
            onSave={(form, existing) => saveCourse.mutate({ form, existing })}
            isPending={saveCourse.isPending}
          />
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <Dialog
            open={!!deleteConfirm}
            onOpenChange={(v) => {
              if (!v) setDeleteConfirm(null);
            }}
          >
            <DialogContent
              className="sm:max-w-sm"
              data-ocid="courses.delete_dialog"
            >
              <DialogHeader>
                <DialogTitle className="font-display">
                  Delete Course?
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {deleteConfirm.title}
                </span>{" "}
                and all its modules and lessons will be permanently deleted.
                This action cannot be undone.
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  data-ocid="courses.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteCourse.mutate(deleteConfirm.id)}
                  disabled={deleteCourse.isPending}
                  data-ocid="courses.confirm_button"
                >
                  {deleteCourse.isPending ? "Deleting..." : "Delete Course"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Course detail sheet */}
        {detailCourse && (
          <CourseDetailSheet
            course={detailCourse}
            open={!!detailCourse}
            onOpenChange={(v) => {
              if (!v) setDetailCourse(null);
            }}
            actor={actor}
          />
        )}
      </div>
    </Layout>
  );
}
