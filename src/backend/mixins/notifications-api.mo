import Types "../types/academy";
import NotifsLib "../lib/notifications";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  accessControlState : AccessControl.AccessControlState,
  notifications : Map.Map<Nat, Types.Notification>,
  nextNotifId : { var v : Nat },
) {
  // Admin: list all notifications (drafts, scheduled, sent)
  public query ({ caller }) func listNotifications() : async [Types.Notification] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.listNotifications(notifications);
  };

  public query ({ caller }) func getNotification(id : Nat) : async ?Types.Notification {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.getNotification(notifications, id);
  };

  public shared ({ caller }) func createNotification(n : Types.Notification) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.createNotification(notifications, nextNotifId, n);
  };

  public shared ({ caller }) func updateNotification(n : Types.Notification) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.updateNotification(notifications, n);
  };

  public shared ({ caller }) func deleteNotification(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.deleteNotification(notifications, id);
  };

  // Mark a notification as sent (records sentAt timestamp)
  public shared ({ caller }) func sendNotification(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.markNotificationSent(notifications, id, Time.now());
  };

  // Notification center: all sent notifications in chronological order
  public query func getSentNotifications() : async [Types.Notification] {
    NotifsLib.listSentNotifications(notifications);
  };

  // History stats: count per status
  public query ({ caller }) func getNotificationHistory() : async [Types.NotificationHistory] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    NotifsLib.getHistory(notifications);
  };
};
