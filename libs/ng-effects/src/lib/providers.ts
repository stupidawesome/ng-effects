import { InitEffects } from "./internals/init-effects"
import { EFFECTS, HOST_INITIALIZER, HostRef } from "./constants"
import { Injector, NgZone, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"
import { ViewRenderer } from "./internals/view-renderer"
import { ConnectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { injectHostRef } from "./internals/utils"
import { DefaultEffectOptions } from "./interfaces"
import { EVENT_MANAGER_PLUGINS, EventManager } from "@angular/platform-browser"
import { ZonelessEventManager } from "./internals/zoneless-event-manager"
import { injectEffectsFactory } from "./internals/inject-effects"

export function effects(types: Type<any> | Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: injectEffectsFactory(types, effectOptions),
            deps: [HostRef, Injector],
        },
        {
            provide: Connect,
            useClass: ConnectFactory,
        },
        {
            provide: HostRef,
            useFactory: injectHostRef,
        },
        {
            provide: HOST_INITIALIZER,
            useValue: InitEffects,
            multi: true,
        },
        DestroyObserver,
        InitEffects,
        types,
    ]
}

export interface Connect {
    // tslint:disable-next-line
    <T>(context: T): void
}

export abstract class Connect {}

export const HOST_EFFECTS = effects()

export const USE_EXPERIMENTAL_RENDER_API = [
    {
        provide: ViewRenderer,
        useClass: ExperimentalIvyViewRenderer,
    },
    {
        provide: EventManager,
        useFactory: (plugins: any[], zone: NgZone) => {
            try {
                return NgZone.isInAngularZone()
                    ? new EventManager(plugins, zone)
                    : new ZonelessEventManager(plugins, zone)
            } catch {
                return new ZonelessEventManager(plugins, zone)
            }
        },
        deps: [EVENT_MANAGER_PLUGINS, NgZone],
    },
]
