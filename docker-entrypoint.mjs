import { spawn } from "node:child_process";
import process from "node:process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${command} exited with signal ${signal}`
            : `${command} exited with code ${code}`,
        ),
      );
    });
  });
}

if (process.env.RUN_MIGRATIONS !== "false") {
  await run("node", ["node_modules/prisma/build/index.js", "migrate", "deploy"]);
}

const command = process.argv[2] ?? "node";
const args = process.argv.length > 3 ? process.argv.slice(3) : ["server.js"];

await run(command, args);
