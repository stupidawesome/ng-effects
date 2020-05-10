import { TeardownLogic } from "rxjs"

export interface OnConnect {
    ngOnConnect?(): void
}

export type ConnectableFunction<T = any> = (ctx: T) => void

export type EffectHook = (...args: any[]) => Teardown

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

export type StopHandle = () => void

export type OnInvalidate = (teardown: Teardown) => void

export type Teardown = TeardownLogic | Promise<void>
