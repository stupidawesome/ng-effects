import { TeardownLogic } from "rxjs"

export interface OnConnect {
    ngOnConnect?(): void
}

export type ConnectableFunction<T = any> = (ctx: T) => void

export type EffectHook = (...args: any[]) => TeardownLogic

export type Context = { [key: string]: any }

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

export interface EffectOptions {
    watch?: boolean
    flush?: "pre" | "post" | "sync"
    invalidate: Function
}

export type StopHandler = () => void

export type OnInvalidate = (teardown: TeardownLogic) => void
