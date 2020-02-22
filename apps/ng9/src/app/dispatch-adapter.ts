import { Inject, Injectable, InjectionToken, Type } from "@angular/core"
import { EffectHandler, EffectMetadata } from "@ng9/ng-effects"

export interface Dispatcher {
    dispatch(action: any): void
}

export const DISPATCH_ADAPTER = new InjectionToken("DISPATCH_ADAPTER")

export interface DispatchValue {
    type: string
}

export interface DispatchOptions {
    test?: boolean
}

@Injectable()
export class Dispatch implements EffectHandler<DispatchValue, DispatchOptions> {
    // tslint:disable-next-line:no-shadowed-variable
    constructor(@Inject(DISPATCH_ADAPTER) private dispatcher: Dispatcher) {}

    public next(action: DispatchValue, options: DispatchOptions, metadata: EffectMetadata): void {
        if (!action || !action.type) {
            console.error(`[dispatch adapter] effect must return an action!`)
            console.error(`Expected: {type: string}`)
            console.error(`Received: ${JSON.stringify(action)}`)
        }
        this.dispatcher.dispatch(action)
    }
}

export function dispatchAdapter(dispatcher: Type<Dispatcher>) {
    return [
        {
            provide: DISPATCH_ADAPTER,
            useClass: dispatcher,
        },
        Dispatch,
    ]
}
