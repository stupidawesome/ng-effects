import { MonoTypeOperatorFunction } from "rxjs"
import { map } from "rxjs/operators"

export function increment(by: number = 1): MonoTypeOperatorFunction<number> {
    return function(source) {
        return source.pipe(map(value => value + by))
    }
}

