import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import open from "open";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

export async function loginViaBrowser(apiUrl: string): Promise<string> {
  const state = randomBytes(24).toString("hex");

  return await new Promise<string>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      done(new Error("Browser login timed out after 5 minutes."));
    }, LOGIN_TIMEOUT_MS);

    function done(err?: Error, token?: string) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close(() => {
        if (err) reject(err);
        else resolve(token!);
      });
    }

    const server = createServer((req, res) => {
      const cors = () => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      };

      if (req.method === "OPTIONS") {
        cors();
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "POST" && req.url?.startsWith("/callback")) {
        cors();
        let body = "";
        req.on("data", (chunk: Buffer | string) => {
          body += typeof chunk === "string" ? chunk : chunk.toString("utf8");
        });
        req.on("end", () => {
          try {
            const json = JSON.parse(body) as {
              access_token?: string;
              state?: string;
            };
            if (json.state !== state) {
              res.writeHead(403, { "Content-Type": "text/plain" });
              res.end("Invalid state");
              return;
            }
            if (!json.access_token?.trim()) {
              res.writeHead(400, { "Content-Type": "text/plain" });
              res.end("Missing access_token");
              return;
            }
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
              "<!doctype html><meta charset=utf-8><title>Signed in</title><p>You can close this tab and return to the terminal.</p>"
            );
            done(undefined, json.access_token.trim());
          } catch {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad request");
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.on("error", (err) =>
      done(err instanceof Error ? err : new Error(String(err)))
    );

    server.listen(0, "127.0.0.1", () => {
      void startBrowserFlow();
    });

    async function startBrowserFlow() {
      const port = (server.address() as AddressInfo).port;
      const callbackUrl = `http://127.0.0.1:${port}/callback`;
      const loginUrl = new URL("/cli-auth", apiUrl);
      loginUrl.searchParams.set("callback", callbackUrl);
      loginUrl.searchParams.set("state", state);

      const urlString = loginUrl.toString();

      console.log("\nCLI sign-in");
      console.log("-----------");
      console.log(`Open this URL in your browser (it should open automatically):\n${urlString}\n`);

      try {
        const subprocess = await open(urlString);
        subprocess?.unref();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Could not launch the default browser (${msg}).`);
        console.warn("Paste the URL above into your browser manually.\n");
      }
    }
  });
}
