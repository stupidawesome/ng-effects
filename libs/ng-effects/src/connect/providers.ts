import { createHostRef } from "./host-ref"
import {
    ChangeDetectorRef,
    ElementRef,
    inject,
    InjectionToken,
    INJECTOR,
    Optional,
    Provider,
    Self,
    SkipSelf,
    Type,
    ViewContainerRef,
    ɵSWITCH_VIEW_CONTAINER_REF_FACTORY__POST_R3__ as injectViewContainerRef,
} from "@angular/core"
import { HostRef } from "./interfaces"
import { connectFactory } from "./connect-factory"
import { DestroyObserver } from "./destroy-observer"
import { scheduler } from "../scheduler/scheduler"
import { ViewRenderer } from "../scheduler/view-renderer"
import { merge, Observable } from "rxjs"
import { delayWhen, distinctUntilChanged, map, share, skip, switchMap, take } from "rxjs/operators"
import { useReactive } from "../composition/utils"
import { ChangeNotifier } from "./change-notifier"
import { flush, getHooks, LifeCycleHooks, setContext } from "./hooks"

export const HOST_REF = {
    provide: HostRef,
    useFactory: createHostRef,
    deps: [],
}

export const HOST_INITIALIZER = new InjectionToken<any[]>("HOST_INITIALIZER")

export interface Connect {
    // tslint:disable-next-line
    <T>(context: T): void
}

export function runSetup() {
    const injector = inject(INJECTOR)
    const context = inject(HostRef as Type<any>).context
    if (typeof context.ngOnConnect === "function") {
        setContext(injector)
        const reactive = useReactive(context)
        context.ngOnConnect.call(reactive, reactive)
        setContext()
    }
}

export const CONNECT = [
    {
        provide: Connect,
        useFactory: connectFactory,
        deps: [[HOST_INITIALIZER, new Self()], INJECTOR],
    },
    HOST_REF,
]

export const RUN_SCHEDULER = [
    ChangeNotifier,
    {
        provide: scheduler,
        useFactory: scheduler,
        deps: [
            HostRef,
            DestroyObserver,
            ViewRenderer,
            [new SkipSelf(), new Optional(), ChangeNotifier],
            ChangeNotifier,
            [new Optional(), ChangeDetectorRef],
        ],
    },
]

export const CONNECT_SCHEDULER = [
    {
        provide: HOST_INITIALIZER,
        useValue: scheduler,
        multi: true,
    },
]

export const SCHEDULER = [CONNECT_SCHEDULER, RUN_SCHEDULER, CONNECT, DestroyObserver]

export function connectable<T>(fn: (context: T) => void): Provider {
    return [
        SCHEDULER,
        {
            provide: fn,
            useFactory: () => {
                const injector = inject(INJECTOR)
                const scheduler = injector.get(ViewRenderer)
                const destroy = injector.get(DestroyObserver)
                const context = injector.get(HostRef).context

                setContext(injector)
                fn(useReactive(context))
                setContext()

                const afterViewInit = getHooks(LifeCycleHooks.AfterViewInit)
                const onChanges = getHooks(LifeCycleHooks.OnChanges)
                const whenRendered = getHooks(LifeCycleHooks.WhenRendered)

                const changes = scheduler.whenScheduled.pipe(
                    map(() => Object.values(context)),
                    distinctUntilChanged((a, b) => a.every((val, i) => val === b[i])),
                    skip(1),
                    share(),
                )

                if (afterViewInit) {
                    const iter = [...afterViewInit]
                    destroy.add(
                        scheduler.whenRendered
                            .pipe(
                                take(1),
                                switchMap(() => {
                                    setContext(injector, LifeCycleHooks.AfterViewInit)
                                    const merged = merge(
                                        ...iter.map(callback => {
                                            return new Observable(() => callback())
                                        }),
                                    )
                                    setContext()
                                    return merged
                                }),
                            )
                            .subscribe(),
                    )
                }
                if (onChanges) {
                    const iter = [...onChanges]
                    changes
                        .pipe(
                            switchMap(() => {
                                flush(LifeCycleHooks.OnChangesEffects)
                                setContext(injector, LifeCycleHooks.OnChanges)
                                const merged = merge(
                                    ...iter.map(callback => {
                                        return new Observable(() => callback())
                                    }),
                                )
                                setContext()
                                return merged
                            }),
                        )
                        .subscribe()
                }

                if (whenRendered) {
                    const iter = [...whenRendered]
                    destroy.add(
                        changes
                            .pipe(
                                delayWhen(() => scheduler.whenRendered),
                                switchMap(() => {
                                    flush(LifeCycleHooks.WhenRenderedEffects)
                                    setContext(injector, LifeCycleHooks.WhenRendered)
                                    const merged = merge(
                                        ...iter.map(callback => {
                                            return new Observable(() => callback())
                                        }),
                                    )
                                    setContext()
                                    return merged
                                }),
                            )
                            .subscribe(),
                    )
                }
            },
        },
        {
            provide: runSetup,
            useFactory: runSetup,
        },
        {
            provide: HOST_INITIALIZER,
            useValue: runSetup,
            multi: true,
        },
        {
            provide: HOST_INITIALIZER,
            useValue: fn,
            multi: true,
        },
    ]
}

export function connect(context: object): void {
    const connect = injectViewContainerRef(ViewContainerRef, ElementRef).injector.get(Connect)
    if (connect) {
        connect(context)
    }
}

export interface Connectable<T extends object = any> {
    ngOnConnect(context?: T): void
}

export const Connectable = connectable(() => {})

export function Connect(): ClassDecorator {
    return function(target) {
        return new Proxy(target, {
            construct(target: any, argArray: any): any {
                const instance = new target(...argArray)
                connect(instance)
                return instance
            },
        })
    }
}
