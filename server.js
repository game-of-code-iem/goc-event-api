const CONSTANT = require("./constant/constant")
const express = require('express');
const controller = require('./controller/controller');

const app = express();

// Pour autoriser les appels http
//const cors = require('cors')
//app.use(cors({credentials: true, origin: true}))

var http = require("http").createServer(app);

const io = require('socket.io')(http, { origins: '*:*'});
    
// CONTROLLER = controller
 io.on("connection",(socket) => {
     console.log("on connection")

     // Retourne le status du server par defaut 200
     socket.emit("status", 300)

     socket.on("register",message => {
         console.log("on register")
         console.log(message)
         //CONTROLLER.newAccount(socket,message)
     })

 })

http.listen("8080","localhost");