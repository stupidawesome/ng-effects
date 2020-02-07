import { ChangeDetectorRef, ElementRef, Inject, Injectable, OnDestroy } from "@angular/core"
import { Subscription } from "rxjs"
import { DEV_MODE, EFFECTS, HOST_CONTEXT } from "../constants"
import { effectsMap } from "./constants"
import { EffectOptions } from "../decorators"
import { initEffect, observe } from "./utils"

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private defaultOptions: EffectOptions
    private nativeElement: any
    private revoke?: Function

    constructor(
        private cdr: ChangeDetectorRef,
        @Inject(EFFECTS) private effects: any[],
        @Inject(DEV_MODE) private isDevMode: boolean,
        @Inject(HOST_CONTEXT) hostContext: any,
        el: ElementRef,
        options: EffectOptions,
    ) {
        this.subs = new Subscription()
        this.nativeElement = el.nativeElement
        this.defaultOptions = Object.assign(
            {
                whenRendered: false,
                detectChanges: false,
                markDirty: false,
            },
            options,
        )
        console.log("effects", effects)
        this.run(hostContext)
    }

    public run(instance: any) {
        const { defaultOptions, nativeElement, cdr, subs, isDevMode } = this
        const { proxy, revoke } = observe(instance, isDevMode)

        for (const effect of this.effects) {
            const props = [
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(effect)),
                ...Object.getOwnPropertyNames(effect),
            ]
            for (const key of props) {
                const fn = effect[key]
                let options = effectsMap.get(fn)

                if (fn && options) {
                    options = Object.assign({}, defaultOptions, options)
                    void initEffect(
                        fn,
                        key,
                        options,
                        nativeElement,
                        cdr,
                        proxy,
                        instance,
                        subs,
                    ).catch(error => console.error(error))
                }
            }
        }

        this.revoke = revoke

        return instance
    }

    public ngOnDestroy() {
        if (this.revoke) {
            this.revoke()
        }
        this.subs.unsubscribe()
    }
}
