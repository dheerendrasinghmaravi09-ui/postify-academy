import Types "../types/academy";
import CourseProgressLib "../lib/courseProgress";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

mixin (
  accessControlState : AccessControl.AccessControlState,
  courseStats : Map.Map<Text, Types.CourseStats>,
  lessons : Map.Map<Nat, Types.Lesson>,
) {
  // ── Course stats ──────────────────────────────────────────────────────────

  public query ({ caller }) func getCourseStats(courseId : Text) : async ?Types.CourseStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.getCourseStats(courseStats, courseId);
  };

  public query ({ caller }) func listCourseStats() : async [Types.CourseStats] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.listCourseStats(courseStats);
  };

  // ── Student activity (any authenticated user can record their own) ─────────

  public shared ({ caller }) func recordVideoView(
    courseId : Text,
    lessonId : Text,
    videoFileKey : Text,
  ) : async () {
    if (caller == Principal.anonymous()) {
      Runtime.trap("Unauthorized: must be authenticated");
    };
    CourseProgressLib.recordVideoView(courseStats, courseId, lessonId, videoFileKey, caller, lessons);
  };

  public shared ({ caller }) func recordPdfDownload(
    courseId : Text,
    lessonId : Text,
    pdfFileKey : Text,
  ) : async () {
    if (caller == Principal.anonymous()) {
      Runtime.trap("Unauthorized: must be authenticated");
    };
    CourseProgressLib.recordPdfDownload(courseStats, courseId, lessonId, pdfFileKey, caller, lessons);
  };

  // ── Student progress (admin read) ─────────────────────────────────────────

  public query ({ caller }) func getStudentProgress(courseId : Text) : async [Types.StudentProgress] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.getStudentProgress(courseStats, courseId);
  };

  // ── Lesson video file management ──────────────────────────────────────────

  public shared ({ caller }) func addVideoFileToLesson(
    lessonId : Text,
    videoFile : Types.VideoFile,
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.addVideoFileToLesson(lessons, lessonId, videoFile);
  };

  public shared ({ caller }) func removeVideoFileFromLesson(
    lessonId : Text,
    fileKey : Text,
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.removeVideoFileFromLesson(lessons, lessonId, fileKey);
  };

  // ── Lesson PDF file management ────────────────────────────────────────────

  public shared ({ caller }) func addPdfFileToLesson(
    lessonId : Text,
    pdfFile : Types.PdfFile,
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.addPdfFileToLesson(lessons, lessonId, pdfFile);
  };

  public shared ({ caller }) func removePdfFileFromLesson(
    lessonId : Text,
    fileKey : Text,
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.removePdfFileFromLesson(lessons, lessonId, fileKey);
  };

  // ── Reorder lesson files ──────────────────────────────────────────────────

  public shared ({ caller }) func reorderLessonFiles(
    lessonId : Text,
    videoFileKeys : [Text],
    pdfFileKeys : [Text],
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    CourseProgressLib.reorderLessonFiles(lessons, lessonId, videoFileKeys, pdfFileKeys);
  };
};
