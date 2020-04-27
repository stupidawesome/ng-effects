export class Callable<T extends Function> extends Function {
    constructor(fn: T) {
        super()
        return Object.setPrototypeOf(fn, new.target.prototype)
    }
}
