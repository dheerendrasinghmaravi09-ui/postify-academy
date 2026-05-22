import Types "../types/academy";
import Map "mo:core/Map";
import Time "mo:core/Time";

module {
  // ── Course management ─────────────────────────────────────────────────────

  public func listCourses(courses : Map.Map<Nat, Types.Course>) : [Types.Course] {
    courses.values().toArray();
  };

  public func getCourse(courses : Map.Map<Nat, Types.Course>, id : Nat) : ?Types.Course {
    courses.get(id);
  };

  public func createCourse(
    courses : Map.Map<Nat, Types.Course>,
    nextId : { var v : Nat },
    course : Types.Course,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    let newCourse : Types.Course = {
      course with
      id;
      moduleCount = 0;
      enrollmentCount = 0;
      isPublished = false;
      createdAt = Time.now();
    };
    courses.add(id, newCourse);
    id;
  };

  public func updateCourse(courses : Map.Map<Nat, Types.Course>, course : Types.Course) : Bool {
    switch (courses.get(course.id)) {
      case null { false };
      case (?existing) {
        courses.add(
          course.id,
          {
            course with
            enrollmentCount = existing.enrollmentCount;
            moduleCount = existing.moduleCount;
            createdAt = existing.createdAt;
          },
        );
        true;
      };
    };
  };

  public func deleteCourse(courses : Map.Map<Nat, Types.Course>, id : Nat) : Bool {
    switch (courses.get(id)) {
      case null { false };
      case (?_) {
        courses.remove(id);
        true;
      };
    };
  };

  public func publishCourse(courses : Map.Map<Nat, Types.Course>, id : Nat, publish : Bool) : Bool {
    switch (courses.get(id)) {
      case null { false };
      case (?existing) {
        courses.add(id, { existing with isPublished = publish });
        true;
      };
    };
  };

  // ── Module management ─────────────────────────────────────────────────────

  public func listModules(
    modules : Map.Map<Nat, Types.CourseModule>,
    courseId : Nat,
  ) : [Types.CourseModule] {
    modules.values().filter(func(m : Types.CourseModule) : Bool { m.courseId == courseId }).toArray();
  };

  public func createModule(
    modules : Map.Map<Nat, Types.CourseModule>,
    courses : Map.Map<Nat, Types.Course>,
    nextId : { var v : Nat },
    m : Types.CourseModule,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    modules.add(id, { m with id });
    // increment moduleCount on parent course
    switch (courses.get(m.courseId)) {
      case null {};
      case (?c) {
        courses.add(c.id, { c with moduleCount = c.moduleCount + 1 });
      };
    };
    id;
  };

  public func updateModule(modules : Map.Map<Nat, Types.CourseModule>, m : Types.CourseModule) : Bool {
    switch (modules.get(m.id)) {
      case null { false };
      case (?_) {
        modules.add(m.id, m);
        true;
      };
    };
  };

  public func deleteModule(
    modules : Map.Map<Nat, Types.CourseModule>,
    courses : Map.Map<Nat, Types.Course>,
    id : Nat,
  ) : Bool {
    switch (modules.get(id)) {
      case null { false };
      case (?m) {
        modules.remove(id);
        // decrement moduleCount on parent course
        switch (courses.get(m.courseId)) {
          case null {};
          case (?c) {
            let newCount = if (c.moduleCount > 0) { c.moduleCount - 1 : Nat } else { 0 };
            courses.add(c.id, { c with moduleCount = newCount });
          };
        };
        true;
      };
    };
  };

  // ── Lesson management ─────────────────────────────────────────────────────

  public func listLessons(
    lessons : Map.Map<Nat, Types.Lesson>,
    moduleId : Nat,
  ) : [Types.Lesson] {
    lessons.values().filter(func(l : Types.Lesson) : Bool { l.moduleId == moduleId }).toArray();
  };

  public func createLesson(
    lessons : Map.Map<Nat, Types.Lesson>,
    nextId : { var v : Nat },
    lesson : Types.Lesson,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    lessons.add(id, { lesson with id });
    id;
  };

  public func updateLesson(lessons : Map.Map<Nat, Types.Lesson>, lesson : Types.Lesson) : Bool {
    switch (lessons.get(lesson.id)) {
      case null { false };
      case (?_) {
        lessons.add(lesson.id, lesson);
        true;
      };
    };
  };

  public func deleteLesson(lessons : Map.Map<Nat, Types.Lesson>, id : Nat) : Bool {
    switch (lessons.get(id)) {
      case null { false };
      case (?_) {
        lessons.remove(id);
        true;
      };
    };
  };
};
