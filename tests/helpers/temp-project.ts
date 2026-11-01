import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface TempProject {
  readonly root: string;
  readonly read: (relativePath: string) => Promise<string>;
  readonly write: (relativePath: string, content: string) => Promise<void>;
  readonly cleanup: () => Promise<void>;
}

export async function createTempProject(): Promise<TempProject> {
  const root = await mkdtemp(path.join(os.tmpdir(), "sdd-harness-test-"));
  return {
    root,
    read: (relativePath) => readFile(path.join(root, relativePath), "utf8"),
    write: async (relativePath, content) => {
      await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
      await writeFile(path.join(root, relativePath), content, "utf8");
    },
    cleanup: () => rm(root, { recursive: true, force: true })
  };
}
