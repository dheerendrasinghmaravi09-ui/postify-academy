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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Award,
  Ban,
  Copy,
  Gift,
  Medal,
  Plus,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Layout } from "../components/layout/Layout";
import { useBackend } from "../hooks/useBackend";
import { rootRoute } from "../rootRoute";
import { ReferralCodeStatus } from "../types";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/referrals",
  component: ReferralsPage,
});

// ─── stat card ───────────────────────────────────────────────────────────────

interface StatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  ocid: string;
}

function StatCard({
  label,
  value,
  icon,
  accent = "text-primary",
  ocid,
}: StatProps) {
  return (
    <Card className="card-hover" data-ocid={ocid}>
      <CardContent className="py-4 px-5 flex items-center gap-4">
        <div className={`rounded-lg bg-muted p-2.5 ${accent}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-display text-2xl font-bold mt-0.5 ${accent}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── skeleton rows ────────────────────────────────────────────────────────────

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="p-4 space-y-2">
      {SKELETON_KEYS.slice(0, count).map((k) => (
        <Skeleton key={k} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

function ReferralsPage() {
  const { actor, isFetching } = useBackend();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<bigint | null>(null);
  const [confirmRegenId, setConfirmRegenId] = useState<bigint | null>(null);

  const enabled = !!actor && !isFetching;

  const { data: codes = [], isLoading: loadingCodes } = useQuery({
    queryKey: ["referral-codes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReferralCodes();
    },
    enabled,
  });

  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ["referral-rewards"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllRewards();
    },
    enabled,
  });

  const { data: topRefs = [], isLoading: loadingTop } = useQuery({
    queryKey: ["top-referrers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.topReferrers();
    },
    enabled,
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.createReferralCode();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-codes"] });
      setShowCreate(false);
      toast.success("Referral code generated successfully");
    },
    onError: () => toast.error("Failed to generate referral code"),
  });

  const revokeCode = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.revokeReferralCode(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-codes"] });
      setConfirmRevokeId(null);
      toast.success("Referral code revoked");
    },
    onError: () => toast.error("Failed to revoke code"),
  });

  const regenCode = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.regenerateReferralCode(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-codes"] });
      setConfirmRegenId(null);
      toast.success("Code regenerated successfully");
    },
    onError: () => toast.error("Failed to regenerate code"),
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const totalCodes = codes.length;
  const totalConversions = codes.reduce(
    (s, c) => s + Number(c.conversionCount),
    0,
  );
  const totalRewardPoints = rewards.reduce(
    (s, r) => s + Number(r.rewardPoints),
    0,
  );
  const activeCount = codes.filter(
    (c) => c.status === ReferralCodeStatus.Active,
  ).length;

  // Sort top referrers descending by rewardPoints as proxy for conversions
  const sortedTop = [...topRefs].sort(
    (a, b) => Number(b.rewardPoints) - Number(a.rewardPoints),
  );

  return (
    <Layout>
      <div className="space-y-6" data-ocid="referrals.page">
        {/* Header */}
        <div>
          <Breadcrumbs items={[{ label: "Referrals" }]} />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Referral System
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track codes, conversions, rewards, and top referrers
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="gap-2"
              data-ocid="referrals.add_button"
            >
              <Plus className="h-4 w-4" />
              Generate Code
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Codes Generated"
            value={totalCodes}
            icon={<Gift className="h-5 w-5" />}
            accent="text-primary"
            ocid="referrals.stat.item.1"
          />
          <StatCard
            label="Active Codes"
            value={activeCount}
            icon={<Users className="h-5 w-5" />}
            accent="text-accent"
            ocid="referrals.stat.item.2"
          />
          <StatCard
            label="Total Conversions"
            value={totalConversions}
            icon={<Award className="h-5 w-5" />}
            accent="text-chart-3"
            ocid="referrals.stat.item.3"
          />
          <StatCard
            label="Total Rewards Earned"
            value={totalRewardPoints.toLocaleString()}
            icon={<Trophy className="h-5 w-5" />}
            accent="text-chart-5"
            ocid="referrals.stat.item.4"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="codes" data-ocid="referrals.tabs">
          <TabsList className="mb-4">
            <TabsTrigger value="codes" data-ocid="referrals.tab.codes">
              Referral Codes
            </TabsTrigger>
            <TabsTrigger value="rewards" data-ocid="referrals.tab.rewards">
              Rewards
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              data-ocid="referrals.tab.leaderboard"
            >
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* ── Referral Codes Tab ── */}
          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base font-semibold">
                  All Referral Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingCodes ? (
                  <SkeletonRows />
                ) : codes.length === 0 ? (
                  <div
                    className="py-14 text-center"
                    data-ocid="referrals.codes.empty_state"
                  >
                    <Gift className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">
                      No referral codes yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Generate your first code to start rewarding your community
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowCreate(true)}
                      data-ocid="referrals.empty_generate_button"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Generate First Code
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">Code</TableHead>
                          <TableHead className="font-semibold">
                            Generated
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Usage
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Conversions
                          </TableHead>
                          <TableHead className="font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {codes.map((code, i) => (
                          <TableRow
                            key={String(code.id)}
                            data-ocid={`referrals.item.${i + 1}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm truncate max-w-[140px]">
                                  {code.code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => copyToClipboard(code.code)}
                                  aria-label="Copy code"
                                  data-ocid={`referrals.copy_button.${i + 1}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(
                                new Date(
                                  Number(code.generatedDate) / 1_000_000,
                                ),
                                "dd MMM yyyy",
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {String(code.usageCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {String(code.conversionCount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  code.status === ReferralCodeStatus.Active
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {code.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1.5 text-xs"
                                  onClick={() => setConfirmRegenId(code.id)}
                                  data-ocid={`referrals.regen_button.${i + 1}`}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  Regen
                                </Button>
                                {code.status === ReferralCodeStatus.Active && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setConfirmRevokeId(code.id)}
                                    data-ocid={`referrals.revoke_button.${i + 1}`}
                                  >
                                    <Ban className="h-3 w-3" />
                                    Revoke
                                  </Button>
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
          </TabsContent>

          {/* ── Rewards Tab ── */}
          <TabsContent value="rewards">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-base font-semibold">
                  Reward Points per Referrer
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4 text-accent" />
                  <span>
                    <span className="font-semibold text-foreground">
                      10 pts
                    </span>{" "}
                    per conversion
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRewards ? (
                  <SkeletonRows />
                ) : rewards.length === 0 ? (
                  <div
                    className="py-14 text-center"
                    data-ocid="referrals.rewards.empty_state"
                  >
                    <Award className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">
                      No rewards issued yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rewards appear when referral conversions are recorded
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">#</TableHead>
                          <TableHead className="font-semibold">
                            Referrer ID
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Total Reward Points
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rewards.map((r, i) => (
                          <TableRow
                            key={r.referrerId.toString()}
                            data-ocid={`referrals.reward.item.${i + 1}`}
                          >
                            <TableCell className="text-sm text-muted-foreground w-10">
                              {i + 1}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm truncate block max-w-[260px]">
                                {r.referrerId.toString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className="gap-1 text-accent border-accent/30 bg-accent/5"
                              >
                                <Award className="h-3 w-3" />
                                {Number(r.rewardPoints).toLocaleString()} pts
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Leaderboard Tab ── */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-chart-5" />
                  Top Referrers Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingTop ? (
                  <SkeletonRows count={5} />
                ) : sortedTop.length === 0 ? (
                  <div
                    className="py-14 text-center"
                    data-ocid="referrals.leaderboard.empty_state"
                  >
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">
                      Leaderboard is empty
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Top referrers will appear here once conversions start
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold w-16">
                            Rank
                          </TableHead>
                          <TableHead className="font-semibold">
                            Referrer ID
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Rewards Earned
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTop.map((r, i) => {
                          const rank = i + 1;
                          const rankIcon =
                            rank === 1 ? (
                              <Medal className="h-4 w-4 text-yellow-500" />
                            ) : rank === 2 ? (
                              <Medal className="h-4 w-4 text-slate-400" />
                            ) : rank === 3 ? (
                              <Medal className="h-4 w-4 text-orange-400" />
                            ) : null;
                          return (
                            <TableRow
                              key={r.referrerId.toString()}
                              data-ocid={`referrals.leaderboard.item.${rank}`}
                              className={rank <= 3 ? "bg-muted/20" : ""}
                            >
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {rankIcon}
                                  <span
                                    className={`font-bold tabular-nums text-sm ${
                                      rank === 1
                                        ? "text-yellow-500"
                                        : rank === 2
                                          ? "text-muted-foreground"
                                          : rank === 3
                                            ? "text-orange-400"
                                            : "text-muted-foreground"
                                    }`}
                                  >
                                    #{rank}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm truncate block max-w-[280px]">
                                  {r.referrerId.toString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="gap-1 text-chart-5 border-chart-5/30 bg-chart-5/5"
                                >
                                  <Trophy className="h-3 w-3" />
                                  {Number(r.rewardPoints).toLocaleString()} pts
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Generate Code Dialog ── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent data-ocid="referrals.dialog">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Generate New Referral Code
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              A unique referral code will be automatically generated and
              activated. Share it with users to track conversions and award
              reward points.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                data-ocid="referrals.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createCode.mutate()}
                disabled={createCode.isPending}
                data-ocid="referrals.submit_button"
              >
                {createCode.isPending ? "Generating..." : "Generate Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Revoke Confirmation Dialog ── */}
        <Dialog
          open={confirmRevokeId !== null}
          onOpenChange={(open) => !open && setConfirmRevokeId(null)}
        >
          <DialogContent data-ocid="referrals.revoke.dialog">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                Revoke Referral Code?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              This code will no longer be usable. Existing conversions will
              retain their rewards. This action cannot be undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmRevokeId(null)}
                data-ocid="referrals.revoke.cancel_button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  confirmRevokeId !== null && revokeCode.mutate(confirmRevokeId)
                }
                disabled={revokeCode.isPending}
                data-ocid="referrals.revoke.confirm_button"
              >
                {revokeCode.isPending ? "Revoking..." : "Revoke Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Regenerate Confirmation Dialog ── */}
        <Dialog
          open={confirmRegenId !== null}
          onOpenChange={(open) => !open && setConfirmRegenId(null)}
        >
          <DialogContent data-ocid="referrals.regen.dialog">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Regenerate Referral Code?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              The existing code will be replaced with a new unique code.
              Previous usage data will be preserved. The old code will stop
              working immediately.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmRegenId(null)}
                data-ocid="referrals.regen.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  confirmRegenId !== null && regenCode.mutate(confirmRegenId)
                }
                disabled={regenCode.isPending}
                data-ocid="referrals.regen.confirm_button"
              >
                {regenCode.isPending ? "Regenerating..." : "Regenerate Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
