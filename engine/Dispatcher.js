class Dispatcher {
    dispatcher = null

    constructor() {
        this.dispatcher = new Map()
    }
    
    add(key,call) {
        this.dispatcher.set(key,call)
    }

    clear() {
        this.dispatcher = new Map()
    }

    dispatch(key,data) {
        this.dispatcher.get(key)(data)
    }
}

const DispatcherSingleton = new Dispatcher()

export default DispatcherSingleton