import { Inject, Injectable, InjectionToken, Type } from "@angular/core"
import { AdapterEffectDecorator, DefaultEffectOptions, EffectAdapter, EffectMetadata, NextEffectAdapter } from "@ng9/ng-effects"
import { Observable } from "rxjs"
import { Effect } from "../../../../libs/ng-effects/src/lib/decorators"

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

type Action = {
    type: string
}

export type Payload<T extends Action> =  Omit<T, "type"> & Partial<Pick<T, "type">>

// export function Effect<T, U extends Type<any>>(
//     adapter: Type<NextEffectAdapter<T, any>>,
//     options?: U & DefaultEffectOptions,
// ): AdapterEffectDecorator<Observable<Payload<InstanceType<U>>>>

export function Dispatch<U extends Type<Action>>(action: U) {
    return Effect(DispatchAdapter as Type<DispatchAdapter<U>>, action)
}

@Injectable()
export class DispatchAdapter<T extends Type<Action>> implements EffectAdapter<InstanceType<T>, T> {
    // tslint:disable-next-line:no-shadowed-variable
    constructor(@Inject(DISPATCH_ADAPTER) private dispatcher: Dispatcher) {}

    public next(action: Payload<InstanceType<T>>, metadata: EffectMetadata<T>): void {
        if (!action || !action.type) {
            console.error(`[dispatch adapter] effect ${metadata.path} must return an action!`)
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
