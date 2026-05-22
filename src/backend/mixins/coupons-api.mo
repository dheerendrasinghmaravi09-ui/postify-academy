import Types "../types/academy";
import CouponsLib "../lib/coupons";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  coupons : Map.Map<Text, Types.Coupon>,
  couponUsages : List.List<Types.CouponUsage>,
) {
  // ── Admin: CRUD ───────────────────────────────────────────────────────────

  public shared ({ caller }) func createCoupon(c : Types.Coupon) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create coupons");
    };
    CouponsLib.createCoupon(coupons, c);
  };

  public query func listCoupons() : async [Types.Coupon] {
    CouponsLib.listCoupons(coupons);
  };

  public query func getCoupon(id : Text) : async ?Types.Coupon {
    CouponsLib.getCoupon(coupons, id);
  };

  public shared ({ caller }) func updateCoupon(c : Types.Coupon) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update coupons");
    };
    CouponsLib.updateCoupon(coupons, c);
  };

  public shared ({ caller }) func deleteCoupon(id : Text) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete coupons");
    };
    CouponsLib.deleteCoupon(coupons, id);
  };

  public shared ({ caller }) func toggleCouponStatus(id : Text) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can toggle coupon status");
    };
    CouponsLib.toggleCouponStatus(coupons, id);
  };

  public shared ({ caller }) func getCouponUsageHistory(couponId : Text) : async [Types.CouponUsage] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view coupon usage history");
    };
    CouponsLib.getCouponUsageHistory(couponUsages, couponId);
  };

  // ── Public: Student app can validate and apply a coupon ───────────────────

  public shared ({ caller }) func useCoupon(couponId : Text, courseId : Text) : async Bool {
    CouponsLib.useCoupon(coupons, couponUsages, couponId, caller, courseId);
  };
};
