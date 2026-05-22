import Types "../types/academy";
import Map "mo:core/Map";
import Time "mo:core/Time";

module {
  public func listReferralCodes(codes : Map.Map<Nat, Types.ReferralCode>) : [Types.ReferralCode] {
    codes.values().toArray();
  };

  public func createReferralCode(codes : Map.Map<Nat, Types.ReferralCode>, nextId : { var v : Nat }, code : Text) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    codes.add(id, {
      id;
      code;
      generatedDate = Time.now();
      usageCount = 0;
      conversionCount = 0;
      status = #Active;
    });
    id;
  };

  public func revokeReferralCode(codes : Map.Map<Nat, Types.ReferralCode>, id : Nat) : Bool {
    switch (codes.get(id)) {
      case null false;
      case (?existing) {
        codes.add(id, { existing with status = #Revoked });
        true;
      };
    };
  };

  // Revoke old code and create a new one with a fresh code string
  public func regenerateReferralCode(codes : Map.Map<Nat, Types.ReferralCode>, nextId : { var v : Nat }, oldId : Nat, newCodeText : Text) : ?Nat {
    switch (codes.get(oldId)) {
      case null null;
      case (?existing) {
        codes.add(oldId, { existing with status = #Revoked });
        let newId = nextId.v;
        nextId.v += 1;
        codes.add(newId, {
          id = newId;
          code = newCodeText;
          generatedDate = Time.now();
          usageCount = 0;
          conversionCount = 0;
          status = #Active;
        });
        ?newId;
      };
    };
  };

  // Locate an active code by code text, increment usage/conversion, award referrer points
  public func useReferralCode(
    codes : Map.Map<Nat, Types.ReferralCode>,
    rewards : Map.Map<Types.UserId, Types.ReferralReward>,
    code : Text,
    referrerId : Types.UserId,
  ) : Bool {
    var foundId : ?Nat = null;
    for ((codeId, rc) in codes.entries()) {
      if (rc.code == code and rc.status == #Active) {
        foundId := ?codeId;
      };
    };
    switch (foundId) {
      case null false;
      case (?codeId) {
        switch (codes.get(codeId)) {
          case null false;
          case (?rc) {
            codes.add(codeId, {
              rc with
              usageCount = rc.usageCount + 1;
              conversionCount = rc.conversionCount + 1;
            });
            let rewardPoints = 10;
            let current = switch (rewards.get(referrerId)) {
              case null 0;
              case (?r) r.rewardPoints;
            };
            rewards.add(referrerId, {
              referrerId;
              rewardPoints = current + rewardPoints;
            });
            true;
          };
        };
      };
    };
  };

  public func getRewards(rewards : Map.Map<Types.UserId, Types.ReferralReward>, userId : Types.UserId) : ?Types.ReferralReward {
    rewards.get(userId);
  };

  public func listRewards(rewards : Map.Map<Types.UserId, Types.ReferralReward>) : [Types.ReferralReward] {
    rewards.values().toArray();
  };

  // Top referrers sorted descending by reward points
  public func topReferrers(_codes : Map.Map<Nat, Types.ReferralCode>, rewards : Map.Map<Types.UserId, Types.ReferralReward>) : [Types.ReferralReward] {
    let arr = rewards.values().toArray();
    arr.sort(func(a : Types.ReferralReward, b : Types.ReferralReward) : { #less; #equal; #greater } {
      if (a.rewardPoints > b.rewardPoints) #less
      else if (a.rewardPoints < b.rewardPoints) #greater
      else #equal
    });
  };
};
