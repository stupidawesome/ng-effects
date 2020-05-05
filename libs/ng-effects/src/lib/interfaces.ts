import { PartialObserver, TeardownLogic } from "rxjs"

export interface OnConnect {
    ngOnConnect?(): void
}

export type ConnectableFunction<T = any> = (ctx: T) => void

export type EffectHook = (stop: PartialObserver<any>) => TeardownLogic

export type Context = { [key: string]: any }

export const enum LifecycleHook {
    OnConnect,
    OnInit,
    OnChanges,
    AfterViewInit,
    WhenRendered,
    OnDestroy,
    DoCheck,
    AfterViewChecked,
}

export interface EffectOptions {
    watch?: boolean
}

export type OnInvalidateFn = (callback: TeardownLogic) => void
