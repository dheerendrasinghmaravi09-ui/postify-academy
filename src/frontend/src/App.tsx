import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "./routes/__root";
import { Route as analyticsRoute } from "./routes/analytics";
import { Route as appBrandingRoute } from "./routes/app-branding";
import { Route as appSyncRoute } from "./routes/app-sync";
import { Route as connectedAppDashboardRoute } from "./routes/connected-app-dashboard";
import { Route as contentRoute } from "./routes/content";
import { Route as couponsRoute } from "./routes/coupons";
import { Route as courseAppDashboardRoute } from "./routes/course-app-dashboard";
import { Route as coursesRoute } from "./routes/courses";
import { Route as dashboardRoute } from "./routes/dashboard";
import { Route as engagementRoute } from "./routes/engagement";
import { Route as indexRoute } from "./routes/index";
import { Route as loginRoute } from "./routes/login";
import { Route as notificationsRoute } from "./routes/notifications";
import { Route as paymentMethodsRoute } from "./routes/payment-methods";
import { Route as paymentsRoute } from "./routes/payments";
import { Route as razorpaySettingsRoute } from "./routes/razorpay-settings";
import { Route as referralsRoute } from "./routes/referrals";
import { Route as settingsRoute } from "./routes/settings";
import { Route as testsRoute } from "./routes/tests";
import { Route as usersRoute } from "./routes/users";
import { Route as withdrawalsRoute } from "./routes/withdrawals";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  coursesRoute,
  usersRoute,
  paymentsRoute,
  testsRoute,
  engagementRoute,
  notificationsRoute,
  referralsRoute,
  contentRoute,
  analyticsRoute,
  settingsRoute,
  couponsRoute,
  paymentMethodsRoute,
  appBrandingRoute,
  appSyncRoute,
  courseAppDashboardRoute,
  connectedAppDashboardRoute,
  withdrawalsRoute,
  razorpaySettingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
