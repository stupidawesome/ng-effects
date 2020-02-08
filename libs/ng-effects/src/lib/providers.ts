import { ConnectFactory, injectAll } from "./internals/utils"
import { Effects } from "./internals/effects"
import { DEV_MODE, EFFECTS, HOST_INITIALIZER } from "./constants"
import { EffectOptions } from "./decorators"
import { isDevMode, Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"

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
            useClass: ConnectFactory,
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
