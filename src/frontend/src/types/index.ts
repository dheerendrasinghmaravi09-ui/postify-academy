// Re-export backend types
export type {
  Audience,
  Course,
  CourseModule,
  Lesson,
  UserProfile,
  Transaction,
  MockTest,
  Question,
  TestResult,
  Notification,
  ReferralCode,
  ReferralReward,
  ContentFile,
  HomepageContent,
  StudyChallenge,
  DailyQuestion,
  MotivationalMessage,
  CountdownTimer,
  AnalyticsSummary,
  RevenueStats,
  TimeSeriesDataPoint,
  AuditLogEntry,
  UserProgress,
  NotificationHistory,
  UserId,
  Timestamp,
} from "../backend";

export {
  FileType,
  NotificationStatus,
  PaymentStatus,
  ReferralCodeStatus,
  UserRole,
  UserStatus,
  VideoType,
} from "../backend";

// UI-only types
export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

// ─── Payment & Withdrawal types ────────────────────────────────────────────────
export interface BankAccountDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  upiId?: string;
}

export type WithdrawalStatus =
  | { Pending: null }
  | { Processing: null }
  | { Completed: null }
  | { Failed: null };

export interface WithdrawalRequest {
  id: bigint;
  amount: number;
  status: WithdrawalStatus;
  bankDetails: BankAccountDetails;
  razorpayPayoutId?: string;
  requestedAt: bigint;
  processedAt?: bigint;
  notes?: string;
}

export interface WithdrawalStats {
  totalWithdrawn: number;
  pendingAmount: number;
  completedRequests: bigint;
  failedRequests: bigint;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  accountNumber?: string;
  enabled: boolean;
}

export interface ConnectedAppInfo {
  appName: string;
  appUrl: string;
  totalCourses: bigint;
  publishedCourses: bigint;
  totalStudents: bigint;
  lastSyncAt?: bigint;
  syncStatus: { Connected: null } | { Syncing: null } | { Disconnected: null };
}
