import { Router } from "#router";
import { Terminal } from "#terminal";
import type { Page } from "#page";

import { SplashPage } from "./pages/splash.ts";
import { SystemPage } from "./pages/applications/system.ts";
import { ProcessPage } from "./pages/applications/process.ts";
import { NetworkPage } from "./pages/applications/network.ts";

const pages: Page[] = [
  new SplashPage(),
  new SystemPage(),
  new ProcessPage(),
  new NetworkPage(),
];

const router = new Router(new Terminal(), pages);
router.start();
