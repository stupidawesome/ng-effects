import { createHostRef } from "./host-ref"
import {
    ChangeDetectorRef,
    ElementRef,
    inject,
    InjectionToken,
    Injector,
    INJECTOR,
    Optional,
    Provider,
    Self,
    SkipSelf,
    ViewContainerRef,
    ɵSWITCH_VIEW_CONTAINER_REF_FACTORY__POST_R3__ as injectViewContainerRef,
} from "@angular/core"
import { HostRef } from "./interfaces"
import { connectFactory } from "./connect-factory"
import { DestroyObserver } from "./destroy-observer"
import { scheduler } from "../scheduler/scheduler"
import { ViewRenderer } from "../scheduler/view-renderer"
import { merge, Observable, Subject } from "rxjs"
import { DefaultEffectOptions } from "../lib/interfaces"
import { delayWhen, distinctUntilChanged, map, share, skip, switchMap, take } from "rxjs/operators"
import { unsubscribe } from "./utils"
let _context: Injector
let _hook: LifeCycleHooks | undefined

export function setContext(context?: any, hook?: LifeCycleHooks) {
    _context = context
    _hook = hook
}

export function getContext() {
    return _context
}

export function getLifeCycle() {
    return _hook !== undefined ? _hook + 1 : undefined
}

export function flush(hook: LifeCycleHooks) {
    const effects = getHooks(hook)
    if (effects) {
        unsubscribe([...effects])
        effects.clear()
    }
}

const hooks = new WeakMap()

export enum LifeCycleHooks {
    OnChanges = 1,
    OnChangesEffects = 2,
    AfterViewInit = 3,
    AfterViewInitEffects = 4,
    WhenRendered = 5,
    WhenRenderedEffects,
    OnDestroy,
}

export function addHook(hook: LifeCycleHooks | undefined, callback: Function) {
    if (hook === undefined) {
        return
    }
    const context = getContext()
    if (!hooks.has(context)) {
        hooks.set(context, new Map())
    }
    const map = hooks.get(context)
    if (!map.has(hook)) {
        map.set(hook, new Set())
    }
    const callbacks = map.get(hook)
    callbacks.add(callback)
}

export function getHooks(hook: LifeCycleHooks): Set<Function> | undefined {
    const context = getContext()
    return hooks.get(context)?.get(hook)
}

export class ChangeNotifier extends Subject<DefaultEffectOptions | void> {}

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

export class Connect {}

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

export const SCHEDULER = [CONNECT, CONNECT_SCHEDULER, RUN_SCHEDULER, DestroyObserver]

export function setup<T>(fn: (context: T) => void): Provider {
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
                fn(context)
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
