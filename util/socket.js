var io
//var CONTROLLER

function init(http) {
    io = require('socket.io')(http, { origins: '*:*'});
    
   // CONTROLLER = controller
    io.on("connection",(client) => {
        console.log("on connection")
  
        // Retourne le status du server par defaut 200
        client.emit("status", 200)
  
        client.on("register",message => {
            console.log("on register")
            console.log(message)
            //CONTROLLER.newAccount(socket,message)
        })
  
    })
  }
  
  // Retourne au socket par une route un message
  function send(client,route,content) {
    client.emit(route,content)
  }
  
  module.exports = {init,send}