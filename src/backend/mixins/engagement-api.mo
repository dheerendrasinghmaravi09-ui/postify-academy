import Types "../types/academy";
import EngagementLib "../lib/engagement";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  accessControlState : AccessControl.AccessControlState,
  dailyQuestions : Map.Map<Nat, Types.DailyQuestion>,
  challenges : Map.Map<Nat, Types.StudyChallenge>,
  timers : Map.Map<Nat, Types.CountdownTimer>,
  messages : Map.Map<Nat, Types.MotivationalMessage>,
  challengeCompletions : Map.Map<Text, Nat>,
  nextDqId : { var v : Nat },
  nextChallengeId : { var v : Nat },
  nextTimerId : { var v : Nat },
  nextMessageId : { var v : Nat },
) {
  // ── Daily Questions ───────────────────────────────────────────────────────
  public query func listDailyQuestions() : async [Types.DailyQuestion] {
    EngagementLib.listDailyQuestions(dailyQuestions);
  };

  public shared ({ caller }) func addDailyQuestion(dq : Types.DailyQuestion) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.addDailyQuestion(dailyQuestions, nextDqId, dq);
  };

  public shared ({ caller }) func updateDailyQuestion(dq : Types.DailyQuestion) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.updateDailyQuestion(dailyQuestions, dq);
  };

  public shared ({ caller }) func deleteDailyQuestion(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.deleteDailyQuestion(dailyQuestions, id);
  };

  // ── Study Challenges ──────────────────────────────────────────────────────
  public query func listChallenges() : async [Types.StudyChallenge] {
    EngagementLib.listChallenges(challenges);
  };

  public shared ({ caller }) func addChallenge(c : Types.StudyChallenge) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.addChallenge(challenges, nextChallengeId, c);
  };

  public shared ({ caller }) func updateChallenge(c : Types.StudyChallenge) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.updateChallenge(challenges, c);
  };

  public shared ({ caller }) func deleteChallenge(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.deleteChallenge(challenges, id);
  };

  // Record a challenge completion for a user (any authenticated user)
  public shared ({ caller }) func recordChallengeCompletion(challengeId : Nat) : async Nat {
    EngagementLib.recordChallengeCompletion(challengeCompletions, challengeId, caller);
  };

  // Challenge leaderboard: [(userId text, total completions)]
  public query func getChallengeLeaderboard() : async [(Text, Nat)] {
    EngagementLib.getLeaderboard(challengeCompletions);
  };

  // ── Countdown Timers ──────────────────────────────────────────────────────
  public query func listTimers() : async [Types.CountdownTimer] {
    EngagementLib.listTimers(timers);
  };

  public shared ({ caller }) func addTimer(t : Types.CountdownTimer) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.addTimer(timers, nextTimerId, t);
  };

  public shared ({ caller }) func deleteTimer(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.deleteTimer(timers, id);
  };

  // ── Motivational Messages ─────────────────────────────────────────────────
  public query func listMotivationalMessages() : async [Types.MotivationalMessage] {
    EngagementLib.listMessages(messages);
  };

  public shared ({ caller }) func addMotivationalMessage(m : Types.MotivationalMessage) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.addMessage(messages, nextMessageId, m);
  };

  public shared ({ caller }) func deleteMotivationalMessage(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    EngagementLib.deleteMessage(messages, id);
  };
};
