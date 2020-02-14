import { InitEffects } from "./internals/init-effects"
import { EFFECTS, HOST_INITIALIZER, HostRef } from "./constants"
import { Injector, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"
import { ViewRenderer } from "./internals/view-renderer"
import { ConnectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { injectEffects, injectHostRef } from "./internals/utils"
import { DefaultEffectOptions, EffectOptions } from "./interfaces"

export function effects(types: Type<any> | Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: injectEffects,
            deps: [EffectOptions, HostRef, DestroyObserver, ViewRenderer, Injector].concat(
                types as any,
            ),
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
]
