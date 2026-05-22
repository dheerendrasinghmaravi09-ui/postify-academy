import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Image as ImageIcon,
  Megaphone,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { ContentFile, Course, HomepageContent } from "../types";
import { FileType } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content",
  component: ContentPage,
});

// ─── helpers ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES: FileType[] = [FileType.PDF, FileType.EPUB];
const MEDIA_TYPES: FileType[] = [FileType.Image, FileType.Banner];

function isImageType(type: FileType) {
  return type === FileType.Image || type === FileType.Banner;
}

function fileTypeIcon(type: FileType) {
  if (type === FileType.EPUB)
    return <BookOpen className="h-5 w-5 text-primary" />;
  if (isImageType(type)) return <ImageIcon className="h-5 w-5 text-accent" />;
  return <FileText className="h-5 w-5 text-primary" />;
}

function fileTypeBadgeColor(
  type: FileType,
): "default" | "secondary" | "outline" {
  if (type === FileType.Banner) return "default";
  if (type === FileType.EPUB) return "secondary";
  return "outline";
}

// ─── upload dialog ────────────────────────────────────────────────────────────

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType?: FileType;
  onSuccess: () => void;
}

function UploadDialog({
  open,
  onClose,
  defaultType,
  onSuccess,
}: UploadDialogProps) {
  const { actor } = useBackend();
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState<FileType>(
    defaultType ?? FileType.PDF,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMedia = isImageType(fileType);

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      let blob: ExternalBlob;
      if (selectedFile) {
        const bytes = new Uint8Array(await selectedFile.arrayBuffer());
        blob = ExternalBlob.fromBytes(bytes).withUploadProgress(setProgress);
      } else {
        blob = ExternalBlob.fromURL("");
      }
      return actor.addContentFile({
        id: BigInt(0),
        title: title || name,
        name: selectedFile?.name ?? name,
        description: description || undefined,
        author: author || undefined,
        fileType,
        fileBlob: blob,
        isPublished: false,
        uploadedAt: BigInt(Date.now() * 1_000_000),
      });
    },
    onSuccess: () => {
      toast.success(`${isMedia ? "Image" : "Document"} uploaded`);
      handleClose();
      onSuccess();
    },
    onError: () => toast.error("Upload failed"),
  });

  function handleClose() {
    setTitle("");
    setName("");
    setAuthor("");
    setDescription("");
    setSelectedFile(null);
    setProgress(0);
    setIsDragging(false);
    setFileType(defaultType ?? FileType.PDF);
    onClose();
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    setTitle((t) => t || file.name.replace(/\.[^.]+$/, ""));
    setName((n) => n || file.name);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDropZoneKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  const canSubmit = (title || name) && !uploadMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg" data-ocid="content.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isMedia ? "Upload Image / Banner" : "Upload eBook / PDF"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* File drop zone */}
          <button
            type="button"
            className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={handleDropZoneKeyDown}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            data-ocid="content.dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept={isMedia ? "image/*" : ".pdf,.epub"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
              data-ocid="content.upload_button"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-1.5">
                {isMedia ? (
                  <ImageIcon className="h-8 w-8 text-accent" />
                ) : (
                  <FileText className="h-8 w-8 text-primary" />
                )}
                <p className="text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
                {uploadMut.isPending && progress > 0 && (
                  <div className="mt-2 w-48 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Drop file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isMedia ? "JPG, PNG, WebP, SVG" : "PDF or EPUB"}
                </p>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="upload-title">Title *</Label>
              <Input
                id="upload-title"
                placeholder="e.g. Study Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-ocid="content.title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-type">File Type</Label>
              <Select
                value={fileType}
                onValueChange={(v) => setFileType(v as FileType)}
              >
                <SelectTrigger
                  id="upload-type"
                  data-ocid="content.file_type_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FileType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isMedia && (
            <div className="space-y-1.5">
              <Label htmlFor="upload-author">Author (optional)</Label>
              <Input
                id="upload-author"
                placeholder="Author name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                data-ocid="content.author_input"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="upload-desc">Description (optional)</Label>
            <Textarea
              id="upload-desc"
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              data-ocid="content.description_input"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-ocid="content.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => uploadMut.mutate()}
            disabled={!canSubmit}
            data-ocid="content.submit_button"
          >
            {uploadMut.isPending
              ? progress > 0
                ? `Uploading ${progress}%…`
                : "Uploading…"
              : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── document card ────────────────────────────────────────────────────────────

interface DocCardProps {
  file: ContentFile;
  index: number;
  onToggle: (id: bigint, published: boolean) => void;
  onDelete: (id: bigint) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

function DocCard({
  file,
  index,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: DocCardProps) {
  const previewUrl = file.fileBlob.getDirectURL();
  return (
    <Card
      className="group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      data-ocid={`content.item.${index}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {fileTypeIcon(file.fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="font-medium text-sm text-foreground line-clamp-1">
                {file.title}
              </h3>
              <Badge
                variant={fileTypeBadgeColor(file.fileType)}
                className="text-xs shrink-0"
              >
                {file.fileType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {file.name}
            </p>
            {file.author && (
              <p className="text-xs text-muted-foreground">by {file.author}</p>
            )}
            {file.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {file.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {format(
                new Date(Number(file.uploadedAt) / 1_000_000),
                "dd MMM yyyy",
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <Badge
            variant={file.isPublished ? "default" : "secondary"}
            className="text-xs"
          >
            {file.isPublished ? "Published" : "Draft"}
          </Badge>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onToggle(file.id, !file.isPublished)}
              disabled={isToggling}
              aria-label={file.isPublished ? "Unpublish" : "Publish"}
              data-ocid={`content.toggle.${index}`}
            >
              {file.isPublished ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
            {previewUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Preview file"
                asChild
              >
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid={`content.preview_link.${index}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(file.id)}
              disabled={isDeleting}
              aria-label="Delete"
              data-ocid={`content.delete_button.${index}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── banner card ─────────────────────────────────────────────────────────────

interface BannerCardProps {
  file: ContentFile;
  index: number;
  onToggle: (id: bigint, published: boolean) => void;
  onDelete: (id: bigint) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

function BannerCard({
  file,
  index,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: BannerCardProps) {
  const url = file.fileBlob.getDirectURL();
  return (
    <Card
      className="group overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      data-ocid={`content.banner.${index}`}
    >
      <div className="relative aspect-video bg-muted/30 overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={file.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Badge
            variant={file.isPublished ? "default" : "secondary"}
            className="text-xs"
          >
            {file.isPublished ? "Active" : "Inactive"}
          </Badge>
          <Badge
            variant={fileTypeBadgeColor(file.fileType)}
            className="text-xs"
          >
            {file.fileType}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {file.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(
                new Date(Number(file.uploadedAt) / 1_000_000),
                "dd MMM yyyy",
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onToggle(file.id, !file.isPublished)}
              disabled={isToggling}
              aria-label={file.isPublished ? "Deactivate" : "Activate"}
              data-ocid={`content.banner_toggle.${index}`}
            >
              {file.isPublished ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(file.id)}
              disabled={isDeleting}
              aria-label="Delete banner"
              data-ocid={`content.banner_delete.${index}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── homepage settings ────────────────────────────────────────────────────────

interface HomepageSettingsProps {
  homepage: HomepageContent | null | undefined;
  courses: Course[];
  banners: ContentFile[];
  onSave: (content: HomepageContent) => void;
  isSaving: boolean;
}

function HomepageSettings({
  homepage,
  courses,
  banners,
  onSave,
  isSaving,
}: HomepageSettingsProps) {
  const [featuredIds, setFeaturedIds] = useState<bigint[]>(
    homepage?.featuredCourseIds ?? [],
  );
  const [bannerIds, setBannerIds] = useState<bigint[]>(
    homepage?.bannerIds ?? [],
  );
  const [announcements, setAnnouncements] = useState<string[]>(
    homepage?.announcements ?? [],
  );
  const [newAnnouncement, setNewAnnouncement] = useState("");

  function toggleFeatured(id: bigint) {
    setFeaturedIds((prev) =>
      prev.some((x) => x === id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleBanner(id: bigint) {
    setBannerIds((prev) =>
      prev.some((x) => x === id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addAnnouncement() {
    const text = newAnnouncement.trim();
    if (!text) return;
    setAnnouncements((prev) => [...prev, text]);
    setNewAnnouncement("");
  }

  function removeAnnouncement(idx: number) {
    setAnnouncements((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-5">
      {/* Featured Courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            Featured Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No courses available
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {courses.map((course, i) => {
                const checkId = `featured-course-${String(course.id)}`;
                return (
                  <div
                    key={String(course.id)}
                    className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 hover:bg-muted/30 transition-colors"
                    data-ocid={`content.featured_course.${i + 1}`}
                  >
                    <Checkbox
                      id={checkId}
                      checked={featuredIds.some((x) => x === course.id)}
                      onCheckedChange={() => toggleFeatured(course.id)}
                      data-ocid={`content.featured_checkbox.${i + 1}`}
                    />
                    <Label
                      htmlFor={checkId}
                      className="text-sm text-foreground line-clamp-1 cursor-pointer flex-1"
                    >
                      {course.title}
                    </Label>
                    {course.isPublished && (
                      <Badge variant="default" className="text-xs shrink-0">
                        Live
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Banners */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            Active Banners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No banners uploaded yet
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {banners.map((b, i) => {
                const checkId = `active-banner-${String(b.id)}`;
                return (
                  <div
                    key={String(b.id)}
                    className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 hover:bg-muted/30 transition-colors"
                    data-ocid={`content.active_banner.${i + 1}`}
                  >
                    <Checkbox
                      id={checkId}
                      checked={bannerIds.some((x) => x === b.id)}
                      onCheckedChange={() => toggleBanner(b.id)}
                      data-ocid={`content.banner_checkbox.${i + 1}`}
                    />
                    <Label
                      htmlFor={checkId}
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                    >
                      {b.fileBlob.getDirectURL() && (
                        <img
                          src={b.fileBlob.getDirectURL()}
                          alt={b.title}
                          className="h-6 w-10 rounded object-cover shrink-0"
                        />
                      )}
                      <span className="text-sm text-foreground truncate">
                        {b.title}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-accent" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              id="new-announcement"
              placeholder="Add announcement text…"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAnnouncement()}
              className="flex-1"
              data-ocid="content.announcement_input"
            />
            <Button
              variant="outline"
              onClick={addAnnouncement}
              disabled={!newAnnouncement.trim()}
              aria-label="Add announcement"
              data-ocid="content.add_announcement_button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {announcements.length > 0 ? (
            <ul className="space-y-1.5">
              {announcements.map((a, i) => (
                <li
                  key={`announcement-${a.slice(0, 20)}-${i}`}
                  className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm"
                  data-ocid={`content.announcement.${i + 1}`}
                >
                  <span className="flex-1 text-foreground">{a}</span>
                  <button
                    type="button"
                    onClick={() => removeAnnouncement(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove announcement"
                    data-ocid={`content.remove_announcement.${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="text-sm text-muted-foreground"
              data-ocid="content.announcements.empty_state"
            >
              No announcements added
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            onSave({
              featuredCourseIds: featuredIds,
              bannerIds,
              announcements,
            })
          }
          disabled={isSaving}
          data-ocid="content.save_homepage_button"
        >
          {isSaving ? "Saving…" : "Save Homepage Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── loading skeletons ────────────────────────────────────────────────────────

function DocGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4].map((n) => (
        <Skeleton key={n} className="h-36 rounded-lg" />
      ))}
    </div>
  );
}

function BannerGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="aspect-video rounded-lg" />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

function ContentPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [tab, setTab] = useState("docs");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDefaultType, setUploadDefaultType] = useState<FileType>(
    FileType.PDF,
  );

  const enabled = !!actor && !isFetching;

  const { data: allFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["content-files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listContentFiles();
    },
    enabled,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled,
  });

  const { data: homepage } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHomepageContent();
    },
    enabled,
  });

  const docFiles = allFiles.filter((f) => DOCUMENT_TYPES.includes(f.fileType));
  const mediaFiles = allFiles.filter((f) => MEDIA_TYPES.includes(f.fileType));

  const togglePublish = useMutation({
    mutationFn: async ({
      id,
      published,
    }: { id: bigint; published: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setContentFilePublished(id, published);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-files"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteFile = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteContentFile(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-files"] });
      toast.success("File deleted");
    },
    onError: () => toast.error("Failed to delete file"),
  });

  const saveHomepage = useMutation({
    mutationFn: async (content: HomepageContent) => {
      if (!actor) throw new Error("Not connected");
      return actor.setHomepageContent(content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage-content"] });
      toast.success("Homepage settings saved");
    },
    onError: () => toast.error("Failed to save homepage settings"),
  });

  function openUpload(type: FileType) {
    setUploadDefaultType(type);
    setUploadOpen(true);
  }

  return (
    <Layout>
      <div className="space-y-6" data-ocid="content.page">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: "Content" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Content Manager
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage eBooks, PDFs, banners, images, and homepage configuration
              </p>
            </div>
            <Button
              onClick={() =>
                openUpload(tab === "banners" ? FileType.Banner : FileType.PDF)
              }
              className="gap-2 shrink-0"
              data-ocid="content.add_button"
            >
              <Plus className="h-4 w-4" />
              Upload Content
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-10">
            <TabsTrigger
              value="docs"
              className="gap-1.5"
              data-ocid="content.docs.tab"
            >
              <BookOpen className="h-3.5 w-3.5" />
              eBooks &amp; PDFs
              {docFiles.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {docFiles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="banners"
              className="gap-1.5"
              data-ocid="content.banners.tab"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Banners &amp; Images
              {mediaFiles.length > 0 && (
                <span className="ml-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                  {mediaFiles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="homepage"
              className="gap-1.5"
              data-ocid="content.homepage.tab"
            >
              <Globe className="h-3.5 w-3.5" />
              Homepage
            </TabsTrigger>
          </TabsList>

          {/* eBooks & PDFs */}
          <TabsContent value="docs" className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {docFiles.length} document
                {docFiles.length !== 1 ? "s" : ""} uploaded
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => openUpload(FileType.PDF)}
                data-ocid="content.upload_doc_button"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Document
              </Button>
            </div>
            {filesLoading ? (
              <DocGridSkeleton />
            ) : docFiles.length === 0 ? (
              <Card className="py-16" data-ocid="content.docs.empty_state">
                <CardContent className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      No documents yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload PDFs or eBooks to make them available in the app
                    </p>
                  </div>
                  <Button
                    className="mt-2 gap-2"
                    onClick={() => openUpload(FileType.PDF)}
                    data-ocid="content.docs_cta_button"
                  >
                    <Upload className="h-4 w-4" />
                    Upload First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {docFiles.map((file, i) => (
                  <DocCard
                    key={String(file.id)}
                    file={file}
                    index={i + 1}
                    onToggle={(id, pub) =>
                      togglePublish.mutate({ id, published: pub })
                    }
                    onDelete={(id) => deleteFile.mutate(id)}
                    isToggling={togglePublish.isPending}
                    isDeleting={deleteFile.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Banners & Images */}
          <TabsContent value="banners" className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {mediaFiles.length} image
                {mediaFiles.length !== 1 ? "s" : ""} uploaded
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => openUpload(FileType.Banner)}
                data-ocid="content.upload_banner_button"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Image
              </Button>
            </div>
            {filesLoading ? (
              <BannerGridSkeleton />
            ) : mediaFiles.length === 0 ? (
              <Card className="py-16" data-ocid="content.banners.empty_state">
                <CardContent className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <ImageIcon className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      No banners or images yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload banners and promotional images for your app
                      homepage
                    </p>
                  </div>
                  <Button
                    className="mt-2 gap-2"
                    onClick={() => openUpload(FileType.Banner)}
                    data-ocid="content.banners_cta_button"
                  >
                    <Upload className="h-4 w-4" />
                    Upload First Banner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mediaFiles.map((file, i) => (
                  <BannerCard
                    key={String(file.id)}
                    file={file}
                    index={i + 1}
                    onToggle={(id, pub) =>
                      togglePublish.mutate({ id, published: pub })
                    }
                    onDelete={(id) => deleteFile.mutate(id)}
                    isToggling={togglePublish.isPending}
                    isDeleting={deleteFile.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Homepage Settings */}
          <TabsContent value="homepage" className="mt-4">
            <HomepageSettings
              homepage={homepage}
              courses={courses}
              banners={mediaFiles}
              onSave={(content) => saveHomepage.mutate(content)}
              isSaving={saveHomepage.isPending}
            />
          </TabsContent>
        </Tabs>

        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          defaultType={uploadDefaultType}
          onSuccess={() =>
            qc.invalidateQueries({ queryKey: ["content-files"] })
          }
        />
      </div>
    </Layout>
  );
}
