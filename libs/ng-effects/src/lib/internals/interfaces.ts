import { EffectOptions } from "../decorators"
import { ChangeDetectorRef } from "@angular/core"
import { Observable, Subscription } from "rxjs"
import { ViewRenderer } from "./view-renderer"

export interface InitEffectArgs {
    effect: any
    effectFn: Function
    binding: string
    options: EffectOptions
    cdr: ChangeDetectorRef
    proxy: any
    hostContext: any
    subs: Subscription
    viewRenderer: ViewRenderer
    whenRendered: Observable<any>
}
