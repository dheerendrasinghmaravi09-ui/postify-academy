import Types "../types/academy";
import AnalyticsLib "../lib/analytics";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Types.UserId, Types.UserProfile>,
  transactions : Map.Map<Nat, Types.Transaction>,
  progress : Map.Map<(Types.UserId, Nat), Types.UserProgress>,
) {
  public query ({ caller }) func getAnalyticsSummary() : async Types.AnalyticsSummary {
    assert AccessControl.isAdmin(accessControlState, caller);
    AnalyticsLib.getSummary(users, transactions, progress);
  };

  public query ({ caller }) func getUserSignupTimeSeries(days : Nat) : async [Types.TimeSeriesDataPoint] {
    assert AccessControl.isAdmin(accessControlState, caller);
    AnalyticsLib.getUserSignupTimeSeries(users, days);
  };

  public query ({ caller }) func getRevenueTimeSeries(days : Nat) : async [Types.TimeSeriesDataPoint] {
    assert AccessControl.isAdmin(accessControlState, caller);
    AnalyticsLib.getRevenuTimeSeries(transactions, days);
  };

  public query ({ caller }) func getCourseCompletionTimeSeries(days : Nat) : async [Types.TimeSeriesDataPoint] {
    assert AccessControl.isAdmin(accessControlState, caller);
    AnalyticsLib.getCourseCompletionTimeSeries(progress, days);
  };

  public query ({ caller }) func getTopCoursesByEnrollment(topN : Nat) : async [AnalyticsLib.CourseEnrollment] {
    assert AccessControl.isAdmin(accessControlState, caller);
    AnalyticsLib.getTopCoursesByEnrollment(users, topN);
  };

  public query ({ caller }) func getRetentionRates() : async AnalyticsLib.RetentionStats {
    assert AccessControl.isAdmin(accessControlState, caller);
    AnalyticsLib.getRetentionRates(users);
  };
};
