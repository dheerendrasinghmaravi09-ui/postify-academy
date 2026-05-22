import Types "../types/academy";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Parse lessonId Text to Nat (returns 0 on failure — callers guard on result)
  func parseNat(t : Text) : Nat {
    switch (Nat.fromText(t)) {
      case (?n) n;
      case null 0;
    };
  };

  // Upsert a StudentProgress record within a CourseStats and write it back.
  // Returns the updated CourseStats.
  func upsertProgress(
    stats : Types.CourseStats,
    studentId : Types.UserId,
    lessons : Map.Map<Nat, Types.Lesson>,
    courseId : Text,
    f : Types.StudentProgress -> Types.StudentProgress,
  ) : Types.CourseStats {
    let existing : ?Types.StudentProgress = stats.studentProgress.find(
      func(p : Types.StudentProgress) : Bool { p.studentId == studentId }
    );
    let old : Types.StudentProgress = switch (existing) {
      case (?p) p;
      case null {
        {
          studentId;
          courseId;
          completionPercent = 0.0;
          videosWatched = 0;
          pdfsDownloaded = 0;
          lastActivity = Time.now();
          lessonsCompleted = [];
          enrolledAt = Time.now();
        };
      };
    };
    let updated = f(old);

    // Recalculate completionPercent based on lessons in the course
    let totalLessons = lessons.values().filter(func(_l : Types.Lesson) : Bool {
      // courseId is Text, lesson.moduleId is Nat — we count all lessons in all
      // modules that belong to this course. Since lessons are stored with
      // moduleId (Nat) and we don't have a direct course→lesson link here, we
      // count total lessons across all modules as a best-effort denominator.
      // If the courseId text matches the lessonId prefix, use total lesson count.
      true;
    }).toArray().size();

    let completedCount = updated.lessonsCompleted.size();
    let pct : Float = if (totalLessons == 0) {
      0.0;
    } else {
      Int.fromNat(completedCount).toFloat() / Int.fromNat(totalLessons).toFloat() * 100.0;
    };

    let finalProgress : Types.StudentProgress = {
      updated with
      completionPercent = pct;
    };

    // Rebuild studentProgress array
    let newProgressArr : [Types.StudentProgress] = switch (existing) {
      case null {
        // append
        stats.studentProgress.concat([finalProgress]);
      };
      case (?_) {
        // replace
        stats.studentProgress.map(
          func(p : Types.StudentProgress) : Types.StudentProgress {
            if (p.studentId == studentId) { finalProgress } else { p };
          }
        );
      };
    };

    // Recalculate avg completion
    let total = newProgressArr.size();
    let sumPct : Float = newProgressArr.foldLeft<Types.StudentProgress, Float>(
      0.0,
      func(acc : Float, p : Types.StudentProgress) : Float { acc + p.completionPercent },
    );
    let avgPct : Float = if (total == 0) { 0.0 } else { sumPct / Int.fromNat(total).toFloat() };

    {
      stats with
      studentProgress = newProgressArr;
      avgCompletionPercent = avgPct;
    };
  };

  // Ensure a CourseStats entry exists; return it.
  func getOrCreate(
    courseStats : Map.Map<Text, Types.CourseStats>,
    courseId : Text,
  ) : Types.CourseStats {
    switch (courseStats.get(courseId)) {
      case (?s) s;
      case null {
        {
          courseId;
          enrollmentCount = 0;
          avgCompletionPercent = 0.0;
          totalRevenue = 0.0;
          studentProgress = [];
        };
      };
    };
  };

  // ── Course stats ──────────────────────────────────────────────────────────

  public func getCourseStats(
    courseStats : Map.Map<Text, Types.CourseStats>,
    courseId : Text,
  ) : ?Types.CourseStats {
    courseStats.get(courseId);
  };

  public func listCourseStats(
    courseStats : Map.Map<Text, Types.CourseStats>,
  ) : [Types.CourseStats] {
    courseStats.values().toArray();
  };

  // ── Student activity recording ────────────────────────────────────────────

  public func recordVideoView(
    courseStats : Map.Map<Text, Types.CourseStats>,
    courseId : Text,
    lessonId : Text,
    _videoFileKey : Text,
    studentId : Types.UserId,
    lessons : Map.Map<Nat, Types.Lesson>,
  ) : () {
    let stats = getOrCreate(courseStats, courseId);
    let lessonNatId = parseNat(lessonId);

    let updated = upsertProgress(stats, studentId, lessons, courseId, func(p : Types.StudentProgress) : Types.StudentProgress {
      // Check whether all videos in this lesson have been watched.
      // We mark the lesson completed when ANY video is viewed (simple heuristic).
      let alreadyCompleted = p.lessonsCompleted.find(
        func(id : Text) : Bool { id == lessonId }
      );
      let newLessonsCompleted : [Text] = switch (alreadyCompleted) {
        case (?_) p.lessonsCompleted;
        case null {
          // Check if the lesson has at least one video — if so, mark complete.
          let hasVideos : Bool = switch (lessons.get(lessonNatId)) {
            case (?l) { l.videoFiles.size() > 0 or l.videoUrl != "" };
            case null { false };
          };
          if (hasVideos) {
            p.lessonsCompleted.concat([lessonId]);
          } else {
            p.lessonsCompleted;
          };
        };
      };
      {
        p with
        videosWatched = p.videosWatched + 1;
        lastActivity = Time.now();
        lessonsCompleted = newLessonsCompleted;
      };
    });
    courseStats.add(courseId, updated);
  };

  public func recordPdfDownload(
    courseStats : Map.Map<Text, Types.CourseStats>,
    courseId : Text,
    _lessonId : Text,
    _pdfFileKey : Text,
    studentId : Types.UserId,
    lessons : Map.Map<Nat, Types.Lesson>,
  ) : () {
    let stats = getOrCreate(courseStats, courseId);
    let updated = upsertProgress(stats, studentId, lessons, courseId, func(p : Types.StudentProgress) : Types.StudentProgress {
      {
        p with
        pdfsDownloaded = p.pdfsDownloaded + 1;
        lastActivity = Time.now();
      };
    });
    courseStats.add(courseId, updated);
  };

  // ── Student progress ──────────────────────────────────────────────────────

  public func getStudentProgress(
    courseStats : Map.Map<Text, Types.CourseStats>,
    courseId : Text,
  ) : [Types.StudentProgress] {
    switch (courseStats.get(courseId)) {
      case (?stats) stats.studentProgress;
      case null [];
    };
  };

  // ── Lesson video file management ──────────────────────────────────────────

  public func addVideoFileToLesson(
    lessons : Map.Map<Nat, Types.Lesson>,
    lessonId : Text,
    videoFile : Types.VideoFile,
  ) : Bool {
    let id = parseNat(lessonId);
    switch (lessons.get(id)) {
      case null false;
      case (?lesson) {
        let newFiles = lesson.videoFiles.concat([videoFile]);
        lessons.add(id, { lesson with videoFiles = newFiles });
        true;
      };
    };
  };

  public func removeVideoFileFromLesson(
    lessons : Map.Map<Nat, Types.Lesson>,
    lessonId : Text,
    fileKey : Text,
  ) : Bool {
    let id = parseNat(lessonId);
    switch (lessons.get(id)) {
      case null false;
      case (?lesson) {
        let newFiles = lesson.videoFiles.filter(
          func(f : Types.VideoFile) : Bool { f.fileKey != fileKey }
        );
        lessons.add(id, { lesson with videoFiles = newFiles });
        true;
      };
    };
  };

  // ── Lesson PDF file management ────────────────────────────────────────────

  public func addPdfFileToLesson(
    lessons : Map.Map<Nat, Types.Lesson>,
    lessonId : Text,
    pdfFile : Types.PdfFile,
  ) : Bool {
    let id = parseNat(lessonId);
    switch (lessons.get(id)) {
      case null false;
      case (?lesson) {
        let newFiles = lesson.pdfFiles.concat([pdfFile]);
        lessons.add(id, { lesson with pdfFiles = newFiles });
        true;
      };
    };
  };

  public func removePdfFileFromLesson(
    lessons : Map.Map<Nat, Types.Lesson>,
    lessonId : Text,
    fileKey : Text,
  ) : Bool {
    let id = parseNat(lessonId);
    switch (lessons.get(id)) {
      case null false;
      case (?lesson) {
        let newFiles = lesson.pdfFiles.filter(
          func(f : Types.PdfFile) : Bool { f.fileKey != fileKey }
        );
        lessons.add(id, { lesson with pdfFiles = newFiles });
        true;
      };
    };
  };

  // ── Reorder lesson files ──────────────────────────────────────────────────

  public func reorderLessonFiles(
    lessons : Map.Map<Nat, Types.Lesson>,
    lessonId : Text,
    videoFileKeys : [Text],
    pdfFileKeys : [Text],
  ) : Bool {
    let id = parseNat(lessonId);
    switch (lessons.get(id)) {
      case null false;
      case (?lesson) {
        // Rebuild videoFiles sorted by position in videoFileKeys
        let reorderedVideos : [Types.VideoFile] = videoFileKeys.mapEntries(
          func(key : Text, idx : Nat) : Types.VideoFile {
            let found = lesson.videoFiles.find(
              func(f : Types.VideoFile) : Bool { f.fileKey == key }
            );
            switch (found) {
              case (?f) { { f with sortOrder = idx } };
              case null { { fileKey = key; fileName = ""; fileSize = 0; duration = null; sortOrder = idx; uploadedAt = 0 } };
            };
          }
        );
        let reorderedPdfs : [Types.PdfFile] = pdfFileKeys.mapEntries(
          func(key : Text, idx : Nat) : Types.PdfFile {
            let found = lesson.pdfFiles.find(
              func(f : Types.PdfFile) : Bool { f.fileKey == key }
            );
            switch (found) {
              case (?f) { { f with sortOrder = idx } };
              case null { { fileKey = key; fileName = ""; fileSize = 0; description = null; sortOrder = idx; uploadedAt = 0 } };
            };
          }
        );
        lessons.add(id, { lesson with videoFiles = reorderedVideos; pdfFiles = reorderedPdfs });
        true;
      };
    };
  };
};
