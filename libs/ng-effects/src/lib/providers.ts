import { connectFactory, injectAll } from "./internals/utils"
import { Effects } from "./internals/effects"
import { DEV_MODE, EFFECTS, HOST_INITIALIZER } from "./constants"
import { EffectOptions } from "./decorators"
import { Injector, isDevMode, Type } from "@angular/core"

export function effects(types: Type<any>[], effectOptions?: EffectOptions) {
    return [
        {
            provide: EFFECTS,
            deps: types,
            useFactory: injectAll,
        },
        {
            provide: EffectOptions,
            useValue: effectOptions,
        },
        {
            provide: DEV_MODE,
            useFactory: isDevMode,
        },
        {
            provide: Connect,
            useFactory: connectFactory,
            deps: [HOST_INITIALIZER, Injector],
        },
        {
            provide: HOST_INITIALIZER,
            useValue: Effects,
            multi: true,
        },
        Effects,
        types,
    ]
}

export interface Connect {
    // tslint:disable-next-line
    <T>(context: T): void
}

export class Connect {}
