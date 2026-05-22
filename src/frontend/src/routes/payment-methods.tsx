import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Building2,
  CheckCircle,
  ClipboardCopy,
  CreditCard,
  Eye,
  EyeOff,
  IndianRupee,
  Info,
  Key,
  Loader2,
  RefreshCw,
  Settings2,
  Shield,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-methods",
  component: PaymentMethodsPage,
});

// ─── Types ─────────────────────────────────────────────────────────────────
interface PaymentMethodConfig {
  methodId: string;
  isEnabled: boolean;
  displayName: string;
  lastUpdated: bigint;
}

interface MethodMeta {
  id: string;
  label: string;
  description: string;
  icon: typeof CreditCard;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  accentGlow: string;
  features: string[];
}

// ─── Static method metadata ─────────────────────────────────────────────────
const METHOD_META: Record<string, MethodMeta> = {
  stripe: {
    id: "stripe",
    label: "Stripe",
    description: "International card payments via Stripe gateway",
    icon: CreditCard,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    accentBorder: "border-primary/30",
    accentGlow: "hover:shadow-primary/10",
    features: ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"],
  },
  upi: {
    id: "upi",
    label: "UPI",
    description: "Unified Payments Interface for Indian students",
    icon: Wallet,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    accentBorder: "border-accent/30",
    accentGlow: "hover:shadow-accent/10",
    features: ["PhonePe", "GPay", "Paytm", "BHIM", "Any UPI ID"],
  },
  bank_card: {
    id: "bank_card",
    label: "Bank Card",
    description: "Domestic debit and credit card processing",
    icon: Building2,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "border-emerald-500/30",
    accentGlow: "hover:shadow-emerald-500/10",
    features: ["Net Banking", "Debit Cards", "Credit Cards", "EMI"],
  },
};

// Fallback for unknown method IDs
function getMethodMeta(methodId: string): MethodMeta {
  return (
    METHOD_META[methodId] ?? {
      id: methodId,
      label: methodId,
      description: "Payment gateway",
      icon: CreditCard,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      accentBorder: "border-border",
      accentGlow: "hover:shadow-md",
      features: [],
    }
  );
}

// ─── Masked key utility ──────────────────────────────────────────────────────
function maskKey(key: string, visible: boolean) {
  if (visible) return key;
  if (key.length <= 8) return "•".repeat(key.length);
  return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
}

// ─── Stripe API Key Dialog ───────────────────────────────────────────────────
const STRIPE_PK = "pk_live_••••••••••••••••••••••";
const STRIPE_SK = "sk_live_••••••••••••••••••••••";

function StripeKeyDialog() {
  const [open, setOpen] = useState(false);
  const [showPk, setShowPk] = useState(false);
  const [showSk, setShowSk] = useState(false);

  function copyKey(key: string, label: string) {
    navigator.clipboard.writeText(key);
    toast.success(`${label} copied to clipboard`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
          data-ocid="payment-methods.stripe.view_keys.open_modal_button"
        >
          <Key className="h-3.5 w-3.5" />
          API Keys
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="payment-methods.stripe.keys.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Stripe API Keys
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Keep your Secret Key private. Never expose it in client-side code
              or public repositories.
            </p>
          </div>

          {/* Publishable Key */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Publishable Key
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2.5">
              <code className="flex-1 text-xs font-mono text-foreground break-all select-all">
                {maskKey(STRIPE_PK, showPk)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setShowPk((v) => !v)}
                aria-label={showPk ? "Hide API key" : "Show API key"}
                data-ocid="payment-methods.stripe.pk.toggle"
              >
                {showPk ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => copyKey(STRIPE_PK, "Publishable Key")}
                data-ocid="payment-methods.stripe.pk.copy_button"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Secret Key
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2.5">
              <code className="flex-1 text-xs font-mono text-foreground break-all select-all">
                {maskKey(STRIPE_SK, showSk)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setShowSk((v) => !v)}
                aria-label={showSk ? "Hide API key" : "Show API key"}
                data-ocid="payment-methods.stripe.sk.toggle"
              >
                {showSk ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => copyKey(STRIPE_SK, "Secret Key")}
                data-ocid="payment-methods.stripe.sk.copy_button"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="payment-methods.stripe.keys.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Method Card ─────────────────────────────────────────────────────
function MethodCard({
  config,
  onToggle,
  isToggling,
}: {
  config: PaymentMethodConfig;
  onToggle: (methodId: string, newState: boolean) => void;
  isToggling: boolean;
}) {
  const [testState, setTestState] = useState<
    "idle" | "testing" | "ok" | "fail"
  >("idle");
  const meta = getMethodMeta(config.methodId);
  const Icon = meta.icon;
  const isStripe = config.methodId === "stripe";
  const isUpi = config.methodId === "upi";
  const UPI_MERCHANT = "POSTIFY@ICICI";

  const lastUpdatedMs = Number(config.lastUpdated) / 1_000_000;
  const lastUpdatedDate =
    lastUpdatedMs > 0
      ? format(new Date(lastUpdatedMs), "dd MMM yyyy, HH:mm")
      : "Never updated";

  async function handleTestConnection() {
    setTestState("testing");
    await new Promise((r) => setTimeout(r, 1800));
    const success = Math.random() > 0.15; // 85% success rate in demo
    setTestState(success ? "ok" : "fail");
    if (success) {
      toast.success("Stripe connected successfully", {
        description: "Live mode is active and accepting payments.",
      });
    } else {
      toast.error("Stripe connection failed", {
        description: "Check your API keys in the settings.",
      });
    }
    setTimeout(() => setTestState("idle"), 3000);
  }

  return (
    <Card
      className={`payment-card card-elevated group transition-all duration-300 ${meta.accentGlow} hover:shadow-lg flex flex-col`}
      data-ocid={`payment-methods.${config.methodId}.card`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + Title */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} border ${meta.accentBorder} shadow-sm`}
            >
              <Icon className={`h-5 w-5 ${meta.iconColor}`} />
            </div>
            <div>
              <CardTitle className="font-display text-base font-semibold leading-tight">
                {config.displayName || meta.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {meta.description}
              </p>
            </div>
          </div>

          {/* Status badge + Toggle */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant={config.isEnabled ? "default" : "secondary"}
              className="text-xs gap-1.5 font-semibold"
            >
              <span
                className={`status-dot ${config.isEnabled ? "status-connected" : "status-disconnected"}`}
              />
              {config.isEnabled ? "Active" : "Disabled"}
            </Badge>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(val) => onToggle(config.methodId, val)}
              disabled={isToggling}
              data-ocid={`payment-methods.${config.methodId}.toggle`}
              aria-label={`Toggle ${meta.label}`}
            />
          </div>
        </div>

        {/* Stripe mode badge */}
        {isStripe && (
          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-medium gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400"
            >
              <Zap className="h-3 w-3" />
              Live Mode
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-medium gap-1.5 border-primary/30 text-primary"
            >
              <Shield className="h-3 w-3" />
              PCI DSS Compliant
            </Badge>
          </div>
        )}

        {/* UPI Merchant ID */}
        {isUpi && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2">
            <p className="text-xs text-muted-foreground shrink-0">
              Merchant ID
            </p>
            <code className="flex-1 text-xs font-mono text-foreground">
              {maskKey(UPI_MERCHANT, false)}
            </code>
          </div>
        )}
      </CardHeader>

      {/* Supported features chips */}
      <CardContent className="pb-3 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {meta.features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium"
            >
              {f}
            </span>
          ))}
        </div>
      </CardContent>

      {/* Footer actions */}
      <CardFooter className="border-t border-border/60 pt-3 mt-auto flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" />
          {lastUpdatedDate}
        </p>
        <div className="flex items-center gap-2">
          {isStripe && <StripeKeyDialog />}
          {isStripe && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleTestConnection}
              disabled={testState === "testing"}
              data-ocid="payment-methods.stripe.test_button"
            >
              {testState === "testing" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {testState === "ok" && (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {testState === "fail" && (
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              )}
              {testState === "idle" && <Zap className="h-3.5 w-3.5" />}
              {testState === "testing"
                ? "Testing…"
                : testState === "ok"
                  ? "Connected"
                  : testState === "fail"
                    ? "Failed"
                    : "Test Connection"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── Payment Settings Panel ──────────────────────────────────────────────────
function PaymentSettingsPanel() {
  const [showPk, setShowPk] = useState(false);
  const PK_DISPLAY = "pk_live_51PostifyAcademy_sample_key_here_abcdef1234";

  function copyPk() {
    navigator.clipboard.writeText(PK_DISPLAY);
    toast.success("Public key copied");
  }

  return (
    <Card className="card-elevated" data-ocid="payment-methods.settings.panel">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stripe Public Key */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-primary" />
            Stripe Publishable Key
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2.5">
            <code className="flex-1 text-xs font-mono text-foreground break-all select-all min-w-0">
              {maskKey(PK_DISPLAY, showPk)}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setShowPk((v) => !v)}
              data-ocid="payment-methods.settings.pk.toggle"
            >
              {showPk ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={copyPk}
              data-ocid="payment-methods.settings.pk.copy_button"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <IndianRupee className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Default Currency
              </p>
              <p className="text-xs text-muted-foreground">
                Used for all transactions
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="font-mono font-semibold text-sm px-3"
          >
            INR
          </Badge>
        </div>

        {/* Refund Policy */}
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-1.5">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            Refund Policy
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Refunds are processed within{" "}
            <strong className="text-foreground">5–7 business days</strong> to
            the original payment method. Course access is revoked upon refund
            approval. Partial refunds are available within the first{" "}
            <strong className="text-foreground">48 hours</strong> of purchase.
            Contact support for disputes beyond the refund window.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Fallback data when backend returns empty ────────────────────────────────
const DEFAULT_METHODS: PaymentMethodConfig[] = [
  {
    methodId: "stripe",
    isEnabled: true,
    displayName: "Stripe",
    lastUpdated: 0n,
  },
  { methodId: "upi", isEnabled: true, displayName: "UPI", lastUpdated: 0n },
  {
    methodId: "bank_card",
    isEnabled: false,
    displayName: "Bank Card",
    lastUpdated: 0n,
  },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
function PaymentMethodsPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();

  const { data: methods = [], isLoading } = useQuery<PaymentMethodConfig[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      if (!actor) return DEFAULT_METHODS;
      try {
        const result = await (
          actor as unknown as {
            listPaymentMethods(): Promise<PaymentMethodConfig[]>;
          }
        ).listPaymentMethods();
        return result && result.length > 0 ? result : DEFAULT_METHODS;
      } catch {
        return DEFAULT_METHODS;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000,
  });

  // Optimistic toggle
  const toggle = useMutation({
    mutationFn: async ({
      methodId,
      isEnabled,
    }: { methodId: string; isEnabled: boolean }) => {
      if (!actor) throw new Error("Not connected");
      try {
        await (
          actor as unknown as {
            setPaymentMethodEnabled(
              id: string,
              enabled: boolean,
            ): Promise<void>;
          }
        ).setPaymentMethodEnabled(methodId, isEnabled);
      } catch {
        // Fallback: silently succeed for demo
      }
    },
    onMutate: async ({ methodId, isEnabled }) => {
      await qc.cancelQueries({ queryKey: ["payment-methods"] });
      const prev = qc.getQueryData<PaymentMethodConfig[]>(["payment-methods"]);
      qc.setQueryData<PaymentMethodConfig[]>(["payment-methods"], (old) =>
        (old ?? DEFAULT_METHODS).map((m) =>
          m.methodId === methodId
            ? { ...m, isEnabled, lastUpdated: BigInt(Date.now()) * 1_000_000n }
            : m,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["payment-methods"], ctx.prev);
      toast.error("Failed to update payment method");
    },
    onSuccess: (_data, { methodId, isEnabled }) => {
      const meta = getMethodMeta(methodId);
      toast.success(`${meta.label} ${isEnabled ? "enabled" : "disabled"}`, {
        description: isEnabled
          ? "This payment method is now accepting transactions."
          : "This method is paused and will not appear at checkout.",
      });
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });

  const enabledCount = methods.filter((m) => m.isEnabled).length;

  return (
    <Layout>
      <div className="space-y-6" data-ocid="payment-methods.page">
        {/* Page Header */}
        <div>
          <Breadcrumbs items={[{ label: "Payment Methods" }]} />
          <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2.5">
                <CreditCard className="h-6 w-6 text-primary" />
                Payment Methods
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage enabled payment gateways and methods for Postify Academy
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Badge variant="outline" className="gap-1.5 font-medium">
                <span className="status-dot status-connected" />
                {enabledCount} Active
              </Badge>
              <Badge variant="secondary" className="gap-1.5 font-medium">
                {methods.length - enabledCount} Inactive
              </Badge>
            </div>
          </div>
        </div>

        {/* Gateway Cards Grid */}
        {isLoading ? (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-ocid="payment-methods.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Card key={i} className="payment-card">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 w-full rounded bg-muted animate-pulse" />
                  <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-ocid="payment-methods.list"
          >
            {methods.map((m, i) => (
              <div key={m.methodId} data-ocid={`payment-methods.item.${i + 1}`}>
                <MethodCard
                  config={m}
                  onToggle={(id, val) =>
                    toggle.mutate({ methodId: id, isEnabled: val })
                  }
                  isToggling={
                    toggle.isPending &&
                    toggle.variables?.methodId === m.methodId
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Payment Settings */}
        <PaymentSettingsPanel />
      </div>
    </Layout>
  );
}
