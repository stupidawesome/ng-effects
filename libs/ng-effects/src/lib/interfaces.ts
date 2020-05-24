import { TeardownLogic } from "rxjs"

export type EffectHook = (...args: any[]) => Teardown

export const enum LifecycleHook {
    OnConnect,
    OnInit,
    OnChanges,
    AfterViewInit,
    AfterContentInit,
    OnDestroy,
    DoCheck,
    AfterContentChecked,
    AfterViewChecked,
}

export interface ForEachObserver<T, U = T> {
    closed?: boolean
    next?: (value: T) => void
    error?: (err: any) => void
    complete?: () => void
    forEach: (value: U) => void
}

export interface CreateEffectOptions {
    watch?: boolean
    flush?: "pre" | "post" | "sync"
    invalidate: Function
}

export type StopHandle = () => void

export type OnInvalidate = (teardown: Teardown) => void

export type Teardown = TeardownLogic | Promise<void>
