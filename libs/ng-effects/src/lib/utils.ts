import { combineLatest, MonoTypeOperatorFunction, Observable } from "rxjs"
import { ElementRef, ViewContainerRef, ɵSWITCH_VIEW_CONTAINER_REF_FACTORY__POST_R3__ as injectViewContainerRef } from "@angular/core"
import { MapSelect } from "./internals/interfaces"
import { map, skip } from "rxjs/operators"
import { Connect } from "./connect"
import { ObservableSources } from "./interfaces"

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

/**
 * Connect views without explicitly injecting `Connect`
 *
 * @experimental
 * @param context The component or directive instance
 */
export function connect(context: any) {
    const connect = injectViewContainerRef(ViewContainerRef, ElementRef).injector.get(Connect)
    if (connect) {
        connect(context)
    }
}
