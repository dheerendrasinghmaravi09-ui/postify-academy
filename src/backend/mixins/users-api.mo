import Types "../types/academy";
import UsersLib "../lib/users";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users              : Map.Map<Types.UserId, Types.UserProfile>,
  progress           : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
) {

  // ── Helpers ────────────────────────────────────────────────────────────────

  func requireAdmin(caller : Types.UserId) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
  };

  // ── User listing (paginated + searchable) ──────────────────────────────────

  /// List users with optional search (name/email) and status filter.
  /// Pagination via offset + limit.
  public query ({ caller }) func listUsers(
    search : ?Text,
    status : ?Types.UserStatus,
    offset : Nat,
    limit  : Nat,
  ) : async [Types.UserProfile] {
    requireAdmin(caller);
    UsersLib.listUsers(users, search, status, offset, limit)
  };

  // ── Single user ─────────────────────────────────────────────────────────────

  /// Get a single user profile by principal id.
  public query ({ caller }) func getUser(id : Types.UserId) : async ?Types.UserProfile {
    requireAdmin(caller);
    UsersLib.getUser(users, id)
  };

  /// Upsert a user profile (admin can create or update any profile).
  public shared ({ caller }) func upsertUser(user : Types.UserProfile) : async () {
    requireAdmin(caller);
    UsersLib.upsertUser(users, user);
  };

  // ── Status management ───────────────────────────────────────────────────────

  /// Activate or block a user.  Returns false when user not found.
  public shared ({ caller }) func setUserStatus(
    id     : Types.UserId,
    status : Types.UserStatus,
  ) : async Bool {
    requireAdmin(caller);
    UsersLib.setUserStatus(users, id, status)
  };

  // ── Course access ───────────────────────────────────────────────────────────

  /// Enrol a user in a course (idempotent).
  public shared ({ caller }) func grantCourseAccess(
    id       : Types.UserId,
    courseId : Nat,
  ) : async Bool {
    requireAdmin(caller);
    UsersLib.grantCourseAccess(users, id, courseId)
  };

  /// Remove a user's enrolment from a course.
  public shared ({ caller }) func revokeCourseAccess(
    id       : Types.UserId,
    courseId : Nat,
  ) : async Bool {
    requireAdmin(caller);
    UsersLib.revokeCourseAccess(users, id, courseId)
  };

  // ── Progress ────────────────────────────────────────────────────────────────

  /// Get progress for a specific (user, course) pair.
  public query ({ caller }) func getUserProgress(
    userId   : Types.UserId,
    courseId : Nat,
  ) : async ?Types.UserProgress {
    requireAdmin(caller);
    UsersLib.getProgress(progress, userId, courseId)
  };

  /// List all progress records for a user across all courses.
  public query ({ caller }) func listUserProgress(
    userId : Types.UserId,
  ) : async [Types.UserProgress] {
    requireAdmin(caller);
    UsersLib.listProgressForUser(progress, userId)
  };

  /// Insert or update a progress record (admin or system use).
  public shared ({ caller }) func upsertProgress(p : Types.UserProgress) : async () {
    requireAdmin(caller);
    UsersLib.upsertProgress(progress, p);
  };

  // ── User detail view ────────────────────────────────────────────────────────

  /// Return a user profile plus all their progress records in a single call.
  public query ({ caller }) func getUserDetail(id : Types.UserId) : async ?(Types.UserProfile, [Types.UserProgress]) {
    requireAdmin(caller);
    switch (UsersLib.getUser(users, id)) {
      case null { null };
      case (?profile) {
        let allProgress = UsersLib.listProgressForUser(progress, id);
        ?(profile, allProgress)
      };
    }
  };
};
