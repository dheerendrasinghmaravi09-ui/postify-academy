import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import type { Transaction } from "../types";
import { PaymentStatus } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payments",
  component: PaymentsPage,
});

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<
  PaymentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
  }
> = {
  [PaymentStatus.Completed]: {
    label: "Completed",
    variant: "default",
    icon: CheckCircle2,
  },
  [PaymentStatus.Pending]: {
    label: "Pending",
    variant: "secondary",
    icon: RefreshCw,
  },
  [PaymentStatus.Failed]: {
    label: "Failed",
    variant: "destructive",
    icon: AlertCircle,
  },
  [PaymentStatus.Refunded]: {
    label: "Refunded",
    variant: "outline",
    icon: RefreshCw,
  },
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant={cfg.variant}
      className="gap-1 text-xs font-medium whitespace-nowrap"
    >
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function RevenueChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return Number.isNaN(d.getTime()) ? v : format(d, "dd MMM");
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
          }
          width={52}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
          formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
          labelFormatter={(l: string) => {
            const d = new Date(l);
            return Number.isNaN(d.getTime()) ? l : format(d, "dd MMM yyyy");
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RefundDialog({
  tx,
  onDone,
}: {
  tx: Transaction | null;
  onDone: () => void;
}) {
  const { actor } = useBackend();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const refund = useMutation({
    mutationFn: async () => {
      if (!actor || !tx) throw new Error("Not ready");
      return actor.refundTransaction(tx.id, reason);
    },
    onSuccess: (ok) => {
      if (ok) {
        toast.success("Refund processed successfully");
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["failed-txs"] });
        qc.invalidateQueries({ queryKey: ["revenue-stats"] });
        setOpen(false);
        setAmount("");
        setReason("");
        onDone();
      } else {
        toast.error("Refund could not be processed");
      }
    },
    onError: () => toast.error("Refund failed"),
  });

  const txAmount = tx ? Number(tx.amount) / 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          data-ocid="payments.refund.open_modal_button"
        >
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-ocid="payments.refund.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Process Refund</DialogTitle>
        </DialogHeader>
        {tx && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction</span>
                <span className="font-mono font-medium">
                  #{String(tx.id).padStart(6, "0")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Amount</span>
                <span className="font-semibold">
                  ₹{txAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Refund Amount (₹)</Label>
              <Input
                id="refund-amount"
                type="number"
                placeholder={txAmount.toString()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={txAmount}
                min={1}
                data-ocid="payments.refund.amount_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">Reason for Refund</Label>
              <Textarea
                id="refund-reason"
                placeholder="Describe why this refund is being issued..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                data-ocid="payments.refund.reason_input"
              />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="payments.refund.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => refund.mutate()}
            disabled={!reason.trim() || refund.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-ocid="payments.refund.confirm_button"
          >
            {refund.isPending ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {refund.isPending ? "Processing..." : "Confirm Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransactionsTab() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: paged, isLoading } = useQuery({
    queryKey: ["transactions-paged", page, statusFilter],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listTransactionsPaginated(
        {
          status:
            statusFilter !== "all"
              ? (statusFilter as PaymentStatus)
              : undefined,
          userId: undefined,
          fromDate: undefined,
          toDate: undefined,
        },
        BigInt(page * PAGE_SIZE),
        BigInt(PAGE_SIZE),
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: bigint; status: PaymentStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTransactionStatus(id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions-paged"] });
      qc.invalidateQueries({ queryKey: ["revenue-stats"] });
      toast.success("Transaction status updated");
    },
    onError: () => toast.error("Failed to update transaction"),
  });

  const items = paged?.items ?? [];
  const total = Number(paged?.total ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const displayed = search.trim()
    ? items.filter(
        (tx) =>
          String(tx.userId).toLowerCase().includes(search.toLowerCase()) ||
          String(tx.id).includes(search),
      )
    : items;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="payments.search_input"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger
            className="w-full sm:w-40"
            data-ocid="payments.status_filter.select"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(PaymentStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div
              className="flex flex-col items-center py-14 text-center"
              data-ocid="payments.transactions.empty_state"
            >
              <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">
                No transactions found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold whitespace-nowrap">
                      Tx ID
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      User
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      Course
                    </TableHead>
                    <TableHead className="font-semibold text-right whitespace-nowrap">
                      Amount
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      Method
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((tx, i) => (
                    <TableRow
                      key={String(tx.id)}
                      data-ocid={`payments.item.${i + 1}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(tx.id).padStart(6, "0")}
                      </TableCell>
                      <TableCell className="max-w-[120px]">
                        <span className="truncate block text-xs text-muted-foreground font-mono">
                          {String(tx.userId).slice(0, 8)}…
                        </span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        Course #{String(tx.courseId)}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">
                        ₹{(Number(tx.amount) / 100).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {tx.paymentMethod}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(
                          new Date(Number(tx.date) / 1_000_000),
                          "dd MMM yyyy",
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={tx.status}
                            onValueChange={(v) =>
                              updateStatus.mutate({
                                id: tx.id,
                                status: v as PaymentStatus,
                              })
                            }
                          >
                            <SelectTrigger
                              className="h-7 w-28 text-xs"
                              data-ocid={`payments.status_select.${i + 1}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(PaymentStatus).map((s) => (
                                <SelectItem
                                  key={s}
                                  value={s}
                                  className="text-xs"
                                >
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {tx.status !== PaymentStatus.Refunded && (
                            <RefundDialog tx={tx} onDone={() => {}} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} &mdash; {total.toLocaleString()}{" "}
            total transactions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              data-ocid="payments.pagination_prev"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              data-ocid="payments.pagination_next"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FailedPaymentsTab() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();

  const { data: failed = [], isLoading } = useQuery({
    queryKey: ["failed-txs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFailedTransactions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const retry = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTransactionStatus(id, PaymentStatus.Pending);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["failed-txs"] });
      qc.invalidateQueries({ queryKey: ["transactions-paged"] });
      toast.success("Transaction marked for retry");
    },
    onError: () => toast.error("Failed to queue retry"),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4" data-ocid="payments.failed.loading_state">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (failed.length === 0) {
    return (
      <Card>
        <CardContent
          className="flex flex-col items-center py-14 text-center"
          data-ocid="payments.failed.empty_state"
        >
          <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
          <p className="font-medium text-foreground">No failed payments</p>
          <p className="mt-1 text-sm text-muted-foreground">
            All transactions are processing normally
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-destructive font-medium">
          {failed.length} failed transaction{failed.length > 1 ? "s" : ""}{" "}
          require attention
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Tx ID</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold text-right">
                    Amount
                  </TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failed.map((tx, i) => (
                  <TableRow
                    key={String(tx.id)}
                    data-ocid={`payments.failed.item.${i + 1}`}
                    className="bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{String(tx.id).padStart(6, "0")}
                    </TableCell>
                    <TableCell className="max-w-[120px]">
                      <span className="truncate block text-xs text-muted-foreground font-mono">
                        {String(tx.userId).slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      Course #{String(tx.courseId)}
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      ₹{(Number(tx.amount) / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(
                        new Date(Number(tx.date) / 1_000_000),
                        "dd MMM yyyy",
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => retry.mutate(tx.id)}
                          disabled={retry.isPending}
                          data-ocid={`payments.failed.retry_button.${i + 1}`}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Retry
                        </Button>
                        <RefundDialog tx={tx} onDone={() => {}} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionsTab({
  stats,
}: {
  stats: {
    mrr: bigint;
    activeSubscriptions: bigint;
    churnedSubscriptions: bigint;
    totalRevenue: bigint;
  } | null;
}) {
  const active = Number(stats?.activeSubscriptions ?? 0);
  const churned = Number(stats?.churnedSubscriptions ?? 0);
  const total = active + churned;
  const churnRate = total > 0 ? ((churned / total) * 100).toFixed(1) : "0.0";

  const plans = [
    {
      name: "Basic Plan",
      price: "₹299/mo",
      users: Math.round(active * 0.45),
      color: "bg-primary",
    },
    {
      name: "Pro Plan",
      price: "₹799/mo",
      users: Math.round(active * 0.38),
      color: "bg-accent",
    },
    {
      name: "Premium Plan",
      price: "₹1,499/mo",
      users: Math.round(active * 0.17),
      color: "bg-chart-3",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card data-ocid="payments.subs.active_card">
          <CardContent className="flex items-center gap-3 py-5 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Active Subscriptions
              </p>
              <p className="font-display text-2xl font-bold text-foreground">
                {active.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="payments.subs.churn_card">
          <CardContent className="flex items-center gap-3 py-5 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 shrink-0">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Churn Rate</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {churnRate}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card data-ocid="payments.subs.mrr_card">
          <CardContent className="flex items-center gap-3 py-5 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">MRR</p>
              <p className="font-display text-2xl font-bold text-foreground">
                ₹{(Number(stats?.mrr ?? 0) / 100).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            Plan Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.map((plan) => {
            const pct =
              active > 0 ? Math.round((plan.users / active) * 100) : 0;
            return (
              <div key={plan.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${plan.color}`} />
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {plan.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {plan.users.toLocaleString()} users
                    </span>
                    <span className="font-semibold w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${plan.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentsPage() {
  const { actor, isFetching } = useBackend();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRevenueStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const { data: timeSeries = [] } = useQuery({
    queryKey: ["revenue-timeseries", 30],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRevenueTimeSeries(30n);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000,
  });

  const summaryCards = [
    {
      label: "Total Revenue",
      value: `₹${(Number(stats?.totalRevenue ?? 0) / 100).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      ocid: "payments.stat.total",
    },
    {
      label: "MRR",
      value: `₹${(Number(stats?.mrr ?? 0) / 100).toLocaleString()}`,
      icon: CreditCard,
      color: "text-accent",
      bg: "bg-accent/10",
      ocid: "payments.stat.mrr",
    },
    {
      label: "New Transactions",
      value: Number(stats?.transactionCount ?? 0).toLocaleString(),
      icon: RefreshCw,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950/30",
      ocid: "payments.stat.count",
    },
    {
      label: "Active Subscriptions",
      value: Number(stats?.activeSubscriptions ?? 0).toLocaleString(),
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950/30",
      ocid: "payments.stat.subs",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-ocid="payments.page">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: "Payments" }]} />
          <div className="mt-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Payment Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Revenue overview, transactions, and subscription management
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryCards.map((s) =>
            statsLoading ? (
              <Card key={s.label}>
                <CardContent className="py-5 px-5">
                  <Skeleton className="mb-2 h-3 w-1/2" />
                  <Skeleton className="h-7 w-2/3" />
                </CardContent>
              </Card>
            ) : (
              <Card key={s.label} data-ocid={s.ocid} className="card-hover">
                <CardContent className="flex items-center gap-3 py-5 px-5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}
                  >
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="font-display text-xl font-bold text-foreground">
                      {s.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>

        {/* Revenue trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Trend — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeries.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No revenue data available yet
                </p>
              </div>
            ) : (
              <RevenueChart data={timeSeries} />
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="transactions" data-ocid="payments.tabs">
          <TabsList className="mb-4" data-ocid="payments.tab_list">
            <TabsTrigger
              value="transactions"
              data-ocid="payments.tab.transactions"
            >
              All Transactions
            </TabsTrigger>
            <TabsTrigger value="failed" data-ocid="payments.tab.failed">
              <span className="flex items-center gap-1.5">
                Failed Payments
                {stats && Number(stats.transactionCount) > 0 && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-xs">
                    !
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              data-ocid="payments.tab.subscriptions"
            >
              Subscriptions
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="transactions"
            data-ocid="payments.transactions.panel"
          >
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="failed" data-ocid="payments.failed.panel">
            <FailedPaymentsTab />
          </TabsContent>

          <TabsContent
            value="subscriptions"
            data-ocid="payments.subscriptions.panel"
          >
            <SubscriptionsTab stats={stats ?? null} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
