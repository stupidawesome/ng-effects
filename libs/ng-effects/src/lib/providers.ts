import { InitEffects } from "./internals/init-effects"
import { EFFECTS, HOST_INITIALIZER, HostRef } from "./constants"
import { ElementRef, Injector, KeyValueDiffers, NgZone, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"
import { ViewRenderer } from "./internals/view-renderer"
import { ConnectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { injectEffects, injectHostRef } from "./internals/utils"
import { DefaultEffectOptions, EffectOptions } from "./interfaces"
import { STATE_FACTORY } from "./internals/providers"
import { EVENT_MANAGER_PLUGINS, EventManager } from "@angular/platform-browser"
import { ZonelessEventManager } from "./internals/zoneless-event-manager"

export function effects(types: Type<any> | Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: injectEffects,
            deps: [
                EffectOptions,
                HostRef,
                DestroyObserver,
                ViewRenderer,
                Injector,
                STATE_FACTORY,
                KeyValueDiffers,
                ElementRef
            ].concat(types as any),
        },
        {
            provide: EffectOptions,
            useValue: effectOptions,
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
                return NgZone.isInAngularZone() ? new EventManager(plugins, zone) : new ZonelessEventManager(plugins, zone)
            } catch {
                return new ZonelessEventManager(plugins, zone)
            }
        },
        deps: [EVENT_MANAGER_PLUGINS, NgZone]
    }
]
