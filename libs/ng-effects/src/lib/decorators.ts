import { effectsMap } from "./internals/constants"
import { Observable, Subscription } from "rxjs"
import { State } from "./interfaces"

export type Effect<T extends object> = {
    [key in keyof T]?: (state: State<T>, context: T) => Observable<T[key]> | Subscription | void
}

export function Effect(options?: any): MethodDecorator {
    return function(target: any, prop) {
        effectsMap.set(target[prop], options || {})
    }
}
