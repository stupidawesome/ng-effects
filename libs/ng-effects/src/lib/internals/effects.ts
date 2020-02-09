import {
    ChangeDetectorRef,
    ElementRef,
    Host,
    Inject,
    Injectable,
    OnDestroy,
    Optional,
} from "@angular/core"
import { Observable, Subject, Subscription } from "rxjs"
import { DEV_MODE, EFFECTS, HOST_CONTEXT, STRICT_MODE } from "../constants"
import { effectsMap, isFactoryOrigin } from "./constants"
import { EffectOptions } from "../decorators"
import { initEffect, observe, throwMissingPropertyError } from "./utils"
import { RenderFactoryObserver } from "./render-factory-observer"
import { filter, share, take } from "rxjs/operators"

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private readonly defaultOptions: EffectOptions
    private readonly whenRendered: Observable<any>
    private readonly revoke: Function
    private readonly proxy: { [key: string]: Subject<any> }
    private readonly hostContext: any
    private readonly effects: any[]
    private readonly cdr: ChangeDetectorRef
    private readonly strictMode: boolean

    constructor(
        @Host() @Inject(HOST_CONTEXT) hostContext: any,
        @Host() @Inject(EFFECTS) effects: any[],
        @Host() options: EffectOptions,
        @Host() cdr: ChangeDetectorRef,
        @Inject(DEV_MODE) isDevMode: boolean,
        @Optional() @Inject(STRICT_MODE) strictMode: boolean | null,
        renderObserver: RenderFactoryObserver,
        elementRef: ElementRef<HTMLElement>,
    ) {
        const { proxy, revoke } = observe(hostContext, isDevMode)
        const { nativeElement } = elementRef

        effects.push(hostContext)

        this.subs = new Subscription()
        this.effects = effects
        this.cdr = cdr
        this.strictMode = strictMode === true
        this.defaultOptions = Object.assign(
            {
                whenRendered: false,
                detectChanges: false,
                markDirty: false,
            },
            options,
        )
        this.whenRendered = renderObserver.whenRendered().pipe(
            filter(() => nativeElement.isConnected),
            take(1),
            share(),
        )
        this.revoke = revoke
        this.proxy = proxy
        this.hostContext = hostContext

        this.run()
    }

    public run() {
        const {
            defaultOptions,
            cdr,
            subs,
            whenRendered,
            proxy,
            hostContext,
            effects,
            strictMode,
        } = this

        for (const effect of effects) {
            const props = [
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(effect)),
                ...Object.getOwnPropertyNames(effect),
            ]

            for (const key of props) {
                const fn = effect[key]
                const maybeOptions = effectsMap.get(fn)

                if (fn && maybeOptions) {
                    // factory effects area created every time, need to clean up to prevent memory leaks
                    if (maybeOptions[isFactoryOrigin]) {
                        effectsMap.delete(fn)
                    }
                    const options: EffectOptions<any> = Object.assign({}, defaultOptions, maybeOptions)
                    const binding = strictMode ? options.bind : options.bind || key
                    const checkBinding = options.bind
                    const args: any = [effect, fn, binding, options, cdr, proxy, hostContext, subs]
                    if (
                        checkBinding &&
                        Object.getOwnPropertyDescriptor(hostContext, checkBinding) === undefined
                    ) {
                        throwMissingPropertyError(checkBinding, hostContext.constructor.name)
                    }
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
