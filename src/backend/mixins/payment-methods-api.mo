import Types "../types/academy";
import PaymentMethodsLib "../lib/paymentMethods";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  paymentMethods : Map.Map<Text, Types.PaymentMethodConfig>,
  razorpayConfig : { var v : ?Types.RazorpayConfig },
) {
  public query func listPaymentMethods() : async [Types.PaymentMethodConfig] {
    PaymentMethodsLib.listPaymentMethods(paymentMethods);
  };

  public query func getPaymentMethod(methodId : Text) : async ?Types.PaymentMethodConfig {
    PaymentMethodsLib.getPaymentMethod(paymentMethods, methodId);
  };

  public shared ({ caller }) func setPaymentMethodEnabled(methodId : Text, isEnabled : Bool) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can toggle payment methods");
    };
    PaymentMethodsLib.setPaymentMethodEnabled(paymentMethods, methodId, isEnabled);
  };

  public shared ({ caller }) func upsertPaymentMethod(m : Types.PaymentMethodConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update payment methods");
    };
    PaymentMethodsLib.upsertPaymentMethod(paymentMethods, m);
  };

  // ── Razorpay config ───────────────────────────────────────────────────────

  public query ({ caller }) func getRazorpayConfig() : async ?Types.RazorpayConfig {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view Razorpay config");
    };
    razorpayConfig.v;
  };

  public shared ({ caller }) func setRazorpayConfig(config : Types.RazorpayConfig) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set Razorpay config");
    };
    razorpayConfig.v := ?config;
  };
};
