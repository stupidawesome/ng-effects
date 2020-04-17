import { MonoTypeOperatorFunction, Observable } from "rxjs"
import { skip } from "rxjs/operators"
import { latest } from "./latest"
import { MapSelect, ObservableSources } from "./interfaces"

export function changes<T>(): MonoTypeOperatorFunction<T>
export function changes<T>(source: Observable<T>): Observable<T>
export function changes<T>(source: ObservableSources<T>): Observable<T>
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
