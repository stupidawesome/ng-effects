import { effectsMap } from "./internals/constants"
import {
    AssignEffectOptions,
    BindEffectOptions,
    DefaultEffectOptions,
    EffectAdapter,
    EffectOptions,
} from "./interfaces"
import {
    AdapterEffectDecorator,
    AssignEffectDecorator,
    BindEffectDecorator,
    DefaultEffectDecorator,
    MapSelect,
    NextOptions,
    NextValue,
} from "./internals/interfaces"
import { defineMetadata } from "./internals/metadata"
import { Type } from "@angular/core"
import { Observable } from "rxjs"

export function Effect<T extends EffectAdapter<any, any>>(
    adapter: Type<T>,
    options?: NextOptions<T> & DefaultEffectOptions,
): AdapterEffectDecorator<Observable<NextValue<T>>>

export function Effect<
    T extends Type<EffectAdapter<any, any>>,
    TOptions = NextOptions<InstanceType<T>>,
    TValue = NextValue<InstanceType<T>>
>(options: { adapter: T } & TOptions & DefaultEffectOptions): AdapterEffectDecorator<TValue>

export function Effect(): DefaultEffectDecorator
//
export function Effect(options: DefaultEffectOptions): DefaultEffectDecorator
//
export function Effect<T extends object>(options: AssignEffectOptions): AssignEffectDecorator<T>

export function Effect<T extends string>(
    target: T,
    options?: DefaultEffectOptions,
): BindEffectDecorator<T>

export function Effect<T extends string>(options: BindEffectOptions<T>): BindEffectDecorator<T>

export function Effect(): any {
    let opts: EffectOptions
    if (typeof arguments[0] === "string") {
        opts = { bind: arguments[0], ...arguments[1] }
    } else if (typeof arguments[0] === "function") {
        opts = { adapter: arguments[0], ...arguments[1] }
    } else {
        opts = arguments[0]
    }
    return function(target: any, prop: any, propertyDescriptor: any) {
        effectsMap.set(propertyDescriptor.value, opts || {})
    }
}

export type State<T> = MapSelect<T>
export type Context<T> = Readonly<T>

export function Context(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(Context, parameterIndex, target, propertyKey)
    }
}

export function State(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(State, parameterIndex, target, propertyKey)
    }
}

export function Observe(): ParameterDecorator {
    return function(target, propertyKey, parameterIndex) {
        defineMetadata(Observe, parameterIndex, target, propertyKey)
    }
}
