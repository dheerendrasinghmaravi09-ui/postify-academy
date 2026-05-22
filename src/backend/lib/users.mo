import Types "../types/academy";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Order "mo:core/Order";

module {

  // ── Composite key compare for (UserId, Nat) ─────────────────────────────
  public func progressKeyCompare(a : (Types.UserId, Nat), b : (Types.UserId, Nat)) : Order.Order {
    let pc = Principal.compare(a.0, b.0);
    if (not pc.isEqual()) { pc } else {
      if (a.1 < b.1) { #less }
      else if (a.1 > b.1) { #greater }
      else { #equal }
    };
  };

  // ── User profile management ──────────────────────────────────────────────

  /// Return a paginated, optionally filtered slice of all user profiles.
  public func listUsers(
    users     : Map.Map<Types.UserId, Types.UserProfile>,
    search    : ?Text,
    status    : ?Types.UserStatus,
    offset    : Nat,
    limit     : Nat,
  ) : [Types.UserProfile] {
    let needle : Text = switch (search) {
      case (?s) { s.toLower() };
      case null { "" };
    };
    let matchesSearch = func(u : Types.UserProfile) : Bool {
      if (needle.size() == 0) { return true };
      u.name.toLower().contains(#text needle) or u.email.toLower().contains(#text needle)
    };
    let matchesStatus = func(u : Types.UserProfile) : Bool {
      switch (status) {
        case null       { true };
        case (?#Active) { switch (u.status) { case (#Active) true; case _ false } };
        case (?#Blocked) { switch (u.status) { case (#Blocked) true; case _ false } };
      }
    };
    let all = List.empty<Types.UserProfile>();
    for ((_, u) in users.entries()) {
      if (matchesSearch(u) and matchesStatus(u)) {
        all.add(u);
      };
    };
    let total = all.size();
    let start = if (offset >= total) { return [] } else { offset };
    let end_ = Nat.min(start + limit, total);
    all.sliceToArray(start, end_)
  };

  /// Fetch a single user by principal id.
  public func getUser(
    users : Map.Map<Types.UserId, Types.UserProfile>,
    id    : Types.UserId,
  ) : ?Types.UserProfile {
    users.get(id)
  };

  /// Insert or replace a user profile.
  public func upsertUser(
    users : Map.Map<Types.UserId, Types.UserProfile>,
    user  : Types.UserProfile,
  ) : () {
    users.add(user.id, user);
  };

  /// Update the status (Active | Blocked) of a user.  Returns false if not found.
  public func setUserStatus(
    users  : Map.Map<Types.UserId, Types.UserProfile>,
    id     : Types.UserId,
    status : Types.UserStatus,
  ) : Bool {
    switch (users.get(id)) {
      case null { false };
      case (?u) {
        users.add(id, { u with status });
        true
      };
    }
  };

  /// Grant access to a course (idempotent — skips if already enrolled).
  public func grantCourseAccess(
    users    : Map.Map<Types.UserId, Types.UserProfile>,
    id       : Types.UserId,
    courseId : Nat,
  ) : Bool {
    switch (users.get(id)) {
      case null { false };
      case (?u) {
        let already = u.enrolledCourses.find(func(c : Nat) : Bool { c == courseId });
        switch (already) {
          case (?_) { true /* already enrolled */ };
          case null {
            let updated = u.enrolledCourses.concat([courseId]);
            users.add(id, { u with enrolledCourses = updated });
            true
          };
        }
      };
    }
  };

  /// Revoke access to a course.  Returns false if user not found.
  public func revokeCourseAccess(
    users    : Map.Map<Types.UserId, Types.UserProfile>,
    id       : Types.UserId,
    courseId : Nat,
  ) : Bool {
    switch (users.get(id)) {
      case null { false };
      case (?u) {
        let updated = u.enrolledCourses.filter(func(c : Nat) : Bool { c != courseId });
        users.add(id, { u with enrolledCourses = updated });
        true
      };
    }
  };

  // ── Progress tracking ────────────────────────────────────────────────────

  /// Fetch progress for a specific (user, course) pair.
  public func getProgress(
    progress : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
    userId   : Types.UserId,
    courseId : Nat,
  ) : ?Types.UserProgress {
    progress.get(progressKeyCompare, (userId, courseId))
  };

  /// Insert or replace progress for a (user, course) pair.
  public func upsertProgress(
    progress : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
    p        : Types.UserProgress,
  ) : () {
    progress.add(progressKeyCompare, (p.userId, p.courseId), p);
  };

  /// List all progress records for a given user across all enrolled courses.
  public func listProgressForUser(
    progress : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
    userId   : Types.UserId,
  ) : [Types.UserProgress] {
    let result = List.empty<Types.UserProgress>();
    for (((uid, _), prog) in progress.entries()) {
      if (Principal.equal(uid, userId)) {
        result.add(prog);
      };
    };
    result.toArray()
  };
};
