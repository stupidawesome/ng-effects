import { TeardownLogic } from "rxjs"

export interface OnConnect {
    ngOnConnect(): void
}

export type ConnectableFunction<T = any> = (ctx: T) => void

export type EffectHook = () => TeardownLogic

export type Context = object

export const enum LifecycleHook {
    OnInit,
    OnChanges,
    AfterViewInit,
    WhenRendered,
    OnDestroy,
    DoCheck,
    AfterViewChecked,
}
