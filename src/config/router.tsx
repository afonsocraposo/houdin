import {
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import ConfigApp from "./ConfigApp";
import ConfigInterface from "./ConfigInterface";
import DesignerView from "./designer/DesignerView";
import AssetsActions from "./static/actions";
import AssetsTriggers from "./static/triggers";
import AssetsIcons from "./static/icons";

export type ConfigSearch = {
  tab?: "workflows" | "trash" | "credentials" | "history" | "settings";
  workflow?: string;
  query?: string;
};

const rootRoute = createRootRoute({
  component: () => (
    <ConfigApp>
      <Outlet />
    </ConfigApp>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): ConfigSearch => ({
    tab:
      search.tab === "workflows" ||
      search.tab === "trash" ||
      search.tab === "credentials" ||
      search.tab === "history" ||
      search.tab === "settings"
        ? search.tab
        : undefined,
    workflow: typeof search.workflow === "string" ? search.workflow : undefined,
    query: typeof search.query === "string" ? search.query : undefined,
  }),
  component: ConfigInterface,
});

const designerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "designer",
  component: () => <DesignerView />,
});

const designerWorkflowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "designer/$workflowId",
  component: () => <DesignerView />,
});

const assetsActionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "assets/actions",
  component: AssetsActions,
});

const assetsTriggersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "assets/triggers",
  component: AssetsTriggers,
});

const assetsIconsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "assets/icons",
  component: AssetsIcons,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  designerRoute,
  designerWorkflowRoute,
  assetsActionsRoute,
  assetsTriggersRoute,
  assetsIconsRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
