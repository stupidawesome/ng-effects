import { createHostRef } from "./host-ref"
import {
    ChangeDetectorRef,
    ElementRef,
    InjectionToken,
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
import { Subject } from "rxjs"
import { DefaultEffectOptions } from "../lib/interfaces"

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

export function setup(fn: Function): Provider {
    return [
        SCHEDULER,
        {
            provide: fn,
            useFactory: fn,
        },
        {
            provide: HOST_INITIALIZER,
            useValue: fn,
            multi: true,
        },
    ]
}

export function connect(fn: () => void): Provider
export function connect(context: object): void
export function connect(arg: unknown): unknown {
    if (typeof arg === "function") {
        return setup(arg)
    } else {
        const connect = injectViewContainerRef(ViewContainerRef, ElementRef).injector.get(Connect)
        if (connect) {
            connect(arg)
        }
    }
}
