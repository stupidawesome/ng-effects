import { ChangeDetectorRef, ElementRef, Host, Inject, Injectable, OnDestroy } from "@angular/core"
import { Subscription } from "rxjs"
import { EFFECTS, HostRef } from "../constants"
import { initEffect } from "./utils"
import { ViewRenderer } from "./view-renderer"
import { InitEffectArgs } from "./interfaces"
import { EffectMetadata } from "../interfaces"

@Injectable()
export class InitEffects implements OnDestroy {
    private readonly subs: Subscription
    private readonly effects: any[]
    private readonly cdr: ChangeDetectorRef
    private readonly viewRenderer: ViewRenderer
    private readonly nativeElement: any
    private readonly hostContext: any

    constructor(
        @Host() hostRef: HostRef,
        @Host() @Inject(EFFECTS) effects: EffectMetadata[],
        @Host() cdr: ChangeDetectorRef,
        @Host() elementRef: ElementRef<HTMLElement>,
        @Host() viewRenderer: ViewRenderer,
    ) {
        const { nativeElement } = elementRef

        this.subs = new Subscription()
        this.effects = effects
        this.cdr = cdr
        this.viewRenderer = viewRenderer
        this.nativeElement = nativeElement
        this.hostContext = hostRef.instance

        this.run()
    }

    public run() {
        const { cdr, subs, effects, viewRenderer, nativeElement, hostContext } = this

        const whenRendered = viewRenderer.whenRendered(nativeElement)

        for (const { effect, binding, options, adapter } of effects) {
            const args: InitEffectArgs = {
                effect,
                hostContext,
                binding,
                options,
                cdr,
                subs,
                viewRenderer,
                adapter,
            }
            if (options.whenRendered) {
                subs.add(
                    whenRendered.subscribe(
                        () => initEffect(args),
                        error => console.error(error),
                    ),
                )
            } else {
                initEffect(args)
            }
        }
    }

    public ngOnDestroy() {
        this.subs.unsubscribe()
    }
}
