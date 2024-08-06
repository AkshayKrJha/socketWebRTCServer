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
// let nickNames = ["Automata", "Compiler", "DBMS", "CO", "Cryptography"];

app.get("/", (req, res) => {
  res.sendFile(join(__dirName, "index.html"));
});

io.on("connection", (socket) => {
  // let name = nickNames.shift();
  // console.log(name, "Connected");
  console.log(socket.username, "Connected");
  let appendedMessage = [];
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      userName: socket.username,
    });
  }
  console.log("Users", users);
  socket.emit("users", users); // not working
  // socket.broadcast.emit("test", `${name} just connected`);
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    userName: socket.username,
  });
  socket.on("disconnect", () => {
    // console.log(name, "disconnected");
    // nickNames.push(name);
    // socket.broadcast.emit("test", `${name} just dis-connected`);
    socket.broadcast.emit("taaip off", socket.username);
    socket.broadcast.emit("user disconnected", {
      userID: socket.id,
      userName: socket.username,
    });
  });
  socket.on("typing on", () => {
    socket.broadcast.emit("taaip on", socket.username);
  });
  socket.on("typing off", () => {
    socket.broadcast.emit("taaip off", socket.username);
  });
  socket.on("some-event", (value) => {
    appendedMessage.push(value);
    console.log("Received some event:", appendedMessage);
    socket.timeout(5000).emit(
      "test",
      `${appendedMessage.reduce((accumulator, value) => {
        return `${accumulator} ${value}`;
      }, "")}`
    );
  });
});
io.use((socket, next) => {
  const username = socket.handshake.auth.name;
  console.log("Socket User Name", username);
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
