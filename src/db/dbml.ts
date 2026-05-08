import { sqliteGenerate } from "drizzle-dbml-generator";
import { run } from "@softwaretechnik/dbml-renderer";
import { schema } from "@/db";

import { writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { exec } from "child_process";

const dbml = sqliteGenerate({ schema, relational: true });
const svg = run(dbml, "svg");

const path = join(tmpdir(), randomUUID() + ".svg");
writeFileSync(path, svg);

const startCommand = (() => {
  const p = process.platform;
  if (p === "darwin") return "open";
  if (p === "win32") return "start";
  return "xdg-open";
})();
exec(`${startCommand} ${path}`, () => setTimeout(() => rmSync(path), 1000));
