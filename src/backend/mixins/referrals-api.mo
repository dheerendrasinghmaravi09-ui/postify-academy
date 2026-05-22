import Types "../types/academy";
import ReferralsLib "../lib/referrals";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Random "mo:core/Random";

mixin (
  accessControlState : AccessControl.AccessControlState,
  referralCodes : Map.Map<Nat, Types.ReferralCode>,
  referralRewards : Map.Map<Types.UserId, Types.ReferralReward>,
  nextCodeId : { var v : Nat },
) {
  // Generate a short hex code from a random blob
  func makeCode(blob : Blob) : Text {
    let bytes = blob.toArray();
    var hex = "";
    let chars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
    var i = 0;
    while (i < 8 and i < bytes.size()) {
      let b = bytes[i].toNat();
      hex := hex # chars[b / 16] # chars[b % 16];
      i += 1;
    };
    hex;
  };

  // Admin: list all referral codes
  public query ({ caller }) func listReferralCodes() : async [Types.ReferralCode] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    ReferralsLib.listReferralCodes(referralCodes);
  };

  // Generate a new unique referral code
  public shared ({ caller }) func createReferralCode() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    let blob = await Random.blob();
    let code = makeCode(blob);
    ReferralsLib.createReferralCode(referralCodes, nextCodeId, code);
  };

  // Revoke a referral code
  public shared ({ caller }) func revokeReferralCode(id : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    ReferralsLib.revokeReferralCode(referralCodes, id);
  };

  // Regenerate: revoke old code and issue a new one
  public shared ({ caller }) func regenerateReferralCode(oldId : Nat) : async ?Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    let blob = await Random.blob();
    let newCode = makeCode(blob);
    ReferralsLib.regenerateReferralCode(referralCodes, nextCodeId, oldId, newCode);
  };

  // Any authenticated user can apply a referral code (marks conversion for referrerId)
  public shared ({ caller }) func useReferralCode(code : Text, referrerId : Types.UserId) : async Bool {
    ReferralsLib.useReferralCode(referralCodes, referralRewards, code, referrerId);
  };

  // Get rewards for the calling user
  public query ({ caller }) func getMyRewards() : async ?Types.ReferralReward {
    ReferralsLib.getRewards(referralRewards, caller);
  };

  // Admin: list all rewards
  public query ({ caller }) func listAllRewards() : async [Types.ReferralReward] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    ReferralsLib.listRewards(referralRewards);
  };

  // Admin: top referrers sorted by reward points (proxy for conversion count)
  public query ({ caller }) func topReferrers() : async [Types.ReferralReward] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: admin only");
    };
    ReferralsLib.topReferrers(referralCodes, referralRewards);
  };
};
