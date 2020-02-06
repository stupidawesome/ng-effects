import { effectsMap, effectsTypeMap } from "./internals/constants"
import { observe } from "./internals/utils"
import { Effects } from "./effects"
import { Observable, Subscription } from "rxjs"
import { State } from "./interfaces"

export function RunEffects(): ClassDecorator {
    return function<T extends object & { prototype: any }>(klass: T): any {
        const paramIndex = effectsTypeMap.get(klass)

        return new Proxy(klass, {
            construct(target: any, argArray: any) {
                const obj = new target(...argArray)
                const ownProperties = Object.getOwnPropertyNames(obj)
                const observer: any = observe(obj, ownProperties)
                const effects: Effects = argArray[paramIndex]

                for (const name of ownProperties) {
                    let value: any
                    const propertyObserver = observer[name]
                    Object.defineProperty(obj, name, {
                        get() {
                            return value
                        },
                        set(_value) {
                            if (value !== _value) {
                                value = _value
                                propertyObserver.next(value)
                            }
                        },
                    })
                }

                effects.run(obj, observer)

                return obj
            },
        })
    }
}

export function UseEffects(): ParameterDecorator {
    return function(target: any, propertyKey, parameterIndex) {
        effectsTypeMap.set(target, parameterIndex)
    }
}

export type Effect<T extends object> = {
    [key in keyof T]?: (state: State<T>, context: T) => Observable<T[key]> | Subscription | void
}

export function Effect(options?: any): MethodDecorator {
    return function(target: any, prop) {
        effectsMap.set(target[prop], options || {})
    }
}
