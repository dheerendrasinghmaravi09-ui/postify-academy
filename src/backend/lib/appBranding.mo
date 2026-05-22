import Types "../types/academy";
import Time "mo:core/Time";

module {

  let defaultBranding : Types.AppBranding = {
    appName = "Postify Academy";
    logoUrl = null;
    primaryColor = "#3B82F6";
    accentColor = "#F97316";
    tagline = "Learn. Grow. Succeed.";
    updatedAt = 0;
  };

  public func initDefault(branding : { var v : Types.AppBranding }) {
    if (branding.v.updatedAt == 0) {
      branding.v := defaultBranding;
    };
  };

  public func getAppBranding(branding : { var v : Types.AppBranding }) : Types.AppBranding {
    branding.v;
  };

  public func setAppBranding(branding : { var v : Types.AppBranding }, b : Types.AppBranding) {
    branding.v := { b with updatedAt = Time.now() };
  };
};
