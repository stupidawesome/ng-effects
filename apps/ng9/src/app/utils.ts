import { MonoTypeOperatorFunction, OperatorFunction } from "rxjs"
import { distinctUntilChanged, map } from "rxjs/operators"

export function increment(by: number = 1): MonoTypeOperatorFunction<number> {
    return function(source) {
        return source.pipe(map(value => value + by))
    }
}

export function select<T, U>(selector: (state: T) => U): OperatorFunction<T, U> {
    return function(source) {
        return source.pipe(map(selector), distinctUntilChanged())
    }
}

export type MapStateToProps<T extends any, U extends any> = {
    [key in keyof U]?: (state: T) => U[key]
}
