import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../rootRoute";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRedirect,
});

import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function IndexRedirect() {
  const { loginStatus, identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (loginStatus === "success" && identity) {
      navigate({ to: "/dashboard", replace: true });
    } else if (loginStatus === "idle") {
      navigate({ to: "/login", replace: true });
    }
  }, [loginStatus, identity, navigate]);

  return null;
}
