const socket = require("../util/socket.js")

function init(http) {
    console.log("init controller");
    
    socket.init(http)
  }


module.exports = {init}