import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server;

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-branch", (branchId: number) => {
      socket.join(`branch:${branchId}`);
    });

    socket.on("leave-branch", (branchId: number) => {
      socket.leave(`branch:${branchId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  console.log("Socket.IO initialized");

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}