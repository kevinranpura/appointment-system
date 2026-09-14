import "dotenv/config";
import app from "./app.js";
import http from "http";
import { initializeSocket } from "./sockets/socket.js";

const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);

initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});