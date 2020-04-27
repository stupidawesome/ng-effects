import { combineLatest, MonoTypeOperatorFunction, Observable } from "rxjs"
import { MapSelect } from "./internals/interfaces"
import { map, skip } from "rxjs/operators"
import { ObservableSources } from "./interfaces"

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function changes<T>(): MonoTypeOperatorFunction<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function changes<T>(source: Observable<T>): Observable<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function changes<T>(source: ObservableSources<T>): Observable<T>
/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function changes<T>(source?: Observable<T> | MapSelect<T>): any {
    if (source) {
        if (source instanceof Observable) {
            return source.pipe(skip(1))
        } else {
            return latest(source).pipe(skip(1))
        }
    } else {
        return changes
    }
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export function latest<T extends any>(source: ObservableSources<T>): Observable<T> {
    const keys = Object.getOwnPropertyNames(source)
    const sources = keys.map(key => source[key])
    return combineLatest(sources).pipe(
        map(values => {
            return values.reduce((acc, value, index) => {
                acc[keys[index]] = value
                return acc
            }, {} as T)
        }),
    )
}
