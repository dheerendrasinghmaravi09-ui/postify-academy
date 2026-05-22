import Types "../types/academy";
import AppSyncLib "../lib/appSync";
import AccessControl "mo:caffeineai-authorization/access-control";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  accessControlState : AccessControl.AccessControlState,
  syncEndpoint : { var v : Types.SyncEndpoint },
  syncLogs : List.List<Types.SyncLogEntry>,
  connectedAppInfo : { var v : Types.ConnectedAppInfo },
  courses : Map.Map<Nat, Types.Course>,
  users : Map.Map<Types.UserId, Types.UserProfile>,
) {
  public query ({ caller }) func getSyncEndpoint() : async Types.SyncEndpoint {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view sync endpoint");
    };
    AppSyncLib.getSyncEndpoint(syncEndpoint);
  };

  public shared ({ caller }) func setSyncEndpoint(url : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set sync endpoint");
    };
    AppSyncLib.setSyncEndpoint(syncEndpoint, url);
  };

  public shared ({ caller }) func recordSyncLog(entry : Types.SyncLogEntry) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can record sync logs");
    };
    AppSyncLib.recordSyncLog(syncLogs, entry);
  };

  public query ({ caller }) func listSyncLogs() : async [Types.SyncLogEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list sync logs");
    };
    AppSyncLib.listSyncLogs(syncLogs);
  };

  public shared ({ caller }) func clearSyncLogs() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can clear sync logs");
    };
    AppSyncLib.clearSyncLogs(syncLogs);
  };

  // ── Connected App Info ────────────────────────────────────────────────────

  public query ({ caller }) func getConnectedAppInfo() : async Types.ConnectedAppInfo {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view connected app info");
    };
    // Count live data from the shared backend state
    let totalCourses = courses.size();
    var publishedCount : Nat = 0;
    courses.forEach(func(_k, c) {
      if (c.isPublished) { publishedCount += 1 };
    });
    let totalStudents = users.size();

    // Determine stored app name — default to "Postify Course App" if not customised
    let storedName = connectedAppInfo.v.appName;
    let appName = if (storedName == "" or storedName == "Postify Academy") {
      "Postify Course App"
    } else {
      storedName
    };

    {
      appName;
      appUrl = connectedAppInfo.v.appUrl;
      totalCourses;
      publishedCourses = publishedCount;
      totalStudents;
      lastSyncAt = ?Time.now();
      syncStatus = #Connected; // Same canister — always connected
    };
  };

  public shared ({ caller }) func updateConnectedAppInfo(appName : Text, appUrl : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update connected app info");
    };
    connectedAppInfo.v := {
      connectedAppInfo.v with
      appName;
      appUrl;
    };
  };
};
