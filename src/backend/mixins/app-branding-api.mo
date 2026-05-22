import Types "../types/academy";
import AppBrandingLib "../lib/appBranding";
import AccessControl "mo:caffeineai-authorization/access-control";
import Runtime "mo:core/Runtime";

mixin (
  accessControlState : AccessControl.AccessControlState,
  appBranding : { var v : Types.AppBranding },
) {
  public query func getAppBranding() : async Types.AppBranding {
    AppBrandingLib.getAppBranding(appBranding);
  };

  public shared ({ caller }) func setAppBranding(b : Types.AppBranding) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update app branding");
    };
    AppBrandingLib.setAppBranding(appBranding, b);
  };
};
