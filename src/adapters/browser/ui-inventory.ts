import path from "node:path";
import { FileSystemPort } from "../../application/ports";
import { executeCommand } from "../commands/command-executor";
import { renderCommandTemplate } from "../commands/command-utils";

export interface ComponentWorkflow {
  readonly path: string;
  readonly name: string;
  readonly route?: string;
}

export interface UiInventory {
  readonly routes: readonly string[];
  readonly forms: readonly { readonly route: string; readonly path: string }[];
  readonly componentForms: readonly ComponentWorkflow[];
  readonly componentActions: readonly ComponentWorkflow[];
}

export interface UiInventoryDiscovery {
  readonly inventory: UiInventory;
  readonly errors: readonly string[];
}

interface CommandInventoryConfig {
  readonly commandTemplate?: string;
  readonly timeoutMs?: number;
}

export async function discoverUiInventory(fs: FileSystemPort, projectRoot: string): Promise<UiInventoryDiscovery> {
  const staticInventory = await discoverStaticUiInventory(fs, projectRoot);
  const commandInventory = await discoverConfiguredUiInventory(fs, projectRoot);
  return {
    inventory: mergeInventories(staticInventory, commandInventory.inventory),
    errors: commandInventory.errors
  };
}

export function routeMatchesFlow(route: string, routeOrScreen: string): boolean {
  const normalizedRoute = normalizeRoute(route);
  const normalizedFlow = routeOrScreen.trim().toLowerCase();
  return normalizedFlow.includes(normalizedRoute.toLowerCase())
    || normalizedRoute.toLowerCase().includes(normalizedFlow)
    || (normalizedRoute === "/" && /\b(home|root|landing|\/)\b/i.test(routeOrScreen));
}

export function isOutOfScope(markdown: string, workflow: string): boolean {
  const normalized = markdown.toLowerCase();
  return normalized.includes("out of scope") && normalized.includes(workflow.toLowerCase());
}

export function componentMatchesFlow(component: ComponentWorkflow, routeOrScreen: string, happyPath: string): boolean {
  const haystack = `${routeOrScreen} ${happyPath}`.toLowerCase();
  return (component.route !== undefined && routeMatchesFlow(component.route, routeOrScreen))
    || haystack.includes(component.path.toLowerCase())
    || haystack.includes(component.name.toLowerCase());
}

async function discoverStaticUiInventory(fs: FileSystemPort, projectRoot: string): Promise<UiInventory> {
  const routeCandidates = [
    path.join(projectRoot, "src", "routes"),
    path.join(projectRoot, "src", "pages"),
    path.join(projectRoot, "src", "app"),
    path.join(projectRoot, "src", "views"),
    path.join(projectRoot, "src", "screens"),
    path.join(projectRoot, "src", "features"),
    path.join(projectRoot, "src", "router"),
    path.join(projectRoot, "routes"),
    path.join(projectRoot, "pages"),
    path.join(projectRoot, "app"),
    path.join(projectRoot, "views"),
    path.join(projectRoot, "screens")
  ];
  const componentCandidates = [
    path.join(projectRoot, "src", "components"),
    path.join(projectRoot, "src", "features"),
    path.join(projectRoot, "src", "ui"),
    path.join(projectRoot, "components")
  ];
  const routeFiles = (await Promise.all(routeCandidates.map((candidate) => listSourceFiles(fs, candidate)))).flat();
  const componentFiles = (await Promise.all(componentCandidates.map((candidate) => listSourceFiles(fs, candidate)))).flat();
  const routes = new Set<string>();
  const forms: { route: string; path: string }[] = [];
  const componentForms: ComponentWorkflow[] = [];
  const componentActions: ComponentWorkflow[] = [];
  for (const file of routeFiles) {
    const content = await fs.readFile(file);
    for (const route of routesFromFile(projectRoot, file, content)) {
      routes.add(route);
    }
    if (/<form\b|onSubmit\s*=|method=["']post["']/i.test(content)) {
      const route = routesFromFile(projectRoot, file, content)[0] ?? routeFromPath(projectRoot, file) ?? "/";
      forms.push({ route, path: path.relative(projectRoot, file).replace(/\\/g, "/") });
      routes.add(route);
    }
  }
  for (const file of componentFiles) {
    const content = await fs.readFile(file);
    const relativePath = path.relative(projectRoot, file).replace(/\\/g, "/");
    const explicitRoutes = explicitRoutesFromContent(content);
    for (const route of explicitRoutes) {
      routes.add(route);
    }
    const workflow = {
      path: relativePath,
      name: componentName(file),
      route: explicitRoutes[0]
    };
    if (/<form\b|onSubmit\s*=|method=["']post["']|<button[^>]*type=["']submit["']/i.test(content)) {
      componentForms.push(workflow);
    } else if (explicitRoutes.length > 0 && /onClick\s*=|<button\b|role=["']button["']|href\s*=|to\s*=/i.test(content)) {
      componentActions.push(workflow);
    }
  }
  return normalizeInventory({ routes: Array.from(routes), forms, componentForms, componentActions });
}

async function discoverConfiguredUiInventory(fs: FileSystemPort, projectRoot: string): Promise<UiInventoryDiscovery> {
  const configPath = path.join(projectRoot, ".sdd", "ui-inventory.json");
  if (!(await fs.exists(configPath))) {
    return { inventory: emptyInventory(), errors: [] };
  }
  let config: CommandInventoryConfig;
  try {
    config = JSON.parse(await fs.readFile(configPath)) as CommandInventoryConfig;
  } catch (error) {
    return { inventory: emptyInventory(), errors: [`Malformed .sdd/ui-inventory.json: ${error instanceof Error ? error.message : String(error)}`] };
  }
  if (config.commandTemplate === undefined || config.commandTemplate.trim().length === 0) {
    return { inventory: emptyInventory(), errors: [".sdd/ui-inventory.json requires commandTemplate."] };
  }

  const command = renderCommandTemplate(config.commandTemplate, { projectRoot });
  try {
    const result = await executeCommand(command, { cwd: projectRoot, timeoutMs: config.timeoutMs ?? 600000 });
    return parseCommandInventory(result.stdout);
  } catch (error) {
    const execError = error as { readonly code?: number; readonly stdout?: string; readonly stderr?: string; readonly message?: string };
    return {
      inventory: emptyInventory(),
      errors: [`UI inventory command failed: ${execError.stderr || execError.stdout || execError.message || `exit code ${execError.code ?? 1}`}`]
    };
  }
}

function parseCommandInventory(stdout: string): UiInventoryDiscovery {
  try {
    return { inventory: normalizeInventory(JSON.parse(stdout) as Partial<UiInventory>), errors: [] };
  } catch (error) {
    return { inventory: emptyInventory(), errors: [`UI inventory command output must be JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
}

function normalizeInventory(input: Partial<UiInventory>): UiInventory {
  return {
    routes: uniqueStrings(arrayValue(input.routes)).map(normalizeRoute).sort(),
    forms: uniqueForms(arrayValue(input.forms)),
    componentForms: uniqueComponents(arrayValue(input.componentForms)),
    componentActions: uniqueComponents(arrayValue(input.componentActions))
  };
}

function mergeInventories(left: UiInventory, right: UiInventory): UiInventory {
  return normalizeInventory({
    routes: [...left.routes, ...right.routes],
    forms: [...left.forms, ...right.forms],
    componentForms: [...left.componentForms, ...right.componentForms],
    componentActions: [...left.componentActions, ...right.componentActions]
  });
}

function emptyInventory(): UiInventory {
  return { routes: [], forms: [], componentForms: [], componentActions: [] };
}

async function listSourceFiles(fs: FileSystemPort, root: string): Promise<string[]> {
  if (!(await fs.exists(root))) return [];
  const entries = await fs.list(root);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const filePath = path.join(root, entry);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory) {
      files.push(...await listSourceFiles(fs, filePath));
    } else if (stat.isFile && /\.(?:ts|tsx|js|jsx|mjs|cjs|svelte|vue)$/.test(filePath)) {
      files.push(filePath);
    }
  }
  return files;
}

function routesFromFile(projectRoot: string, file: string, content: string): string[] {
  const routes = new Set<string>();
  const implicitRoute = routeFromPath(projectRoot, file);
  if (implicitRoute !== undefined) {
    routes.add(implicitRoute);
  }
  for (const route of explicitRoutesFromContent(content)) routes.add(route);
  return Array.from(routes);
}

function explicitRoutesFromContent(content: string): string[] {
  const routes = new Set<string>();
  for (const match of content.matchAll(/\b(?:href|to|action|path)\s*=\s*["'](\/[^"'#?]*)["']|\b(?:page\.goto|router\.push|router\.replace|navigate|redirect)\(\s*["'](\/[^"'#?]*)["']|path:\s*["'](\/[^"'#?]*)["']/g)) {
    const route = match[1] ?? match[2] ?? match[3];
    if (route !== undefined) routes.add(normalizeRoute(route));
  }
  return Array.from(routes);
}

function routeFromPath(projectRoot: string, file: string): string | undefined {
  const relative = path.relative(projectRoot, file).replace(/\\/g, "/");
  const routeRoot = /(?:^|\/)(?:src\/)?(?:routes|pages|app|views|screens|features|router)\//.exec(relative);
  if (routeRoot === null) return undefined;
  const afterRoot = relative.slice((routeRoot.index ?? 0) + routeRoot[0].length)
    .replace(/\.(?:tsx?|jsx?|mjs|cjs|svelte|vue)$/, "")
    .replace(/\/(?:index|page|route)$/, "")
    .replace(/^(?:index|page|route)$/, "")
    .replace(/\[[^\]]+\]/g, ":param");
  return normalizeRoute(`/${afterRoot}`);
}

function normalizeRoute(route: string): string {
  const normalized = route.trim().replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized.length === 0 ? "/" : normalized;
}

function componentName(file: string): string {
  return path.basename(file).replace(/\.(?:tsx?|jsx?|mjs|cjs|svelte|vue)$/, "");
}

function uniqueStrings(values: readonly unknown[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

function arrayValue(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueForms(values: readonly unknown[]): { readonly route: string; readonly path: string }[] {
  const forms = values.filter(isForm).map((form) => ({ route: normalizeRoute(form.route), path: form.path }));
  return Array.from(new Map(forms.map((form) => [`${form.route}:${form.path}`, form])).values()).sort((left, right) => `${left.route}:${left.path}`.localeCompare(`${right.route}:${right.path}`));
}

function uniqueComponents(values: readonly unknown[]): ComponentWorkflow[] {
  const components = values.filter(isComponent).map((component) => ({
    path: component.path,
    name: component.name,
    route: component.route === undefined ? undefined : normalizeRoute(component.route)
  }));
  return Array.from(new Map(components.map((component) => [`${component.path}:${component.name}:${component.route ?? ""}`, component])).values())
    .sort((left, right) => `${left.path}:${left.name}`.localeCompare(`${right.path}:${right.name}`));
}

function isForm(value: unknown): value is { readonly route: string; readonly path: string } {
  return typeof value === "object" && value !== null
    && typeof (value as { readonly route?: unknown }).route === "string"
    && typeof (value as { readonly path?: unknown }).path === "string";
}

function isComponent(value: unknown): value is ComponentWorkflow {
  return typeof value === "object" && value !== null
    && typeof (value as { readonly path?: unknown }).path === "string"
    && typeof (value as { readonly name?: unknown }).name === "string"
    && ((value as { readonly route?: unknown }).route === undefined || typeof (value as { readonly route?: unknown }).route === "string");
}
