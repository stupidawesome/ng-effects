import { ChangeDetectorRef, Host, Inject, Injectable, OnDestroy } from "@angular/core"
import { asapScheduler, isObservable, Subscription } from "rxjs"
import { EFFECTS, HostRef } from "../constants"
import { ViewRenderer } from "./view-renderer"
import { InitEffectArgs } from "./interfaces"
import { EffectMetadata } from "../interfaces"
import { last, observeOn, take, takeUntil, tap } from "rxjs/operators"
import { assertPropertyExists, isTeardownLogic, throwBadReturnTypeError } from "./utils"

export function initEffect({
    effect,
    binding,
    options,
    cdr,
    hostContext,
    subs,
    viewRenderer,
    adapter,
    notifier,
}: InitEffectArgs) {
    const returnValue = effect()

    if (returnValue === undefined) {
        return
    }

    if (isObservable(returnValue)) {
        returnValue
            .pipe(
                takeUntil(notifier.pipe(last())),
                tap((value: any) => {
                    if (adapter) {
                        adapter.next(value, options)
                    }
                    if (options.assign) {
                        for (const prop of Object.keys(value)) {
                            assertPropertyExists(prop, hostContext)
                            hostContext[prop] = value[prop]
                        }
                    } else if (binding) {
                        assertPropertyExists(binding, hostContext)
                        hostContext[binding] = value
                    }
                    if (options.detectChanges) {
                        viewRenderer.detectChanges(hostContext, cdr)
                    } else {
                        notifier.next(hostContext)
                    }
                }),
                observeOn(asapScheduler),
            )
            .subscribe(() => {
                if (options.markDirty) {
                    viewRenderer.markDirty(hostContext, cdr)
                }
            })
    } else if (isTeardownLogic(returnValue)) {
        subs.add(returnValue)
    } else {
        throwBadReturnTypeError()
    }
}

@Injectable()
export class InitEffects implements OnDestroy {
    private readonly subs: Subscription
    private readonly effects: any[]
    private readonly cdr: ChangeDetectorRef
    private readonly viewRenderer: ViewRenderer
    private readonly hostContext: any

    constructor(
        @Host() hostRef: HostRef,
        @Host() @Inject(EFFECTS) effects: EffectMetadata[],
        @Host() cdr: ChangeDetectorRef,
        viewRenderer: ViewRenderer,
    ) {
        this.subs = new Subscription()
        this.effects = effects
        this.cdr = cdr
        this.viewRenderer = viewRenderer
        this.hostContext = hostRef.instance

        this.run()
    }

    public run() {
        const { cdr, subs, effects, viewRenderer, hostContext } = this

        const whenRendered = viewRenderer.whenRendered().pipe(take(1))

        for (const { effect, binding, options, adapter, notifier } of effects) {
            const args: InitEffectArgs = {
                effect,
                hostContext,
                binding,
                options,
                cdr,
                subs,
                viewRenderer,
                adapter,
                notifier,
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
