import Types "../types/academy";
import Map "mo:core/Map";
import Time "mo:core/Time";

module {
  public func listFiles(files : Map.Map<Nat, Types.ContentFile>) : [Types.ContentFile] {
    files.values().toArray();
  };

  public func getFile(files : Map.Map<Nat, Types.ContentFile>, id : Nat) : ?Types.ContentFile {
    files.get(id);
  };

  public func addFile(
    files : Map.Map<Nat, Types.ContentFile>,
    nextId : { var v : Nat },
    f : Types.ContentFile,
  ) : Nat {
    let id = nextId.v;
    nextId.v += 1;
    files.add(
      id,
      {
        f with
        id;
        uploadedAt = Time.now();
        isPublished = false;
      },
    );
    id;
  };

  public func updateFile(files : Map.Map<Nat, Types.ContentFile>, f : Types.ContentFile) : Bool {
    switch (files.get(f.id)) {
      case null { false };
      case (?existing) {
        // preserve uploadedAt on updates
        files.add(f.id, { f with uploadedAt = existing.uploadedAt });
        true;
      };
    };
  };

  public func deleteFile(files : Map.Map<Nat, Types.ContentFile>, id : Nat) : Bool {
    switch (files.get(id)) {
      case null { false };
      case (?_) {
        files.remove(id);
        true;
      };
    };
  };

  public func setPublished(
    files : Map.Map<Nat, Types.ContentFile>,
    id : Nat,
    published : Bool,
  ) : Bool {
    switch (files.get(id)) {
      case null { false };
      case (?existing) {
        files.add(id, { existing with isPublished = published });
        true;
      };
    };
  };

  public func getHomepageContent(homepage : { var v : Types.HomepageContent }) : Types.HomepageContent {
    homepage.v;
  };

  public func setHomepageContent(
    homepage : { var v : Types.HomepageContent },
    content : Types.HomepageContent,
  ) {
    homepage.v := content;
  };
};
