import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { rootRoute } from "../rootRoute";
import { useAuthStore } from "../store/authStore";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity } = useInternetIdentity();
  const { setLoggedIn, isLoggedIn } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (loginStatus === "success" && identity) {
      setLoggedIn("Super Admin");
      navigate({ to: "/dashboard" });
    }
  }, [loginStatus, identity, setLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate({ to: "/dashboard" });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex" data-ocid="login.page">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-lg font-bold">Postify Academy</p>
            <p className="text-xs text-primary-foreground/70">
              Admin Control Panel
            </p>
          </div>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Manage your EdTech platform with confidence
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Full control over courses, users, payments, and analytics — all in
            one place.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Courses", value: "50+" },
              { label: "Students", value: "10K+" },
              { label: "Completion", value: "92%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-primary-foreground/10 p-4 text-center"
              >
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
          <Shield className="h-4 w-4" />
          <span>Secured by Internet Identity — no passwords stored</span>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">
                Postify Academy
              </p>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access the admin control panel
            </p>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base"
            disabled={isLoggingIn || loginStatus === "logging-in"}
            data-ocid="login.submit_button"
          >
            {isLoggingIn || loginStatus === "logging-in" ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Login with Internet Identity
              </span>
            )}
          </Button>

          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">
                  Internet Identity Authentication
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your identity is verified using decentralized cryptographic
                  keys — no passwords are stored anywhere.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Only authorized Super Admins can access this panel
          </p>
        </div>
      </div>
    </div>
  );
}
