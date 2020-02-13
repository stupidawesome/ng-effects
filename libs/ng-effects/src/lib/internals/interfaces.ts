import { ChangeDetectorRef } from "@angular/core"
import { Observable, Subject, Subscription } from "rxjs"
import { ViewRenderer } from "./view-renderer"
import { EffectHandler, EffectOptions } from "../interfaces"
import { proxyTarget } from "./constants"

export interface InitEffectArgs {
    effect: Function
    binding: string
    options: EffectOptions
    cdr: ChangeDetectorRef
    hostContext: any
    subs: Subscription
    viewRenderer: ViewRenderer
    adapter?: EffectHandler<any, any>
    notifier: Subject<void>
}

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenScheduled(): Observable<null>
    whenRendered(): Observable<null>
}

export type MapSelect<T> = {
    [key in keyof T]: Observable<T[key]>
} & {
    [proxyTarget]: T
}
