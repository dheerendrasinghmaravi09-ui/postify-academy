import Types "../types/academy";
import List "mo:core/List";
import Time "mo:core/Time";

module {
  /// Append a new audit log entry. Increments nextId.
  public func addEntry(
    log : List.List<Types.AuditLogEntry>,
    nextId : { var v : Nat },
    userId : Types.UserId,
    action : Text,
    details : Text,
  ) : () {
    let entry : Types.AuditLogEntry = {
      id = nextId.v;
      userId;
      action;
      details;
      timestamp = Time.now();
    };
    log.add(entry);
    nextId.v += 1;
  };

  /// Return all audit log entries as an immutable array, newest first.
  public func listEntries(log : List.List<Types.AuditLogEntry>) : [Types.AuditLogEntry] {
    log.reverse().toArray();
  };
};
