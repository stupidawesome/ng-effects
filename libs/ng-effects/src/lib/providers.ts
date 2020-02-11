import { Effects } from "./internals/effects"
import { EFFECTS, HOST_INITIALIZER, HostRef, STRICT_MODE } from "./constants"
import { DefaultEffectOptions, EffectOptions } from "./decorators"
import { APP_BOOTSTRAP_LISTENER, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"
import { ViewRenderer } from "./internals/view-renderer"
import { ConnectFactory } from "./internals/connect-factory"
import { ExperimentalIvyViewRenderer } from "./internals/experimental-view-renderer"
import { bootstrapCallback } from "./internals/constants"
import { injectAll, injectHostRef } from "./internals/utils"

export function effects(types: Type<any> | Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useFactory: injectAll,
            deps: [].concat(types as any),
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
            useValue: Effects,
            multi: true,
        },
        DestroyObserver,
        Effects,
        types,
    ]
}

export interface Connect {
    // tslint:disable-next-line
    <T>(context: T): void
}

export abstract class Connect {}

export const HOST_EFFECTS = effects()

// noinspection JSUnusedGlobalSymbols
export const USE_STRICT_EFFECTS = {
    provide: STRICT_MODE,
    useValue: true,
}

export const USE_EXPERIMENTAL_RENDER_API = [
    {
        provide: ViewRenderer,
        useClass: ExperimentalIvyViewRenderer,
    },
    {
        provide: APP_BOOTSTRAP_LISTENER,
        useFactory: () => () => bootstrapCallback(),
        multi: true,
    },
]
