import Types "../types/academy";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";

module {

  public func createCoupon(
    coupons : Map.Map<Text, Types.Coupon>,
    c : Types.Coupon,
  ) : Bool {
    // reject duplicate code
    let exists = coupons.values().find(func(existing) { existing.code == c.code });
    switch exists {
      case (?_) { false };
      case null {
        coupons.add(c.id, { c with createdAt = Time.now() });
        true;
      };
    };
  };

  public func listCoupons(coupons : Map.Map<Text, Types.Coupon>) : [Types.Coupon] {
    coupons.values().toArray();
  };

  public func getCoupon(coupons : Map.Map<Text, Types.Coupon>, id : Text) : ?Types.Coupon {
    coupons.get(id);
  };

  public func updateCoupon(coupons : Map.Map<Text, Types.Coupon>, c : Types.Coupon) : Bool {
    switch (coupons.get(c.id)) {
      case null { false };
      case (?existing) {
        coupons.add(c.id, { c with createdAt = existing.createdAt });
        true;
      };
    };
  };

  public func deleteCoupon(coupons : Map.Map<Text, Types.Coupon>, id : Text) : Bool {
    switch (coupons.get(id)) {
      case null { false };
      case (?_) {
        coupons.remove(id);
        true;
      };
    };
  };

  public func toggleCouponStatus(coupons : Map.Map<Text, Types.Coupon>, id : Text) : Bool {
    switch (coupons.get(id)) {
      case null { false };
      case (?existing) {
        coupons.add(id, { existing with isActive = not existing.isActive });
        true;
      };
    };
  };

  public func useCoupon(
    coupons : Map.Map<Text, Types.Coupon>,
    usages : List.List<Types.CouponUsage>,
    couponId : Text,
    userId : Principal,
    courseId : Text,
  ) : Bool {
    switch (coupons.get(couponId)) {
      case null { false };
      case (?c) {
        if (not c.isActive) { return false };
        // check expiry
        switch (c.expiryDate) {
          case (?expiry) {
            if (Time.now() > expiry) { return false };
          };
          case null {};
        };
        // check max usage
        switch (c.maxUsage) {
          case (?maxU) {
            if (c.usedCount >= maxU) { return false };
          };
          case null {};
        };
        // record usage and increment counter
        usages.add({
          couponId;
          userId;
          courseId;
          usedAt = Time.now();
        });
        coupons.add(couponId, { c with usedCount = c.usedCount + 1 });
        true;
      };
    };
  };

  public func getCouponUsageHistory(
    usages : List.List<Types.CouponUsage>,
    couponId : Text,
  ) : [Types.CouponUsage] {
    usages.filter(func(u) { u.couponId == couponId }).toArray();
  };
};
