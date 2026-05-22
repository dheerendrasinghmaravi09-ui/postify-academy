import Types "../types/academy";
import CoursesLib "../lib/courses";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  courses : Map.Map<Nat, Types.Course>,
  courseModules : Map.Map<Nat, Types.CourseModule>,
  lessons : Map.Map<Nat, Types.Lesson>,
  nextCourseId : { var v : Nat },
  nextModuleId : { var v : Nat },
  nextLessonId : { var v : Nat },
) {
  // ── Courses ───────────────────────────────────────────────────────────────

  public query func listCourses() : async [Types.Course] {
    CoursesLib.listCourses(courses);
  };

  public query func getCourse(id : Nat) : async ?Types.Course {
    CoursesLib.getCourse(courses, id);
  };

  public shared ({ caller }) func createCourse(course : Types.Course) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create courses");
    };
    CoursesLib.createCourse(courses, nextCourseId, course);
  };

  public shared ({ caller }) func updateCourse(course : Types.Course) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update courses");
    };
    CoursesLib.updateCourse(courses, course);
  };

  public shared ({ caller }) func deleteCourse(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete courses");
    };
    CoursesLib.deleteCourse(courses, id);
  };

  public shared ({ caller }) func publishCourse(id : Nat, publish : Bool) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can publish courses");
    };
    CoursesLib.publishCourse(courses, id, publish);
  };

  // ── Modules ───────────────────────────────────────────────────────────────

  public query func listModules(courseId : Nat) : async [Types.CourseModule] {
    CoursesLib.listModules(courseModules, courseId);
  };

  public shared ({ caller }) func createModule(m : Types.CourseModule) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create modules");
    };
    CoursesLib.createModule(courseModules, courses, nextModuleId, m);
  };

  public shared ({ caller }) func updateModule(m : Types.CourseModule) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update modules");
    };
    CoursesLib.updateModule(courseModules, m);
  };

  public shared ({ caller }) func deleteModule(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete modules");
    };
    CoursesLib.deleteModule(courseModules, courses, id);
  };

  // ── Lessons ───────────────────────────────────────────────────────────────

  public query func listLessons(moduleId : Nat) : async [Types.Lesson] {
    CoursesLib.listLessons(lessons, moduleId);
  };

  public shared ({ caller }) func createLesson(lesson : Types.Lesson) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create lessons");
    };
    CoursesLib.createLesson(lessons, nextLessonId, lesson);
  };

  public shared ({ caller }) func updateLesson(lesson : Types.Lesson) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update lessons");
    };
    CoursesLib.updateLesson(lessons, lesson);
  };

  public shared ({ caller }) func deleteLesson(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete lessons");
    };
    CoursesLib.deleteLesson(lessons, id);
  };
};
