import {
    ChangeDetectorRef,
    ElementRef,
    Host,
    Inject,
    Injectable,
    Injector,
    OnDestroy,
    Optional,
    Type,
} from "@angular/core"
import { Subject, Subscription } from "rxjs"
import { DEV_MODE, EFFECTS, HostRef, STRICT_MODE } from "../constants"
import { effectsMap } from "./constants"
import { EffectOptions } from "../decorators"
import { flat, initEffect, observe, throwMissingPropertyError } from "./utils"
import { ViewRenderer } from "./view-renderer"
import { InitEffectArgs } from "./interfaces"

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private readonly defaultOptions: EffectOptions
    private readonly revoke: Function
    private readonly proxy: { [key: string]: Subject<any> }
    private readonly hostContext: any
    private readonly effects: any[]
    private readonly cdr: ChangeDetectorRef
    private readonly strictMode: boolean
    private readonly viewRenderer: ViewRenderer
    private readonly nativeElement: any

    constructor(
        @Host() hostRef: HostRef,
        @Host() @Inject(EFFECTS) effectTypes: Type<any>[],
        @Host() options: EffectOptions,
        @Host() cdr: ChangeDetectorRef,
        @Inject(DEV_MODE) isDevMode: boolean,
        @Optional() @Inject(STRICT_MODE) strictMode: boolean | null,
        viewRenderer: ViewRenderer,
        elementRef: ElementRef<HTMLElement>,
        injector: Injector,
    ) {
        const hostContext = hostRef.instance
        const { proxy, revoke } = observe(hostContext, isDevMode)
        const { nativeElement } = elementRef
        const effects = flat(effectTypes).map(injector.get, injector)

        effects.push(hostContext)

        this.subs = new Subscription()
        this.effects = effects
        this.cdr = cdr
        this.viewRenderer = viewRenderer
        this.strictMode = strictMode === true
        this.nativeElement = nativeElement
        this.defaultOptions = Object.assign(
            {
                whenRendered: false,
                detectChanges: false,
                markDirty: false,
            },
            options,
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
            proxy,
            hostContext,
            effects,
            strictMode,
            viewRenderer,
            nativeElement,
        } = this

        const whenRendered = viewRenderer.whenRendered(nativeElement)

        for (const effect of effects) {
            const props = [
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(effect)),
                ...Object.getOwnPropertyNames(effect),
            ]

            for (const key of props) {
                const effectFn = effect[key]
                const maybeOptions = effectsMap.get(effectFn)

                if (effectFn && maybeOptions) {
                    const options: EffectOptions<any> = Object.assign(
                        {},
                        defaultOptions,
                        maybeOptions,
                    )
                    const binding = strictMode ? options.bind : options.bind || key
                    const checkBinding = options.bind
                    const args: InitEffectArgs = {
                        effect,
                        effectFn,
                        binding,
                        options,
                        cdr,
                        proxy,
                        hostContext,
                        subs,
                        viewRenderer,
                        whenRendered,
                    }
                    if (
                        typeof checkBinding === "string" &&
                        Object.getOwnPropertyDescriptor(hostContext, checkBinding) === undefined
                    ) {
                        throwMissingPropertyError(checkBinding, hostContext.constructor.name)
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
        }
    }

    public ngOnDestroy() {
        this.revoke()
        this.subs.unsubscribe()
    }
}
