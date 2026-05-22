import Types "../types/academy";
import TestsLib "../lib/tests";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  mockTests : Map.Map<Nat, Types.MockTest>,
  questions : Map.Map<Nat, Types.Question>,
  testResults : Map.Map<(Types.UserId, Nat), Types.TestResult>,
  nextTestId : { var v : Nat },
  nextQuestionId : { var v : Nat },
) {
  // ── Mock Tests ────────────────────────────────────────────────────────────

  public query func listMockTests() : async [Types.MockTest] {
    TestsLib.listTests(mockTests);
  };

  public query func getMockTest(id : Nat) : async ?Types.MockTest {
    TestsLib.getTest(mockTests, id);
  };

  public shared ({ caller }) func createMockTest(test : Types.MockTest) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    TestsLib.createTest(mockTests, nextTestId, test);
  };

  public shared ({ caller }) func updateMockTest(test : Types.MockTest) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    TestsLib.updateTest(mockTests, test);
  };

  public shared ({ caller }) func deleteMockTest(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    TestsLib.deleteTest(mockTests, id);
  };

  // ── Questions ─────────────────────────────────────────────────────────────

  public query func listQuestions(testId : Nat) : async [Types.Question] {
    TestsLib.listQuestions(questions, testId);
  };

  public shared ({ caller }) func addQuestion(q : Types.Question) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    TestsLib.addQuestion(questions, nextQuestionId, q);
  };

  public shared ({ caller }) func updateQuestion(q : Types.Question) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    TestsLib.updateQuestion(questions, q);
  };

  public shared ({ caller }) func deleteQuestion(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
    TestsLib.deleteQuestion(questions, id);
  };

  // ── Submit & Auto-grade ───────────────────────────────────────────────────
  // Accepts pre-computed result (score, percentage, passed already calculated client-side or via gradeAndSubmit).
  // For server-side grading, use gradeAndSubmit below.

  public shared ({ caller }) func submitTestResult(r : Types.TestResult) : async () {
    // Users submit their own result; the userId in the result must match the caller
    if (not caller.equal(r.userId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: can only submit your own result");
    };
    TestsLib.submitTestResult(testResults, r);
  };

  // Server-side grading: caller submits answers, backend grades and stores result
  public shared ({ caller }) func gradeAndSubmit(
    testId : Nat,
    answers : [TestsLib.UserAnswer],
    timeTaken : Nat,
  ) : async Types.TestResult {
    let test = switch (TestsLib.getTest(mockTests, testId)) {
      case null { Runtime.trap("Test not found") };
      case (?t) t;
    };
    let graded = TestsLib.gradeAnswers(
      questions,
      testId,
      answers,
      test.passingScore,
      test.negativeMarking,
    );
    let result : Types.TestResult = {
      userId = caller;
      testId;
      score = graded.score;
      percentage = graded.percentage;
      passed = graded.passed;
      timeTaken;
    };
    TestsLib.submitTestResult(testResults, result);
    result;
  };

  public query ({ caller }) func getTestResult(userId : Types.UserId, testId : Nat) : async ?Types.TestResult {
    // Users can see their own result; admins can see any
    if (not caller.equal(userId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: can only view your own result");
    };
    TestsLib.getTestResult(testResults, userId, testId);
  };

  public query func getTestLeaderboard(testId : Nat) : async [Types.TestResult] {
    TestsLib.getLeaderboard(testResults, testId);
  };

  // Review: return per-question breakdown of a user's answers
  public query ({ caller }) func reviewTestAnswers(
    testId : Nat,
    answers : [TestsLib.UserAnswer],
  ) : async [TestsLib.ReviewItem] {
    TestsLib.reviewAnswers(questions, testId, answers);
  };
};
