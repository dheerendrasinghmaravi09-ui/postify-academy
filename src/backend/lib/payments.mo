import Types "../types/academy";
import Map "mo:core/Map";
import Time "mo:core/Time";

module {

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /// Returns the start-of-month timestamp (nanoseconds) for the current month.
  func startOfCurrentMonthNs() : Int {
    let nowNs : Int = Time.now();
    // 1 day in nanoseconds
    let dayNs : Int = 86_400_000_000_000;
    // Approximate: strip sub-day remainder to get rough day boundary,
    // then use the day-of-month offset (we use a 30-day approximation for MRR window).
    let monthNs : Int = 30 * dayNs;
    nowNs - monthNs;
  };

  func matchesFilter(tx : Types.Transaction, f : Types.TransactionFilter) : Bool {
    let statusOk = switch (f.status) {
      case null true;
      case (?s) {
        switch (tx.status, s) {
          case (#Pending, #Pending) true;
          case (#Completed, #Completed) true;
          case (#Failed, #Failed) true;
          case (#Refunded, #Refunded) true;
          case _ false;
        };
      };
    };
    let userOk = switch (f.userId) {
      case null true;
      case (?uid) tx.userId == uid;
    };
    let fromOk = switch (f.fromDate) {
      case null true;
      case (?from) tx.date >= from;
    };
    let toOk = switch (f.toDate) {
      case null true;
      case (?to) tx.date <= to;
    };
    statusOk and userOk and fromOk and toOk;
  };

  func isCompleted(tx : Types.Transaction) : Bool {
    switch (tx.status) { case (#Completed) true; case _ false };
  };

  // ── Core CRUD ────────────────────────────────────────────────────────────────

  public func listTransactions(transactions : Map.Map<Nat, Types.Transaction>) : [Types.Transaction] {
    transactions.values().toArray();
  };

  public func getTransaction(transactions : Map.Map<Nat, Types.Transaction>, id : Nat) : ?Types.Transaction {
    transactions.get(id);
  };

  public func addTransaction(
    transactions : Map.Map<Nat, Types.Transaction>,
    nextId : { var v : Nat },
    tx : Types.Transaction,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    let newTx = { tx with id };
    transactions.add(id, newTx);
    id;
  };

  public func updateTransactionStatus(
    transactions : Map.Map<Nat, Types.Transaction>,
    id : Nat,
    status : Types.PaymentStatus,
  ) : Bool {
    switch (transactions.get(id)) {
      case null false;
      case (?tx) {
        transactions.add(id, { tx with status });
        true;
      };
    };
  };

  public func refundTransaction(
    transactions : Map.Map<Nat, Types.Transaction>,
    id : Nat,
    reason : Text,
  ) : Bool {
    switch (transactions.get(id)) {
      case null false;
      case (?tx) {
        transactions.add(id, { tx with status = #Refunded; refundReason = ?reason });
        true;
      };
    };
  };

  // ── Filtering & Pagination ───────────────────────────────────────────────────

  public func filterTransactions(
    transactions : Map.Map<Nat, Types.Transaction>,
    filter : Types.TransactionFilter,
  ) : [Types.Transaction] {
    transactions.values().filter(func(tx) { matchesFilter(tx, filter) }).toArray();
  };

  public func listTransactionsPaginated(
    transactions : Map.Map<Nat, Types.Transaction>,
    filter : Types.TransactionFilter,
    offset : Nat,
    limit : Nat,
  ) : Types.PaginatedTransactions {
    let all = transactions.values().filter(func(tx) { matchesFilter(tx, filter) }).toArray();
    let total = all.size();
    let start = if (offset >= total) total else offset;
    let end_ = if (start + limit > total) total else start + limit;
    let items = all.sliceToArray(start, end_);
    { items; total; offset; limit };
  };

  public func listFailedTransactions(transactions : Map.Map<Nat, Types.Transaction>) : [Types.Transaction] {
    transactions.values().filter(func(tx) {
      switch (tx.status) { case (#Failed) true; case _ false };
    }).toArray();
  };

  public func listTransactionsForUser(
    transactions : Map.Map<Nat, Types.Transaction>,
    userId : Types.UserId,
  ) : [Types.Transaction] {
    transactions.values().filter(func(tx) { tx.userId == userId }).toArray();
  };

  // ── Revenue Stats ────────────────────────────────────────────────────────────

  public func getRevenueStats(transactions : Map.Map<Nat, Types.Transaction>) : Types.RevenueStats {
    let monthStart = startOfCurrentMonthNs();

    var totalRevenue : Nat = 0;
    var mtdRevenue : Nat = 0;
    var txCount : Nat = 0;
    var activeSubs : Nat = 0;
    var churnedSubs : Nat = 0;

    transactions.values().forEach(func(tx) {
      if (isCompleted(tx)) {
        totalRevenue += tx.amount;
        txCount += 1;
        if (tx.date >= monthStart) {
          mtdRevenue += tx.amount;
          activeSubs += 1;
        };
      };
      switch (tx.status) {
        case (#Refunded) { churnedSubs += 1 };
        case _ {};
      };
    });

    // MRR: revenue from completed transactions within the current 30-day window
    let mrr = mtdRevenue;

    {
      totalRevenue;
      mtdRevenue;
      mrr;
      transactionCount = txCount;
      activeSubscriptions = activeSubs;
      churnedSubscriptions = churnedSubs;
    };
  };
};
