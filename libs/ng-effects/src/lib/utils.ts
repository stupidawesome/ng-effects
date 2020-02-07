import { MonoTypeOperatorFunction, Observable } from "rxjs"
import { filter, startWith, switchMap, takeUntil, tap } from "rxjs/operators"
import { QueryList, ɵmarkDirty as markDirty } from "@angular/core"
import { destroyed, effectsMap } from "./internals/constants"

export function markDirtyOn<T>(inst: any): MonoTypeOperatorFunction<T> {
    return source => source.pipe(tap(() => markDirty(inst)))
}

export function takeUntilDestroy<T>(obj: any): MonoTypeOperatorFunction<T> {
    return source => source.pipe(takeUntil(destroyed.pipe(filter(value => value === obj))))
}

export function dispose(inst: any) {
    destroyed.next(inst)
}

export function isNotNullOrUndefined<T>(value: T): value is Exclude<T, null | undefined> {
    return value !== null && value !== undefined
}

export function queryList<T>(source: Observable<QueryList<T> | null | undefined>): Observable<QueryList<T>> {
    return source.pipe(
        filter(isNotNullOrUndefined),
        switchMap(value => value.changes.pipe(startWith(value))),
    )
}


export function createEffect<T>(fn: T, options: any): T {
    effectsMap.set(fn, options || {})
    return fn
}
