import Types "../types/academy";
import Map "mo:core/Map";

module {
  // ── Daily Questions ─────────────────────────────────────────────────────────
  public func listDailyQuestions(dqs : Map.Map<Nat, Types.DailyQuestion>) : [Types.DailyQuestion] {
    dqs.values().toArray();
  };

  public func addDailyQuestion(dqs : Map.Map<Nat, Types.DailyQuestion>, nextId : { var v : Nat }, dq : Types.DailyQuestion) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    dqs.add(id, { dq with id });
    id;
  };

  public func updateDailyQuestion(dqs : Map.Map<Nat, Types.DailyQuestion>, dq : Types.DailyQuestion) : Bool {
    switch (dqs.get(dq.id)) {
      case null false;
      case (?_) { dqs.add(dq.id, dq); true };
    };
  };

  public func deleteDailyQuestion(dqs : Map.Map<Nat, Types.DailyQuestion>, id : Nat) : Bool {
    switch (dqs.get(id)) {
      case null false;
      case (?_) { dqs.remove(id); true };
    };
  };

  // ── Study Challenges ────────────────────────────────────────────────────────
  public func listChallenges(challenges : Map.Map<Nat, Types.StudyChallenge>) : [Types.StudyChallenge] {
    challenges.values().toArray();
  };

  public func addChallenge(challenges : Map.Map<Nat, Types.StudyChallenge>, nextId : { var v : Nat }, c : Types.StudyChallenge) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    challenges.add(id, { c with id });
    id;
  };

  public func updateChallenge(challenges : Map.Map<Nat, Types.StudyChallenge>, c : Types.StudyChallenge) : Bool {
    switch (challenges.get(c.id)) {
      case null false;
      case (?_) { challenges.add(c.id, c); true };
    };
  };

  public func deleteChallenge(challenges : Map.Map<Nat, Types.StudyChallenge>, id : Nat) : Bool {
    switch (challenges.get(id)) {
      case null false;
      case (?_) { challenges.remove(id); true };
    };
  };

  // ── Countdown Timers ────────────────────────────────────────────────────────
  public func listTimers(timers : Map.Map<Nat, Types.CountdownTimer>) : [Types.CountdownTimer] {
    timers.values().toArray();
  };

  public func addTimer(timers : Map.Map<Nat, Types.CountdownTimer>, nextId : { var v : Nat }, t : Types.CountdownTimer) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    timers.add(id, { t with id });
    id;
  };

  public func deleteTimer(timers : Map.Map<Nat, Types.CountdownTimer>, id : Nat) : Bool {
    switch (timers.get(id)) {
      case null false;
      case (?_) { timers.remove(id); true };
    };
  };

  // ── Motivational Messages ───────────────────────────────────────────────────
  public func listMessages(messages : Map.Map<Nat, Types.MotivationalMessage>) : [Types.MotivationalMessage] {
    messages.values().toArray();
  };

  public func addMessage(messages : Map.Map<Nat, Types.MotivationalMessage>, nextId : { var v : Nat }, m : Types.MotivationalMessage) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    messages.add(id, { m with id });
    id;
  };

  public func deleteMessage(messages : Map.Map<Nat, Types.MotivationalMessage>, id : Nat) : Bool {
    switch (messages.get(id)) {
      case null false;
      case (?_) { messages.remove(id); true };
    };
  };

  // ── Challenge Completions ──────────────────────────────────────────────────
  // completions keyed by "challengeId:userId" → count
  public func recordChallengeCompletion(
    completions : Map.Map<Text, Nat>,
    challengeId : Nat,
    userId : Types.UserId,
  ) : Nat {
    let key = challengeId.toText() # ":" # userId.toText();
    let current = switch (completions.get(key)) {
      case null 0;
      case (?n) n;
    };
    let updated = current + 1;
    completions.add(key, updated);
    updated;
  };

  // Returns leaderboard as [(userId text, total completions across all challenges)]
  // Sorted descending by total completions
  public func getLeaderboard(completions : Map.Map<Text, Nat>) : [(Text, Nat)] {
    let userTotals = Map.empty<Text, Nat>();
    for ((key, count) in completions.entries()) {
      let parts = key.split(#char ':').toArray();
      if (parts.size() == 2) {
        let uid = parts[1];
        let prev = switch (userTotals.get(uid)) {
          case null 0;
          case (?n) n;
        };
        userTotals.add(uid, prev + count);
      };
    };
    let arr = userTotals.entries().toArray();
    arr.sort(func((_, a) : (Text, Nat), (_, b) : (Text, Nat)) : { #less; #equal; #greater } {
      if (a > b) #less else if (a < b) #greater else #equal
    });
  };
};
