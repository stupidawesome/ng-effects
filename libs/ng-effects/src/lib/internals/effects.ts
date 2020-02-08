import { ChangeDetectorRef, Host, Inject, Injectable, OnDestroy } from "@angular/core"
import { Observable, Subject, Subscription } from "rxjs"
import { DEV_MODE, EFFECTS, HOST_CONTEXT } from "../constants"
import { effectsMap } from "./constants"
import { EffectOptions } from "../decorators"
import { initEffect, observe } from "./utils"
import { RenderFactoryObserver } from "./render-factory-observer"
import { take } from "rxjs/operators"

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private readonly defaultOptions: EffectOptions
    private readonly whenRendered: Observable<any>
    private readonly revoke: Function
    private readonly proxy: { [key: string]: Subject<any> }
    private readonly hostContext: any

    constructor(
        @Host() private cdr: ChangeDetectorRef,
        @Host() @Inject(EFFECTS) private effects: any[],
        @Host() @Inject(HOST_CONTEXT) hostContext: any,
        @Inject(DEV_MODE) private isDevMode: boolean,
        @Host() options: EffectOptions,
        renderObserver: RenderFactoryObserver,
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
        this.whenRendered = renderObserver.whenRendered().pipe(take(1))
        this.revoke = revoke
        this.proxy = proxy
        this.hostContext = hostContext

        this.run()
    }

    public run() {
        const { defaultOptions, cdr, subs, whenRendered, proxy, hostContext, effects } = this

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
                        subs.add(
                            whenRendered.subscribe(
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
