import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface CourseEnrollment {
    courseId: bigint;
    enrollmentCount: bigint;
}
export interface SyncEndpoint {
    url: string;
    isConnected: boolean;
    validatedAt?: bigint;
}
export interface AnalyticsSummary {
    activeUsers: bigint;
    newSignupsThisMonth: bigint;
    avgStudyHoursPerUser: number;
    courseCompletionRate: number;
    totalUsers: bigint;
    totalRevenue: bigint;
    retentionRate: number;
    mrrGrowthPercent: number;
}
export interface WithdrawalStats {
    failedRequests: bigint;
    completedRequests: bigint;
    totalWithdrawn: number;
    pendingAmount: number;
}
export interface UserProgress {
    quizScores: Array<bigint>;
    userId: UserId;
    studyTime: bigint;
    completionPercent: bigint;
    courseId: bigint;
}
export interface NotificationHistory {
    status: NotificationStatus;
    sentCount: bigint;
}
export interface CourseModule {
    id: bigint;
    title: string;
    order: bigint;
    courseId: bigint;
}
export interface Lesson {
    id: bigint;
    moduleId: bigint;
    title: string;
    pdfUrls: Array<string>;
    order: bigint;
    videoType: VideoType;
    pdfFiles: Array<PdfFile>;
    isLocked: boolean;
    videoUrl: string;
    videoFiles: Array<VideoFile>;
}
export interface BankAccountDetails {
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    upiId?: string;
    accountNumber: string;
}
export interface StudentProgress {
    studentId: UserId;
    lastActivity: bigint;
    videosWatched: bigint;
    completionPercent: number;
    enrolledAt: bigint;
    lessonsCompleted: Array<string>;
    pdfsDownloaded: bigint;
    courseId: string;
}
export interface TransactionFilter {
    status?: PaymentStatus;
    userId?: UserId;
    toDate?: Timestamp;
    fromDate?: Timestamp;
}
export interface TimeSeriesDataPoint {
    value: number;
    date: string;
}
export interface MockTest {
    id: bigint;
    title: string;
    negativeMarking: boolean;
    passingScore: bigint;
    timerMinutes: bigint;
    courseId: bigint;
}
export interface ReviewItem {
    correctIndex: bigint;
    explanation: string;
    isCorrect: boolean;
    questionText: string;
    questionId: bigint;
    userSelectedIndex?: bigint;
    options: Array<string>;
}
export interface AuditLogEntry {
    id: bigint;
    action: string;
    userId: UserId;
    timestamp: Timestamp;
    details: string;
}
export interface PaginatedTransactions {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<Transaction>;
}
export type UserId = Principal;
export type NotificationAudience = {
    __kind__: "All";
    All: null;
} | {
    __kind__: "Course";
    Course: bigint;
} | {
    __kind__: "Individual";
    Individual: UserId;
};
export interface Notification {
    id: bigint;
    status: NotificationStatus;
    title: string;
    body: string;
    audience: NotificationAudience;
    sentAt?: Timestamp;
    ctaUrl: string;
    scheduledAt?: Timestamp;
}
export interface ReferralReward {
    rewardPoints: bigint;
    referrerId: UserId;
}
export interface ConnectedAppInfo {
    appName: string;
    totalStudents: bigint;
    appUrl: string;
    publishedCourses: bigint;
    lastSyncAt?: bigint;
    totalCourses: bigint;
    syncStatus: ConnectedAppSyncStatus;
}
export interface MotivationalMessage {
    id: bigint;
    text: string;
    audience: Audience;
    scheduledAt: Timestamp;
}
export interface PdfFile {
    sortOrder: bigint;
    description?: string;
    fileName: string;
    fileSize: bigint;
    uploadedAt: bigint;
    fileKey: string;
}
export interface ReferralCode {
    id: bigint;
    status: ReferralCodeStatus;
    code: string;
    usageCount: bigint;
    generatedDate: Timestamp;
    conversionCount: bigint;
}
export interface WithdrawalRequest {
    id: bigint;
    status: WithdrawalStatus;
    bankDetails: BankAccountDetails;
    processedAt?: bigint;
    razorpayPayoutId?: string;
    notes?: string;
    amount: number;
    requestedAt: bigint;
}
export interface UserProfile {
    id: UserId;
    status: UserStatus;
    name: string;
    createdAt: Timestamp;
    email: string;
    totalPurchases: bigint;
    phone: string;
    lastLogin: Timestamp;
    enrolledCourses: Array<bigint>;
}
export interface AppBranding {
    tagline: string;
    appName: string;
    primaryColor: string;
    accentColor: string;
    updatedAt: bigint;
    logoUrl?: string;
}
export interface WithdrawalFilter {
    status?: WithdrawalStatus;
}
export type Timestamp = bigint;
export interface CountdownTimer {
    id: bigint;
    name: string;
    targetDate: string;
}
export interface DailyQuestion {
    id: bigint;
    scheduledDate: string;
    text: string;
    correctAnswer: string;
    audience: Audience;
}
export interface PaginatedWithdrawals {
    total: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<WithdrawalRequest>;
}
export interface RevenueStats {
    mrr: bigint;
    churnedSubscriptions: bigint;
    mtdRevenue: bigint;
    totalRevenue: bigint;
    activeSubscriptions: bigint;
    transactionCount: bigint;
}
export interface Transaction {
    id: bigint;
    status: PaymentStatus;
    paymentMethod: string;
    refundReason?: string;
    userId: UserId;
    date: Timestamp;
    amount: bigint;
    courseId: bigint;
}
export interface PaymentMethodConfig {
    displayName: string;
    methodId: string;
    lastUpdated: bigint;
    isEnabled: boolean;
}
export interface Course {
    id: bigint;
    title: string;
    isPublished: boolean;
    createdAt: Timestamp;
    description: string;
    isFree: boolean;
    thumbnailBlob: ExternalBlob;
    moduleCount: bigint;
    price: bigint;
    enrollmentCount: bigint;
}
export interface UserAnswer {
    questionId: bigint;
    selectedIndex: bigint;
}
export interface HomepageContent {
    featuredCourseIds: Array<bigint>;
    bannerIds: Array<bigint>;
    announcements: Array<string>;
}
export interface ContentFile {
    id: bigint;
    title: string;
    isPublished: boolean;
    name: string;
    fileBlob: ExternalBlob;
    description?: string;
    fileType: FileType;
    author?: string;
    uploadedAt: Timestamp;
}
export interface SyncLogEntry {
    id: string;
    status: SyncStatus;
    errorMessage?: string;
    itemsSynced: bigint;
    syncType: SyncType;
    syncedAt: bigint;
}
export interface StudyChallenge {
    id: bigint;
    title: string;
    endDate: string;
    rewardPoints: bigint;
    description: string;
    goalCount: bigint;
}
export interface RetentionStats {
    day7: number;
    day30: number;
}
export type Audience = {
    __kind__: "All";
    All: null;
} | {
    __kind__: "CourseAudience";
    CourseAudience: bigint;
} | {
    __kind__: "Individual";
    Individual: UserId;
};
export interface CouponUsage {
    usedAt: bigint;
    userId: Principal;
    couponId: string;
    courseId: string;
}
export interface VideoFile {
    duration?: string;
    sortOrder: bigint;
    fileName: string;
    fileSize: bigint;
    uploadedAt: bigint;
    fileKey: string;
}
export interface Coupon {
    id: string;
    discountValue: number;
    expiryDate?: bigint;
    code: string;
    createdAt: bigint;
    discountType: DiscountType;
    maxUsage?: bigint;
    usedCount: bigint;
    isActive: boolean;
    courseIds: Array<string>;
}
export interface CourseStats {
    studentProgress: Array<StudentProgress>;
    avgCompletionPercent: number;
    totalRevenue: number;
    courseId: string;
    enrollmentCount: bigint;
}
export interface TestResult {
    userId: UserId;
    score: bigint;
    timeTaken: bigint;
    testId: bigint;
    percentage: bigint;
    passed: boolean;
}
export interface Question {
    id: bigint;
    correctIndex: bigint;
    explanation: string;
    text: string;
    testId: bigint;
    options: Array<string>;
}
export interface RazorpayConfig {
    enabled: boolean;
    accountNumber?: string;
    keyId: string;
    keySecret: string;
}
export enum ConnectedAppSyncStatus {
    Connected = "Connected",
    Disconnected = "Disconnected",
    Syncing = "Syncing"
}
export enum DiscountType {
    Percent = "Percent",
    Fixed = "Fixed"
}
export enum FileType {
    PDF = "PDF",
    EPUB = "EPUB",
    Image = "Image",
    Banner = "Banner"
}
export enum NotificationStatus {
    Failed = "Failed",
    Sent = "Sent",
    Draft = "Draft",
    Scheduled = "Scheduled"
}
export enum PaymentStatus {
    Failed = "Failed",
    Refunded = "Refunded",
    Completed = "Completed",
    Pending = "Pending"
}
export enum ReferralCodeStatus {
    Active = "Active",
    Revoked = "Revoked"
}
export enum SyncStatus {
    Failed = "Failed",
    Success = "Success"
}
export enum SyncType {
    Auto = "Auto",
    Manual = "Manual"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum UserStatus {
    Blocked = "Blocked",
    Active = "Active"
}
export enum VideoType {
    YouTube = "YouTube",
    GoogleDrive = "GoogleDrive"
}
export enum WithdrawalStatus {
    Failed = "Failed",
    Processing = "Processing",
    Completed = "Completed",
    Pending = "Pending"
}
export interface backendInterface {
    addChallenge(c: StudyChallenge): Promise<bigint>;
    addContentFile(f: ContentFile): Promise<bigint>;
    addDailyQuestion(dq: DailyQuestion): Promise<bigint>;
    addMotivationalMessage(m: MotivationalMessage): Promise<bigint>;
    addPdfFileToLesson(lessonId: string, pdfFile: PdfFile): Promise<boolean>;
    addQuestion(q: Question): Promise<bigint>;
    addTimer(t: CountdownTimer): Promise<bigint>;
    addTransaction(tx: Transaction): Promise<bigint>;
    addVideoFileToLesson(lessonId: string, videoFile: VideoFile): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelWithdrawalRequest(id: bigint): Promise<boolean>;
    clearSyncLogs(): Promise<void>;
    createCoupon(c: Coupon): Promise<boolean>;
    createCourse(course: Course): Promise<bigint>;
    createLesson(lesson: Lesson): Promise<bigint>;
    createMockTest(test: MockTest): Promise<bigint>;
    createModule(m: CourseModule): Promise<bigint>;
    createNotification(n: Notification): Promise<bigint>;
    createReferralCode(): Promise<bigint>;
    createWithdrawalRequest(amount: number, notes: string | null): Promise<bigint>;
    deleteChallenge(id: bigint): Promise<boolean>;
    deleteContentFile(id: bigint): Promise<boolean>;
    deleteCoupon(id: string): Promise<boolean>;
    deleteCourse(id: bigint): Promise<boolean>;
    deleteDailyQuestion(id: bigint): Promise<boolean>;
    deleteLesson(id: bigint): Promise<boolean>;
    deleteMockTest(id: bigint): Promise<boolean>;
    deleteModule(id: bigint): Promise<boolean>;
    deleteMotivationalMessage(id: bigint): Promise<boolean>;
    deleteNotification(id: bigint): Promise<boolean>;
    deleteQuestion(id: bigint): Promise<boolean>;
    deleteTimer(id: bigint): Promise<boolean>;
    filterTransactions(filter: TransactionFilter): Promise<Array<Transaction>>;
    getAnalyticsSummary(): Promise<AnalyticsSummary>;
    getAppBranding(): Promise<AppBranding>;
    getBankAccountDetails(): Promise<BankAccountDetails | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChallengeLeaderboard(): Promise<Array<[string, bigint]>>;
    getConnectedAppInfo(): Promise<ConnectedAppInfo>;
    getContentFile(id: bigint): Promise<ContentFile | null>;
    getCoupon(id: string): Promise<Coupon | null>;
    getCouponUsageHistory(couponId: string): Promise<Array<CouponUsage>>;
    getCourse(id: bigint): Promise<Course | null>;
    getCourseCompletionTimeSeries(days: bigint): Promise<Array<TimeSeriesDataPoint>>;
    getCourseStats(courseId: string): Promise<CourseStats | null>;
    getHomepageContent(): Promise<HomepageContent>;
    getMockTest(id: bigint): Promise<MockTest | null>;
    getMyRewards(): Promise<ReferralReward | null>;
    getNotification(id: bigint): Promise<Notification | null>;
    getNotificationHistory(): Promise<Array<NotificationHistory>>;
    getPaymentMethod(methodId: string): Promise<PaymentMethodConfig | null>;
    getRazorpayConfig(): Promise<RazorpayConfig | null>;
    getRetentionRates(): Promise<RetentionStats>;
    getRevenueStats(): Promise<RevenueStats>;
    getRevenueTimeSeries(days: bigint): Promise<Array<TimeSeriesDataPoint>>;
    getSentNotifications(): Promise<Array<Notification>>;
    getStudentProgress(courseId: string): Promise<Array<StudentProgress>>;
    getSyncEndpoint(): Promise<SyncEndpoint>;
    getTestLeaderboard(testId: bigint): Promise<Array<TestResult>>;
    getTestResult(userId: UserId, testId: bigint): Promise<TestResult | null>;
    getTopCoursesByEnrollment(topN: bigint): Promise<Array<CourseEnrollment>>;
    getTransaction(id: bigint): Promise<Transaction | null>;
    getUser(id: UserId): Promise<UserProfile | null>;
    getUserDetail(id: UserId): Promise<[UserProfile, Array<UserProgress>] | null>;
    getUserProgress(userId: UserId, courseId: bigint): Promise<UserProgress | null>;
    getUserSignupTimeSeries(days: bigint): Promise<Array<TimeSeriesDataPoint>>;
    getWithdrawalRequest(id: bigint): Promise<WithdrawalRequest | null>;
    getWithdrawalStats(): Promise<WithdrawalStats>;
    gradeAndSubmit(testId: bigint, answers: Array<UserAnswer>, timeTaken: bigint): Promise<TestResult>;
    grantCourseAccess(id: UserId, courseId: bigint): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listAllRewards(): Promise<Array<ReferralReward>>;
    listAuditLog(): Promise<Array<AuditLogEntry>>;
    listChallenges(): Promise<Array<StudyChallenge>>;
    listContentFiles(): Promise<Array<ContentFile>>;
    listCoupons(): Promise<Array<Coupon>>;
    listCourseStats(): Promise<Array<CourseStats>>;
    listCourses(): Promise<Array<Course>>;
    listDailyQuestions(): Promise<Array<DailyQuestion>>;
    listFailedTransactions(): Promise<Array<Transaction>>;
    listLessons(moduleId: bigint): Promise<Array<Lesson>>;
    listMockTests(): Promise<Array<MockTest>>;
    listModules(courseId: bigint): Promise<Array<CourseModule>>;
    listMotivationalMessages(): Promise<Array<MotivationalMessage>>;
    listNotifications(): Promise<Array<Notification>>;
    listPaymentMethods(): Promise<Array<PaymentMethodConfig>>;
    listQuestions(testId: bigint): Promise<Array<Question>>;
    listReferralCodes(): Promise<Array<ReferralCode>>;
    listSyncLogs(): Promise<Array<SyncLogEntry>>;
    listTimers(): Promise<Array<CountdownTimer>>;
    listTransactions(): Promise<Array<Transaction>>;
    listTransactionsPaginated(filter: TransactionFilter, offset: bigint, limit: bigint): Promise<PaginatedTransactions>;
    listUserProgress(userId: UserId): Promise<Array<UserProgress>>;
    listUserTransactions(userId: UserId): Promise<Array<Transaction>>;
    listUsers(search: string | null, status: UserStatus | null, offset: bigint, limit: bigint): Promise<Array<UserProfile>>;
    listWithdrawalRequests(filter: WithdrawalFilter, offset: bigint, limit: bigint): Promise<PaginatedWithdrawals>;
    publishCourse(id: bigint, publish: boolean): Promise<boolean>;
    recordChallengeCompletion(challengeId: bigint): Promise<bigint>;
    recordPdfDownload(courseId: string, lessonId: string, pdfFileKey: string): Promise<void>;
    recordSyncLog(entry: SyncLogEntry): Promise<void>;
    recordVideoView(courseId: string, lessonId: string, videoFileKey: string): Promise<void>;
    refundTransaction(id: bigint, reason: string): Promise<boolean>;
    regenerateReferralCode(oldId: bigint): Promise<bigint | null>;
    removePdfFileFromLesson(lessonId: string, fileKey: string): Promise<boolean>;
    removeVideoFileFromLesson(lessonId: string, fileKey: string): Promise<boolean>;
    reorderLessonFiles(lessonId: string, videoFileKeys: Array<string>, pdfFileKeys: Array<string>): Promise<boolean>;
    reviewTestAnswers(testId: bigint, answers: Array<UserAnswer>): Promise<Array<ReviewItem>>;
    revokeCourseAccess(id: UserId, courseId: bigint): Promise<boolean>;
    revokeReferralCode(id: bigint): Promise<boolean>;
    sendNotification(id: bigint): Promise<boolean>;
    setAppBranding(b: AppBranding): Promise<void>;
    setBankAccountDetails(details: BankAccountDetails): Promise<void>;
    setContentFilePublished(id: bigint, published: boolean): Promise<boolean>;
    setHomepageContent(content: HomepageContent): Promise<void>;
    setPaymentMethodEnabled(methodId: string, isEnabled: boolean): Promise<boolean>;
    setRazorpayConfig(config: RazorpayConfig): Promise<void>;
    setSyncEndpoint(url: string): Promise<void>;
    setUserStatus(id: UserId, status: UserStatus): Promise<boolean>;
    submitTestResult(r: TestResult): Promise<void>;
    toggleCouponStatus(id: string): Promise<boolean>;
    topReferrers(): Promise<Array<ReferralReward>>;
    updateChallenge(c: StudyChallenge): Promise<boolean>;
    updateConnectedAppInfo(appName: string, appUrl: string): Promise<void>;
    updateContentFile(f: ContentFile): Promise<boolean>;
    updateCoupon(c: Coupon): Promise<boolean>;
    updateCourse(course: Course): Promise<boolean>;
    updateDailyQuestion(dq: DailyQuestion): Promise<boolean>;
    updateLesson(lesson: Lesson): Promise<boolean>;
    updateMockTest(test: MockTest): Promise<boolean>;
    updateModule(m: CourseModule): Promise<boolean>;
    updateNotification(n: Notification): Promise<boolean>;
    updateQuestion(q: Question): Promise<boolean>;
    updateTransactionStatus(id: bigint, status: PaymentStatus): Promise<boolean>;
    updateWithdrawalStatus(id: bigint, status: WithdrawalStatus, razorpayPayoutId: string | null): Promise<boolean>;
    upsertPaymentMethod(m: PaymentMethodConfig): Promise<void>;
    upsertProgress(p: UserProgress): Promise<void>;
    upsertUser(user: UserProfile): Promise<void>;
    useCoupon(couponId: string, courseId: string): Promise<boolean>;
    useReferralCode(code: string, referrerId: UserId): Promise<boolean>;
}
