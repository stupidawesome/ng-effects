import { MapSelect } from "./internals/interfaces"
import { defineMetadata } from "./internals/metadata"

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export type State<T> = MapSelect<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export type Context<T> = Readonly<T>

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Context(): ParameterDecorator {
    return function (target, propertyKey, parameterIndex) {
        defineMetadata(Context, parameterIndex, target.constructor, propertyKey)
    }
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function State(): ParameterDecorator {
    return function (target, propertyKey, parameterIndex) {
        defineMetadata(State, parameterIndex, target.constructor, propertyKey)
    }
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function Observe(): ParameterDecorator {
    return function (target, propertyKey, parameterIndex) {
        defineMetadata(Observe, parameterIndex, target.constructor, propertyKey)
    }
}
