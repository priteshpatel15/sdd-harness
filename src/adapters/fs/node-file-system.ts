import { copyFile, mkdir, readFile, readdir, stat, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { FileSystemPort } from "../../application/ports";

export class NodeFileSystem implements FileSystemPort {
  public async readFile(filePath: string): Promise<string> {
    return readFile(filePath, "utf8");
  }

  public async readFileBuffer(filePath: string): Promise<Uint8Array> {
    return readFile(filePath);
  }

  public async writeFile(filePath: string, content: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }

  public async appendFile(filePath: string, content: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, content, "utf8");
  }

  public async exists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch (error) {
      if (isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }

  public async mkdir(directoryPath: string): Promise<void> {
    await mkdir(directoryPath, { recursive: true });
  }

  public async list(directoryPath: string): Promise<string[]> {
    try {
      return await readdir(directoryPath);
    } catch (error) {
      if (isNotFound(error)) {
        return [];
      }
      throw error;
    }
  }

  public async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
  }

  public async stat(filePath: string): Promise<{ readonly isFile: boolean; readonly isDirectory: boolean }> {
    const result = await stat(filePath);
    return {
      isFile: result.isFile(),
      isDirectory: result.isDirectory()
    };
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
