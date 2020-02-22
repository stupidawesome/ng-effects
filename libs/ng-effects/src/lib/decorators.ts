import { effectsMap } from "./internals/constants"
import {
    AssignEffectOptions,
    BindEffectOptions,
    DefaultEffectOptions,
    EffectHandler,
    EffectOptions,
} from "./interfaces"
import { Type } from "@angular/core"
import {
    EffectAdapterDecorator,
    EffectDecorator,
    NextOptions,
    NextValue,
} from "./internals/interfaces"

export function Effect<T extends Type<EffectHandler<any, any>>>(
    adapter: T,
    options?: NextOptions<InstanceType<T>> & DefaultEffectOptions,
): EffectAdapterDecorator<NextValue<InstanceType<T>>>
export function Effect<
    T extends Type<EffectHandler<any, any>>,
    TOptions = NextOptions<InstanceType<T>>,
    TValue = NextValue<InstanceType<T>>
>(options?: { adapter: T } & TOptions & DefaultEffectOptions): EffectAdapterDecorator<TValue>
export function Effect(): EffectDecorator<unknown>
export function Effect(options?: DefaultEffectOptions): EffectDecorator<unknown>
export function Effect<T extends string>(
    target?: T,
    options?: DefaultEffectOptions,
): EffectDecorator<T>
export function Effect<T extends string>(options?: BindEffectOptions<T>): EffectDecorator<T>
export function Effect<T extends AssignEffectOptions>(options?: T): EffectDecorator<T["assign"]>
export function Effect(): EffectDecorator<unknown> {
    let opts: EffectOptions
    if (typeof arguments[0] === "string") {
        opts = { bind: arguments[0], ...arguments[1] }
    } else if (typeof arguments[0] === "function") {
        opts = { adapter: arguments[0], ...arguments[1] }
    } else {
        opts = arguments[0]
    }
    return function(target, prop, propertyDescriptor: any) {
        effectsMap.set(propertyDescriptor.value, opts || {})
    }
}
