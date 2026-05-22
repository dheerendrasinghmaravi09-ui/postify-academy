import Types "types/academy";
import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import CoursesMixin "mixins/courses-api";
import UsersMixin "mixins/users-api";
import PaymentsMixin "mixins/payments-api";
import TestsMixin "mixins/tests-api";
import EngagementMixin "mixins/engagement-api";
import NotificationsMixin "mixins/notifications-api";
import ReferralsMixin "mixins/referrals-api";
import ContentMixin "mixins/content-api";
import AnalyticsMixin "mixins/analytics-api";
import AuditLogMixin "mixins/auditlog-api";
import CouponsMixin "mixins/coupons-api";
import PaymentMethodsMixin "mixins/payment-methods-api";
import AppBrandingMixin "mixins/app-branding-api";
import AppSyncMixin "mixins/app-sync-api";
import ProgressMixin "mixins/progress-api";
import WithdrawalsMixin "mixins/withdrawals-api";
import PaymentMethodsLib "lib/paymentMethods";
import AppBrandingLib "lib/appBranding";



actor {
  // ── Authorization ─────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Object Storage ────────────────────────────────────────────────────────
  include MixinObjectStorage();

  // ── Course State ──────────────────────────────────────────────────────────
  let courses = Map.empty<Nat, Types.Course>();
  let courseModules = Map.empty<Nat, Types.CourseModule>();
  let lessons = Map.empty<Nat, Types.Lesson>();
  var _nextCourseId = { var v : Nat = 1 };
  var _nextModuleId = { var v : Nat = 1 };
  var _nextLessonId = { var v : Nat = 1 };
  include CoursesMixin(accessControlState, courses, courseModules, lessons, _nextCourseId, _nextModuleId, _nextLessonId);

  // ── User State ────────────────────────────────────────────────────────────
  let users = Map.empty<Types.UserId, Types.UserProfile>();
  let progress = Map.empty<(Types.UserId, Nat), Types.UserProgress>();
  include UsersMixin(accessControlState, users, progress);

  // ── Payment State ─────────────────────────────────────────────────────────
  let transactions = Map.empty<Nat, Types.Transaction>();
  var _nextTxId = { var v : Nat = 1 };
  include PaymentsMixin(accessControlState, transactions, _nextTxId);

  // ── Mock Test State ───────────────────────────────────────────────────────
  let mockTests = Map.empty<Nat, Types.MockTest>();
  let questions = Map.empty<Nat, Types.Question>();
  let testResults = Map.empty<(Types.UserId, Nat), Types.TestResult>();
  var _nextTestId = { var v : Nat = 1 };
  var _nextQuestionId = { var v : Nat = 1 };
  include TestsMixin(accessControlState, mockTests, questions, testResults, _nextTestId, _nextQuestionId);

  // ── Engagement State ──────────────────────────────────────────────────────
  let dailyQuestions = Map.empty<Nat, Types.DailyQuestion>();
  let challenges = Map.empty<Nat, Types.StudyChallenge>();
  let timers = Map.empty<Nat, Types.CountdownTimer>();
  let messages = Map.empty<Nat, Types.MotivationalMessage>();
  let challengeCompletions = Map.empty<Text, Nat>();
  var _nextDqId = { var v : Nat = 1 };
  var _nextChallengeId = { var v : Nat = 1 };
  var _nextTimerId = { var v : Nat = 1 };
  var _nextMessageId = { var v : Nat = 1 };
  include EngagementMixin(accessControlState, dailyQuestions, challenges, timers, messages, challengeCompletions, _nextDqId, _nextChallengeId, _nextTimerId, _nextMessageId);

  // ── Notification State ────────────────────────────────────────────────────
  let notifications = Map.empty<Nat, Types.Notification>();
  var _nextNotifId = { var v : Nat = 1 };
  include NotificationsMixin(accessControlState, notifications, _nextNotifId);

  // ── Referral State ────────────────────────────────────────────────────────
  let referralCodes = Map.empty<Nat, Types.ReferralCode>();
  let referralRewards = Map.empty<Types.UserId, Types.ReferralReward>();
  var _nextCodeId = { var v : Nat = 1 };
  include ReferralsMixin(accessControlState, referralCodes, referralRewards, _nextCodeId);

  // ── Content State ─────────────────────────────────────────────────────────
  let contentFiles = Map.empty<Nat, Types.ContentFile>();
  var _homepage = { var v : Types.HomepageContent = { featuredCourseIds = []; bannerIds = []; announcements = [] } };
  var _nextFileId = { var v : Nat = 1 };
  include ContentMixin(accessControlState, contentFiles, _homepage, _nextFileId);

  // ── Analytics ─────────────────────────────────────────────────────────────
  include AnalyticsMixin(accessControlState, users, transactions, progress);

  // ── Audit Log ─────────────────────────────────────────────────────────────
  let auditLog = List.empty<Types.AuditLogEntry>();
  var _nextAuditId = { var v : Nat = 1 };
  include AuditLogMixin(accessControlState, auditLog, _nextAuditId);

  // ── Coupons ───────────────────────────────────────────────────────────────
  let coupons = Map.empty<Text, Types.Coupon>();
  let couponUsages = List.empty<Types.CouponUsage>();
  include CouponsMixin(accessControlState, coupons, couponUsages);

  // ── Payment Methods ───────────────────────────────────────────────────────
  let paymentMethods = Map.empty<Text, Types.PaymentMethodConfig>();
  do { PaymentMethodsLib.initDefaults(paymentMethods) };
  var _razorpayConfig = { var v : ?Types.RazorpayConfig = null };
  include PaymentMethodsMixin(accessControlState, paymentMethods, _razorpayConfig);

  // ── App Branding ──────────────────────────────────────────────────────────
  var _appBranding = { var v : Types.AppBranding = { appName = "Postify Academy"; logoUrl = null; primaryColor = "#3B82F6"; accentColor = "#F97316"; tagline = "Learn. Grow. Succeed."; updatedAt = 0 } };
  do { AppBrandingLib.initDefault(_appBranding) };
  include AppBrandingMixin(accessControlState, _appBranding);

  // ── App Sync ──────────────────────────────────────────────────────────────
  var _syncEndpoint = { var v : Types.SyncEndpoint = { url = ""; validatedAt = null; isConnected = false } };
  let syncLogs = List.empty<Types.SyncLogEntry>();
  var _connectedAppInfo = { var v : Types.ConnectedAppInfo = { appName = "Postify Academy"; appUrl = ""; totalCourses = 0; publishedCourses = 0; totalStudents = 0; lastSyncAt = null; syncStatus = #Disconnected } };
  include AppSyncMixin(accessControlState, _syncEndpoint, syncLogs, _connectedAppInfo, courses, users);

  // ── Course Progress & Student Stats ───────────────────────────────────────
  let courseStats = Map.empty<Text, Types.CourseStats>();
  include ProgressMixin(accessControlState, courseStats, lessons);

  // ── Withdrawals ───────────────────────────────────────────────────────────
  var _bankDetails = { var v : ?Types.BankAccountDetails = null };
  let withdrawals = Map.empty<Nat, Types.WithdrawalRequest>();
  var _nextWithdrawalId = { var v : Nat = 1 };
  include WithdrawalsMixin(accessControlState, _bankDetails, withdrawals, _nextWithdrawalId);
};
