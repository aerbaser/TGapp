import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join, normalize } from "path";

const port = process.env.PORT || 3000;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

async function sendFile(pathname, res) {
  const safePath = normalize(pathname).replace(/^([.][.][/\\])+/, "");
  const filePath = join(process.cwd(), safePath);
  const content = await readFile(filePath);

  res.writeHead(200, {
    "Content-Type": mime[extname(filePath)] || "application/octet-stream",
  });
  res.end(content);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    try {
      await sendFile(pathname, res);
    } catch {
      await sendFile("/index.html", res);
    }
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
});

server.listen(port, () => {
  console.log(`Knee Rehab Mini App listening on :${port}`);
});
