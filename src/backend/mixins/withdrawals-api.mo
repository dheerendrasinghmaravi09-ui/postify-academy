import Types "../types/academy";
import WithdrawalsLib "../lib/withdrawals";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  bankDetails : { var v : ?Types.BankAccountDetails },
  withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
  nextWithdrawalId : { var v : Nat },
) {

  // ── Bank account details ──────────────────────────────────────────────────

  public query ({ caller }) func getBankAccountDetails() : async ?Types.BankAccountDetails {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view bank account details");
    };
    WithdrawalsLib.getBankAccountDetails(bankDetails);
  };

  public shared ({ caller }) func setBankAccountDetails(details : Types.BankAccountDetails) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set bank account details");
    };
    WithdrawalsLib.setBankAccountDetails(bankDetails, details);
  };

  // ── Withdrawal requests ───────────────────────────────────────────────────

  public shared ({ caller }) func createWithdrawalRequest(
    amount : Float,
    notes : ?Text,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create withdrawal requests");
    };
    if (amount <= 0.0) {
      Runtime.trap("Invalid: Withdrawal amount must be greater than 0");
    };
    let bd = switch (WithdrawalsLib.getBankAccountDetails(bankDetails)) {
      case (null) { Runtime.trap("Bank account details not configured. Please set bank details first.") };
      case (?d) { d };
    };
    WithdrawalsLib.createWithdrawalRequest(withdrawals, nextWithdrawalId, amount, bd, notes);
  };

  public query ({ caller }) func listWithdrawalRequests(
    filter : Types.WithdrawalFilter,
    offset : Nat,
    limit : Nat,
  ) : async Types.PaginatedWithdrawals {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list withdrawal requests");
    };
    WithdrawalsLib.listWithdrawalRequests(withdrawals, filter, offset, limit);
  };

  public query ({ caller }) func getWithdrawalRequest(id : Nat) : async ?Types.WithdrawalRequest {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view withdrawal requests");
    };
    WithdrawalsLib.getWithdrawalRequest(withdrawals, id);
  };

  public shared ({ caller }) func updateWithdrawalStatus(
    id : Nat,
    status : Types.WithdrawalStatus,
    razorpayPayoutId : ?Text,
  ) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update withdrawal status");
    };
    WithdrawalsLib.updateWithdrawalStatus(withdrawals, id, status, razorpayPayoutId);
  };

  public shared ({ caller }) func cancelWithdrawalRequest(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can cancel withdrawal requests");
    };
    WithdrawalsLib.cancelWithdrawalRequest(withdrawals, id);
  };

  public query ({ caller }) func getWithdrawalStats() : async Types.WithdrawalStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view withdrawal stats");
    };
    WithdrawalsLib.getWithdrawalStats(withdrawals);
  };
};
