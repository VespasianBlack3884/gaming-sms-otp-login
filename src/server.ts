import { createServer } from "node:http";
import { login, clientResponse } from "./game_login.js";

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/login") { response.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const result = await login(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const mapped = clientResponse(error); response.writeHead(mapped.status, { "content-type": "application/json" }).end(JSON.stringify(mapped.body));
  }
}).listen(Number(process.env.PORT ?? 3000), () => console.log("login service listening on port 3000"));
