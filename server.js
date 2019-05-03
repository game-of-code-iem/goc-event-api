const express = require('express');
const app = express();
var http = require("http").createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});

io.on("connection",(socket) => {
   console.log("on connection")
   socket.emit("status", "200")

})

http.listen("4444","192.168.43.211");