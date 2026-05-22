import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Eye,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Palette,
  RefreshCw,
  Save,
  Smartphone,
  Type,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { AppBranding } from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app-branding",
  component: AppBrandingPage,
});

// ─── defaults ────────────────────────────────────────────────────────────────

const DEFAULT_BRANDING: AppBranding = {
  appName: "Postify Academy",
  tagline: "Learn, Grow, Succeed — Your EdTech Journey Starts Here",
  primaryColor: "#4F46E5",
  accentColor: "#F97316",
  logoUrl: undefined,
  updatedAt: BigInt(0),
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function isValidHex(hex: string) {
  return /^#([0-9A-Fa-f]{6})$/.test(hex);
}

function hexToRgb(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function contrastColor(hex: string) {
  if (!isValidHex(hex)) return "#ffffff";
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
}

// ─── color field ─────────────────────────────────────────────────────────────

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  ocid: string;
}

function ColorField({ label, value, onChange, id, ocid }: ColorFieldProps) {
  const [raw, setRaw] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRaw(value);
  }, [value]);

  function handleTextChange(v: string) {
    setRaw(v);
    if (isValidHex(v)) onChange(v);
  }

  function handlePickerChange(v: string) {
    setRaw(v);
    onChange(v);
  }

  const valid = isValidHex(raw);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {/* Color swatch / picker trigger */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="relative h-10 w-14 rounded-md border-2 border-border overflow-hidden shrink-0 transition-smooth hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: valid ? raw : "#cccccc" }}
          aria-label={`Pick ${label}`}
          data-ocid={`${ocid}_swatch`}
        >
          <input
            ref={pickerRef}
            type="color"
            value={valid ? raw : "#cccccc"}
            onChange={(e) => handlePickerChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
          />
        </button>
        <Input
          id={id}
          value={raw}
          maxLength={7}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="#4F46E5"
          className={`font-mono text-sm flex-1 ${!valid && raw.length > 0 ? "border-destructive focus-visible:ring-destructive" : ""}`}
          data-ocid={ocid}
        />
      </div>
      {valid && (
        <div
          className="color-swatch"
          style={{ backgroundColor: raw }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ─── live preview ─────────────────────────────────────────────────────────────

interface LivePreviewProps {
  branding: AppBranding;
  logoPreview: string | null;
}

function LivePreview({ branding, logoPreview }: LivePreviewProps) {
  const primary = isValidHex(branding.primaryColor)
    ? branding.primaryColor
    : "#4F46E5";
  const accent = isValidHex(branding.accentColor)
    ? branding.accentColor
    : "#F97316";
  const primaryText = contrastColor(primary);
  const accentText = contrastColor(accent);

  return (
    <div
      className="flex flex-col items-center gap-4"
      data-ocid="branding.preview_panel"
    >
      {/* Device frame */}
      <div
        className="relative w-[220px] rounded-[2rem] border-[6px] border-border shadow-2xl overflow-hidden bg-background"
        style={{ minHeight: 420 }}
      >
        {/* Status bar notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-border rounded-b-full z-10" />

        {/* App top bar */}
        <div
          className="flex items-center justify-between px-4 pt-7 pb-3"
          style={{ backgroundColor: primary }}
        >
          <div className="flex items-center gap-2">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="h-7 w-7 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center border border-white/20 font-display font-bold text-xs"
                style={{
                  backgroundColor: `rgba(${hexToRgb(accent)}, 0.85)`,
                  color: accentText,
                }}
              >
                {(branding.appName || "P").charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="font-display font-bold text-xs truncate max-w-[100px]"
              style={{ color: primaryText }}
            >
              {branding.appName || "App Name"}
            </span>
          </div>
          <Smartphone
            className="h-3.5 w-3.5 opacity-70"
            style={{ color: primaryText }}
          />
        </div>

        {/* Banner hero */}
        <div
          className="relative px-4 py-5 flex flex-col gap-2"
          style={{
            background: `linear-gradient(135deg, ${primary}22 0%, ${accent}18 100%)`,
          }}
        >
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="App logo"
              className="h-12 w-12 rounded-2xl object-cover shadow-lg border-2 border-border mb-1"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg shadow-lg mb-1"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              {(branding.appName || "P").charAt(0).toUpperCase()}
            </div>
          )}
          <p
            className="font-display font-bold text-sm leading-tight"
            style={{ color: primary }}
          >
            {branding.appName || "Your App Name"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 max-w-[160px]">
            {branding.tagline || "Your app tagline goes here"}
          </p>
        </div>

        {/* Mock course card */}
        <div className="px-3 pb-2">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2">
            <div
              className="w-full h-1.5 rounded-full"
              style={{ backgroundColor: `${primary}30` }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "62%", backgroundColor: primary }}
              />
            </div>
            <p className="text-[10px] font-medium text-foreground truncate">
              Advanced Mathematics
            </p>
            <p className="text-[9px] text-muted-foreground">
              62% complete · 3h 20m left
            </p>
          </div>
        </div>

        {/* CTA button */}
        <div className="px-3 pb-4 pt-1">
          <button
            type="button"
            className="w-full rounded-xl py-2.5 text-xs font-bold font-display tracking-wide transition-smooth"
            style={{
              backgroundColor: accent,
              color: accentText,
            }}
          >
            Explore Courses
          </button>
        </div>

        {/* Bottom nav bar */}
        <div className="flex items-center justify-around border-t border-border px-4 py-2 bg-card">
          {["🏠", "📚", "📊", "👤"].map((icon, i) => (
            <span
              key={icon}
              className="text-sm"
              style={
                i === 0 ? { filter: `drop-shadow(0 0 4px ${primary})` } : {}
              }
            >
              {icon}
            </span>
          ))}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: primary }}
          />
          Primary
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
          Accent
        </span>
      </div>
    </div>
  );
}

// ─── overview stat card ────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}

function OverviewStat({ icon, label, value, accent }: StatCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="kpi-label text-xs">{label}</p>
          <p className="kpi-value text-xl mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

function AppBrandingPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const enabled = !!actor && !isFetching;

  // ── remote data ──
  const { data: savedBranding, isLoading } = useQuery({
    queryKey: ["app-branding"],
    queryFn: async () => {
      if (!actor) return DEFAULT_BRANDING;
      return actor.getAppBranding();
    },
    enabled,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalyticsSummary();
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

  // ── form state ──
  const [form, setForm] = useState<AppBranding>(DEFAULT_BRANDING);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── populate on load ──
  useEffect(() => {
    if (savedBranding) {
      setForm(savedBranding);
      if (savedBranding.logoUrl) setLogoPreview(savedBranding.logoUrl);
      setIsDirty(false);
    }
  }, [savedBranding]);

  function updateField<K extends keyof AppBranding>(
    key: K,
    value: AppBranding[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function handleReset() {
    if (savedBranding) {
      setForm(savedBranding);
      setLogoFile(null);
      setLogoPreview(savedBranding.logoUrl ?? null);
      setIsDirty(false);
    }
  }

  function handleLogoSelect(file: File) {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setIsDirty(true);
  }

  // ── save mutation ──
  const saveMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      let finalForm = { ...form, updatedAt: BigInt(Date.now() * 1_000_000) };

      if (logoFile) {
        const bytes = new Uint8Array(await logoFile.arrayBuffer());
        const blob =
          ExternalBlob.fromBytes(bytes).withUploadProgress(setUploadProgress);
        // Upload logo as a content file and get its URL
        const fakeId = await actor.addContentFile({
          id: BigInt(0),
          title: `${form.appName} Logo`,
          name: logoFile.name,
          fileType: (await import("../backend")).FileType.Image,
          fileBlob: blob,
          isPublished: true,
          uploadedAt: BigInt(Date.now() * 1_000_000),
        });
        const uploaded = await actor.getContentFile(fakeId);
        if (uploaded) {
          const url = uploaded.fileBlob.getDirectURL();
          finalForm = { ...finalForm, logoUrl: url };
        }
        setUploadProgress(0);
      }

      await actor.setAppBranding(finalForm);
      return finalForm;
    },
    onSuccess: (saved) => {
      setForm(saved);
      if (saved.logoUrl) setLogoPreview(saved.logoUrl);
      setLogoFile(null);
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["app-branding"] });
      toast.success("Branding saved successfully!");
    },
    onError: () => {
      setUploadProgress(0);
      toast.error("Failed to save branding. Please try again.");
    },
  });

  const isSaving = saveMut.isPending;

  return (
    <Layout>
      <div className="space-y-6 pb-8" data-ocid="branding.page">
        {/* ── header ── */}
        <div>
          <Breadcrumbs items={[{ label: "App Branding" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <Palette className="h-6 w-6 text-primary" />
                App Branding
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your app's identity — name, logo, colors, and tagline.
                Changes reflect live in the preview.
              </p>
            </div>

            {/* save controls */}
            <div className="flex items-center gap-2 shrink-0">
              {isDirty && (
                <span
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-700"
                  data-ocid="branding.unsaved_indicator"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!isDirty || isSaving}
                className="gap-1.5"
                data-ocid="branding.reset_button"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => saveMut.mutate()}
                disabled={isSaving}
                className="gap-1.5"
                data-ocid="branding.save_button"
              >
                {isSaving ? (
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

        {/* ── main split ── */}
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Skeleton
              className="h-[600px] rounded-xl"
              data-ocid="branding.loading_state"
            />
            <Skeleton className="h-[600px] rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* ── LEFT: settings form ── */}
            <div className="space-y-5">
              {/* App Identity */}
              <Card data-ocid="branding.identity_section">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    App Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Logo upload */}
                  <div className="space-y-2">
                    <Label>App Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-2xl border-2 border-dashed border-border bg-muted/20 overflow-hidden flex items-center justify-center">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="App logo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleLogoSelect(f);
                          }}
                          data-ocid="branding.logo_file_input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => logoInputRef.current?.click()}
                          data-ocid="branding.logo_upload_button"
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
                    <div className="space-y-2">
                      <Label htmlFor="appName">App Name</Label>
                      <Input
                        id="appName"
                        value={form.appName}
                        onChange={(e) => updateField("appName", e.target.value)}
                        placeholder="Postify Academy"
                        data-ocid="branding.app_name_input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tagline">Tagline</Label>
                      <span
                        className={`text-xs ${form.tagline.length > 230 ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {form.tagline.length}/250
                      </span>
                    </div>
                    <Textarea
                      id="tagline"
                      value={form.tagline}
                      maxLength={250}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      placeholder="Learn, Grow, Succeed — Your EdTech Journey Starts Here"
                      rows={3}
                      data-ocid="branding.tagline_input"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Brand Colors */}
              <Card data-ocid="branding.colors_section">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <ColorField
                      label="Primary Color"
                      value={form.primaryColor}
                      onChange={(v) => updateField("primaryColor", v)}
                      id="primaryColor"
                      ocid="branding.primary_color_input"
                    />
                    <ColorField
                      label="Accent Color"
                      value={form.accentColor}
                      onChange={(v) => updateField("accentColor", v)}
                      id="accentColor"
                      ocid="branding.accent_color_input"
                    />
                  </div>

                  {/* Color combo preview */}
                  <div className="mt-5 rounded-xl overflow-hidden border border-border">
                    <div
                      className="h-10 flex items-center px-4 gap-3"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      <span
                        className="text-xs font-semibold font-display"
                        style={{ color: contrastColor(form.primaryColor) }}
                      >
                        {form.appName || "App Name"}
                      </span>
                      <Globe
                        className="h-3.5 w-3.5 ml-auto"
                        style={{ color: contrastColor(form.primaryColor) }}
                      />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-card">
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: form.accentColor,
                          color: contrastColor(form.accentColor),
                        }}
                      >
                        Enroll Now
                      </button>
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Info */}
              <Card data-ocid="branding.platform_info_section">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Platform Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformDesc">Platform Description</Label>
                    <Textarea
                      id="platformDesc"
                      placeholder="Describe your learning platform — what students gain, unique features, and your mission..."
                      rows={4}
                      data-ocid="branding.platform_desc_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown on app store listings and landing pages.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT: live preview ── */}
            <div className="space-y-4">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Live Preview
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs font-normal"
                    >
                      Real-time
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <LivePreview branding={form} logoPreview={logoPreview} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── App Overview ── */}
        <div className="space-y-4" data-ocid="branding.overview_section">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">
              Platform Overview
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate({ to: "/dashboard" })}
              data-ocid="branding.go_to_dashboard_button"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Full Dashboard
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewStat
              icon={<Users className="h-5 w-5" />}
              label="Total Students"
              value={
                analytics ? Number(analytics.totalUsers).toLocaleString() : "—"
              }
            />
            <OverviewStat
              icon={<BookOpen className="h-5 w-5" />}
              label="Total Courses"
              value={courses.length}
              accent
            />
            <OverviewStat
              icon={<Globe className="h-5 w-5" />}
              label="Platform Status"
              value="Live"
            />
            <OverviewStat
              icon={<Smartphone className="h-5 w-5" />}
              label="App Name"
              value={form.appName || "—"}
              accent
            />
          </div>

          {/* Status badges row */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                Quick status:
              </span>
              <span className="badge-success">
                <span className="status-connected" />
                Backend Connected
              </span>
              <span className="badge-primary">
                <span className="status-dot bg-primary animate-pulse" />
                Branding Active
              </span>
              {isDirty && (
                <span className="badge-warning">
                  <span className="status-dot bg-amber-500" />
                  Pending Changes
                </span>
              )}
              {!isDirty && savedBranding && (
                <span className="badge-success">
                  <span className="status-connected" />
                  Up to date
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
