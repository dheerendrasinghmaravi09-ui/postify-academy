import Types "../types/academy";
import Map "mo:core/Map";
import Time "mo:core/Time";

module {
  public func listNotifications(notifs : Map.Map<Nat, Types.Notification>) : [Types.Notification] {
    notifs.values().toArray();
  };

  public func getNotification(notifs : Map.Map<Nat, Types.Notification>, id : Nat) : ?Types.Notification {
    notifs.get(id);
  };

  public func createNotification(notifs : Map.Map<Nat, Types.Notification>, nextId : { var v : Nat }, n : Types.Notification) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    notifs.add(id, { n with id; status = #Draft });
    id;
  };

  public func updateNotification(notifs : Map.Map<Nat, Types.Notification>, n : Types.Notification) : Bool {
    switch (notifs.get(n.id)) {
      case null false;
      case (?existing) {
        switch (existing.status) {
          case (#Sent) false;
          case (_) { notifs.add(n.id, n); true };
        };
      };
    };
  };

  public func deleteNotification(notifs : Map.Map<Nat, Types.Notification>, id : Nat) : Bool {
    switch (notifs.get(id)) {
      case null false;
      case (?_) { notifs.remove(id); true };
    };
  };

  public func markNotificationSent(notifs : Map.Map<Nat, Types.Notification>, id : Nat, sentAt : Types.Timestamp) : Bool {
    switch (notifs.get(id)) {
      case null false;
      case (?existing) {
        notifs.add(id, { existing with sentAt = ?sentAt; status = #Sent });
        true;
      };
    };
  };

  // Returns history stats: count per status
  public func getHistory(notifs : Map.Map<Nat, Types.Notification>) : [Types.NotificationHistory] {
    var sentCount = 0;
    var draftCount = 0;
    var scheduledCount = 0;
    var failedCount = 0;
    for ((_, n) in notifs.entries()) {
      switch (n.status) {
        case (#Sent) sentCount += 1;
        case (#Draft) draftCount += 1;
        case (#Scheduled) scheduledCount += 1;
        case (#Failed) failedCount += 1;
      };
    };
    [
      { sentCount = sentCount; status = #Sent },
      { sentCount = draftCount; status = #Draft },
      { sentCount = scheduledCount; status = #Scheduled },
      { sentCount = failedCount; status = #Failed },
    ];
  };

  // List all sent notifications sorted newest sentAt first
  public func listSentNotifications(notifs : Map.Map<Nat, Types.Notification>) : [Types.Notification] {
    let sent = notifs.values().filter(func(n : Types.Notification) : Bool {
      switch (n.status) { case (#Sent) true; case (_) false }
    }).toArray();
    sent.sort(func(a : Types.Notification, b : Types.Notification) : { #less; #equal; #greater } {
      let aTime = switch (a.sentAt) { case (?t) t; case null 0 };
      let bTime = switch (b.sentAt) { case (?t) t; case null 0 };
      if (aTime > bTime) #less else if (aTime < bTime) #greater else #equal
    });
  };
};
