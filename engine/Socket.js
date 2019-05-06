let io
let sockets = new Map()
let Dispatcher

function init(dispatcher,http) {
    Dispatcher = dispatcher
    io = require('socket.io')(http, { origins: '*:*' });
    io.on("connection", socket => {

        //Dico des sockets
        socket.emit("status",202)
        sockets.set(socket.id,socket)

        socket.on("register/user", data => {
            Dispatcher.dispatch("register/user", data,socket.id)
        })
        
        socket.on("login/user", data => {
            Dispatcher.dispatch("login/user", data,socket.id)
        })
    
        socket.on("add/event", data => {
            Dispatcher.dispatch("add/event", data,socket.id)
        })
    
        socket.on("get/event", data => {
            Dispatcher.dispatch("get/event", data,socket.id)
        })
    
        socket.on("get/MyEvent", data => {
            Dispatcher.dispatch("get/myEvent", data,socket.id)
        })
    
        socket.on("update/event", data => {
            Dispatcher.dispatch("update/event", data,socket.id)
        })
    
        socket.on("get/joinedEvent", data => {
            Dispatcher.dispatch("get/joinedEvent", data,socket.id)
        })
    
        socket.on("delete/event", data => {
            Dispatcher.dispatch("delete/event", data,socket.id)
        })
        
        socket.on("join/event", data => {
            Dispatcher.dispatch("join/event", data,socket.id)
        })
    
        socket.on("add/post", data => {
            Dispatcher.dispatch("add/post", data,socket.id)
        })
    
        socket.on("like/post", data => {
            Dispatcher.dispatch("like/post", data,socket.id)
        })
        
        socket.on("comment/post", data => {
            Dispatcher.dispatch("comment/post", data,socket.id)
        })
    
        socket.on("delete/post", data => {
            Dispatcher.dispatch("delete/post", data,socket.id)
        })
    
        socket.on("unlike/post", data => {
            Dispatcher.dispatch("unlike/post", data,socket.id)
        })
    
        socket.on("uncomment/post", data => {
            Dispatcher.dispatch("uncomment/post", data,socket.id)
        })
        
        socket.on("get/post", data => {
            Dispatcher.dispatch("get/post", data,socket.id)
        })
    
        socket.on("disconnect", reason => {
            //socket.close()
            sockets.delete(socket.id)
            console.log("Disconnected: " + reason)
        })
    })
}

function getSocket(id) {
    return sockets.get(id)
}

function broadcast(route,data) {
    io.broadcast(route,data)
}

function emit(route, data, id) {
    let socket = getSocket(id)
    socket.emit(route, data)
}

module.exports = { init, emit, getSocket, broadcast}
