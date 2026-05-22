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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Link, createRoute } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  Megaphone,
  MoreVertical,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Star,
  Trash2,
  Type,
  Unlock,
  Upload,
  Users,
  Video,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { FileType, VideoType } from "../backend";
import type {
  AppBranding,
  ContentFile,
  Course,
  CourseModule,
  HomepageContent,
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
  path: "/connected-app-dashboard",
  component: ConnectedAppDashboardPage,
});

// ─── helpers ────────────────────────────────────────────────────────────────

function formatPrice(paise: bigint, isFree: boolean) {
  if (isFree) return "Free";
  return `₹${(Number(paise) / 100).toLocaleString("en-IN")}`;
}

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isValidHex(hex: string) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex);
}

function contrastColor(hex: string) {
  if (!isValidHex(hex)) return "#ffffff";
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "#1a1a2e" : "#ffffff";
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

const DEFAULT_BRANDING: AppBranding = {
  appName: "Postify Academy",
  tagline: "Learn, Grow, Succeed",
  primaryColor: "#4F46E5",
  accentColor: "#F97316",
  logoUrl: undefined,
  updatedAt: BigInt(0),
};

// ─── Tab 1: App Overview ──────────────────────────────────────────────────────

interface ColorSwatchProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  ocid: string;
}

function ColorSwatch({ label, value, onChange, id, ocid }: ColorSwatchProps) {
  const [raw, setRaw] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRaw(value), [value]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="relative h-9 w-12 rounded-md border-2 border-border overflow-hidden shrink-0 hover:border-primary/40 transition-colors"
          style={{ backgroundColor: isValidHex(raw) ? raw : "#ccc" }}
          aria-label={`Pick ${label}`}
          data-ocid={`${ocid}_swatch`}
        >
          <input
            ref={pickerRef}
            type="color"
            value={isValidHex(raw) ? raw : "#cccccc"}
            onChange={(e) => {
              setRaw(e.target.value);
              onChange(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
          />
        </button>
        <Input
          id={id}
          value={raw}
          maxLength={7}
          onChange={(e) => {
            setRaw(e.target.value);
            if (isValidHex(e.target.value)) onChange(e.target.value);
          }}
          placeholder="#4F46E5"
          className="font-mono text-sm"
          data-ocid={ocid}
        />
      </div>
    </div>
  );
}

interface AppOverviewTabProps {
  branding: AppBranding;
  publishedCount: number;
  draftCount: number;
  totalEnrollments: number;
  totalFiles: number;
  onSaveBranding: (b: AppBranding) => void;
  isSaving: boolean;
}

function AppOverviewTab({
  branding,
  publishedCount,
  draftCount,
  totalEnrollments,
  totalFiles,
  onSaveBranding,
  isSaving,
}: AppOverviewTabProps) {
  const { actor } = useBackend();
  const [form, setForm] = useState<AppBranding>(branding);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    branding.logoUrl ?? null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setForm(branding);
    setLogoPreview(branding.logoUrl ?? null);
    setIsDirty(false);
  }, [branding]);

  function update<K extends keyof AppBranding>(k: K, v: AppBranding[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setIsDirty(true);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      let final = { ...form, updatedAt: BigInt(Date.now() * 1_000_000) };
      if (logoFile) {
        const bytes = new Uint8Array(await logoFile.arrayBuffer());
        const blob =
          ExternalBlob.fromBytes(bytes).withUploadProgress(setUploadProgress);
        const id = await actor.addContentFile({
          id: BigInt(0),
          title: `${form.appName} Logo`,
          name: logoFile.name,
          fileType: FileType.Image,
          fileBlob: blob,
          isPublished: true,
          uploadedAt: BigInt(Date.now() * 1_000_000),
        });
        const uploaded = await actor.getContentFile(id);
        if (uploaded)
          final = { ...final, logoUrl: uploaded.fileBlob.getDirectURL() };
        setUploadProgress(0);
      }
      await actor.setAppBranding(final);
      return final;
    },
    onSuccess: (saved) => {
      setForm(saved);
      if (saved.logoUrl) setLogoPreview(saved.logoUrl);
      setLogoFile(null);
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["app-branding"] });
      onSaveBranding(saved);
      toast.success("App branding saved!");
    },
    onError: () => {
      setUploadProgress(0);
      toast.error("Failed to save branding");
    },
  });

  const primary = isValidHex(form.primaryColor) ? form.primaryColor : "#4F46E5";
  const accent = isValidHex(form.accentColor) ? form.accentColor : "#F97316";

  return (
    <div className="space-y-6" data-ocid="cad.overview_tab">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Published",
            value: publishedCount,
            icon: <Eye className="h-4 w-4" />,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
          },
          {
            label: "Draft",
            value: draftCount,
            icon: <EyeOff className="h-4 w-4" />,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
          },
          {
            label: "Enrollments",
            value: totalEnrollments.toLocaleString("en-IN"),
            icon: <Users className="h-4 w-4" />,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "Content Files",
            value: totalFiles,
            icon: <FileText className="h-4 w-4" />,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-950/30",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-display text-xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branding editor + preview split */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {/* Identity */}
          <Card data-ocid="cad.branding_identity">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                App Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>App Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl border-2 border-dashed border-border bg-muted/20 overflow-hidden flex items-center justify-center shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      ref={logoRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setLogoFile(f);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (typeof ev.target?.result === "string")
                            setLogoPreview(ev.target.result);
                        };
                        reader.readAsDataURL(f);
                        setIsDirty(true);
                      }}
                      data-ocid="cad.logo_file_input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => logoRef.current?.click()}
                      data-ocid="cad.logo_upload_button"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP · max 2 MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cad-appname">App Name</Label>
                  <Input
                    id="cad-appname"
                    value={form.appName}
                    onChange={(e) => update("appName", e.target.value)}
                    placeholder="Postify Academy"
                    data-ocid="cad.app_name_input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cad-tagline">Tagline</Label>
                <Textarea
                  id="cad-tagline"
                  value={form.tagline}
                  maxLength={250}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Learn, Grow, Succeed — Your EdTech Journey Starts Here"
                  rows={2}
                  data-ocid="cad.tagline_input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card data-ocid="cad.branding_colors">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-5 sm:grid-cols-2">
                <ColorSwatch
                  label="Primary Color"
                  value={form.primaryColor}
                  onChange={(v) => update("primaryColor", v)}
                  id="cad-primary"
                  ocid="cad.primary_color_input"
                />
                <ColorSwatch
                  label="Accent Color"
                  value={form.accentColor}
                  onChange={(v) => update("accentColor", v)}
                  id="cad-accent"
                  ocid="cad.accent_color_input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex items-center justify-between">
            {isDirty && (
              <span
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-700"
                data-ocid="cad.unsaved_indicator"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm(branding);
                  setLogoFile(null);
                  setLogoPreview(branding.logoUrl ?? null);
                  setIsDirty(false);
                }}
                disabled={!isDirty || isSaving || saveMut.isPending}
                data-ocid="cad.branding_reset_button"
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
                data-ocid="cad.branding_save_button"
              >
                {saveMut.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    {uploadProgress > 0
                      ? `Uploading ${uploadProgress}%…`
                      : "Saving…"}
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Branding
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="hidden lg:block">
          <Card className="sticky top-20">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Student App Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 flex justify-center">
              <div
                className="relative w-[180px] rounded-[1.75rem] border-[5px] border-border shadow-xl overflow-hidden bg-background"
                style={{ minHeight: 360 }}
              >
                {/* Status bar notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-border rounded-b-full z-10" />
                {/* App bar */}
                <div
                  className="flex items-center justify-between px-3 pt-5 pb-2.5"
                  style={{ backgroundColor: primary }}
                >
                  <div className="flex items-center gap-1.5">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold"
                        style={{
                          backgroundColor: accent,
                          color: contrastColor(accent),
                        }}
                      >
                        {(form.appName || "P").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="font-display font-bold text-[10px] truncate max-w-[90px]"
                      style={{ color: contrastColor(primary) }}
                    >
                      {form.appName || "App Name"}
                    </span>
                  </div>
                </div>
                {/* Hero */}
                <div
                  className="px-3 pt-3 pb-2"
                  style={{
                    background: `linear-gradient(135deg, ${primary}22 0%, ${accent}18 100%)`,
                  }}
                >
                  <p
                    className="font-display font-bold text-[11px] leading-tight"
                    style={{ color: primary }}
                  >
                    {form.appName || "App Name"}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">
                    {form.tagline || "Your tagline"}
                  </p>
                </div>
                {/* Mock card */}
                <div className="px-3 py-2">
                  <div className="rounded-lg border border-border bg-card p-2 space-y-1.5">
                    <div
                      className="w-full h-1 rounded-full"
                      style={{ backgroundColor: `${primary}30` }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: "62%", backgroundColor: primary }}
                      />
                    </div>
                    <p className="text-[9px] font-medium text-foreground truncate">
                      Advanced Mathematics
                    </p>
                    <p className="text-[8px] text-muted-foreground">
                      62% complete
                    </p>
                  </div>
                </div>
                {/* CTA */}
                <div className="px-3 pb-3">
                  <button
                    type="button"
                    className="w-full rounded-lg py-2 text-[10px] font-bold"
                    style={{
                      backgroundColor: accent,
                      color: contrastColor(accent),
                    }}
                  >
                    Explore Courses
                  </button>
                </div>
                {/* Bottom nav */}
                <div className="flex items-center justify-around border-t border-border px-3 py-1.5 bg-card">
                  {["🏠", "📚", "📊", "👤"].map((icon) => (
                    <span key={icon} className="text-[11px]">
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Banners & Homepage ────────────────────────────────────────────────

interface BannersTabProps {
  allFiles: ContentFile[];
  courses: Course[];
  homepage: HomepageContent | null | undefined;
  filesLoading: boolean;
  onToggle: (id: bigint, pub: boolean) => void;
  onDelete: (id: bigint) => void;
  onSaveHomepage: (c: HomepageContent) => void;
  isSavingHomepage: boolean;
  onUploadBanner: () => void;
}

function BannersTab({
  allFiles,
  courses,
  homepage,
  filesLoading,
  onToggle,
  onDelete,
  onSaveHomepage,
  isSavingHomepage,
  onUploadBanner,
}: BannersTabProps) {
  const banners = allFiles.filter(
    (f) => f.fileType === FileType.Banner || f.fileType === FileType.Image,
  );
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

  useEffect(() => {
    if (homepage) {
      setFeaturedIds(homepage.featuredCourseIds);
      setBannerIds(homepage.bannerIds);
      setAnnouncements(homepage.announcements);
    }
  }, [homepage]);

  return (
    <div className="space-y-6" data-ocid="cad.banners_tab">
      {/* Banners Grid */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Homepage Banners
              <Badge variant="secondary" className="text-xs">
                {banners.length}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7"
              onClick={onUploadBanner}
              data-ocid="cad.upload_banner_button"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="cad.banners.empty_state"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <ImageIcon className="h-7 w-7 text-accent" />
              </div>
              <p className="font-semibold text-foreground">No banners yet</p>
              <p className="text-sm text-muted-foreground">
                Upload banners that students see on the app homepage
              </p>
              <Button
                className="mt-1 gap-2"
                onClick={onUploadBanner}
                data-ocid="cad.upload_banner_cta_button"
              >
                <Upload className="h-4 w-4" />
                Upload First Banner
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {banners.map((file, i) => {
                const url = file.fileBlob.getDirectURL();
                return (
                  <Card
                    key={String(file.id)}
                    className="overflow-hidden group"
                    data-ocid={`cad.banner.item.${i + 1}`}
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
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant={file.isPublished ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {file.isPublished ? "Active" : "Inactive"}
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
                            {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onToggle(file.id, !file.isPublished)}
                            aria-label={
                              file.isPublished ? "Deactivate" : "Activate"
                            }
                            data-ocid={`cad.banner_toggle.${i + 1}`}
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
                            aria-label="Delete banner"
                            data-ocid={`cad.banner_delete.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured Courses */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            Featured Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No courses available yet
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {courses.map((course, i) => (
                <div
                  key={String(course.id)}
                  className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 hover:bg-muted/30 transition-colors"
                  data-ocid={`cad.featured_course.${i + 1}`}
                >
                  <Checkbox
                    id={`feat-${String(course.id)}`}
                    checked={featuredIds.some((x) => x === course.id)}
                    onCheckedChange={() =>
                      setFeaturedIds((prev) =>
                        prev.some((x) => x === course.id)
                          ? prev.filter((x) => x !== course.id)
                          : [...prev, course.id],
                      )
                    }
                    data-ocid={`cad.featured_checkbox.${i + 1}`}
                  />
                  <Label
                    htmlFor={`feat-${String(course.id)}`}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-accent" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add announcement text…"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAnnouncement.trim()) {
                  setAnnouncements((prev) => [...prev, newAnnouncement.trim()]);
                  setNewAnnouncement("");
                }
              }}
              className="flex-1"
              data-ocid="cad.announcement_input"
            />
            <Button
              variant="outline"
              onClick={() => {
                const t = newAnnouncement.trim();
                if (!t) return;
                setAnnouncements((prev) => [...prev, t]);
                setNewAnnouncement("");
              }}
              disabled={!newAnnouncement.trim()}
              data-ocid="cad.add_announcement_button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {announcements.length > 0 ? (
            <ul className="space-y-1.5">
              {announcements.map((a, i) => (
                <li
                  key={`ann-${a.slice(0, 20)}-${i}`}
                  className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm"
                  data-ocid={`cad.announcement.${i + 1}`}
                >
                  <span className="flex-1 text-foreground">{a}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAnnouncements((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove announcement"
                    data-ocid={`cad.remove_announcement.${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="text-sm text-muted-foreground"
              data-ocid="cad.announcements.empty_state"
            >
              No announcements added
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            onSaveHomepage({
              featuredCourseIds: featuredIds,
              bannerIds,
              announcements,
            })
          }
          disabled={isSavingHomepage}
          data-ocid="cad.save_homepage_button"
        >
          {isSavingHomepage ? "Saving…" : "Save Homepage Settings"}
        </Button>
      </div>
    </div>
  );
}

// ─── Tab 3: Courses Manager ───────────────────────────────────────────────────

interface CourseFormState {
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  thumbnailFile: File | null;
  thumbnailPreview: string;
}

function defaultCourseForm(): CourseFormState {
  return {
    title: "",
    description: "",
    price: "",
    isFree: false,
    thumbnailFile: null,
    thumbnailPreview: "",
  };
}

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Course | null;
  onSave: (form: CourseFormState, existing?: Course) => void;
  isPending: boolean;
}

function CourseDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: CourseDialogProps) {
  const [form, setForm] = useState<CourseFormState>(() =>
    editing
      ? {
          title: editing.title,
          description: editing.description,
          price: editing.isFree ? "" : String(Number(editing.price) / 100),
          isFree: editing.isFree,
          thumbnailFile: null,
          thumbnailPreview: editing.thumbnailBlob.getDirectURL(),
        }
      : defaultCourseForm(),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof CourseFormState>(k: K, v: CourseFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-ocid="cad.course_dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit Course" : "Add New Course"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-1">
          <div className="space-y-4 py-2 pr-3">
            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label>Thumbnail</Label>
              <button
                type="button"
                className="relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-primary/40 transition-colors"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload thumbnail"
                data-ocid="cad.course_thumbnail_upload"
              >
                {form.thumbnailPreview ? (
                  <img
                    src={form.thumbnailPreview}
                    alt="Thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-7 w-7" />
                    <span className="text-sm">Click to upload thumbnail</span>
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  set("thumbnailFile", f);
                  set("thumbnailPreview", URL.createObjectURL(f));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Course Title *</Label>
              <Input
                placeholder="e.g. Complete React Developer Bootcamp"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                data-ocid="cad.course_title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What will students learn?"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                data-ocid="cad.course_desc_input"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.isFree ? "" : form.price}
                  disabled={form.isFree}
                  onChange={(e) => set("price", e.target.value)}
                  data-ocid="cad.course_price_input"
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={form.isFree}
                  onCheckedChange={(v) => {
                    set("isFree", v);
                    if (v) set("price", "");
                  }}
                  data-ocid="cad.course_free_switch"
                />
                <Label className="cursor-pointer">Free Course</Label>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="cad.course_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form, editing ?? undefined)}
            disabled={!form.title.trim() || isPending}
            data-ocid="cad.course_submit_button"
          >
            {isPending
              ? editing
                ? "Saving…"
                : "Creating…"
              : editing
                ? "Save Changes"
                : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LessonFormValues {
  title: string;
  videoUrl: string;
  videoType: VideoType;
  isLocked: boolean;
}

interface LessonPanelProps {
  courseId: bigint;
  actor: ReturnType<typeof useBackend>["actor"];
}

function LessonPanel({ courseId, actor }: LessonPanelProps) {
  const qc = useQueryClient();
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [showAddModule, setShowAddModule] = useState(false);
  const [editModuleId, setEditModuleId] = useState<bigint | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonDialogModuleId, setLessonDialogModuleId] = useState<
    bigint | null
  >(null);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormValues>({
    title: "",
    videoUrl: "",
    videoType: VideoType.YouTube,
    isLocked: false,
  });
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(
    null,
  );
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["cad-modules", String(courseId)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listModules(courseId);
    },
    enabled: !!actor,
  });

  const saveMod = useMutation({
    mutationFn: async ({
      title,
      existing,
    }: { title: string; existing?: CourseModule }) => {
      if (!actor) throw new Error("Not connected");
      if (existing) return actor.updateModule({ ...existing, title });
      return actor.createModule({
        id: BigInt(0),
        courseId,
        title,
        order: BigInt(modules.length),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cad-modules", String(courseId)] });
      qc.invalidateQueries({ queryKey: ["cad-courses"] });
      setShowAddModule(false);
      setEditModuleId(null);
      setModuleTitle("");
      toast.success("Module saved");
    },
    onError: () => toast.error("Failed to save module"),
  });

  const delMod = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteModule(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cad-modules", String(courseId)] });
      toast.success("Module deleted");
    },
    onError: () => toast.error("Failed to delete module"),
  });

  const saveLesson = useMutation({
    mutationFn: async ({
      moduleId,
      form,
      vids,
      pdfs,
      existing,
    }: {
      moduleId: bigint;
      form: LessonFormValues;
      vids: VideoFile[];
      pdfs: PdfFile[];
      existing?: Lesson;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { data: currentLessons = [] } = await new Promise<{
        data: Lesson[];
      }>((res) => res({ data: [] }));
      if (existing)
        return actor.updateLesson({
          ...existing,
          ...form,
          videoFiles: vids,
          pdfFiles: pdfs,
        });
      const id = await actor.createLesson({
        id: BigInt(0),
        moduleId,
        title: form.title,
        videoUrl: form.videoUrl,
        videoType: form.videoType,
        isLocked: form.isLocked,
        pdfUrls: [],
        videoFiles: [],
        pdfFiles: [],
        order: BigInt(currentLessons.length),
      });
      for (const vf of vids) await actor.addVideoFileToLesson(String(id), vf);
      for (const pf of pdfs) await actor.addPdfFileToLesson(String(id), pf);
      return id;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["cad-lessons", String(vars.moduleId)],
      });
      setLessonDialogModuleId(null);
      setEditLesson(null);
      setLessonForm({
        title: "",
        videoUrl: "",
        videoType: VideoType.YouTube,
        isLocked: false,
      });
      setVideoFiles([]);
      setPdfFiles([]);
      toast.success("Lesson saved");
    },
    onError: () => toast.error("Failed to save lesson"),
  });

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setPdfUploadProgress(pct),
      );
      let fileKey = `pdf-${crypto.randomUUID()}`;
      if (actor) {
        const id = await actor.addContentFile({
          id: BigInt(0),
          title: file.name,
          name: file.name,
          fileType: FileType.PDF,
          fileBlob: blob,
          isPublished: false,
          uploadedAt: BigInt(Date.now() * 1_000_000),
        });
        fileKey = String(id);
      }
      setPdfFiles((prev) => [
        ...prev,
        {
          fileKey,
          fileName: file.name,
          fileSize: BigInt(file.size),
          description: undefined,
          sortOrder: BigInt(prev.length),
          uploadedAt: BigInt(Date.now()),
        },
      ]);
      toast.success(`PDF "${file.name}" ready`);
    } catch {
      toast.error("PDF upload failed");
    } finally {
      setPdfUploadProgress(null);
      if (pdfFileRef.current) pdfFileRef.current.value = "";
    }
  }

  function openLessonDialog(moduleId: bigint, editing?: Lesson) {
    setLessonDialogModuleId(moduleId);
    if (editing) {
      setEditLesson(editing);
      setLessonForm({
        title: editing.title,
        videoUrl: editing.videoUrl,
        videoType: editing.videoType,
        isLocked: editing.isLocked,
      });
      setVideoFiles(editing.videoFiles);
      setPdfFiles(editing.pdfFiles);
    } else {
      setEditLesson(null);
      setLessonForm({
        title: "",
        videoUrl: "",
        videoType: VideoType.YouTube,
        isLocked: false,
      });
      setVideoFiles([]);
      setPdfFiles([]);
    }
  }

  return (
    <div className="space-y-3 pt-2" data-ocid="cad.lesson_panel">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Modules & Lessons
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs h-7"
          onClick={() => {
            setEditModuleId(null);
            setModuleTitle("");
            setShowAddModule(true);
          }}
          data-ocid="cad.add_module_button"
        >
          <Plus className="h-3 w-3" />
          Add Module
        </Button>
      </div>

      {modulesLoading ? (
        <div className="space-y-2">
          {[1, 2].map((k) => (
            <Skeleton key={k} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div
          className="py-6 text-center text-sm text-muted-foreground"
          data-ocid="cad.modules.empty_state"
        >
          No modules yet. Add modules to organize your course content.
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((mod, i) => {
            const isOpen = openModules.has(String(mod.id));
            return (
              <ModuleLessonRow
                key={String(mod.id)}
                mod={mod}
                index={i}
                isOpen={isOpen}
                onToggle={() =>
                  setOpenModules((prev) => {
                    const next = new Set(prev);
                    isOpen
                      ? next.delete(String(mod.id))
                      : next.add(String(mod.id));
                    return next;
                  })
                }
                actor={actor}
                onEdit={() => {
                  setEditModuleId(mod.id);
                  setModuleTitle(mod.title);
                  setShowAddModule(true);
                }}
                onDelete={() => {
                  if (confirm(`Delete module "${mod.title}"?`))
                    delMod.mutate(mod.id);
                }}
                onAddLesson={() => openLessonDialog(mod.id)}
                onEditLesson={(lesson) => openLessonDialog(mod.id, lesson)}
              />
            );
          })}
        </div>
      )}

      {/* Add/Edit Module Dialog */}
      <Dialog
        open={showAddModule}
        onOpenChange={(v) => {
          if (!v) {
            setShowAddModule(false);
            setEditModuleId(null);
            setModuleTitle("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm" data-ocid="cad.module_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editModuleId ? "Edit Module" : "Add Module"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Module Title *</Label>
              <Input
                placeholder="e.g. Getting Started"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && moduleTitle.trim()) {
                    const existing = editModuleId
                      ? modules.find((m) => m.id === editModuleId)
                      : undefined;
                    saveMod.mutate({ title: moduleTitle.trim(), existing });
                  }
                }}
                data-ocid="cad.module_title_input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModule(false)}
              data-ocid="cad.module_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const existing = editModuleId
                  ? modules.find((m) => m.id === editModuleId)
                  : undefined;
                saveMod.mutate({ title: moduleTitle.trim(), existing });
              }}
              disabled={!moduleTitle.trim() || saveMod.isPending}
              data-ocid="cad.module_submit_button"
            >
              {saveMod.isPending
                ? "Saving…"
                : editModuleId
                  ? "Save"
                  : "Add Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog
        open={lessonDialogModuleId !== null}
        onOpenChange={(v) => {
          if (!v) {
            setLessonDialogModuleId(null);
            setEditLesson(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" data-ocid="cad.lesson_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editLesson ? "Edit Lesson" : "Add Lesson"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-1">
            <div className="space-y-4 py-2 pr-3">
              <div className="space-y-1.5">
                <Label>Lesson Title *</Label>
                <Input
                  placeholder="e.g. Introduction to Hooks"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, title: e.target.value }))
                  }
                  data-ocid="cad.lesson_title_input"
                />
              </div>

              {/* Embed video */}
              <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Embed Video (YouTube / Google Drive)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={lessonForm.videoType}
                      onValueChange={(v) =>
                        setLessonForm((f) => ({
                          ...f,
                          videoType: v as VideoType,
                        }))
                      }
                    >
                      <SelectTrigger data-ocid="cad.lesson_video_type_select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VideoType.YouTube}>
                          YouTube
                        </SelectItem>
                        <SelectItem value={VideoType.GoogleDrive}>
                          Google Drive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label>Video URL</Label>
                    <Input
                      placeholder={
                        lessonForm.videoType === VideoType.YouTube
                          ? "youtube.com/watch?v=..."
                          : "drive.google.com/file/d/..."
                      }
                      value={lessonForm.videoUrl}
                      onChange={(e) =>
                        setLessonForm((f) => ({
                          ...f,
                          videoUrl: e.target.value,
                        }))
                      }
                      data-ocid="cad.lesson_video_url_input"
                    />
                  </div>
                </div>
                {lessonForm.videoUrl &&
                  getEmbedUrl(lessonForm.videoUrl, lessonForm.videoType) && (
                    <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted/30">
                      <iframe
                        src={
                          getEmbedUrl(
                            lessonForm.videoUrl,
                            lessonForm.videoType,
                          ) ?? ""
                        }
                        title="Preview"
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                  )}
              </div>

              {/* PDF Upload */}
              <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      PDF Notes
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Chapter notes, slides, assignments
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => pdfFileRef.current?.click()}
                    disabled={pdfUploadProgress !== null}
                    data-ocid="cad.lesson_pdf_upload_button"
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
                  <div
                    className="space-y-1"
                    data-ocid="cad.lesson_pdf_loading_state"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading PDF…</span>
                      <span>{Math.round(pdfUploadProgress)}%</span>
                    </div>
                    <Progress value={pdfUploadProgress} className="h-1.5" />
                  </div>
                )}
                {pdfFiles.length === 0 ? (
                  <div
                    className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-4 text-center"
                    data-ocid="cad.lesson_pdf.empty_state"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">
                      No PDF notes. Click "Add PDF" to upload.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pdfFiles.map((pf, i) => (
                      <div
                        key={pf.fileKey}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
                      >
                        <FileText className="h-4 w-4 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {pf.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(pf.fileSize)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                          onClick={() =>
                            setPdfFiles((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                          data-ocid={`cad.lesson_pdf_remove.${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lock toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={lessonForm.isLocked}
                  onCheckedChange={(v) =>
                    setLessonForm((f) => ({ ...f, isLocked: v }))
                  }
                  data-ocid="cad.lesson_locked_switch"
                />
                <Label className="cursor-pointer flex items-center gap-1.5">
                  {lessonForm.isLocked ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                  {lessonForm.isLocked
                    ? "Locked (paid only)"
                    : "Unlocked (free preview)"}
                </Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLessonDialogModuleId(null);
                setEditLesson(null);
              }}
              data-ocid="cad.lesson_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!lessonDialogModuleId) return;
                saveLesson.mutate({
                  moduleId: lessonDialogModuleId,
                  form: lessonForm,
                  vids: videoFiles,
                  pdfs: pdfFiles,
                  existing: editLesson ?? undefined,
                });
              }}
              disabled={!lessonForm.title.trim() || saveLesson.isPending}
              data-ocid="cad.lesson_submit_button"
            >
              {saveLesson.isPending
                ? "Saving…"
                : editLesson
                  ? "Save Changes"
                  : "Add Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ModuleLessonRowProps {
  mod: CourseModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  actor: ReturnType<typeof useBackend>["actor"];
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
}

function ModuleLessonRow({
  mod,
  index,
  isOpen,
  onToggle,
  actor,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
}: ModuleLessonRowProps) {
  const qc = useQueryClient();
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["cad-lessons", String(mod.id)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLessons(mod.id);
    },
    enabled: !!actor && isOpen,
  });

  const delLesson = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteLesson(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cad-lessons", String(mod.id)] });
      toast.success("Lesson deleted");
    },
    onError: () => toast.error("Failed to delete lesson"),
  });

  return (
    <div
      className="rounded-lg border border-border bg-card"
      data-ocid={`cad.module.item.${index + 1}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical
          className="h-4 w-4 text-muted-foreground/30 shrink-0"
          aria-hidden
        />
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left min-w-0"
          onClick={onToggle}
          data-ocid={`cad.module_toggle.${index + 1}`}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">
            Module {index + 1}: {mod.title}
          </span>
          <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
            {isOpen ? lessons.length : "?"} lessons
          </Badge>
        </button>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            aria-label="Edit"
            data-ocid={`cad.module_edit.${index + 1}`}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete"
            data-ocid={`cad.module_delete.${index + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isOpen && (
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
              data-ocid={`cad.lessons.empty_state.${index + 1}`}
            >
              No lessons yet. Add the first lesson below.
            </p>
          ) : (
            lessons.map((lesson, li) => (
              <div
                key={String(lesson.id)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                data-ocid={`cad.lesson.item.${li + 1}`}
              >
                <Video className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="flex-1 min-w-0 text-sm truncate text-foreground/80">
                  {lesson.title}
                </span>
                {lesson.videoFiles.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 bg-primary/10 text-primary border-primary/20"
                  >
                    🎬 {lesson.videoFiles.length}
                  </Badge>
                )}
                {lesson.pdfFiles.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 bg-accent/10 text-accent border-accent/20"
                  >
                    📄 {lesson.pdfFiles.length}
                  </Badge>
                )}
                {lesson.isLocked && (
                  <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onEditLesson(lesson)}
                  aria-label="Edit lesson"
                  data-ocid={`cad.lesson_edit.${li + 1}`}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${lesson.title}"?`))
                      delLesson.mutate(lesson.id);
                  }}
                  aria-label="Delete lesson"
                  data-ocid={`cad.lesson_delete.${li + 1}`}
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
            onClick={onAddLesson}
            data-ocid={`cad.add_lesson_button.${index + 1}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lesson
          </Button>
        </div>
      )}
    </div>
  );
}

interface CoursesTabProps {
  courses: Course[];
  isLoading: boolean;
  actor: ReturnType<typeof useBackend>["actor"];
  onPublishToggle: (id: bigint, publish: boolean) => void;
  onDelete: (id: bigint) => void;
  onEdit: (c: Course) => void;
  onAdd: () => void;
  isToggling: boolean;
}

function CoursesTab({
  courses,
  isLoading,
  actor,
  onPublishToggle,
  onDelete,
  onEdit,
  onAdd,
  isToggling,
}: CoursesTabProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  return (
    <div className="space-y-4" data-ocid="cad.courses_tab">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {courses.length} course{courses.length !== 1 ? "s" : ""} total
        </p>
        <Button
          className="gap-1.5"
          onClick={onAdd}
          data-ocid="cad.add_course_button"
        >
          <Plus className="h-4 w-4" />
          Add New Course
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="py-16" data-ocid="cad.courses.empty_state">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold text-foreground">No courses yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first course — students will see it instantly in the
              app
            </p>
            <Button
              className="mt-2 gap-2"
              onClick={onAdd}
              data-ocid="cad.add_first_course_button"
            >
              <Plus className="h-4 w-4" />
              Create First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {courses.map((course, i) => (
            <Card
              key={String(course.id)}
              className="overflow-hidden"
              data-ocid={`cad.course.item.${i + 1}`}
            >
              <div className="flex items-center gap-4 px-4 py-3">
                {course.thumbnailBlob.getDirectURL() ? (
                  <img
                    src={course.thumbnailBlob.getDirectURL()}
                    alt={course.title}
                    className="h-12 w-18 rounded-md object-cover shrink-0 hidden sm:block"
                    style={{ width: "4.5rem" }}
                  />
                ) : (
                  <div
                    className="h-12 w-18 rounded-md bg-muted/60 flex items-center justify-center shrink-0 hidden sm:flex"
                    style={{ width: "4.5rem" }}
                  >
                    <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {course.title}
                    </p>
                    <Badge
                      variant={course.isPublished ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{formatPrice(course.price, course.isFree)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {Number(course.enrollmentCount)} enrolled
                    </span>
                    <span>·</span>
                    <span>{Number(course.moduleCount)} modules</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={course.isPublished}
                    onCheckedChange={(v) => onPublishToggle(course.id, v)}
                    disabled={isToggling}
                    aria-label={course.isPublished ? "Unpublish" : "Publish"}
                    data-ocid={`cad.course_publish_switch.${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(course)}
                    aria-label="Edit course"
                    data-ocid={`cad.course_edit_button.${i + 1}`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setExpandedCourse((prev) =>
                        prev === String(course.id) ? null : String(course.id),
                      )
                    }
                    aria-label="Manage lessons"
                    data-ocid={`cad.course_lessons_toggle.${i + 1}`}
                  >
                    {expandedCourse === String(course.id) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${course.title}"?`))
                        onDelete(course.id);
                    }}
                    aria-label="Delete course"
                    data-ocid={`cad.course_delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {expandedCourse === String(course.id) && (
                <div className="border-t border-border px-4 pb-4 bg-muted/10">
                  <LessonPanel courseId={course.id} actor={actor} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Study Materials ───────────────────────────────────────────────────

interface StudyMaterialsTabProps {
  allFiles: ContentFile[];
  isLoading: boolean;
  onToggle: (id: bigint, pub: boolean) => void;
  onDelete: (id: bigint) => void;
  onUpload: () => void;
}

function StudyMaterialsTab({
  allFiles,
  isLoading,
  onToggle,
  onDelete,
  onUpload,
}: StudyMaterialsTabProps) {
  const [filter, setFilter] = useState<"all" | "pdf" | "ebook" | "other">(
    "all",
  );
  const docs = allFiles.filter((f) =>
    filter === "all"
      ? f.fileType === FileType.PDF || f.fileType === FileType.EPUB
      : filter === "pdf"
        ? f.fileType === FileType.PDF
        : filter === "ebook"
          ? f.fileType === FileType.EPUB
          : false,
  );

  return (
    <div className="space-y-5" data-ocid="cad.materials_tab">
      {/* Upload drop zone */}
      <button
        type="button"
        className="upload-zone w-full"
        onClick={onUpload}
        data-ocid="cad.materials_dropzone"
      >
        <div className="flex flex-col items-center gap-2 py-8">
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            Click to upload study materials
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, eBook (EPUB) · notes, slides, assignments
          </p>
        </div>
      </button>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["all", "pdf", "ebook"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            onClick={() => setFilter(f)}
            data-ocid={`cad.materials_filter.${f}`}
          >
            {f === "all" ? "All" : f === "pdf" ? "PDF" : "eBook"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <Card className="py-16" data-ocid="cad.materials.empty_state">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold text-foreground">
              No study materials yet
            </p>
            <p className="text-sm text-muted-foreground">
              Upload PDFs and eBooks — students can download them from the app
            </p>
            <Button
              className="mt-2 gap-2"
              onClick={onUpload}
              data-ocid="cad.upload_material_cta_button"
            >
              <Upload className="h-4 w-4" />
              Upload First Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((file, i) => {
            const previewUrl = file.fileBlob.getDirectURL();
            return (
              <Card
                key={String(file.id)}
                className="group"
                data-ocid={`cad.material.item.${i + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {file.fileType === FileType.EPUB ? (
                        <BookOpen className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-0.5">
                        <h3 className="font-medium text-sm text-foreground line-clamp-1 flex-1">
                          {file.title}
                        </h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {file.fileType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {file.name}
                      </p>
                      {file.author && (
                        <p className="text-xs text-muted-foreground">
                          by {file.author}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(file.uploadedAt)}
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
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onToggle(file.id, !file.isPublished)}
                        aria-label={file.isPublished ? "Unpublish" : "Publish"}
                        data-ocid={`cad.material_toggle.${i + 1}`}
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
                          asChild
                        >
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-ocid={`cad.material_preview.${i + 1}`}
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
                        aria-label="Delete"
                        data-ocid={`cad.material_delete.${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

interface UploadDialogProps {
  open: boolean;
  defaultType: FileType;
  onClose: () => void;
  onSuccess: () => void;
  actor: ReturnType<typeof useBackend>["actor"];
}

function UploadDialog({
  open,
  defaultType,
  onClose,
  onSuccess,
  actor,
}: UploadDialogProps) {
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState<FileType>(defaultType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setFileType(defaultType), [defaultType]);

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
        title: title || selectedFile?.name || "Untitled",
        name: selectedFile?.name ?? title,
        fileType,
        fileBlob: blob,
        isPublished: false,
        uploadedAt: BigInt(Date.now() * 1_000_000),
      });
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      handleClose();
      onSuccess();
    },
    onError: () => toast.error("Upload failed"),
  });

  function handleClose() {
    setTitle("");
    setSelectedFile(null);
    setProgress(0);
    setIsDragging(false);
    setFileType(defaultType);
    onClose();
  }

  const isBanner = fileType === FileType.Banner || fileType === FileType.Image;
  const accept = isBanner ? "image/*" : ".pdf,.epub";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="cad.upload_dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            Upload {isBanner ? "Image / Banner" : "Study Material"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <button
            type="button"
            className={`relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/30"}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) {
                setSelectedFile(f);
                setTitle((t) => t || f.name.replace(/\.[^.]+$/, ""));
              }
            }}
            data-ocid="cad.upload_dropzone"
          >
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedFile(f);
                setTitle((t) => t || f.name.replace(/\.[^.]+$/, ""));
              }}
              data-ocid="cad.upload_file_input"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-1.5">
                {isBanner ? (
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
                  {isBanner ? "JPG, PNG, WebP" : "PDF or EPUB"}
                </p>
              </>
            )}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Chapter 1 Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-ocid="cad.upload_title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={fileType}
                onValueChange={(v) => setFileType(v as FileType)}
              >
                <SelectTrigger data-ocid="cad.upload_type_select">
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-ocid="cad.upload_cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => uploadMut.mutate()}
            disabled={!title.trim() || uploadMut.isPending}
            data-ocid="cad.upload_submit_button"
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

// ─── Main Page ────────────────────────────────────────────────────────────────

function ConnectedAppDashboardPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const enabled = !!actor && !isFetching;
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<FileType>(FileType.PDF);

  // Data queries
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["cad-courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled,
    refetchInterval: 30000,
  });

  const { data: allFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["cad-content-files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listContentFiles();
    },
    enabled,
  });

  const { data: branding = DEFAULT_BRANDING } = useQuery({
    queryKey: ["app-branding"],
    queryFn: async () => {
      if (!actor) return DEFAULT_BRANDING;
      return actor.getAppBranding();
    },
    enabled,
  });

  const { data: homepage } = useQuery({
    queryKey: ["cad-homepage"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHomepageContent();
    },
    enabled,
  });

  // Mutations
  const publishToggle = useMutation({
    mutationFn: async ({ id, publish }: { id: bigint; publish: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.publishCourse(id, publish);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cad-courses"] });
      toast.success(
        vars.publish
          ? "Course published — visible to students now!"
          : "Course unpublished",
      );
    },
    onError: () => toast.error("Failed to update course status"),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCourse(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cad-courses"] });
      toast.success("Course deleted");
    },
    onError: () => toast.error("Failed to delete course"),
  });

  const saveCourse = useMutation({
    mutationFn: async ({
      form,
      existing,
    }: { form: ReturnType<typeof defaultCourseForm>; existing?: Course }) => {
      if (!actor) throw new Error("Not connected");
      let thumbnailBlob = existing?.thumbnailBlob ?? ExternalBlob.fromURL("");
      if (form.thumbnailFile) {
        const bytes = new Uint8Array(await form.thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(bytes);
      }
      const priceInPaise = form.isFree
        ? BigInt(0)
        : BigInt(Math.round(Number.parseFloat(form.price || "0") * 100));
      if (existing) {
        return actor.updateCourse({
          ...existing,
          title: form.title,
          description: form.description,
          price: priceInPaise,
          isFree: form.isFree,
          thumbnailBlob,
        });
      }
      return actor.createCourse({
        id: BigInt(0),
        title: form.title,
        description: form.description,
        price: priceInPaise,
        isFree: form.isFree,
        thumbnailBlob,
        isPublished: false,
        createdAt: BigInt(Date.now() * 1_000_000),
        moduleCount: BigInt(0),
        enrollmentCount: BigInt(0),
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cad-courses"] });
      setShowCreateCourse(false);
      setEditCourse(null);
      toast.success(
        vars.existing
          ? "Course updated!"
          : "Course created — add modules and lessons now!",
      );
    },
    onError: () => toast.error("Failed to save course"),
  });

  const toggleFile = useMutation({
    mutationFn: async ({
      id,
      published,
    }: { id: bigint; published: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setContentFilePublished(id, published);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cad-content-files"] });
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
      qc.invalidateQueries({ queryKey: ["cad-content-files"] });
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
      qc.invalidateQueries({ queryKey: ["cad-homepage"] });
      toast.success(
        "Homepage settings saved — students will see changes instantly!",
      );
    },
    onError: () => toast.error("Failed to save homepage settings"),
  });

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;
  const totalEnrollments = courses.reduce(
    (acc, c) => acc + Number(c.enrollmentCount),
    0,
  );

  return (
    <Layout>
      <div className="space-y-6 pb-8" data-ocid="cad.page">
        {/* Header */}
        <div>
          <Breadcrumbs
            items={[
              { label: "App Sync", href: "/app-sync" },
              { label: "Content Manager" },
            ]}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Postify Course App
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 ml-0.5">
                Content Manager — edit everything students see in the app
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                data-ocid="cad.sync_status"
              >
                <Wifi className="h-3 w-3" />
                Live — Same Backend
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ["cad-courses"] });
                  qc.invalidateQueries({ queryKey: ["cad-content-files"] });
                  toast.success("Data refreshed");
                }}
                data-ocid="cad.refresh_button"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 gap-0.5">
            <TabsTrigger
              value="overview"
              className="gap-1.5"
              data-ocid="cad.overview.tab"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">App Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="banners"
              className="gap-1.5"
              data-ocid="cad.banners.tab"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Banners & Homepage</span>
              <span className="sm:hidden">Banners</span>
            </TabsTrigger>
            <TabsTrigger
              value="courses"
              className="gap-1.5"
              data-ocid="cad.courses.tab"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Courses Manager</span>
              <span className="sm:hidden">Courses</span>
              {courses.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {courses.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              className="gap-1.5"
              data-ocid="cad.materials.tab"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Study Materials</span>
              <span className="sm:hidden">Materials</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: App Overview */}
          <TabsContent value="overview" className="mt-5">
            <AppOverviewTab
              branding={branding}
              publishedCount={publishedCount}
              draftCount={draftCount}
              totalEnrollments={totalEnrollments}
              totalFiles={allFiles.length}
              onSaveBranding={() => {}}
              isSaving={false}
            />
          </TabsContent>

          {/* Tab 2: Banners & Homepage */}
          <TabsContent value="banners" className="mt-5">
            <BannersTab
              allFiles={allFiles}
              courses={courses}
              homepage={homepage}
              filesLoading={filesLoading}
              onToggle={(id, pub) => toggleFile.mutate({ id, published: pub })}
              onDelete={(id) => {
                if (confirm("Delete this banner?")) deleteFile.mutate(id);
              }}
              onSaveHomepage={(c) => saveHomepage.mutate(c)}
              isSavingHomepage={saveHomepage.isPending}
              onUploadBanner={() => {
                setUploadType(FileType.Banner);
                setShowUpload(true);
              }}
            />
          </TabsContent>

          {/* Tab 3: Courses Manager */}
          <TabsContent value="courses" className="mt-5">
            <CoursesTab
              courses={courses}
              isLoading={coursesLoading}
              actor={actor}
              onPublishToggle={(id, pub) =>
                publishToggle.mutate({ id, publish: pub })
              }
              onDelete={(id) => deleteCourse.mutate(id)}
              onEdit={(c) => setEditCourse(c)}
              onAdd={() => setShowCreateCourse(true)}
              isToggling={publishToggle.isPending}
            />
          </TabsContent>

          {/* Tab 4: Study Materials */}
          <TabsContent value="materials" className="mt-5">
            <StudyMaterialsTab
              allFiles={allFiles}
              isLoading={filesLoading}
              onToggle={(id, pub) => toggleFile.mutate({ id, published: pub })}
              onDelete={(id) => {
                if (confirm("Delete this file?")) deleteFile.mutate(id);
              }}
              onUpload={() => {
                setUploadType(FileType.PDF);
                setShowUpload(true);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Course create/edit dialog */}
        {(showCreateCourse || editCourse) && (
          <CourseDialog
            open={showCreateCourse || !!editCourse}
            onOpenChange={(v) => {
              if (!v) {
                setShowCreateCourse(false);
                setEditCourse(null);
              }
            }}
            editing={editCourse}
            onSave={(form, existing) => saveCourse.mutate({ form, existing })}
            isPending={saveCourse.isPending}
          />
        )}

        {/* Upload dialog */}
        <UploadDialog
          open={showUpload}
          defaultType={uploadType}
          onClose={() => setShowUpload(false)}
          onSuccess={() =>
            qc.invalidateQueries({ queryKey: ["cad-content-files"] })
          }
          actor={actor}
        />
      </div>
    </Layout>
  );
}
