import { EffectOptions } from "../decorators"
import { ChangeDetectorRef } from "@angular/core"
import { Observable, Subscription } from "rxjs"
import { ViewRenderer } from "./view-renderer"
import { EffectHandler } from "../interfaces"

export interface InitEffectArgs {
    effect: Function
    binding: string
    options: EffectOptions
    cdr: ChangeDetectorRef
    hostContext: any
    subs: Subscription
    viewRenderer: ViewRenderer
    adapter?: EffectHandler<any, any>
}

export interface RenderApi {
    detectChanges(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    markDirty(componentOrView: any, changeDetector?: ChangeDetectorRef): void
    whenRendered(componentOrView: any, changeDetector?: ChangeDetectorRef): Observable<null>
}
