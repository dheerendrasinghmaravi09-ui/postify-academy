import Types "../types/academy";
import AuditLib "../lib/auditlog";
import AccessControl "mo:caffeineai-authorization/access-control";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  auditLog : List.List<Types.AuditLogEntry>,
  nextAuditId : { var v : Nat },
) {
  /// List all audit log entries (newest first). Admin-only.
  public query ({ caller }) func listAuditLog() : async [Types.AuditLogEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view audit log");
    };
    AuditLib.listEntries(auditLog);
  };
};
