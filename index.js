import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const __dirName = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirName, "index.html"));
});

io.on("connection", (socket) => {
  console.log("User Connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  socket.on("some-event", (value) => {
    console.log("Received some event:", value);
    socket.timeout(5000).emit("test",`${value} received by server`)
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
