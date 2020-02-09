import { MonoTypeOperatorFunction } from "rxjs"
import { tap } from "rxjs/operators"
import { ChangeDetectorRef } from "@angular/core"
import { effectsMap } from "./internals/constants"
import { EffectOptions } from "./decorators"
import { EffectFn } from "./interfaces"

export function markDirtyOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
    return tap(() => cdr.markForCheck())
}

export function detectChangesOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
    return tap(() => cdr.detectChanges())
}

export function createEffect<T, U extends keyof T>(
    fn: EffectFn<T, T[U]>,
    options?: EffectOptions<U>,
): EffectFn<T, T[U]> {
    effectsMap.set(fn, options || {})
    return fn
}
