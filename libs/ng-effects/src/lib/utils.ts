import { combineLatest, MonoTypeOperatorFunction, Observable } from "rxjs"
import {
    ElementRef,
    ViewContainerRef,
    ɵSWITCH_VIEW_CONTAINER_REF_FACTORY__POST_R3__ as injectViewContainerRef,
} from "@angular/core"
import { MapSelect } from "./internals/interfaces"
import { map, skip } from "rxjs/operators"
import { Connect } from "./connect"

function changesOperator<T>(source: Observable<T>) {
    return source.pipe(skip(1))
}

export function changes<T>(source: Observable<T>): Observable<T>
export function changes<T>(): MonoTypeOperatorFunction<T>
export function changes<T>(source?: Observable<T>): any {
    return source ? changesOperator(source) : changesOperator
}

export function latestFrom<T>(source: MapSelect<T>): Observable<T> {
    const keys = Object.keys(source) as (keyof T)[]
    return combineLatest(keys.map(key => source[key])).pipe(
        map(values =>
            values.reduce((acc, value, index) => {
                acc[keys[index]] = value as any
                return acc
            }, {} as T),
        ),
    )
}

/**
 * Connect views without explicitly injecting `Connect`
 *
 * @experimental
 * @param context The component or directive instance
 */
export function connect(context: any) {
    injectViewContainerRef(ViewContainerRef, ElementRef).injector.get(Connect)(context)
}
