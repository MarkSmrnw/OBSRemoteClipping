const { Server } = require("socket.io")

const io = new Server()

io.on("connection", async (socket) => {
    console.log(`${socket.handshake.address} - device connected`)
})

io.listen(3001)