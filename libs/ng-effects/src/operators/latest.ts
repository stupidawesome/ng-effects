import { combineLatest, Observable } from "rxjs"
import { map } from "rxjs/operators"
import { ObservableSources } from "./interfaces"

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
