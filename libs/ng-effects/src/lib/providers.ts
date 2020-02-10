import { ConnectFactory } from "./internals/utils"
import { Effects } from "./internals/effects"
import { EFFECTS, HOST_INITIALIZER, STRICT_MODE } from "./constants"
import { DefaultEffectOptions, EffectOptions } from "./decorators"
import { Type } from "@angular/core"
import { DestroyObserver } from "./internals/destroy-observer"

export function effects(types: Type<any> | Type<any>[] = [], effectOptions?: DefaultEffectOptions) {
    return [
        {
            provide: EFFECTS,
            useValue: [types],
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
            provide: HOST_INITIALIZER,
            useValue: Effects,
            multi: true,
        },
        {
            provide: HOST_INITIALIZER,
            useValue: types,
            multi: true,
        },
        DestroyObserver,
        Effects,
    ]
}

export interface Connect {
    // tslint:disable-next-line
    <T>(context: T): void
}

export abstract class Connect {}

export const HOST_EFFECTS = effects()

export const USE_STRICT_EFFECTS = {
    provide: STRICT_MODE,
    useValue: true,
}
