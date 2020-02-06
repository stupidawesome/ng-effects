import { MonoTypeOperatorFunction } from "rxjs"
import { filter, takeUntil, tap } from "rxjs/operators"
import { ɵmarkDirty as markDirty } from "@angular/core"
import { destroyed } from "./internals/constants"

export function markDirtyOn<T>(inst: any): MonoTypeOperatorFunction<T> {
    return source => source.pipe(tap(() => markDirty(inst)))
}

export function takeUntilDestroy<T>(obj: any): MonoTypeOperatorFunction<T> {
    return source => source.pipe(takeUntil(destroyed.pipe(filter(value => value === obj))))
}

export function dispose(inst: any) {
    destroyed.next(inst)
}
