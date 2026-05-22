import Types "../types/academy";
import ContentLib "../lib/content";
import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  contentFiles : Map.Map<Nat, Types.ContentFile>,
  homepage : { var v : Types.HomepageContent },
  nextFileId : { var v : Nat },
) {
  // ── Content Files ─────────────────────────────────────────────────────────

  public query func listContentFiles() : async [Types.ContentFile] {
    ContentLib.listFiles(contentFiles);
  };

  public query func getContentFile(id : Nat) : async ?Types.ContentFile {
    ContentLib.getFile(contentFiles, id);
  };

  public shared ({ caller }) func addContentFile(f : Types.ContentFile) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add content files");
    };
    ContentLib.addFile(contentFiles, nextFileId, f);
  };

  public shared ({ caller }) func updateContentFile(f : Types.ContentFile) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update content files");
    };
    ContentLib.updateFile(contentFiles, f);
  };

  public shared ({ caller }) func deleteContentFile(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete content files");
    };
    ContentLib.deleteFile(contentFiles, id);
  };

  public shared ({ caller }) func setContentFilePublished(id : Nat, published : Bool) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can publish content files");
    };
    ContentLib.setPublished(contentFiles, id, published);
  };

  // ── Homepage Content ──────────────────────────────────────────────────────

  public query func getHomepageContent() : async Types.HomepageContent {
    ContentLib.getHomepageContent(homepage);
  };

  public shared ({ caller }) func setHomepageContent(content : Types.HomepageContent) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update homepage content");
    };
    ContentLib.setHomepageContent(homepage, content);
  };
};
