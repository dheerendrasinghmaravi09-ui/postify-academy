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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DiscountType } from "../backend";
import type { Coupon, CouponUsage, Course } from "../backend";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coupons",
  component: CouponsPage,
});

// ─── helpers ─────────────────────────────────────────────────────────────────

type CouponStatus = "Active" | "Inactive" | "Expired";

function getCouponStatus(coupon: Coupon): CouponStatus {
  if (!coupon.isActive) return "Inactive";
  if (
    coupon.expiryDate != null &&
    coupon.expiryDate < BigInt(Date.now() * 1_000_000)
  ) {
    return "Expired";
  }
  return "Active";
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function formatExpiry(expiryDate?: bigint): string {
  if (!expiryDate) return "Never";
  return format(new Date(Number(expiryDate) / 1_000_000), "dd MMM yyyy");
}

function formatUsage(usedCount: bigint, maxUsage?: bigint): string {
  const used = Number(usedCount);
  if (!maxUsage || maxUsage === BigInt(0)) return `${used} / ∞`;
  return `${used} / ${Number(maxUsage)}`;
}

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CouponStatus }) {
  if (status === "Active") {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (status === "Expired") {
    return (
      <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15">
        <Clock className="h-3 w-3" />
        Expired
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="h-3 w-3" />
      Inactive
    </Badge>
  );
}

// ─── coupon form ──────────────────────────────────────────────────────────────

interface CouponFormData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  maxUsage: string;
  isActive: boolean;
  courseIds: string[];
}

const DEFAULT_FORM: CouponFormData = {
  code: "",
  discountType: DiscountType.Percent,
  discountValue: 10,
  expiryDate: "",
  maxUsage: "",
  isActive: true,
  courseIds: [],
};

interface CouponDialogProps {
  open: boolean;
  onClose: () => void;
  editCoupon?: Coupon;
  courses: Course[];
  onSuccess: () => void;
}

function CouponDialog({
  open,
  onClose,
  editCoupon,
  courses,
  onSuccess,
}: CouponDialogProps) {
  const { actor } = useBackend();
  const [form, setForm] = useState<CouponFormData>(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      if (editCoupon) {
        setForm({
          code: editCoupon.code,
          discountType: editCoupon.discountType,
          discountValue: editCoupon.discountValue,
          expiryDate: editCoupon.expiryDate
            ? format(
                new Date(Number(editCoupon.expiryDate) / 1_000_000),
                "yyyy-MM-dd",
              )
            : "",
          maxUsage: editCoupon.maxUsage
            ? String(Number(editCoupon.maxUsage))
            : "",
          isActive: editCoupon.isActive,
          courseIds: editCoupon.courseIds,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, editCoupon]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const expiryTs = form.expiryDate
        ? BigInt(new Date(form.expiryDate).getTime() * 1_000_000)
        : undefined;
      const maxU = form.maxUsage
        ? BigInt(Number.parseInt(form.maxUsage, 10))
        : undefined;

      const payload: Coupon = {
        id: editCoupon?.id ?? form.code,
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        expiryDate: expiryTs,
        maxUsage: maxU,
        usedCount: editCoupon?.usedCount ?? BigInt(0),
        isActive: form.isActive,
        courseIds: form.courseIds,
        createdAt: editCoupon?.createdAt ?? BigInt(Date.now() * 1_000_000),
      };

      if (editCoupon) {
        return actor.updateCoupon(payload);
      }
      return actor.createCoupon(payload);
    },
    onSuccess: () => {
      toast.success(editCoupon ? "Coupon updated" : "Coupon created");
      onSuccess();
      onClose();
    },
    onError: () => toast.error("Failed to save coupon"),
  });

  const isAllCourses = form.courseIds.length === 0;

  function toggleCourse(id: string) {
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(id)
        ? f.courseIds.filter((c) => c !== id)
        : [...f.courseIds, id],
    }));
  }

  const canSave =
    form.code.trim().length >= 3 &&
    form.discountValue > 0 &&
    !saveMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="coupons.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {editCoupon ? "Edit Coupon" : "Create Coupon"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Coupon Code *</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                placeholder="e.g. LAUNCH50"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                className="font-mono uppercase tracking-widest"
                data-ocid="coupons.code_input"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                aria-label="Generate random code"
                data-ocid="coupons.generate_code_button"
                title="Generate random code"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Min 3 chars, uppercase alphanumeric
            </p>
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount-type">Discount Type</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, discountType: v as DiscountType }))
                }
              >
                <SelectTrigger
                  id="discount-type"
                  data-ocid="coupons.discount_type_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DiscountType.Percent}>
                    <span className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" /> Percentage
                    </span>
                  </SelectItem>
                  <SelectItem value={DiscountType.Fixed}>
                    <span className="flex items-center gap-1.5">
                      ₹ Fixed Amount
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-value">
                {form.discountType === DiscountType.Percent
                  ? "Discount %"
                  : "Amount (₹)"}{" "}
                *
              </Label>
              <Input
                id="discount-value"
                type="number"
                min={1}
                max={
                  form.discountType === DiscountType.Percent ? 100 : undefined
                }
                value={form.discountValue}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountValue: Number(e.target.value),
                  }))
                }
                data-ocid="coupons.discount_value_input"
              />
            </div>
          </div>

          {/* Expiry + max usage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expiry-date">Expiry Date (optional)</Label>
              <Input
                id="expiry-date"
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiryDate: e.target.value }))
                }
                data-ocid="coupons.expiry_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max-usage">Max Usage (0 = unlimited)</Label>
              <Input
                id="max-usage"
                type="number"
                min={0}
                placeholder="Unlimited"
                value={form.maxUsage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxUsage: e.target.value }))
                }
                data-ocid="coupons.max_usage_input"
              />
            </div>
          </div>

          {/* Course applicability */}
          <div className="space-y-1.5">
            <Label>Course Applicability</Label>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 max-h-40 overflow-y-auto">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllCourses}
                  onChange={() => setForm((f) => ({ ...f, courseIds: [] }))}
                  className="accent-primary h-4 w-4"
                  data-ocid="coupons.all_courses_checkbox"
                />
                <span className="text-sm font-medium text-foreground">
                  All Courses
                </span>
              </label>
              {courses.map((course) => (
                <label
                  key={String(course.id)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.courseIds.includes(String(course.id))}
                    onChange={() => {
                      setForm((f) => ({
                        ...f,
                        courseIds: f.courseIds.filter(Boolean),
                      }));
                      toggleCourse(String(course.id));
                    }}
                    className="accent-primary h-4 w-4"
                    data-ocid={`coupons.course_checkbox.${String(course.id)}`}
                  />
                  <span className="text-sm text-foreground truncate">
                    {course.title}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Coupon can be used by students
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              data-ocid="coupons.active_switch"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="coupons.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={!canSave}
            data-ocid="coupons.submit_button"
          >
            {saveMut.isPending
              ? "Saving…"
              : editCoupon
                ? "Save Changes"
                : "Create Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── delete confirmation ──────────────────────────────────────────────────────

interface DeleteDialogProps {
  coupon: Coupon | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteDialog({
  coupon,
  onClose,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  return (
    <Dialog open={!!coupon} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" data-ocid="coupons.delete_dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Coupon
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete coupon{" "}
            <span className="font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
              {coupon?.code}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="coupons.delete_cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="coupons.delete_confirm_button"
          >
            {isPending ? "Deleting…" : "Delete Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── detail sheet ─────────────────────────────────────────────────────────────

interface DetailSheetProps {
  coupon: Coupon | null;
  courses: Course[];
  onClose: () => void;
}

function DetailSheet({ coupon, courses, onClose }: DetailSheetProps) {
  const { actor, isFetching } = useBackend();
  const enabled = !!actor && !isFetching && !!coupon;

  const { data: history = [], isLoading } = useQuery<CouponUsage[]>({
    queryKey: ["coupon-usage", coupon?.id],
    queryFn: async () => {
      if (!actor || !coupon) return [];
      return actor.getCouponUsageHistory(coupon.id);
    },
    enabled,
  });

  if (!coupon) return null;
  const status = getCouponStatus(coupon);
  const courseMap = new Map(courses.map((c) => [String(c.id), c.title]));

  return (
    <Sheet open={!!coupon} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto"
        data-ocid="coupons.detail_sheet"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="font-display flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Coupon Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          {/* Code + status */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Coupon Code
              </p>
              <p className="font-mono text-2xl font-bold text-foreground tracking-widest">
                {coupon.code}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Discount",
                value:
                  coupon.discountType === DiscountType.Percent
                    ? `${coupon.discountValue}%`
                    : `₹${coupon.discountValue}`,
              },
              {
                label: "Usage",
                value: formatUsage(coupon.usedCount, coupon.maxUsage),
              },
              { label: "Expiry", value: formatExpiry(coupon.expiryDate) },
              {
                label: "Created",
                value: format(
                  new Date(Number(coupon.createdAt) / 1_000_000),
                  "dd MMM yyyy",
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Courses */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Applicable Courses
            </p>
            {coupon.courseIds.length === 0 ? (
              <Badge variant="secondary">All Courses</Badge>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {coupon.courseIds.map((id) => (
                  <Badge key={id} variant="outline" className="text-xs">
                    {courseMap.get(id) ?? id}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Usage History */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Usage History
            </p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div
                className="rounded-lg border border-dashed border-border py-8 text-center"
                data-ocid="coupons.usage_history.empty_state"
              >
                <p className="text-sm text-muted-foreground">
                  No usage recorded yet
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h, i) => (
                      <TableRow
                        key={`${h.userId.toString()}-${i}`}
                        data-ocid={`coupons.usage.item.${i + 1}`}
                      >
                        <TableCell className="text-xs font-mono truncate max-w-[100px]">
                          {h.userId.toString().slice(0, 10)}…
                        </TableCell>
                        <TableCell className="text-xs">
                          {courseMap.get(h.courseId) ?? h.courseId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(Number(h.usedAt) / 1_000_000),
                            "dd MMM yy",
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Skeleton key={n} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

function CouponsPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const enabled = !!actor && !isFetching;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | undefined>();
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);
  const [detailCoupon, setDetailCoupon] = useState<Coupon | null>(null);

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoupons();
    },
    enabled,
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCourses();
    },
    enabled,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCoupon(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
      setDeleteCoupon(null);
    },
    onError: () => toast.error("Failed to delete coupon"),
  });

  function copyCode(code: string) {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(`Copied: ${code}`));
  }

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      const matchSearch =
        !search || c.code.toLowerCase().includes(search.toLowerCase());
      const status = getCouponStatus(c);
      const matchStatus = statusFilter === "All" || status === statusFilter;
      const matchCourse =
        courseFilter === "All" ||
        c.courseIds.length === 0 ||
        c.courseIds.includes(courseFilter);
      return matchSearch && matchStatus && matchCourse;
    });
  }, [coupons, search, statusFilter, courseFilter]);

  const stats = useMemo(() => {
    const active = coupons.filter(
      (c) => getCouponStatus(c) === "Active",
    ).length;
    const expired = coupons.filter(
      (c) => getCouponStatus(c) === "Expired",
    ).length;
    const totalUses = coupons.reduce((sum, c) => sum + Number(c.usedCount), 0);
    return { active, expired, totalUses };
  }, [coupons]);

  return (
    <Layout>
      <div className="space-y-6" data-ocid="coupons.page">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: "Coupons" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" />
                Coupon Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Create and manage discount codes for your courses
              </p>
            </div>
            <Button
              className="gap-2 shrink-0"
              onClick={() => {
                setEditCoupon(undefined);
                setCreateOpen(true);
              }}
              data-ocid="coupons.create_button"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total Coupons",
              value: coupons.length,
              icon: Ticket,
              color: "text-primary",
            },
            {
              label: "Active",
              value: stats.active,
              icon: CheckCircle2,
              color: "text-emerald-600",
            },
            {
              label: "Total Uses",
              value: stats.totalUses,
              icon: Percent,
              color: "text-accent",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 ${color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-foreground font-display">
                    {value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coupon code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-ocid="coupons.search_input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-full sm:w-36"
              data-ocid="coupons.status_filter_select"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Active", "Inactive", "Expired"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger
              className="w-full sm:w-44"
              data-ocid="coupons.course_filter_select"
            >
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <Card className="py-20" data-ocid="coupons.empty_state">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-dashed border-primary/30">
                <Ticket className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">
                  {search || statusFilter !== "All" || courseFilter !== "All"
                    ? "No coupons match your filters"
                    : "No coupons yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "All" || courseFilter !== "All"
                    ? "Try adjusting your search or filters."
                    : "Create your first discount code to boost enrollments."}
                </p>
              </div>
              {!search && statusFilter === "All" && courseFilter === "All" && (
                <Button
                  className="gap-2 mt-2"
                  onClick={() => {
                    setEditCoupon(undefined);
                    setCreateOpen(true);
                  }}
                  data-ocid="coupons.empty_create_button"
                >
                  <Plus className="h-4 w-4" />
                  Create First Coupon
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Discount</TableHead>
                  <TableHead className="font-semibold">Expiry</TableHead>
                  <TableHead className="font-semibold">Usage</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((coupon, i) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow
                      key={coupon.id}
                      className="cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => setDetailCoupon(coupon)}
                      data-ocid={`coupons.item.${i + 1}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-primary tracking-wider bg-primary/8 px-2 py-0.5 rounded text-sm">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCode(coupon.code);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                            aria-label={`Copy ${coupon.code}`}
                            data-ocid={`coupons.copy_button.${i + 1}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs gap-1">
                          {coupon.discountType === DiscountType.Percent ? (
                            <>
                              <Percent className="h-3 w-3" />
                              Percent
                            </>
                          ) : (
                            <>₹ Fixed</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground tabular-nums">
                        {coupon.discountType === DiscountType.Percent
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatExpiry(coupon.expiryDate)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {formatUsage(coupon.usedCount, coupon.maxUsage)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditCoupon(coupon);
                              setCreateOpen(true);
                            }}
                            aria-label="Edit coupon"
                            data-ocid={`coupons.edit_button.${i + 1}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCoupon(coupon);
                            }}
                            aria-label="Delete coupon"
                            data-ocid={`coupons.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <CouponDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditCoupon(undefined);
        }}
        editCoupon={editCoupon}
        courses={courses}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["coupons"] })}
      />

      <DeleteDialog
        coupon={deleteCoupon}
        onClose={() => setDeleteCoupon(null)}
        onConfirm={() => deleteCoupon && deleteMut.mutate(deleteCoupon.id)}
        isPending={deleteMut.isPending}
      />

      <DetailSheet
        coupon={detailCoupon}
        courses={courses}
        onClose={() => setDetailCoupon(null)}
      />
    </Layout>
  );
}
