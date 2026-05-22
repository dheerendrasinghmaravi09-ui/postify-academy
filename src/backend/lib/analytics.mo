import Types "../types/academy";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Text "mo:core/Text";

module {
  // ── Helpers ──────────────────────────────────────────────────────────────

  // Returns a YYYY-MM-DD date string from a nanosecond Int timestamp
  func timestampToDate(ts : Int) : Text {
    let secs : Int = ts / 1_000_000_000;
    let days : Int = secs / 86400;
    // Civil calendar algorithm (Euclidean affine functions)
    let z : Int = days + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let d : Int = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = mp + (if (mp < 10) 3 else -9);
    let yr : Int = y + (if (m <= 2) 1 else 0);
    yr.toText() # "-" # padTwo(m.toNat()) # "-" # padTwo(d.toNat());
  };

  func padTwo(n : Nat) : Text {
    if (n < 10) "0" # n.toText() else n.toText();
  };

  // Returns nanosecond timestamp N days ago
  func daysAgoNs(daysAgo : Nat) : Int {
    Time.now() - (daysAgo * 86400 * 1_000_000_000 : Nat).toInt();
  };

  // Compare TimeSeriesDataPoint by date (lexicographic on YYYY-MM-DD is correct)
  func compareDataPoint(a : Types.TimeSeriesDataPoint, b : Types.TimeSeriesDataPoint) : { #less; #equal; #greater } {
    Text.compare(a.date, b.date);
  };

  // ── Analytics Summary ────────────────────────────────────────────────────

  public func getSummary(
    users : Map.Map<Types.UserId, Types.UserProfile>,
    transactions : Map.Map<Nat, Types.Transaction>,
    progress : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
  ) : Types.AnalyticsSummary {
    let thirtyDaysAgo = daysAgoNs(30);
    let sixtyDaysAgo = daysAgoNs(60);
    let sevenDaysAgo = daysAgoNs(7);
    let fourteenDaysAgo = daysAgoNs(14);

    let totalUsers = users.size();

    // Active users: logged in within last 30 days
    var activeUsers : Nat = 0;
    users.forEach(func(_, u) {
      if (u.lastLogin >= thirtyDaysAgo) activeUsers += 1;
    });

    // New signups this month (using 30-day window as proxy)
    var newSignups : Nat = 0;
    users.forEach(func(_, u) {
      if (u.createdAt >= thirtyDaysAgo) newSignups += 1;
    });

    // Total revenue and per-window revenue for MRR growth
    var totalRevenue : Nat = 0;
    var thisMonthRevenue : Nat = 0;
    var lastMonthRevenue : Nat = 0;
    transactions.forEach(func(_, t) {
      switch (t.status) {
        case (#Completed) {
          totalRevenue += t.amount;
          if (t.date >= thirtyDaysAgo) {
            thisMonthRevenue += t.amount;
          } else if (t.date >= sixtyDaysAgo) {
            lastMonthRevenue += t.amount;
          };
        };
        case _ {};
      };
    });

    let mrrGrowthPercent : Float = if (lastMonthRevenue == 0) {
      if (thisMonthRevenue > 0) 100.0 else 0.0;
    } else {
      let diff : Int = thisMonthRevenue.toInt() - lastMonthRevenue.toInt();
      (diff.toFloat() / lastMonthRevenue.toFloat()) * 100.0;
    };

    // Course completion rate: % of progress records at 100%
    let totalProgress = progress.size();
    var completedCourses : Nat = 0;
    progress.forEach(func(_, p) {
      if (p.completionPercent >= 100) completedCourses += 1;
    });
    let courseCompletionRate : Float = if (totalProgress == 0) 0.0 else {
      completedCourses.toFloat() / totalProgress.toFloat() * 100.0;
    };

    // Avg study hours per user (studyTime stored in minutes)
    var totalStudyTime : Nat = 0;
    progress.forEach(func(_, p) {
      totalStudyTime += p.studyTime;
    });
    let avgStudyHoursPerUser : Float = if (totalUsers == 0) 0.0 else {
      (totalStudyTime.toFloat() / 60.0) / totalUsers.toFloat();
    };

    // Retention: users who signed up 8-14 days ago and logged in within last 7 days
    var cohort : Nat = 0;
    var retained : Nat = 0;
    users.forEach(func(_, u) {
      if (u.createdAt >= fourteenDaysAgo and u.createdAt < sevenDaysAgo) {
        cohort += 1;
        if (u.lastLogin >= sevenDaysAgo) retained += 1;
      };
    });
    let retentionRate : Float = if (cohort == 0) 0.0 else {
      retained.toFloat() / cohort.toFloat() * 100.0;
    };

    {
      totalUsers;
      activeUsers;
      newSignupsThisMonth = newSignups;
      totalRevenue;
      mrrGrowthPercent;
      courseCompletionRate;
      avgStudyHoursPerUser;
      retentionRate;
    };
  };

  // ── User Signup Time Series ───────────────────────────────────────────────

  public func getUserSignupTimeSeries(
    users : Map.Map<Types.UserId, Types.UserProfile>,
    days : Nat,
  ) : [Types.TimeSeriesDataPoint] {
    let cutoff = daysAgoNs(days);
    let counts = Map.empty<Text, Nat>();
    users.forEach(func(_, u) {
      if (u.createdAt >= cutoff) {
        let d = timestampToDate(u.createdAt);
        let prev = switch (counts.get(d)) { case (?n) n; case null 0 };
        counts.add(d, prev + 1);
      };
    });
    let result = List.empty<Types.TimeSeriesDataPoint>();
    for ((date, count) in counts.entries()) {
      result.add({ date; value = count.toFloat() });
    };
    result.sort(compareDataPoint).toArray();
  };

  // ── Revenue Time Series ───────────────────────────────────────────────────

  public func getRevenuTimeSeries(
    transactions : Map.Map<Nat, Types.Transaction>,
    days : Nat,
  ) : [Types.TimeSeriesDataPoint] {
    let cutoff = daysAgoNs(days);
    let sums = Map.empty<Text, Nat>();
    transactions.forEach(func(_, t) {
      switch (t.status) {
        case (#Completed) {
          if (t.date >= cutoff) {
            let d = timestampToDate(t.date);
            let prev = switch (sums.get(d)) { case (?n) n; case null 0 };
            sums.add(d, prev + t.amount);
          };
        };
        case _ {};
      };
    });
    let result = List.empty<Types.TimeSeriesDataPoint>();
    for ((date, amt) in sums.entries()) {
      result.add({ date; value = amt.toFloat() });
    };
    result.sort(compareDataPoint).toArray();
  };

  // ── Course Completion Time Series ─────────────────────────────────────────
  // Returns avg completion % per course (x = courseId as Text, y = avg%)

  public func getCourseCompletionTimeSeries(
    progress : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
    _days : Nat,
  ) : [Types.TimeSeriesDataPoint] {
    let courseStats = Map.empty<Nat, (Nat, Nat)>(); // courseId → (totalPct, count)
    progress.forEach(func(key, p) {
      let courseId = key.1;
      let (total, cnt) = switch (courseStats.get(courseId)) {
        case (?(t, c)) (t, c);
        case null (0, 0);
      };
      courseStats.add(courseId, (total + p.completionPercent, cnt + 1));
    });
    let result = List.empty<Types.TimeSeriesDataPoint>();
    for ((courseId, stats) in courseStats.entries()) {
      let (total, cnt) = stats;
      let avg : Float = if (cnt == 0) 0.0 else total.toFloat() / cnt.toFloat();
      result.add({ date = courseId.toText(); value = avg });
    };
    result.toArray();
  };

  // ── Top Courses by Enrollment ─────────────────────────────────────────────

  public type CourseEnrollment = { courseId : Nat; enrollmentCount : Nat };

  public func getTopCoursesByEnrollment(
    users : Map.Map<Types.UserId, Types.UserProfile>,
    topN : Nat,
  ) : [CourseEnrollment] {
    let counts = Map.empty<Nat, Nat>();
    users.forEach(func(_, u) {
      for (courseId in u.enrolledCourses.values()) {
        let prev = switch (counts.get(courseId)) { case (?n) n; case null 0 };
        counts.add(courseId, prev + 1);
      };
    });
    let list = List.empty<CourseEnrollment>();
    for ((courseId, count) in counts.entries()) {
      list.add({ courseId; enrollmentCount = count });
    };
    let arr = list.toArray();
    let sorted = arr.sort(func(a : CourseEnrollment, b : CourseEnrollment) : { #less; #equal; #greater } {
      // descending by enrollmentCount
      if (a.enrollmentCount > b.enrollmentCount) #less
      else if (a.enrollmentCount < b.enrollmentCount) #greater
      else #equal
    });
    sorted.sliceToArray(0, topN.toInt());
  };

  // ── Retention Rates ───────────────────────────────────────────────────────

  public type RetentionStats = { day7 : Float; day30 : Float };

  public func getRetentionRates(
    users : Map.Map<Types.UserId, Types.UserProfile>,
  ) : RetentionStats {
    let sevenDaysAgo = daysAgoNs(7);
    let fourteenDaysAgo = daysAgoNs(14);
    let thirtyDaysAgo = daysAgoNs(30);
    let sixtyDaysAgo = daysAgoNs(60);

    var cohort7 : Nat = 0;
    var retained7 : Nat = 0;
    var cohort30 : Nat = 0;
    var retained30 : Nat = 0;

    users.forEach(func(_, u) {
      // 7-day cohort: signed up 8-14 days ago, active in last 7 days
      if (u.createdAt >= fourteenDaysAgo and u.createdAt < sevenDaysAgo) {
        cohort7 += 1;
        if (u.lastLogin >= sevenDaysAgo) retained7 += 1;
      };
      // 30-day cohort: signed up 31-60 days ago, active in last 30 days
      if (u.createdAt >= sixtyDaysAgo and u.createdAt < thirtyDaysAgo) {
        cohort30 += 1;
        if (u.lastLogin >= thirtyDaysAgo) retained30 += 1;
      };
    });

    {
      day7 = if (cohort7 == 0) 0.0 else retained7.toFloat() / cohort7.toFloat() * 100.0;
      day30 = if (cohort30 == 0) 0.0 else retained30.toFloat() / cohort30.toFloat() * 100.0;
    };
  };
};
