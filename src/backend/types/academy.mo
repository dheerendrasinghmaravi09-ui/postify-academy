import Storage "mo:caffeineai-object-storage/Storage";
import CommonTypes "common";

module {
  public type UserId = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  // ── Course ────────────────────────────────────────────────────────────────
  public type VideoType = { #YouTube; #GoogleDrive };

  public type Course = {
    id : Nat;
    title : Text;
    description : Text;
    thumbnailBlob : Storage.ExternalBlob;
    price : Nat;
    isFree : Bool;
    isPublished : Bool;
    moduleCount : Nat;
    enrollmentCount : Nat;
    createdAt : Timestamp;
  };

  public type CourseModule = {
    id : Nat;
    courseId : Nat;
    title : Text;
    order : Nat;
  };

  // ── Lesson media files ────────────────────────────────────────────────────
  public type VideoFile = {
    fileKey : Text;
    fileName : Text;
    fileSize : Nat;
    duration : ?Text;
    sortOrder : Nat;
    uploadedAt : Int;
  };

  public type PdfFile = {
    fileKey : Text;
    fileName : Text;
    fileSize : Nat;
    description : ?Text;
    sortOrder : Nat;
    uploadedAt : Int;
  };

  public type Lesson = {
    id : Nat;
    moduleId : Nat;
    title : Text;
    videoUrl : Text;
    videoType : VideoType;
    pdfUrls : [Text];
    videoFiles : [VideoFile];
    pdfFiles : [PdfFile];
    order : Nat;
    isLocked : Bool;
  };

  // ── Student Progress & Course Stats ──────────────────────────────────────
  public type StudentProgress = {
    studentId : UserId;
    courseId : Text;
    completionPercent : Float;
    videosWatched : Nat;
    pdfsDownloaded : Nat;
    lastActivity : Int;
    lessonsCompleted : [Text];
    enrolledAt : Int;
  };

  public type CourseStats = {
    courseId : Text;
    enrollmentCount : Nat;
    avgCompletionPercent : Float;
    totalRevenue : Float;
    studentProgress : [StudentProgress];
  };

  // ── Users ─────────────────────────────────────────────────────────────────
  public type UserStatus = { #Active; #Blocked };

  public type UserProfile = {
    id : UserId;
    name : Text;
    email : Text;
    phone : Text;
    status : UserStatus;
    enrolledCourses : [Nat];
    totalPurchases : Nat;
    lastLogin : Timestamp;
    createdAt : Timestamp;
  };

  public type UserProgress = {
    userId : UserId;
    courseId : Nat;
    completionPercent : Nat;
    studyTime : Nat;
    quizScores : [Nat];
  };

  // ── Payments ──────────────────────────────────────────────────────────────
  public type PaymentStatus = { #Pending; #Completed; #Failed; #Refunded };

  public type Transaction = {
    id : Nat;
    userId : UserId;
    courseId : Nat;
    amount : Nat;
    status : PaymentStatus;
    paymentMethod : Text;
    date : Timestamp;
    refundReason : ?Text;
  };

  public type TransactionFilter = {
    status : ?PaymentStatus;
    userId : ?UserId;
    fromDate : ?Timestamp;
    toDate : ?Timestamp;
  };

  public type PaginatedTransactions = {
    items : [Transaction];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type RevenueStats = {
    totalRevenue : Nat;
    mtdRevenue : Nat;
    mrr : Nat;
    transactionCount : Nat;
    activeSubscriptions : Nat;
    churnedSubscriptions : Nat;
  };

  // ── Mock Tests ────────────────────────────────────────────────────────────
  public type MockTest = {
    id : Nat;
    courseId : Nat;
    title : Text;
    passingScore : Nat;
    timerMinutes : Nat;
    negativeMarking : Bool;
  };

  public type Question = {
    id : Nat;
    testId : Nat;
    text : Text;
    options : [Text];
    correctIndex : Nat;
    explanation : Text;
  };

  public type TestResult = {
    userId : UserId;
    testId : Nat;
    score : Nat;
    percentage : Nat;
    passed : Bool;
    timeTaken : Nat;
  };

  // ── Engagement ────────────────────────────────────────────────────────────
  public type Audience = { #All; #CourseAudience : Nat; #Individual : UserId };

  public type DailyQuestion = {
    id : Nat;
    text : Text;
    correctAnswer : Text;
    scheduledDate : Text;
    audience : Audience;
  };

  public type StudyChallenge = {
    id : Nat;
    title : Text;
    description : Text;
    goalCount : Nat;
    rewardPoints : Nat;
    endDate : Text;
  };

  public type CountdownTimer = {
    id : Nat;
    name : Text;
    targetDate : Text;
  };

  public type MotivationalMessage = {
    id : Nat;
    text : Text;
    audience : Audience;
    scheduledAt : Timestamp;
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  public type NotificationAudience = { #All; #Course : Nat; #Individual : UserId };
  public type NotificationStatus = { #Draft; #Scheduled; #Sent; #Failed };

  public type Notification = {
    id : Nat;
    title : Text;
    body : Text;
    ctaUrl : Text;
    audience : NotificationAudience;
    scheduledAt : ?Timestamp;
    sentAt : ?Timestamp;
    status : NotificationStatus;
  };

  public type NotificationHistory = {
    sentCount : Nat;
    status : NotificationStatus;
  };

  // ── Referrals ─────────────────────────────────────────────────────────────
  public type ReferralCodeStatus = { #Active; #Revoked };

  public type ReferralCode = {
    id : Nat;
    code : Text;
    generatedDate : Timestamp;
    usageCount : Nat;
    conversionCount : Nat;
    status : ReferralCodeStatus;
  };

  public type ReferralReward = {
    referrerId : UserId;
    rewardPoints : Nat;
  };

  // ── Content ───────────────────────────────────────────────────────────────
  public type FileType = { #PDF; #EPUB; #Image; #Banner };

  public type ContentFile = {
    id : Nat;
    name : Text;
    fileType : FileType;
    fileBlob : Storage.ExternalBlob;
    title : Text;
    author : ?Text;
    description : ?Text;
    uploadedAt : Timestamp;
    isPublished : Bool;
  };

  public type HomepageContent = {
    featuredCourseIds : [Nat];
    bannerIds : [Nat];
    announcements : [Text];
  };

  // ── Analytics ─────────────────────────────────────────────────────────────
  public type AnalyticsSummary = {
    totalUsers : Nat;
    activeUsers : Nat;
    newSignupsThisMonth : Nat;
    totalRevenue : Nat;
    mrrGrowthPercent : Float;
    courseCompletionRate : Float;
    avgStudyHoursPerUser : Float;
    retentionRate : Float;
  };

  public type TimeSeriesDataPoint = {
    date : Text;
    value : Float;
  };

  // ── Audit Log ─────────────────────────────────────────────────────────────
  public type AuditLogEntry = {
    id : Nat;
    userId : UserId;
    action : Text;
    details : Text;
    timestamp : Timestamp;
  };

  // ── Coupons ───────────────────────────────────────────────────────────────
  public type DiscountType = { #Percent; #Fixed };

  public type Coupon = {
    id : Text;
    code : Text;
    discountType : DiscountType;
    discountValue : Float;
    expiryDate : ?Int;
    maxUsage : ?Nat;
    usedCount : Nat;
    courseIds : [Text];
    isActive : Bool;
    createdAt : Int;
  };

  public type CouponUsage = {
    couponId : Text;
    userId : Principal;
    courseId : Text;
    usedAt : Int;
  };

  // ── Payment Methods ───────────────────────────────────────────────────────
  public type PaymentMethodConfig = {
    methodId : Text;
    isEnabled : Bool;
    displayName : Text;
    lastUpdated : Int;
  };

  // ── App Branding ──────────────────────────────────────────────────────────
  public type AppBranding = {
    appName : Text;
    logoUrl : ?Text;
    primaryColor : Text;
    accentColor : Text;
    tagline : Text;
    updatedAt : Int;
  };

  // ── Withdrawals ───────────────────────────────────────────────────────────
  public type BankAccountDetails = {
    accountNumber : Text;
    ifscCode : Text;
    accountHolderName : Text;
    bankName : Text;
    upiId : ?Text;
  };

  public type WithdrawalStatus = { #Pending; #Processing; #Completed; #Failed };

  public type WithdrawalRequest = {
    id : Nat;
    amount : Float;
    status : WithdrawalStatus;
    bankDetails : BankAccountDetails;
    razorpayPayoutId : ?Text;
    requestedAt : Int;
    processedAt : ?Int;
    notes : ?Text;
  };

  public type WithdrawalStats = {
    totalWithdrawn : Float;
    pendingAmount : Float;
    completedRequests : Nat;
    failedRequests : Nat;
  };

  public type WithdrawalFilter = {
    status : ?WithdrawalStatus;
  };

  public type PaginatedWithdrawals = {
    items : [WithdrawalRequest];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // ── Razorpay ──────────────────────────────────────────────────────────────
  public type RazorpayConfig = {
    keyId : Text;
    keySecret : Text;
    accountNumber : ?Text;
    enabled : Bool;
  };

  // ── Connected App Info ────────────────────────────────────────────────────
  public type ConnectedAppSyncStatus = { #Connected; #Syncing; #Disconnected };

  public type ConnectedAppInfo = {
    appName : Text;
    appUrl : Text;
    totalCourses : Nat;
    publishedCourses : Nat;
    totalStudents : Nat;
    lastSyncAt : ?Int;
    syncStatus : ConnectedAppSyncStatus;
  };

  // ── App Sync ──────────────────────────────────────────────────────────────
  public type SyncEndpoint = {
    url : Text;
    validatedAt : ?Int;
    isConnected : Bool;
  };

  public type SyncType = { #Manual; #Auto };
  public type SyncStatus = { #Success; #Failed };

  public type SyncLogEntry = {
    id : Text;
    syncedAt : Int;
    syncType : SyncType;
    status : SyncStatus;
    itemsSynced : Nat;
    errorMessage : ?Text;
  };
};
