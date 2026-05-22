import type { backendInterface } from "../backend";
import {
  ConnectedAppSyncStatus,
  DiscountType,
  FileType,
  NotificationStatus,
  PaymentStatus,
  ReferralCodeStatus,
  SyncStatus,
  SyncType,
  UserRole,
  UserStatus,
  VideoType,
  WithdrawalStatus,
} from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const samplePrincipal = Principal.fromText("aaaaa-aa");
const now = BigInt(Date.now()) * BigInt(1_000_000);

export const mockBackend: backendInterface = {
  // ─── Auth ─────────────────────────────────────────────────────────────────
  isCallerAdmin: async () => true,
  getCallerUserRole: async () => UserRole.admin,
  assignCallerUserRole: async () => undefined,

  // ─── Courses ─────────────────────────────────────────────────────────────
  listCourses: async () => [
    {
      id: BigInt(1),
      title: "Complete React Developer",
      description: "Master React with hooks, context, and advanced patterns",
      price: BigInt(2999),
      isFree: false,
      isPublished: true,
      createdAt: now,
      moduleCount: BigInt(8),
      enrollmentCount: BigInt(342),
      thumbnailBlob: { getBytes: async () => new Uint8Array(), getDirectURL: () => "https://picsum.photos/seed/react/400/225", withUploadProgress: (fn) => ({ getBytes: async () => new Uint8Array(), getDirectURL: () => "", withUploadProgress: fn, ...{} }) } as never,
    },
    {
      id: BigInt(2),
      title: "Node.js Backend Mastery",
      description: "Build scalable APIs with Node.js and Express",
      price: BigInt(1999),
      isFree: false,
      isPublished: true,
      createdAt: now,
      moduleCount: BigInt(6),
      enrollmentCount: BigInt(218),
      thumbnailBlob: { getBytes: async () => new Uint8Array(), getDirectURL: () => "https://picsum.photos/seed/node/400/225", withUploadProgress: (fn) => ({ getBytes: async () => new Uint8Array(), getDirectURL: () => "", withUploadProgress: fn, ...{} }) } as never,
    },
    {
      id: BigInt(3),
      title: "Python for Data Science",
      description: "Pandas, NumPy, ML fundamentals",
      price: BigInt(0),
      isFree: true,
      isPublished: false,
      createdAt: now,
      moduleCount: BigInt(4),
      enrollmentCount: BigInt(89),
      thumbnailBlob: { getBytes: async () => new Uint8Array(), getDirectURL: () => "https://picsum.photos/seed/python/400/225", withUploadProgress: (fn) => ({ getBytes: async () => new Uint8Array(), getDirectURL: () => "", withUploadProgress: fn, ...{} }) } as never,
    },
  ],
  getCourse: async () => null,
  createCourse: async () => BigInt(4),
  updateCourse: async () => true,
  deleteCourse: async () => true,
  publishCourse: async () => true,

  // ─── Modules ─────────────────────────────────────────────────────────────
  listModules: async () => [
    { id: BigInt(1), title: "Getting Started", order: BigInt(1), courseId: BigInt(1) },
    { id: BigInt(2), title: "Core Concepts", order: BigInt(2), courseId: BigInt(1) },
  ],
  createModule: async () => BigInt(3),
  updateModule: async () => true,
  deleteModule: async () => true,

  // ─── Lessons ─────────────────────────────────────────────────────────────
  listLessons: async () => [
    {
      id: BigInt(1),
      moduleId: BigInt(1),
      title: "Introduction to React",
      pdfUrls: [],
      order: BigInt(1),
      videoType: VideoType.YouTube,
      isLocked: false,
      videoUrl: "https://youtube.com/watch?v=abc",
      videoFiles: [
        {
          fileKey: "vid-key-1",
          fileName: "intro-react.mp4",
          fileSize: BigInt(52428800),
          duration: "12:34",
          sortOrder: BigInt(0),
          uploadedAt: now,
        },
      ],
      pdfFiles: [
        {
          fileKey: "pdf-key-1",
          fileName: "react-intro-notes.pdf",
          fileSize: BigInt(1048576),
          description: "Chapter 1 notes",
          sortOrder: BigInt(0),
          uploadedAt: now,
        },
      ],
    },
    {
      id: BigInt(2),
      moduleId: BigInt(1),
      title: "JSX Deep Dive",
      pdfUrls: [],
      order: BigInt(2),
      videoType: VideoType.YouTube,
      isLocked: true,
      videoUrl: "https://youtube.com/watch?v=def",
      videoFiles: [],
      pdfFiles: [],
    },
  ],
  createLesson: async () => BigInt(3),
  updateLesson: async () => true,
  deleteLesson: async () => true,

  // ─── New lesson file APIs ──────────────────────────────────────────────────
  addVideoFileToLesson: async () => true,
  removeVideoFileFromLesson: async () => true,
  addPdfFileToLesson: async () => true,
  removePdfFileFromLesson: async () => true,
  reorderLessonFiles: async () => true,
  recordVideoView: async () => undefined,
  recordPdfDownload: async () => undefined,

  // ─── Users ───────────────────────────────────────────────────────────────
  listUsers: async () => [
    { id: samplePrincipal, name: "Arjun Sharma", email: "arjun@example.com", phone: "+91 98765 43210", status: UserStatus.Active, createdAt: now, lastLogin: now, totalPurchases: BigInt(5998), enrolledCourses: [BigInt(1), BigInt(2)] },
    { id: samplePrincipal, name: "Priya Patel", email: "priya@example.com", phone: "+91 87654 32109", status: UserStatus.Active, createdAt: now, lastLogin: now, totalPurchases: BigInt(2999), enrolledCourses: [BigInt(1)] },
    { id: samplePrincipal, name: "Rahul Gupta", email: "rahul@example.com", phone: "+91 76543 21098", status: UserStatus.Blocked, createdAt: now, lastLogin: now, totalPurchases: BigInt(0), enrolledCourses: [] },
  ],
  getUser: async () => null,
  getUserDetail: async () => null,
  upsertUser: async () => undefined,
  setUserStatus: async () => true,
  grantCourseAccess: async () => true,
  revokeCourseAccess: async () => true,
  getUserProgress: async () => null,
  listUserProgress: async () => [],
  upsertProgress: async () => undefined,

  // ─── Payments ────────────────────────────────────────────────────────────
  getRevenueStats: async () => ({
    totalRevenue: BigInt(485200),
    mrr: BigInt(42500),
    mtdRevenue: BigInt(38900),
    activeSubscriptions: BigInt(128),
    churnedSubscriptions: BigInt(12),
    transactionCount: BigInt(318),
  }),
  listTransactions: async () => [
    { id: BigInt(1), userId: samplePrincipal, courseId: BigInt(1), amount: BigInt(2999), status: PaymentStatus.Completed, paymentMethod: "UPI", date: now },
    { id: BigInt(2), userId: samplePrincipal, courseId: BigInt(2), amount: BigInt(1999), status: PaymentStatus.Completed, paymentMethod: "Card", date: now },
    { id: BigInt(3), userId: samplePrincipal, courseId: BigInt(3), amount: BigInt(2999), status: PaymentStatus.Pending, paymentMethod: "NetBanking", date: now },
    { id: BigInt(4), userId: samplePrincipal, courseId: BigInt(1), amount: BigInt(1999), status: PaymentStatus.Failed, paymentMethod: "UPI", date: now },
    { id: BigInt(5), userId: samplePrincipal, courseId: BigInt(2), amount: BigInt(2999), status: PaymentStatus.Refunded, paymentMethod: "Card", date: now, refundReason: "Course not as described" },
  ],
  listTransactionsPaginated: async () => ({
    items: [
      { id: BigInt(1), userId: samplePrincipal, courseId: BigInt(1), amount: BigInt(2999), status: PaymentStatus.Completed, paymentMethod: "UPI", date: now },
      { id: BigInt(2), userId: samplePrincipal, courseId: BigInt(2), amount: BigInt(1999), status: PaymentStatus.Completed, paymentMethod: "Card", date: now },
    ],
    total: BigInt(318),
    offset: BigInt(0),
    limit: BigInt(20),
  }),
  getTransaction: async () => null,
  addTransaction: async () => BigInt(6),
  updateTransactionStatus: async () => true,
  refundTransaction: async () => true,
  filterTransactions: async () => [],
  listFailedTransactions: async () => [],
  listUserTransactions: async () => [],

  // ─── Mock Tests ──────────────────────────────────────────────────────────
  listMockTests: async () => [
    { id: BigInt(1), title: "React Fundamentals Quiz", courseId: BigInt(1), timerMinutes: BigInt(30), passingScore: BigInt(70), negativeMarking: false },
    { id: BigInt(2), title: "Advanced JavaScript Test", courseId: BigInt(2), timerMinutes: BigInt(45), passingScore: BigInt(75), negativeMarking: true },
  ],
  getMockTest: async () => null,
  createMockTest: async () => BigInt(3),
  updateMockTest: async () => true,
  deleteMockTest: async () => true,
  listQuestions: async () => [
    { id: BigInt(1), testId: BigInt(1), text: "What is JSX?", options: ["A syntax extension", "A library", "A framework", "A build tool"], correctIndex: BigInt(0), explanation: "JSX is a syntax extension for JavaScript" },
    { id: BigInt(2), testId: BigInt(1), text: "What hook manages state?", options: ["useEffect", "useState", "useRef", "useContext"], correctIndex: BigInt(1), explanation: "useState is used to manage component state" },
  ],
  addQuestion: async () => BigInt(3),
  updateQuestion: async () => true,
  deleteQuestion: async () => true,
  getTestLeaderboard: async () => [
    { userId: samplePrincipal, testId: BigInt(1), score: BigInt(95), percentage: BigInt(95), timeTaken: BigInt(1200), passed: true },
    { userId: samplePrincipal, testId: BigInt(1), score: BigInt(82), percentage: BigInt(82), timeTaken: BigInt(1500), passed: true },
  ],
  getTestResult: async () => null,
  gradeAndSubmit: async () => ({ userId: samplePrincipal, testId: BigInt(1), score: BigInt(85), percentage: BigInt(85), timeTaken: BigInt(1800), passed: true }),
  reviewTestAnswers: async () => [],
  submitTestResult: async () => undefined,
  getChallengeLeaderboard: async () => [["arjun@example.com", BigInt(120)], ["priya@example.com", BigInt(95)]],

  // ─── Engagement ──────────────────────────────────────────────────────────
  listDailyQuestions: async () => [
    { id: BigInt(1), text: "What is the time complexity of binary search?", correctAnswer: "O(log n)", scheduledDate: "2026-04-17", audience: { __kind__: "All", All: null } },
    { id: BigInt(2), text: "What does CSS stand for?", correctAnswer: "Cascading Style Sheets", scheduledDate: "2026-04-18", audience: { __kind__: "All", All: null } },
  ],
  addDailyQuestion: async () => BigInt(3),
  updateDailyQuestion: async () => true,
  deleteDailyQuestion: async () => true,
  listChallenges: async () => [
    { id: BigInt(1), title: "7-Day Coding Sprint", description: "Complete 7 lessons in 7 days", endDate: "2026-04-24", rewardPoints: BigInt(100), goalCount: BigInt(7) },
    { id: BigInt(2), title: "Quiz Master Challenge", description: "Score 90%+ on 3 quizzes", endDate: "2026-04-30", rewardPoints: BigInt(150), goalCount: BigInt(3) },
  ],
  addChallenge: async () => BigInt(3),
  updateChallenge: async () => true,
  deleteChallenge: async () => true,
  recordChallengeCompletion: async () => BigInt(1),
  listTimers: async () => [
    { id: BigInt(1), name: "Summer Batch Enrollment", targetDate: "2026-05-01" },
    { id: BigInt(2), name: "Flash Sale Ends", targetDate: "2026-04-20" },
  ],
  addTimer: async () => BigInt(3),
  deleteTimer: async () => true,
  listMotivationalMessages: async () => [
    { id: BigInt(1), text: "Success is the sum of small efforts, repeated day in and day out.", audience: { __kind__: "All", All: null }, scheduledAt: now },
    { id: BigInt(2), text: "Believe you can and you're halfway there.", audience: { __kind__: "All", All: null }, scheduledAt: now },
  ],
  addMotivationalMessage: async () => BigInt(3),
  deleteMotivationalMessage: async () => true,

  // ─── Notifications ───────────────────────────────────────────────────────
  listNotifications: async () => [
    { id: BigInt(1), title: "New Course Available!", body: "Check out our latest React course", status: NotificationStatus.Sent, audience: { __kind__: "All", All: null }, ctaUrl: "/courses", sentAt: now },
    { id: BigInt(2), title: "Limited Time Offer", body: "Get 50% off all courses this weekend", status: NotificationStatus.Scheduled, audience: { __kind__: "All", All: null }, ctaUrl: "/courses", scheduledAt: now },
    { id: BigInt(3), title: "Quiz Reminder", body: "Don't forget to complete your daily quiz", status: NotificationStatus.Draft, audience: { __kind__: "All", All: null }, ctaUrl: "/quiz" },
  ],
  getNotification: async () => null,
  createNotification: async () => BigInt(4),
  updateNotification: async () => true,
  deleteNotification: async () => true,
  sendNotification: async () => true,
  getSentNotifications: async () => [],
  getNotificationHistory: async () => [
    { status: NotificationStatus.Sent, sentCount: BigInt(1024) },
    { status: NotificationStatus.Failed, sentCount: BigInt(12) },
  ],

  // ─── Referrals ───────────────────────────────────────────────────────────
  listReferralCodes: async () => [
    { id: BigInt(1), code: "POSTIFY2026", status: ReferralCodeStatus.Active, usageCount: BigInt(45), conversionCount: BigInt(32), generatedDate: now },
    { id: BigInt(2), code: "ARJUN100", status: ReferralCodeStatus.Active, usageCount: BigInt(23), conversionCount: BigInt(18), generatedDate: now },
    { id: BigInt(3), code: "SUMMER50", status: ReferralCodeStatus.Revoked, usageCount: BigInt(89), conversionCount: BigInt(61), generatedDate: now },
  ],
  createReferralCode: async () => BigInt(4),
  revokeReferralCode: async () => true,
  regenerateReferralCode: async () => BigInt(5),
  useReferralCode: async () => true,
  listAllRewards: async () => [
    { referrerId: samplePrincipal, rewardPoints: BigInt(320) },
    { referrerId: samplePrincipal, rewardPoints: BigInt(180) },
  ],
  getMyRewards: async () => null,
  topReferrers: async () => [
    { referrerId: samplePrincipal, rewardPoints: BigInt(320) },
    { referrerId: samplePrincipal, rewardPoints: BigInt(240) },
  ],

  // ─── Content ─────────────────────────────────────────────────────────────
  listContentFiles: async () => [
    { id: BigInt(1), title: "React Cheatsheet", name: "react-cheatsheet.pdf", description: "Quick reference for React hooks", fileType: FileType.PDF, isPublished: true, uploadedAt: now, fileBlob: { getBytes: async () => new Uint8Array(), getDirectURL: () => "/files/react.pdf", withUploadProgress: (fn) => ({ getBytes: async () => new Uint8Array(), getDirectURL: () => "", withUploadProgress: fn, ...{} }) } as never },
    { id: BigInt(2), title: "JavaScript eBook", name: "javascript-ebook.epub", description: "Complete JS guide", fileType: FileType.EPUB, isPublished: true, uploadedAt: now, author: "John Doe", fileBlob: { getBytes: async () => new Uint8Array(), getDirectURL: () => "/files/js.epub", withUploadProgress: (fn) => ({ getBytes: async () => new Uint8Array(), getDirectURL: () => "", withUploadProgress: fn, ...{} }) } as never },
    { id: BigInt(3), title: "Summer Banner", name: "summer-banner.png", description: "Promotional banner", fileType: FileType.Banner, isPublished: false, uploadedAt: now, fileBlob: { getBytes: async () => new Uint8Array(), getDirectURL: () => "https://picsum.photos/seed/banner/1200/400", withUploadProgress: (fn) => ({ getBytes: async () => new Uint8Array(), getDirectURL: () => "", withUploadProgress: fn, ...{} }) } as never },
  ],
  getContentFile: async () => null,
  addContentFile: async () => BigInt(4),
  updateContentFile: async () => true,
  deleteContentFile: async () => true,
  setContentFilePublished: async () => true,
  getHomepageContent: async () => ({ featuredCourseIds: [BigInt(1), BigInt(2)], bannerIds: [BigInt(3)], announcements: ["New batch starting May 1st!", "Flash sale: 50% off this weekend"] }),
  setHomepageContent: async () => undefined,

  // ─── Analytics ───────────────────────────────────────────────────────────
  getAnalyticsSummary: async () => ({
    totalUsers: BigInt(4821),
    activeUsers: BigInt(1243),
    newSignupsThisMonth: BigInt(312),
    totalRevenue: BigInt(485200),
    courseCompletionRate: 0.68,
    avgStudyHoursPerUser: 4.5,
    retentionRate: 0.73,
    mrrGrowthPercent: 12.4,
  }),
  getRevenueTimeSeries: async () => [
    { date: "2026-04-11", value: 12400 }, { date: "2026-04-12", value: 9800 }, { date: "2026-04-13", value: 15600 }, { date: "2026-04-14", value: 11200 }, { date: "2026-04-15", value: 18900 }, { date: "2026-04-16", value: 14300 }, { date: "2026-04-17", value: 16700 },
  ],
  getUserSignupTimeSeries: async () => [
    { date: "2026-04-11", value: 42 }, { date: "2026-04-12", value: 38 }, { date: "2026-04-13", value: 55 }, { date: "2026-04-14", value: 49 }, { date: "2026-04-15", value: 67 }, { date: "2026-04-16", value: 51 }, { date: "2026-04-17", value: 73 },
  ],
  getCourseCompletionTimeSeries: async () => [
    { date: "2026-04-11", value: 0.62 }, { date: "2026-04-12", value: 0.65 }, { date: "2026-04-13", value: 0.63 }, { date: "2026-04-14", value: 0.68 }, { date: "2026-04-15", value: 0.70 }, { date: "2026-04-16", value: 0.67 }, { date: "2026-04-17", value: 0.68 },
  ],
  getTopCoursesByEnrollment: async () => [
    { courseId: BigInt(1), enrollmentCount: BigInt(342) },
    { courseId: BigInt(2), enrollmentCount: BigInt(218) },
    { courseId: BigInt(3), enrollmentCount: BigInt(89) },
  ],
  getRetentionRates: async () => ({ day7: 0.73, day30: 0.58 }),

  // ─── Audit Log ───────────────────────────────────────────────────────────
  listAuditLog: async () => [
    { id: BigInt(1), action: "PUBLISH_COURSE", userId: samplePrincipal, timestamp: now, details: "Published course: Complete React Developer" },
    { id: BigInt(2), action: "BLOCK_USER", userId: samplePrincipal, timestamp: now, details: "Blocked user: rahul@example.com" },
    { id: BigInt(3), action: "REFUND_PAYMENT", userId: samplePrincipal, timestamp: now, details: "Refunded transaction #5" },
  ],

  // ─── Coupons ─────────────────────────────────────────────────────────────
  listCoupons: async () => [
    { id: "coupon-1", code: "LAUNCH50", discountType: DiscountType.Percent, discountValue: 50, maxUsage: BigInt(100), usedCount: BigInt(43), expiryDate: BigInt(new Date("2026-06-30").getTime()) * BigInt(1_000_000), createdAt: now, isActive: true, courseIds: [] },
    { id: "coupon-2", code: "FLAT200", discountType: DiscountType.Fixed, discountValue: 200, maxUsage: BigInt(50), usedCount: BigInt(12), expiryDate: BigInt(new Date("2026-05-15").getTime()) * BigInt(1_000_000), createdAt: now, isActive: true, courseIds: [] },
  ],
  createCoupon: async () => true,
  getCoupon: async () => null,
  updateCoupon: async () => true,
  deleteCoupon: async () => true,
  toggleCouponStatus: async () => true,
  useCoupon: async () => true,
  getCouponUsageHistory: async () => [],

  // ─── Payment Methods ─────────────────────────────────────────────────────
  listPaymentMethods: async () => [
    { methodId: "card", displayName: "Credit / Debit Card", isEnabled: true, lastUpdated: now },
    { methodId: "upi", displayName: "UPI", isEnabled: true, lastUpdated: now },
    { methodId: "netbanking", displayName: "Net Banking", isEnabled: true, lastUpdated: now },
    { methodId: "wallet", displayName: "Wallets", isEnabled: false, lastUpdated: now },
  ],
  getPaymentMethod: async () => null,
  setPaymentMethodEnabled: async () => true,
  upsertPaymentMethod: async () => undefined,

  // ─── App Branding ────────────────────────────────────────────────────────
  getAppBranding: async () => ({
    appName: "Postify Academy",
    tagline: "Learn. Grow. Succeed.",
    primaryColor: "#2563eb",
    accentColor: "#f97316",
    updatedAt: now,
  }),
  setAppBranding: async () => undefined,

  // ─── Sync ────────────────────────────────────────────────────────────────
  getSyncEndpoint: async () => ({ url: "https://postify.academy/app", isConnected: true, validatedAt: now }),
  setSyncEndpoint: async () => undefined,
  listSyncLogs: async () => [
    { id: "log-1", syncType: SyncType.Manual, status: SyncStatus.Success, itemsSynced: BigInt(48), syncedAt: now },
    { id: "log-2", syncType: SyncType.Auto, status: SyncStatus.Success, itemsSynced: BigInt(12), syncedAt: now },
  ],
  recordSyncLog: async () => undefined,
  clearSyncLogs: async () => undefined,
  getConnectedAppInfo: async () => ({
    appName: "Postify Course App",
    appUrl: "https://postify-academy-f0o.caffeine.xyz",
    totalCourses: BigInt(3),
    publishedCourses: BigInt(2),
    totalStudents: BigInt(4821),
    lastSyncAt: now,
    syncStatus: ConnectedAppSyncStatus.Connected,
  }),
  updateConnectedAppInfo: async () => undefined,

  // ─── Razorpay ────────────────────────────────────────────────────────────
  getRazorpayConfig: async () => ({
    enabled: true,
    keyId: "rzp_live_xxxxxxxx",
    keySecret: "••••••••••••••••",
    accountNumber: "1234567890",
  }),
  setRazorpayConfig: async () => undefined,

  // ─── Bank & Withdrawals ──────────────────────────────────────────────────
  getBankAccountDetails: async () => ({
    accountHolderName: "Postify Academy Pvt Ltd",
    accountNumber: "9876543210",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank",
    upiId: "postify@hdfcbank",
  }),
  setBankAccountDetails: async () => undefined,
  createWithdrawalRequest: async () => BigInt(1),
  cancelWithdrawalRequest: async () => true,
  listWithdrawalRequests: async () => ({
    items: [
      { id: BigInt(1), amount: 25000, status: WithdrawalStatus.Completed, bankDetails: { accountHolderName: "Postify Academy Pvt Ltd", accountNumber: "9876543210", ifscCode: "HDFC0001234", bankName: "HDFC Bank" }, requestedAt: now, processedAt: now, razorpayPayoutId: "pout_abc123" },
      { id: BigInt(2), amount: 15000, status: WithdrawalStatus.Processing, bankDetails: { accountHolderName: "Postify Academy Pvt Ltd", accountNumber: "9876543210", ifscCode: "HDFC0001234", bankName: "HDFC Bank" }, requestedAt: now },
      { id: BigInt(3), amount: 8500, status: WithdrawalStatus.Pending, bankDetails: { accountHolderName: "Postify Academy Pvt Ltd", accountNumber: "9876543210", ifscCode: "HDFC0001234", bankName: "HDFC Bank" }, requestedAt: now },
      { id: BigInt(4), amount: 5000, status: WithdrawalStatus.Failed, bankDetails: { accountHolderName: "Postify Academy Pvt Ltd", accountNumber: "9876543210", ifscCode: "HDFC0001234", bankName: "HDFC Bank" }, requestedAt: now, notes: "Insufficient balance" },
    ],
    total: BigInt(4),
    offset: BigInt(0),
    limit: BigInt(20),
  }),
  getWithdrawalRequest: async () => null,
  updateWithdrawalStatus: async () => true,
  getWithdrawalStats: async () => ({
    totalWithdrawn: 55000,
    pendingAmount: 23500,
    completedRequests: BigInt(12),
    failedRequests: BigInt(2),
  }),

  // ─── Course Stats ──────────────────────────────────────────────────────────
  listCourseStats: async () => [],
  getCourseStats: async () => null,
  getStudentProgress: async () => [],

  // ─── Object Storage internals (stubs) ─────────────────────────────────────
  _immutableObjectStorageBlobsAreLive: async () => [],
  _immutableObjectStorageBlobsToDelete: async () => [],
  _immutableObjectStorageConfirmBlobDeletion: async () => undefined,
  _immutableObjectStorageCreateCertificate: async () => ({ Ok: null } as never),
  _immutableObjectStorageRefillCashier: async () => ({} as never),
  _immutableObjectStorageUpdateGatewayPrincipals: async () => undefined,
  _initializeAccessControl: async () => undefined,
};
