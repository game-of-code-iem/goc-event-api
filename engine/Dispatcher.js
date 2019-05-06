class Dispatcher {

    constructor() {
        this.dispatcher = new Map()
    }
    
    add(key,call) {
        
        this.dispatcher.set(key,call)
    }

    clear() {
        this.dispatcher = new Map()
    }

    dispatch(key,data,id) {
        console.log(this.dispatcher)
        console.log(key)

        this.dispatcher.get(key)(data,id)
    }
}


module.exports = {Dispatcher} 