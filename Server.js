const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(__dirname))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("offer", (offer) => socket.broadcast.emit("offer", offer))
  socket.on("answer", (answer) => socket.broadcast.emit("answer", answer))
  socket.on("candidate", (candidate) => socket.broadcast.emit("candidate", candidate))
})

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000")
})
