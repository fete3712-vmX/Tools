export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function text(data, status = 200) {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function html(data, status = 200) {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export function redirect(location, status = 302) {
  return new Response(null, { status, headers: { Location: location } });
}

const STATUS_TEXT = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  206: "Partial Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Content Too Large",
  415: "Unsupported Media Type",
  418: "I'm a teapot",
  422: "Unprocessable Content",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

function sendResponse(socket, response, headOnly = false) {
  void (async () => {
    try {
      const responseBody = new Uint8Array(await response.arrayBuffer());
      const body = headOnly ? new Uint8Array() : responseBody;
      const headers = [];

      response.headers.forEach((value, name) => {
        if (!["content-length", "transfer-encoding", "connection"].includes(name.toLowerCase())) {
          headers.push(`${name}: ${value}`);
        }
      });

      headers.push(`Content-Length: ${headOnly ? response.headers.get("content-length") ?? responseBody.byteLength : body.byteLength}`);
      headers.push("Connection: close");
      const statusText = response.statusText || STATUS_TEXT[response.status] || "Unknown";
      socket.write(`HTTP/1.1 ${response.status} ${statusText}\r\n${headers.join("\r\n")}\r\n\r\n`);
      if (body.byteLength > 0) socket.write(body);
    } catch {
      socket.write("HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
    } finally {
      socket.end();
    }
  })();
}

export class Server {
  routes = new Map();
  cacheEntries = new Map();
  cacheTtlMs = 0;
  cacheMaxEntries = 500;
  databaseAdapter;

  constructor(port = 3000) {
    this.port = port;
  }

  cache(ttlMs = 5_000, maxEntries = 500) {
    this.cacheTtlMs = Math.max(0, ttlMs);
    this.cacheMaxEntries = Math.max(1, Math.floor(maxEntries));
    if (this.cacheTtlMs === 0) this.cacheEntries.clear();
    return this;
  }

  clearCache() {
    this.cacheEntries.clear();
    return this;
  }

  database(adapter) {
    this.databaseAdapter = adapter;
    return this;
  }

  query(sql, parameters = []) {
    if (!this.databaseAdapter) {
      return Promise.reject(new Error("No database adapter configured"));
    }
    return Promise.resolve(this.databaseAdapter.query(sql, parameters));
  }

  route(method, path, handler) {
    this.routes.set(`${method.toUpperCase()} ${path}`, handler);
    return this;
  }

  get(path, handler) {
    return this.route("GET", path, handler);
  }

  post(path, handler) {
    return this.route("POST", path, handler);
  }

  put(path, handler) {
    return this.route("PUT", path, handler);
  }

  patch(path, handler) {
    return this.route("PATCH", path, handler);
  }

  delete(path, handler) {
    return this.route("DELETE", path, handler);
  }

  listen() {
    const buffers = new WeakMap();
    const handled = new WeakSet();

    return Bun.listen({
      hostname: "0.0.0.0",
      port: this.port,
      socket: {
        data: (socket, data) => {
          if (handled.has(socket)) return;

          const previous = buffers.get(socket) ?? Buffer.alloc(0);
          const buffer = Buffer.concat([previous, Buffer.from(data)]);
          buffers.set(socket, buffer);

          const headerEnd = buffer.indexOf("\r\n\r\n");
          if (headerEnd < 0) return;

          const headerText = buffer.subarray(0, headerEnd).toString("latin1");
          const lines = headerText.split("\r\n");
          const [method, target] = (lines.shift() ?? "").split(" ");
          if (!method || !target) {
            handled.add(socket);
            sendResponse(socket, new Response("Bad Request", { status: 400 }));
            return;
          }

          const headers = new Headers();
          for (const line of lines) {
            const colon = line.indexOf(":");
            if (colon <= 0) {
              handled.add(socket);
              sendResponse(socket, new Response("Bad Request", { status: 400 }));
              return;
            }
            headers.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
          }

          if (headers.get("transfer-encoding")?.toLowerCase().includes("chunked")) {
            handled.add(socket);
            sendResponse(socket, new Response("Chunked requests are not supported", { status: 501 }));
            return;
          }

          const contentLength = Number(headers.get("content-length") ?? 0);
          if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
            handled.add(socket);
            sendResponse(socket, new Response("Bad Request", { status: 400 }));
            return;
          }
          if (buffer.length < headerEnd + 4 + contentLength) return;

          handled.add(socket);
          void (async () => {
            try {
              const host = headers.get("host") ?? "localhost";
              const url = new URL(target, `http://${host}`);
              const body = buffer.subarray(headerEnd + 4, headerEnd + 4 + contentLength);
              const request = new Request(url, {
                method,
                headers,
                ...(method.toUpperCase() === "GET" || method.toUpperCase() === "HEAD" || contentLength === 0
                  ? {}
                  : { body }),
              });
              const isGet = method.toUpperCase() === "GET";
              const cacheKey = url.toString();
              const cached = isGet && this.cacheTtlMs > 0 ? this.cacheEntries.get(cacheKey) : undefined;
              if (cached && cached.expiresAt > Date.now()) {
                sendResponse(socket, cached.response.clone());
                return;
              }
              if (cached) this.cacheEntries.delete(cacheKey);

              const handler = this.routes.get(`${method.toUpperCase()} ${url.pathname}`);
              const response = handler
                ? await handler(request)
                : new Response("Not Found", { status: 404 });

              const cacheControl = response.headers.get("cache-control")?.toLowerCase() ?? "";
              if (
                isGet && handler && this.cacheTtlMs > 0 && response.status === 200 &&
                !response.headers.has("set-cookie") &&
                !cacheControl.includes("no-store") && !cacheControl.includes("private")
              ) {
                this.cacheEntries.set(cacheKey, {
                  expiresAt: Date.now() + this.cacheTtlMs,
                  response: response.clone(),
                });
                for (const [key, entry] of this.cacheEntries) {
                  if (entry.expiresAt <= Date.now()) this.cacheEntries.delete(key);
                }
                while (this.cacheEntries.size > this.cacheMaxEntries) {
                  const oldestKey = this.cacheEntries.keys().next().value;
                  if (oldestKey === undefined) break;
                  this.cacheEntries.delete(oldestKey);
                }
              }

              sendResponse(socket, response, method.toUpperCase() === "HEAD");
            } catch {
              sendResponse(socket, new Response("Internal Server Error", { status: 500 }));
            }
          })();
        },
      },
    });
  }
}

export default Server;
          
