import Types "../types/academy";
import Map "mo:core/Map";
import Time "mo:core/Time";

module {

  let defaultMethods : [Types.PaymentMethodConfig] = [
    { methodId = "stripe"; isEnabled = true; displayName = "Credit / Debit Card (Stripe)"; lastUpdated = 0 },
    { methodId = "upi"; isEnabled = true; displayName = "UPI"; lastUpdated = 0 },
    { methodId = "card"; isEnabled = true; displayName = "Net Banking"; lastUpdated = 0 },
  ];

  public func initDefaults(methods : Map.Map<Text, Types.PaymentMethodConfig>) {
    if (methods.isEmpty()) {
      for (m in defaultMethods.values()) {
        methods.add(m.methodId, m);
      };
    };
  };

  public func listPaymentMethods(methods : Map.Map<Text, Types.PaymentMethodConfig>) : [Types.PaymentMethodConfig] {
    methods.values().toArray();
  };

  public func getPaymentMethod(methods : Map.Map<Text, Types.PaymentMethodConfig>, methodId : Text) : ?Types.PaymentMethodConfig {
    methods.get(methodId);
  };

  public func setPaymentMethodEnabled(
    methods : Map.Map<Text, Types.PaymentMethodConfig>,
    methodId : Text,
    isEnabled : Bool,
  ) : Bool {
    switch (methods.get(methodId)) {
      case null { false };
      case (?existing) {
        methods.add(methodId, { existing with isEnabled; lastUpdated = Time.now() });
        true;
      };
    };
  };

  public func upsertPaymentMethod(
    methods : Map.Map<Text, Types.PaymentMethodConfig>,
    m : Types.PaymentMethodConfig,
  ) {
    methods.add(m.methodId, { m with lastUpdated = Time.now() });
  };
};
