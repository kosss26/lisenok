import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Shell } from "./screens/shell";
import { Title } from "./screens/title";
import { WorldMap } from "./screens/world-map";
import { Forest } from "./screens/forest";
import { StopScreen } from "./screens/stop";
import { Album } from "./screens/album";

const root = createRootRoute({ component: Shell });
const title = createRoute({ getParentRoute: () => root, path: "/", component: Title });
const map = createRoute({ getParentRoute: () => root, path: "/map", component: WorldMap });
const forest = createRoute({ getParentRoute: () => root, path: "/forest", component: Forest });
export const stopRoute = createRoute({
  getParentRoute: () => root,
  path: "/forest/$stopId",
  component: StopScreen,
});
const album = createRoute({ getParentRoute: () => root, path: "/album", component: Album });

export const router = createRouter({
  routeTree: root.addChildren([title, map, forest, stopRoute, album]),
  defaultPreload: false,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
