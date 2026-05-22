import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  AlertCircle,
  ArrowDownToLine,
  BanknoteIcon,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  HelpCircle,
  IndianRupee,
  Info,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type {
  BankAccountDetails,
  WithdrawalRequest,
  WithdrawalStats,
} from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/withdrawals",
  component: WithdrawalsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskAccount(acc: string) {
  if (acc.length <= 4) return acc;
  return "•".repeat(acc.length - 4) + acc.slice(-4);
}

function validateIfsc(ifsc: string) {
  return /^[A-Z]{4}[0-9A-Z]{7}$/.test(ifsc);
}

type WithdrawalStatusKey = "Pending" | "Processing" | "Completed" | "Failed";

function getStatusKey(
  status: WithdrawalRequest["status"],
): WithdrawalStatusKey {
  if ("Completed" in status) return "Completed";
  if ("Processing" in status) return "Processing";
  if ("Failed" in status) return "Failed";
  return "Pending";
}

function StatusBadge({ status }: { status: WithdrawalRequest["status"] }) {
  const key = getStatusKey(status);
  const map: Record<
    WithdrawalStatusKey,
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    Completed: {
      cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Completed",
    },
    Pending: {
      cls: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
    },
    Processing: {
      cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      icon: <RefreshCw className="h-3 w-3 animate-spin" />,
      label: "Processing",
    },
    Failed: {
      cls: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      icon: <XCircle className="h-3 w-3" />,
      label: "Failed",
    },
  };
  const { cls, icon, label } = map[key];
  return (
    <Badge className={`${cls} text-xs gap-1`}>
      {icon}
      {label}
    </Badge>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function StatsRow({ stats }: { stats: WithdrawalStats }) {
  const cards = [
    {
      label: "Total Withdrawn",
      value: formatAmount(stats.totalWithdrawn),
      icon: <TrendingDown className="h-5 w-5" />,
      cls: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
      iconCls:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending Amount",
      value: formatAmount(stats.pendingAmount),
      icon: <Clock className="h-5 w-5" />,
      cls: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
      iconCls:
        "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Completed",
      value: Number(stats.completedRequests),
      icon: <CheckCircle2 className="h-5 w-5" />,
      cls: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      iconCls:
        "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Failed",
      value: Number(stats.failedRequests),
      icon: <XCircle className="h-5 w-5" />,
      cls: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
      iconCls: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
    },
  ];
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      data-ocid="withdrawals.stats"
    >
      {cards.map(({ label, value, icon, cls, iconCls }) => (
        <div
          key={label}
          className={`rounded-xl border px-4 py-4 flex items-center gap-3 ${cls}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconCls}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {label}
            </p>
            <p className="font-display text-lg font-bold text-foreground mt-0.5 truncate">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bank Details Card ────────────────────────────────────────────────────────
interface BankFormFields {
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId: string;
}

const emptyBankForm: BankFormFields = {
  accountHolderName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  bankName: "",
  upiId: "",
};

function bankFormFromDetails(d: BankAccountDetails): BankFormFields {
  return {
    accountHolderName: d.accountHolderName,
    accountNumber: d.accountNumber,
    confirmAccountNumber: d.accountNumber,
    ifscCode: d.ifscCode,
    bankName: d.bankName,
    upiId: d.upiId ?? "",
  };
}

function BankDetailsCard({
  bank,
  onSave,
  saving,
}: {
  bank: BankAccountDetails | null;
  onSave: (d: BankAccountDetails) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BankFormFields>(
    bank ? bankFormFromDetails(bank) : emptyBankForm,
  );
  const [errors, setErrors] = useState<Partial<BankFormFields>>({});

  function setF<K extends keyof BankFormFields>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const errs: Partial<BankFormFields> = {};
    if (!form.accountHolderName.trim()) errs.accountHolderName = "Required";
    if (!form.accountNumber.trim()) errs.accountNumber = "Required";
    if (form.accountNumber !== form.confirmAccountNumber)
      errs.confirmAccountNumber = "Account numbers don't match";
    if (!validateIfsc(form.ifscCode.toUpperCase()))
      errs.ifscCode = "Invalid IFSC (e.g. HDFC0001234)";
    if (!form.bankName.trim()) errs.bankName = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      bankName: form.bankName.trim(),
      upiId: form.upiId.trim() || undefined,
    });
    setEditing(false);
  }

  if (!bank && !editing) {
    return (
      <Card
        className="border-dashed border-2 border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-orange-950/20"
        data-ocid="withdrawals.bank_empty_state"
      >
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
            <Building2 className="h-7 w-7 text-orange-500" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground text-base">
              Bank Account Not Set
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Add your bank details to start requesting withdrawals. Details are
              saved once and reused.
            </p>
          </div>
          <Button
            onClick={() => {
              setForm(emptyBankForm);
              setEditing(true);
            }}
            data-ocid="withdrawals.add_bank_button"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Add Bank Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-ocid="withdrawals.bank_card">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Bank Account Details
          </CardTitle>
          {!editing && bank && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm(bankFormFromDetails(bank));
                setEditing(true);
              }}
              data-ocid="withdrawals.edit_bank_button"
              className="gap-1.5 h-7 text-xs"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!editing && bank ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoField label="Account Holder" value={bank.accountHolderName} />
            <InfoField
              label="Account Number"
              value={maskAccount(bank.accountNumber)}
            />
            <InfoField label="IFSC Code" value={bank.ifscCode} />
            <InfoField label="Bank Name" value={bank.bankName} />
            {bank.upiId && <InfoField label="UPI ID" value={bank.upiId} />}
            <div className="flex items-center gap-1.5 col-span-full">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Details saved securely
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="b-holder"
                label="Account Holder Name"
                placeholder="Full name as per bank"
                value={form.accountHolderName}
                error={errors.accountHolderName}
                onChange={(v) => setF("accountHolderName", v)}
                ocid="withdrawals.holder_name_input"
              />
              <FormField
                id="b-bank"
                label="Bank Name"
                placeholder="e.g. HDFC Bank"
                value={form.bankName}
                error={errors.bankName}
                onChange={(v) => setF("bankName", v)}
                ocid="withdrawals.bank_name_input"
              />
              <FormField
                id="b-acc"
                label="Account Number"
                placeholder="Enter account number"
                value={form.accountNumber}
                error={errors.accountNumber}
                onChange={(v) => setF("accountNumber", v)}
                ocid="withdrawals.account_number_input"
              />
              <FormField
                id="b-confirm"
                label="Confirm Account Number"
                placeholder="Re-enter account number"
                value={form.confirmAccountNumber}
                error={errors.confirmAccountNumber}
                onChange={(v) => setF("confirmAccountNumber", v)}
                ocid="withdrawals.confirm_account_input"
              />
              <FormField
                id="b-ifsc"
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={form.ifscCode}
                error={errors.ifscCode}
                onChange={(v) => setF("ifscCode", v.toUpperCase())}
                ocid="withdrawals.ifsc_input"
              />
              <FormField
                id="b-upi"
                label="UPI ID (optional)"
                placeholder="name@upi"
                value={form.upiId}
                onChange={(v) => setF("upiId", v)}
                ocid="withdrawals.upi_input"
              />
            </div>
            <div className="flex items-center gap-2 justify-end pt-1 border-t border-border">
              {bank && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  data-ocid="withdrawals.cancel_bank_button"
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                data-ocid="withdrawals.save_bank_button"
              >
                {saving ? "Saving…" : "Save Bank Details"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground text-sm mt-0.5 font-mono">
        {value}
      </p>
    </div>
  );
}

function FormField({
  id,
  label,
  placeholder,
  value,
  error,
  onChange,
  ocid,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  ocid: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          error ? "border-destructive focus-visible:ring-destructive" : ""
        }
        data-ocid={ocid}
      />
      {error && (
        <p
          className="text-xs text-destructive flex items-center gap-1"
          data-ocid={`${ocid}_error`}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── New Withdrawal Dialog ─────────────────────────────────────────────────────
function NewWithdrawalDialog({
  open,
  onClose,
  bank,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  bank: BankAccountDetails | null;
  onSubmit: (amount: number, notes: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const amountNum = Number.parseFloat(amount);
  const isValid = bank && !Number.isNaN(amountNum) && amountNum >= 100;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit(amountNum, notes);
    setAmount("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-ocid="withdrawals.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ArrowDownToLine className="h-5 w-5 text-primary" />
            New Withdrawal Request
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {!bank ? (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Please add your bank account details first before requesting a
                withdrawal.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Payout will go to:
              </p>
              <p className="font-medium text-foreground text-sm">
                {bank.bankName}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {maskAccount(bank.accountNumber)} · {bank.ifscCode}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="wd-amount">
              Withdrawal Amount (₹){" "}
              <span className="text-muted-foreground font-normal">
                — min ₹100
              </span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="wd-amount"
                type="number"
                min="100"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                data-ocid="withdrawals.amount_input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wd-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="wd-notes"
              rows={2}
              placeholder="Any notes for this withdrawal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-ocid="withdrawals.notes_input"
            />
          </div>
          <div className="flex items-center gap-2 justify-end pt-1 border-t border-border">
            <Button
              variant="ghost"
              onClick={onClose}
              data-ocid="withdrawals.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              data-ocid="withdrawals.submit_button"
            >
              <ArrowDownToLine className="h-4 w-4 mr-1.5" />
              {isPending ? "Submitting…" : "Request Withdrawal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  "All",
  "Pending",
  "Processing",
  "Completed",
  "Failed",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const PAGE_SIZE = 10;

function HistoryTable({
  requests,
  loading,
}: { requests: WithdrawalRequest[]; loading: boolean }) {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);

  const filtered = requests.filter((r) => {
    if (filter === "All") return true;
    return getStatusKey(r.status) === filter;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card data-ocid="withdrawals.history_card">
      <CardHeader className="pb-0 border-b border-border bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
          <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Withdrawal History
            <Badge variant="outline" className="text-xs ml-1">
              {filtered.length}
            </Badge>
          </CardTitle>
          <Tabs
            value={filter}
            onValueChange={(v) => {
              setFilter(v as StatusFilter);
              setPage(1);
            }}
            data-ocid="withdrawals.filter_tabs"
          >
            <TabsList className="h-7 text-xs">
              {STATUS_FILTERS.map((f) => (
                <TabsTrigger
                  key={f}
                  value={f}
                  className="text-xs px-2.5 h-6"
                  data-ocid={`withdrawals.filter.${f.toLowerCase()}`}
                >
                  {f}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((k) => (
              <div key={k} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-14 text-center"
            data-ocid="withdrawals.empty_state"
          >
            <BanknoteIcon className="h-12 w-12 text-muted-foreground/25" />
            <p className="font-display font-semibold text-foreground">
              {filter === "All"
                ? "No withdrawals yet"
                : `No ${filter} withdrawals`}
            </p>
            <p className="text-sm text-muted-foreground">
              {filter === "All"
                ? "Submit your first withdrawal request above"
                : "Change the filter to see other requests"}
            </p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_100px_120px] gap-4 px-5 py-2 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground">
              <span>Bank / Account</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Requested</span>
            </div>
            <div className="divide-y divide-border">
              {paged.map((req, i) => (
                <div
                  key={String(req.id)}
                  className="flex flex-col gap-2 px-5 py-3.5 sm:grid sm:grid-cols-[1fr_120px_100px_120px] sm:items-center sm:gap-4 hover:bg-muted/20 transition-colors"
                  data-ocid={`withdrawals.item.${i + 1}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {req.bankDetails.bankName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {maskAccount(req.bankDetails.accountNumber)} ·{" "}
                      {req.bankDetails.ifscCode}
                    </p>
                    {req.notes && (
                      <p className="text-xs text-muted-foreground italic mt-0.5 truncate">
                        "{req.notes}"
                      </p>
                    )}
                  </div>
                  <StatusBadge status={req.status} />
                  <span className="font-display font-bold text-foreground sm:text-right">
                    {formatAmount(req.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground sm:text-right">
                    {formatDate(req.requestedAt)}
                    {req.processedAt && (
                      <span className="block text-emerald-600 dark:text-emerald-400">
                        Processed {formatDate(req.processedAt)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    data-ocid="withdrawals.pagination_prev"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                    data-ocid="withdrawals.pagination_next"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  {
    icon: Building2,
    title: "Set Bank Details",
    desc: "Add your account number, IFSC, and UPI ID once. We save them securely.",
  },
  {
    icon: ArrowDownToLine,
    title: "Request Withdrawal",
    desc: "Enter the amount you want to withdraw (min ₹100) and submit the request.",
  },
  {
    icon: RefreshCw,
    title: "Admin Processes",
    desc: "Your request is reviewed and processed via Razorpay Payout.",
  },
  {
    icon: CreditCard,
    title: "Money in Account",
    desc: "Funds arrive in your bank account within 2–3 business days.",
  },
];

function HowItWorks() {
  return (
    <Card className="bg-muted/20" data-ocid="withdrawals.how_it_works">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="font-display text-sm font-semibold flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          How Withdrawals Work
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex gap-3">
              <div className="relative flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs font-display">
                  {i + 1}
                </div>
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden lg:block h-full w-px bg-border" />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <p className="font-medium text-foreground text-sm">{title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Processing time: 2–3 business days. Payouts are processed via
            Razorpay. Minimum withdrawal amount is ₹100.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mock data helpers (for graceful degradation when backend methods unavailable) ──
function useWithdrawalData(
  actor: ReturnType<typeof useBackend>["actor"],
  enabled: boolean,
) {
  // Use listTransactions as a proxy source, or return empty arrays gracefully
  const { data: requests = [], isLoading: reqLoading } = useQuery<
    WithdrawalRequest[]
  >({
    queryKey: ["withdrawal-requests"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const raw = actor as unknown as {
          listWithdrawalRequests?: () => Promise<WithdrawalRequest[]>;
        };
        if (typeof raw.listWithdrawalRequests === "function") {
          return await raw.listWithdrawalRequests();
        }
      } catch {}
      return [];
    },
    enabled,
    refetchInterval: 60000,
  });

  const { data: stats, isLoading: statsLoading } =
    useQuery<WithdrawalStats | null>({
      queryKey: ["withdrawal-stats"],
      queryFn: async () => {
        if (!actor) return null;
        try {
          const raw = actor as unknown as {
            getWithdrawalStats?: () => Promise<WithdrawalStats>;
          };
          if (typeof raw.getWithdrawalStats === "function") {
            return await raw.getWithdrawalStats();
          }
        } catch {}
        return {
          totalWithdrawn: 0,
          pendingAmount: 0,
          completedRequests: 0n,
          failedRequests: 0n,
        };
      },
      enabled,
    });

  const { data: savedBank = null, isLoading: bankLoading } =
    useQuery<BankAccountDetails | null>({
      queryKey: ["saved-bank"],
      queryFn: async () => {
        if (!actor) return null;
        try {
          const raw = actor as unknown as {
            getBankAccountDetails?: () => Promise<BankAccountDetails | null>;
          };
          if (typeof raw.getBankAccountDetails === "function") {
            return await raw.getBankAccountDetails();
          }
        } catch {}
        return null;
      },
      enabled,
    });

  return { requests, reqLoading, stats, statsLoading, savedBank, bankLoading };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function WithdrawalsPage() {
  const { actor, isFetching } = useBackend();
  const enabled = !!actor && !isFetching;
  const qc = useQueryClient();

  const [showNewDialog, setShowNewDialog] = useState(false);

  const { requests, reqLoading, stats, statsLoading, savedBank, bankLoading } =
    useWithdrawalData(actor, enabled);

  const saveBank = useMutation({
    mutationFn: async (d: BankAccountDetails) => {
      if (!actor) throw new Error("Not connected");
      const raw = actor as unknown as {
        setBankAccountDetails?: (d: BankAccountDetails) => Promise<void>;
      };
      if (typeof raw.setBankAccountDetails === "function") {
        return await raw.setBankAccountDetails(d);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-bank"] });
      toast.success("Bank details saved successfully!");
    },
    onError: () => toast.error("Failed to save bank details"),
  });

  const createWithdrawal = useMutation({
    mutationFn: async ({
      amount,
      notes,
    }: { amount: number; notes: string }) => {
      if (!actor) throw new Error("Not connected");
      const raw = actor as unknown as {
        createWithdrawalRequest?: (
          amount: number,
          notes: string | undefined,
        ) => Promise<WithdrawalRequest>;
      };
      if (typeof raw.createWithdrawalRequest === "function") {
        return await raw.createWithdrawalRequest(amount, notes || undefined);
      }
      throw new Error("Method not available");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawal-requests"] });
      qc.invalidateQueries({ queryKey: ["withdrawal-stats"] });
      setShowNewDialog(false);
      toast.success(
        "Withdrawal request submitted! Processing takes 2–3 business days.",
      );
    },
    onError: () => toast.error("Failed to submit withdrawal request"),
  });

  const isLoading = reqLoading || statsLoading || bankLoading;
  const defaultStats: WithdrawalStats = {
    totalWithdrawn: 0,
    pendingAmount: 0,
    completedRequests: 0n,
    failedRequests: 0n,
  };

  return (
    <Layout>
      <div className="space-y-6" data-ocid="withdrawals.page">
        {/* Header */}
        <div className="space-y-3">
          <Breadcrumbs items={[{ label: "Withdrawals" }]} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BanknoteIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Withdrawals & Payouts
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Request payouts to your bank account via Razorpay
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowNewDialog(true)}
              disabled={!savedBank || isLoading}
              data-ocid="withdrawals.new_request_button"
              className="gap-2 shrink-0"
            >
              <ArrowDownToLine className="h-4 w-4" />
              New Withdrawal
            </Button>
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsRow stats={stats ?? defaultStats} />
        )}

        {/* Bank Details */}
        {bankLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : (
          <BankDetailsCard
            bank={savedBank}
            onSave={(d) => saveBank.mutate(d)}
            saving={saveBank.isPending}
          />
        )}

        {/* History */}
        <HistoryTable requests={requests} loading={reqLoading} />

        {/* How It Works */}
        <HowItWorks />

        {/* New Withdrawal Dialog */}
        <NewWithdrawalDialog
          open={showNewDialog}
          onClose={() => setShowNewDialog(false)}
          bank={savedBank}
          onSubmit={(amount, notes) =>
            createWithdrawal.mutate({ amount, notes })
          }
          isPending={createWithdrawal.isPending}
        />
      </div>
    </Layout>
  );
}
