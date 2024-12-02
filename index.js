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

const metzages = new Map();

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
    console.log(socket.username, "disconnected");
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

  socket.on("room metzage", ({ content, to }) => {
    // store the sent message
    const timeStamp = +new Date();
    const oldMetzages = metzages.get(to);
    const metzage = {
      message:content,
      for: socket.id,
      senderName: socket.username,
      timeStamp,
    };
    console.log("========received message for the room=========\n", metzage);
    metzages.set(to, [...oldMetzages, metzage]);
    // io sends to all in the room, socket sends to all except sender
    io.to(to).emit("room metzage", metzage);
  });

  socket.on("private metzage", ({ content, to }) => {
    socket
      .to(to)
      .emit("private metzage", { content, from: socket.id, received: true });
      socket.emit("private metzage", { content, from: to, received: false });
  });

  socket.on("join room", (roomName, callback) => {
    socket.join(roomName);
    // send old metzages to new user in the room
    const roomMetzages = metzages.get(roomName);
    if (!roomMetzages) metzages.set(roomName, []);
    console.log(
      "=========Metzages for the new user============\n",
      metzages.get(roomName)
    );
    callback(metzages.get(roomName));
  });

  socket.on("leave room", (roomName, callback) => {
    socket.leave(roomName);
    // if room gets empty delete chats of the room
    callback();
  });
});
io.use((socket, next) => {
  const username = socket.handshake.auth.name;
  console.log("Socket User Name", username);
  if (!username) {
    return next(new Error("invalid username"));
  }
  // modify for already existing user
  const socketMap = io.of("/").sockets;
  // check whether any key of socketMap contain same username
  let isUsernameAlreadyExists = false;
  for (let [id, socket] of socketMap) {
    if (socket.username === username) {
      isUsernameAlreadyExists = true;
      break;
    }
  }
  if (isUsernameAlreadyExists) {
    return next(new Error("User already exists"));
  }
  socket.username = username;
  next();
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
