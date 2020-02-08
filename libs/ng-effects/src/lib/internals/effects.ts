import { ChangeDetectorRef, ElementRef, Inject, Injectable, OnDestroy } from "@angular/core"
import { AsyncSubject, Observable, Subscription } from "rxjs"
import { DEV_MODE, EFFECTS, HOST_CONTEXT } from "../constants"
import { effectsMap } from "./constants"
import { EffectOptions } from "../decorators"
import { initEffect, observe } from "./utils"
import { whenRenderedOn } from "../utils"

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private readonly defaultOptions: EffectOptions
    private readonly rendered: Observable<any>
    private readonly revoke: Function
    private readonly proxy: any
    private readonly hostContext: any

    constructor(
        private cdr: ChangeDetectorRef,
        @Inject(EFFECTS) private effects: any[],
        @Inject(DEV_MODE) private isDevMode: boolean,
        @Inject(HOST_CONTEXT) hostContext: any,
        el: ElementRef,
        options: EffectOptions,
    ) {
        const { proxy, revoke } = observe(hostContext, isDevMode)

        this.subs = new Subscription()
        this.defaultOptions = Object.assign(
            {
                whenRendered: false,
                detectChanges: false,
                markDirty: false,
            },
            options,
        )
        this.rendered = whenRenderedOn(el.nativeElement)
        this.revoke = revoke
        this.proxy = proxy
        this.hostContext = hostContext

        this.run()
    }

    public run() {
        const { defaultOptions, cdr, subs, rendered, proxy, hostContext, effects } = this
        let isRendered: AsyncSubject<void> | undefined

        for (const effect of effects) {
            const props = [
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(effect)),
                ...Object.getOwnPropertyNames(effect),
            ]

            for (const key of props) {
                const fn = effect[key]
                let options: EffectOptions = effectsMap.get(fn)

                if (fn && options) {
                    options = Object.assign({}, defaultOptions, options)
                    const args: any = [fn, key, options, cdr, proxy, hostContext, subs]
                    if (options.whenRendered) {
                        if (isRendered === undefined) {
                            isRendered = new AsyncSubject()
                            rendered.subscribe(isRendered)
                        }
                        subs.add(
                            isRendered.subscribe(
                                () => initEffect.apply(null, args),
                                error => console.error(error),
                            ),
                        )
                    } else {
                        initEffect.apply(null, args)
                    }
                }
            }
        }
    }

    public ngOnDestroy() {
        this.revoke()
        this.subs.unsubscribe()
    }
}
