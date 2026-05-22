import Types "../types/academy";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";

module {

  // ── State helpers ────────────────────────────────────────────────────────

  public func getBankAccountDetails(
    bankDetails : { var v : ?Types.BankAccountDetails }
  ) : ?Types.BankAccountDetails {
    bankDetails.v;
  };

  public func setBankAccountDetails(
    bankDetails : { var v : ?Types.BankAccountDetails },
    details : Types.BankAccountDetails,
  ) {
    bankDetails.v := ?details;
  };

  // ── Withdrawal requests ──────────────────────────────────────────────────

  public func createWithdrawalRequest(
    withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
    nextId : { var v : Nat },
    amount : Float,
    bankDetails : Types.BankAccountDetails,
    notes : ?Text,
  ) : Nat {
    if (amount <= 0.0) {
      // Validate amount > 0
      return 0; // caller should check for 0 as error indicator — but mixin handles the guard
    };
    let id = nextId.v;
    nextId.v += 1;
    let req : Types.WithdrawalRequest = {
      id;
      amount;
      status = #Pending;
      bankDetails;
      razorpayPayoutId = null;
      requestedAt = Time.now();
      processedAt = null;
      notes;
    };
    withdrawals.add(id, req);
    id;
  };

  public func listWithdrawalRequests(
    withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
    filter : Types.WithdrawalFilter,
    offset : Nat,
    limit : Nat,
  ) : Types.PaginatedWithdrawals {
    // Collect all entries into an array for sorting and pagination
    let all : [Types.WithdrawalRequest] = withdrawals.values().toArray();

    // Filter by status if provided
    let filtered : [Types.WithdrawalRequest] = switch (filter.status) {
      case (null) { all };
      case (?s) {
        all.filter(func(r : Types.WithdrawalRequest) : Bool {
          switch (r.status, s) {
            case (#Pending, #Pending) true;
            case (#Processing, #Processing) true;
            case (#Completed, #Completed) true;
            case (#Failed, #Failed) true;
            case (_, _) false;
          };
        });
      };
    };

    // Sort by requestedAt descending (newest first)
    let sorted = filtered.sort(
      func(a : Types.WithdrawalRequest, b : Types.WithdrawalRequest) : {#less; #equal; #greater} {
        if (a.requestedAt > b.requestedAt) #less
        else if (a.requestedAt < b.requestedAt) #greater
        else #equal;
      },
    );

    let total = sorted.size();
    let start = if (offset < total) offset else total;
    let end_ = if (start + limit < total) start + limit else total;
    let items = sorted.sliceToArray(start, end_);

    { items; total; offset; limit };
  };

  public func getWithdrawalRequest(
    withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
    id : Nat,
  ) : ?Types.WithdrawalRequest {
    withdrawals.get(id);
  };

  public func updateWithdrawalStatus(
    withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
    id : Nat,
    status : Types.WithdrawalStatus,
    razorpayPayoutId : ?Text,
  ) : Bool {
    switch (withdrawals.get(id)) {
      case (null) { false };
      case (?req) {
        let updated : Types.WithdrawalRequest = {
          req with
          status;
          razorpayPayoutId;
          processedAt = ?Time.now();
        };
        withdrawals.add(id, updated);
        true;
      };
    };
  };

  public func cancelWithdrawalRequest(
    withdrawals : Map.Map<Nat, Types.WithdrawalRequest>,
    id : Nat,
  ) : Bool {
    switch (withdrawals.get(id)) {
      case (null) { false };
      case (?req) {
        switch (req.status) {
          case (#Pending) {
            let updated : Types.WithdrawalRequest = {
              req with
              status = #Failed;
              processedAt = ?Time.now();
            };
            withdrawals.add(id, updated);
            true;
          };
          case (_) { false }; // Only pending can be cancelled
        };
      };
    };
  };

  public func getWithdrawalStats(
    withdrawals : Map.Map<Nat, Types.WithdrawalRequest>
  ) : Types.WithdrawalStats {
    withdrawals.foldLeft(
      { totalWithdrawn = 0.0; pendingAmount = 0.0; completedRequests = 0; failedRequests = 0 } : Types.WithdrawalStats,
      func(acc : Types.WithdrawalStats, _k : Nat, req : Types.WithdrawalRequest) : Types.WithdrawalStats {
        switch (req.status) {
          case (#Completed) {
            {
              acc with
              totalWithdrawn = acc.totalWithdrawn + req.amount;
              completedRequests = acc.completedRequests + 1;
            };
          };
          case (#Pending or #Processing) {
            {
              acc with
              pendingAmount = acc.pendingAmount + req.amount;
            };
          };
          case (#Failed) {
            { acc with failedRequests = acc.failedRequests + 1 };
          };
        };
      },
    );
  };
};
