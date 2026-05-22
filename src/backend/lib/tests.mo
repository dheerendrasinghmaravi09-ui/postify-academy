import Types "../types/academy";
import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";

module {
  // ── Composite key compare for (UserId, Nat) ────────────────────────────────
  public func resultKeyCompare(a : (Types.UserId, Nat), b : (Types.UserId, Nat)) : Order.Order {
    let pc = a.0.compare(b.0);
    if (not pc.isEqual()) { pc } else {
      if (a.1 < b.1) { #less } else if (a.1 > b.1) { #greater } else { #equal };
    };
  };

  // ── Mock test management ───────────────────────────────────────────────────

  public func listTests(tests : Map.Map<Nat, Types.MockTest>) : [Types.MockTest] {
    tests.values().toArray();
  };

  public func getTest(tests : Map.Map<Nat, Types.MockTest>, id : Nat) : ?Types.MockTest {
    tests.get(id);
  };

  public func createTest(
    tests : Map.Map<Nat, Types.MockTest>,
    nextId : { var v : Nat },
    test : Types.MockTest,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    tests.add(id, { test with id });
    id;
  };

  public func updateTest(tests : Map.Map<Nat, Types.MockTest>, test : Types.MockTest) : Bool {
    switch (tests.get(test.id)) {
      case null { false };
      case (?_) {
        tests.add(test.id, test);
        true;
      };
    };
  };

  public func deleteTest(tests : Map.Map<Nat, Types.MockTest>, id : Nat) : Bool {
    switch (tests.get(id)) {
      case null { false };
      case (?_) {
        tests.remove(id);
        true;
      };
    };
  };

  // ── Question management ────────────────────────────────────────────────────

  public func listQuestions(
    questions : Map.Map<Nat, Types.Question>,
    testId : Nat,
  ) : [Types.Question] {
    questions.values().filter(func(q : Types.Question) : Bool { q.testId == testId }).toArray();
  };

  public func addQuestion(
    questions : Map.Map<Nat, Types.Question>,
    nextId : { var v : Nat },
    q : Types.Question,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    questions.add(id, { q with id });
    id;
  };

  public func updateQuestion(questions : Map.Map<Nat, Types.Question>, q : Types.Question) : Bool {
    switch (questions.get(q.id)) {
      case null { false };
      case (?_) {
        questions.add(q.id, q);
        true;
      };
    };
  };

  public func deleteQuestion(questions : Map.Map<Nat, Types.Question>, id : Nat) : Bool {
    switch (questions.get(id)) {
      case null { false };
      case (?_) {
        questions.remove(id);
        true;
      };
    };
  };

  // ── Auto-grading ───────────────────────────────────────────────────────────

  // (questionId, selectedIndex) submitted by the user
  public type UserAnswer = { questionId : Nat; selectedIndex : Nat };

  // Grade a set of answers against stored questions.
  // Returns (score = correct count, percentage 0-100, passed).
  // negativeMarking: deduct 0.25 per wrong answer, using integer math (*4).
  public func gradeAnswers(
    questions : Map.Map<Nat, Types.Question>,
    testId : Nat,
    answers : [UserAnswer],
    passingScore : Nat,
    negativeMarking : Bool,
  ) : { score : Nat; percentage : Nat; passed : Bool } {
    let qs = listQuestions(questions, testId);
    let total = qs.size();
    if (total == 0) {
      return { score = 0; percentage = 0; passed = false };
    };

    // Use *4 integer scaling: correct = +4, wrong with neg marking = -1, skip = 0
    var scaled4 : Int = 0;
    var correctCount : Nat = 0;

    for (q in qs.values()) {
      let answerOpt = answers.find(func(a : UserAnswer) : Bool { a.questionId == q.id });
      switch (answerOpt) {
        case null {};
        case (?a) {
          if (a.selectedIndex == q.correctIndex) {
            scaled4 += 4;
            correctCount += 1;
          } else if (negativeMarking) {
            scaled4 -= 1;
          };
        };
      };
    };

    // Clamp to 0
    if (scaled4 < 0) { scaled4 := 0 };

    // max possible = total * 4
    let maxScaled4 : Nat = total * 4;
    let pct : Nat = if (maxScaled4 == 0) { 0 } else {
      let raw : Int = scaled4 * 100 / maxScaled4;
      if (raw < 0) { 0 } else { raw.toNat() };
    };

    { score = correctCount; percentage = pct; passed = pct >= passingScore };
  };

  // ── Review ─────────────────────────────────────────────────────────────────

  public type ReviewItem = {
    questionId : Nat;
    questionText : Text;
    options : [Text];
    userSelectedIndex : ?Nat;
    correctIndex : Nat;
    isCorrect : Bool;
    explanation : Text;
  };

  public func reviewAnswers(
    questions : Map.Map<Nat, Types.Question>,
    testId : Nat,
    answers : [UserAnswer],
  ) : [ReviewItem] {
    let qs = listQuestions(questions, testId);
    qs.map<Types.Question, ReviewItem>(func(q : Types.Question) : ReviewItem {
      let answerOpt = answers.find(func(a : UserAnswer) : Bool { a.questionId == q.id });
      let userIdx : ?Nat = switch (answerOpt) {
        case null null;
        case (?a) ?a.selectedIndex;
      };
      let isCorrect = switch (userIdx) {
        case (?i) i == q.correctIndex;
        case null false;
      };
      {
        questionId = q.id;
        questionText = q.text;
        options = q.options;
        userSelectedIndex = userIdx;
        correctIndex = q.correctIndex;
        isCorrect;
        explanation = q.explanation;
      };
    });
  };

  // ── Test result storage ────────────────────────────────────────────────────

  public func submitTestResult(
    results : Map.Map<(Types.UserId, Nat), Types.TestResult>,
    r : Types.TestResult,
  ) : () {
    results.add(resultKeyCompare, (r.userId, r.testId), r);
  };

  public func getTestResult(
    results : Map.Map<(Types.UserId, Nat), Types.TestResult>,
    userId : Types.UserId,
    testId : Nat,
  ) : ?Types.TestResult {
    results.get(resultKeyCompare, (userId, testId));
  };

  // Return all results for a test, sorted by score descending, then timeTaken ascending
  public func getLeaderboard(
    results : Map.Map<(Types.UserId, Nat), Types.TestResult>,
    testId : Nat,
  ) : [Types.TestResult] {
    let board = List.empty<Types.TestResult>();
    for (((_, tid), r) in results.entries()) {
      if (tid == testId) {
        board.add(r);
      };
    };
    board.sortInPlace(func(a : Types.TestResult, b : Types.TestResult) : { #less; #equal; #greater } {
      if (a.score > b.score) { #less } else if (a.score < b.score) { #greater } else {
        // same score: lower timeTaken wins
        if (a.timeTaken < b.timeTaken) { #less } else if (a.timeTaken > b.timeTaken) { #greater } else { #equal };
      };
    });
    board.toArray();
  };
};
