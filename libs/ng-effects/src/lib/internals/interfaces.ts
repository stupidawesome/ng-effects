import { ChangeDetectorRef } from "@angular/core"
import { Observable, Subject, Subscription } from "rxjs"
import { ViewRenderer } from "./view-renderer"
import { EffectHandler, EffectOptions } from "../interfaces"

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
    [key in keyof Required<T>]: Observable<T[key]>
}

export type NextValue<T extends any> = T["next"] extends (value: infer R, ...args: any[]) => any
    ? R
    : never

export type NextOptions<T extends any> = T["next"] extends (value: any, options: infer R, ...args: any[]) => any
    ? R
    : never
