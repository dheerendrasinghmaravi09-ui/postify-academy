import Types "../types/academy";
import PaymentsLib "../lib/payments";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  accessControlState : AccessControl.AccessControlState,
  transactions : Map.Map<Nat, Types.Transaction>,
  nextTxId : { var v : Nat },
) {

  // ── Read-only queries (admin-only) ────────────────────────────────────────

  public query ({ caller }) func listTransactions() : async [Types.Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.listTransactions(transactions);
  };

  public query ({ caller }) func getTransaction(id : Nat) : async ?Types.Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.getTransaction(transactions, id);
  };

  public query ({ caller }) func listTransactionsPaginated(
    filter : Types.TransactionFilter,
    offset : Nat,
    limit : Nat,
  ) : async Types.PaginatedTransactions {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    let safeLimit = if (limit == 0) 20 else if (limit > 100) 100 else limit;
    PaymentsLib.listTransactionsPaginated(transactions, filter, offset, safeLimit);
  };

  public query ({ caller }) func filterTransactions(
    filter : Types.TransactionFilter,
  ) : async [Types.Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.filterTransactions(transactions, filter);
  };

  public query ({ caller }) func listFailedTransactions() : async [Types.Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.listFailedTransactions(transactions);
  };

  public query ({ caller }) func getRevenueStats() : async Types.RevenueStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.getRevenueStats(transactions);
  };

  public query ({ caller }) func listUserTransactions(userId : Types.UserId) : async [Types.Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.listTransactionsForUser(transactions, userId);
  };

  // ── Mutations (admin-only) ────────────────────────────────────────────────

  public shared ({ caller }) func addTransaction(tx : Types.Transaction) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    let now = Time.now();
    let txWithDate = { tx with date = now; refundReason = null };
    PaymentsLib.addTransaction(transactions, nextTxId, txWithDate);
  };

  public shared ({ caller }) func updateTransactionStatus(id : Nat, status : Types.PaymentStatus) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.updateTransactionStatus(transactions, id, status);
  };

  public shared ({ caller }) func refundTransaction(id : Nat, reason : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: admin only");
    };
    PaymentsLib.refundTransaction(transactions, id, reason);
  };
};
