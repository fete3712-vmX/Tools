import { html as htmlResponse, json, Server } from "./quadhttp.js";

const homePage = `
  <div style="padding: 2px 20px; font-family: system-ui">
    <h1 style="color: #5C6AC4;">Hello, World!</h1>
    <p>
      <a href="/api/hello" style="color: inherit;">API Demo</a>
    </p>
  </div>
`;

function getHello() {
  return json({ message: "Hello, World!" });
}

function getHome() {
  return htmlResponse(homePage);
}

const server = new Server(3000)
  .cache(5_000, 500)
  .get("/api/hello", getHello)
  .get("/", getHome)
  .listen();

console.log(`Server listening on port ${server.port}`);
