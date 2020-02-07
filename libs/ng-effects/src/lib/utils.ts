import { MonoTypeOperatorFunction, Observable } from "rxjs"
import { filter, startWith, switchMap, tap } from "rxjs/operators"
import { ChangeDetectorRef, QueryList } from "@angular/core"
import { effectsMap } from "./internals/constants"
import { EffectOptions } from "./decorators"

export function markDirtyOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
    return tap(() => cdr.markForCheck())
}

export function detectChangesOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
    return tap(() => cdr.detectChanges())
}

export function isNotNullOrUndefined<T>(value: T): value is Exclude<T, null | undefined> {
    return value !== null && value !== undefined
}

export function queryList<T>(
    source: Observable<QueryList<T> | null | undefined>,
): Observable<QueryList<T>> {
    return source.pipe(
        filter(isNotNullOrUndefined),
        switchMap(value => value.changes.pipe(startWith(value))),
    )
}

export function createEffect<T>(fn: T, options?: EffectOptions): T {
    effectsMap.set(fn, options || {})
    return fn
}
