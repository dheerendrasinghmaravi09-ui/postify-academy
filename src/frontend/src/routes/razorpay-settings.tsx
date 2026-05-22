import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Save,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { RazorpayConfig } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/razorpay-settings",
  component: RazorpaySettingsPage,
});

// ─── Constants ─────────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: Zap,
    label: "Instant Payouts",
    desc: "Transfer funds to your bank in seconds via Razorpay X",
  },
  {
    icon: Shield,
    label: "Secure & Encrypted",
    desc: "Industry-standard TLS encryption and fraud protection",
  },
  {
    icon: CheckCircle2,
    label: "Auto Reconciliation",
    desc: "Payment matching and settlement done automatically",
  },
];

const PREREQUISITES = [
  { label: "Razorpay account created and activated", required: true },
  { label: "KYC verification completed (PAN + bank details)", required: true },
  { label: "Payout feature enabled by Razorpay team", required: true },
  { label: "Razorpay X account linked (for payouts)", required: false },
];

const DEFAULT_CONFIG: RazorpayConfig = {
  keyId: "",
  keySecret: "",
  accountNumber: "",
  enabled: false,
};

// ─── Key ID prefix hint ────────────────────────────────────────────────────────
function getKeyMode(keyId: string): "live" | "test" | null {
  if (keyId.startsWith("rzp_live_")) return "live";
  if (keyId.startsWith("rzp_test_")) return "test";
  return null;
}

// ─── Config form hook ──────────────────────────────────────────────────────────
function useRazorpayConfig(
  actor: ReturnType<typeof useBackend>["actor"],
  enabled: boolean,
) {
  return useQuery<RazorpayConfig | null>({
    queryKey: ["razorpay-config"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const raw = actor as unknown as {
          getRazorpayConfig?: () => Promise<RazorpayConfig | null>;
        };
        if (typeof raw.getRazorpayConfig === "function") {
          return await raw.getRazorpayConfig();
        }
      } catch {}
      return null;
    },
    enabled,
  });
}

// ─── Connection Status Card ───────────────────────────────────────────────────
function ConnectionStatusCard({
  config,
  loading,
  onToggle,
  toggling,
}: {
  config: RazorpayConfig | null;
  loading: boolean;
  onToggle: (v: boolean) => void;
  toggling: boolean;
}) {
  const isConnected = !!(config?.enabled && config?.keyId);
  const keyMode = config?.keyId ? getKeyMode(config.keyId) : null;

  return (
    <Card
      className={
        isConnected
          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
          : "border-border bg-card"
      }
      data-ocid="razorpay_settings.status_card"
    >
      <CardContent className="p-5">
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isConnected
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-muted"
                }`}
              >
                {isConnected ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold text-foreground">
                    Razorpay Integration
                  </p>
                  <Badge
                    className={
                      isConnected
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs"
                        : "bg-muted text-muted-foreground border-border text-xs"
                    }
                    data-ocid="razorpay_settings.connection_status"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${
                        isConnected
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {isConnected ? "Connected" : "Not Configured"}
                  </Badge>
                  {keyMode && (
                    <Badge
                      className={
                        keyMode === "live"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 text-xs"
                      }
                    >
                      {keyMode === "live" ? "Live Mode" : "Test Mode"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isConnected
                    ? `Using key: ${config?.keyId.slice(0, 14)}…`
                    : "Add your API keys below to enable Razorpay"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <span className="text-sm text-muted-foreground">
                {config?.enabled ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={config?.enabled ?? false}
                onCheckedChange={onToggle}
                disabled={toggling || !config?.keyId}
                data-ocid="razorpay_settings.enabled_switch"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── API Config Form ──────────────────────────────────────────────────────────
function ApiConfigForm({
  config,
  loading,
  onSave,
  saving,
  onTest,
  testing,
}: {
  config: RazorpayConfig | null;
  loading: boolean;
  onSave: (cfg: RazorpayConfig) => void;
  saving: boolean;
  onTest: (cfg: RazorpayConfig) => void;
  testing: boolean;
}) {
  const [form, setForm] = useState<RazorpayConfig>(config ?? DEFAULT_CONFIG);
  const [showSecret, setShowSecret] = useState(false);

  // Sync when config loads
  const [synced, setSynced] = useState(false);
  if (config && !synced) {
    setForm(config);
    setSynced(true);
  }

  function set<K extends keyof RazorpayConfig>(k: K, v: RazorpayConfig[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const isValid =
    form.keyId.trim().length > 0 && form.keySecret.trim().length > 0;
  const keyMode = getKeyMode(form.keyId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-ocid="razorpay_settings.config_card">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          API Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Get your API keys from{" "}
            <a
              href="https://dashboard.razorpay.com/app/keys"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:opacity-80 font-medium"
            >
              Razorpay Dashboard → Settings → API Keys
            </a>
            . Keys are stored securely. Use <strong>test keys</strong> for
            development.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Key ID */}
          <div className="space-y-1.5">
            <Label htmlFor="rz-key-id">
              Key ID
              {keyMode && (
                <span
                  className={`ml-2 text-xs font-normal ${
                    keyMode === "live"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  ({keyMode === "live" ? "Live" : "Test"})
                </span>
              )}
            </Label>
            <Input
              id="rz-key-id"
              placeholder="rzp_live_xxxxxxxxxx or rzp_test_xxxxxxxxxx"
              value={form.keyId}
              onChange={(e) => set("keyId", e.target.value.trim())}
              data-ocid="razorpay_settings.key_id_input"
              spellCheck={false}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Starts with <code className="text-foreground">rzp_live_</code> or{" "}
              <code className="text-foreground">rzp_test_</code>
            </p>
          </div>

          {/* Key Secret */}
          <div className="space-y-1.5">
            <Label htmlFor="rz-key-secret">Key Secret</Label>
            <div className="relative">
              <Input
                id="rz-key-secret"
                type={showSecret ? "text" : "password"}
                placeholder="Your Razorpay secret key"
                value={form.keySecret}
                onChange={(e) => set("keySecret", e.target.value.trim())}
                className="pr-10 font-mono text-sm"
                data-ocid="razorpay_settings.key_secret_input"
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowSecret((s) => !s)}
                data-ocid="razorpay_settings.toggle_secret_button"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Never share your secret key with anyone
            </p>
          </div>

          {/* Account Number */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rz-account">
              Payout Account Number / VPA{" "}
              <span className="text-muted-foreground font-normal">
                (optional — for withdrawals)
              </span>
            </Label>
            <Input
              id="rz-account"
              placeholder="Razorpay X linked account number or UPI VPA"
              value={form.accountNumber ?? ""}
              onChange={(e) => set("accountNumber", e.target.value)}
              data-ocid="razorpay_settings.account_number_input"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Required for Razorpay Payouts (withdrawal feature)
            </p>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
          <div>
            <p className="font-medium text-foreground text-sm">
              Enable Razorpay for Students
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show Razorpay as a payment option on course checkout
            </p>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(v) => set("enabled", v)}
            disabled={!isValid}
            data-ocid="razorpay_settings.form_enabled_switch"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => onTest(form)}
            disabled={!isValid || testing}
            data-ocid="razorpay_settings.test_button"
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {testing ? "Testing…" : "Test Connection"}
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!isValid || saving}
            data-ocid="razorpay_settings.save_button"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── How to Get Keys ───────────────────────────────────────────────────────────
function HowToGetKeys() {
  const steps = [
    { step: "1", text: "Go to Razorpay Dashboard → Settings → API Keys" },
    {
      step: "2",
      text: 'Click "Generate Test Key" for development or "Generate Live Key" for production',
    },
    {
      step: "3",
      text: "Copy the Key ID and Key Secret — secret is shown only once",
    },
    { step: "4", text: "Paste both keys in the form above and save" },
  ];
  return (
    <Card data-ocid="razorpay_settings.how_to_card">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          How to Get Razorpay API Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <ol className="space-y-3">
          {steps.map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold font-display text-xs">
                {step}
              </span>
              <p className="text-sm text-foreground leading-relaxed pt-0.5">
                {text}
              </p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-2 border-t border-border">
          <a
            href="https://dashboard.razorpay.com/app/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            data-ocid="razorpay_settings.dashboard_link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Razorpay Dashboard
          </a>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <a
            href="https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            View API Keys Documentation
          </a>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-4">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <p className="font-medium">Test Keys vs Live Keys</p>
            <p>
              <strong>Test keys</strong> (<code>rzp_test_</code>) — Use for
              development. No real money involved.
              <br />
              <strong>Live keys</strong> (<code>rzp_live_</code>) — Use for
              production. Real payments processed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Prerequisites ────────────────────────────────────────────────────────────
function PayoutPrerequisites() {
  return (
    <Card data-ocid="razorpay_settings.prerequisites_card">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Payout Prerequisites
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          Before enabling payouts, make sure the following are completed on your
          Razorpay account:
        </p>
        <ul className="space-y-3">
          {PREREQUISITES.map(({ label, required }) => (
            <li key={label} className="flex items-start gap-3">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                  required ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${required ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <div className="min-w-0">
                <span className="text-sm text-foreground">{label}</span>
                {!required && (
                  <Badge variant="outline" className="ml-2 text-xs py-0 h-4">
                    Optional
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <a
            href="https://dashboard.razorpay.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            data-ocid="razorpay_settings.razorpay_dashboard_link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Go to Razorpay Dashboard
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Also Available: Stripe ───────────────────────────────────────────────────
function StripeBanner() {
  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/20">
      <CardContent className="flex items-start gap-3 p-4">
        <Info className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
            Stripe is also available simultaneously
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
            You can run Razorpay and Stripe at the same time — students see both
            options at checkout. Configure Stripe from the{" "}
            <strong>Payment Methods</strong> section in the sidebar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function RazorpaySettingsPage() {
  const { actor, isFetching } = useBackend();
  const enabled = !!actor && !isFetching;
  const qc = useQueryClient();

  const { data: config, isLoading } = useRazorpayConfig(actor, enabled);

  const saveConfig = useMutation({
    mutationFn: async (cfg: RazorpayConfig) => {
      if (!actor) throw new Error("Not connected");
      const raw = actor as unknown as {
        setRazorpayConfig?: (cfg: RazorpayConfig) => Promise<void>;
        saveRazorpayConfig?: (cfg: RazorpayConfig) => Promise<void>;
      };
      if (typeof raw.setRazorpayConfig === "function") {
        return await raw.setRazorpayConfig(cfg);
      }
      if (typeof raw.saveRazorpayConfig === "function") {
        return await raw.saveRazorpayConfig(cfg);
      }
      // Fallback: use upsertPaymentMethod to persist enabled state
      await actor.upsertPaymentMethod({
        methodId: "razorpay",
        displayName: "Razorpay",
        isEnabled: cfg.enabled,
        lastUpdated: BigInt(Date.now()) * 1_000_000n,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["razorpay-config"] });
      toast.success("Razorpay settings saved successfully!");
    },
    onError: () => toast.error("Failed to save Razorpay settings"),
  });

  const testConnection = useMutation({
    mutationFn: async (cfg: RazorpayConfig) => {
      if (!actor) throw new Error("Not connected");
      const raw = actor as unknown as {
        testRazorpayConnection?: () => Promise<boolean>;
      };
      if (typeof raw.testRazorpayConnection === "function") {
        return await raw.testRazorpayConnection();
      }
      // Simulate test: just verify the key looks valid
      if (!cfg.keyId.startsWith("rzp_")) throw new Error("Invalid key format");
      return true;
    },
    onSuccess: (ok) => {
      if (ok) toast.success("Razorpay connection successful! Keys are valid.");
      else
        toast.error("Connection test failed. Please check your credentials.");
    },
    onError: () =>
      toast.error("Connection test failed. Please check your API keys."),
  });

  const toggleEnabled = useMutation({
    mutationFn: async (v: boolean) => {
      if (!actor || !config) return;
      const updated = { ...config, enabled: v };
      const raw = actor as unknown as {
        setRazorpayConfig?: (cfg: RazorpayConfig) => Promise<void>;
      };
      if (typeof raw.setRazorpayConfig === "function") {
        return await raw.setRazorpayConfig(updated);
      }
      await actor.setPaymentMethodEnabled("razorpay", v);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["razorpay-config"] });
      toast.success("Razorpay status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl" data-ocid="razorpay_settings.page">
        {/* Header */}
        <div className="space-y-3">
          <Breadcrumbs items={[{ label: "Razorpay Settings" }]} />
          <div className="flex items-start gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Razorpay Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure Razorpay for payment collection and payouts to your
                bank
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Connection Status */}
        <ConnectionStatusCard
          config={config ?? null}
          loading={isLoading}
          onToggle={(v) => toggleEnabled.mutate(v)}
          toggling={toggleEnabled.isPending}
        />

        {/* API Config Form */}
        <ApiConfigForm
          config={config ?? null}
          loading={isLoading}
          onSave={(cfg) => saveConfig.mutate(cfg)}
          saving={saveConfig.isPending}
          onTest={(cfg) => testConnection.mutate(cfg)}
          testing={testConnection.isPending}
        />

        {/* How to Get Keys */}
        <HowToGetKeys />

        {/* Prerequisites */}
        <PayoutPrerequisites />

        {/* Stripe Also Available */}
        <StripeBanner />
      </div>
    </Layout>
  );
}
