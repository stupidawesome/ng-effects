import { MonoTypeOperatorFunction } from "rxjs"
import { tap } from "rxjs/operators"
import { ChangeDetectorRef } from "@angular/core"
import { effectsMap } from "./internals/constants"
import { EffectOptions } from "./decorators"

export function markDirtyOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
    return tap(() => cdr.markForCheck())
}

export function detectChangesOn<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
    return tap(() => cdr.detectChanges())
}

export function createEffect<T>(fn: T, options?: EffectOptions): T {
    effectsMap.set(fn, options || {})
    return fn
}
