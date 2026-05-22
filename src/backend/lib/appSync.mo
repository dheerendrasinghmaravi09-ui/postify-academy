import Types "../types/academy";
import List "mo:core/List";

module {

  public func getSyncEndpoint(endpoint : { var v : Types.SyncEndpoint }) : Types.SyncEndpoint {
    endpoint.v;
  };

  public func setSyncEndpoint(endpoint : { var v : Types.SyncEndpoint }, url : Text) {
    endpoint.v := { url; validatedAt = null; isConnected = false };
  };

  public func recordSyncLog(
    logs : List.List<Types.SyncLogEntry>,
    entry : Types.SyncLogEntry,
  ) {
    logs.add(entry);
  };

  public func listSyncLogs(logs : List.List<Types.SyncLogEntry>) : [Types.SyncLogEntry] {
    let total = logs.size();
    if (total <= 50) {
      logs.toArray();
    } else {
      // total > 50 guaranteed by outer if; Int subtraction avoids trap warning
      let start = (total : Int) - 50;
      logs.sliceToArray(start.toNat(), total);
    };
  };

  public func clearSyncLogs(logs : List.List<Types.SyncLogEntry>) {
    logs.clear();
  };
};
