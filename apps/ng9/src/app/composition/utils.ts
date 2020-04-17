import { Observable } from "rxjs"
import { use, useEffect, useState } from "@ng9/ng-effects"
import { ChangeDetectorRef, Type } from "@angular/core"
import { MapStateToProps, select } from "../utils"
import { distinctUntilChanged } from "rxjs/operators"

interface Dispatcher {
    dispatch(action: any): any
}

export function useDispatch(token: Type<Dispatcher>) {
    const dispatcher = use(token)
    const effect = useEffect()
    return function(arg: Observable<any>) {
        effect(() => arg.subscribe(action => dispatcher.dispatch(action)))
    }
}

export function useMapStateToProps<TState extends any, TProps extends any>(
    token: Type<Observable<TState>>,
) {
    const state = useState<TState>()
    const store = use(token)
    const effect = useEffect()

    return function(arg: MapStateToProps<TState, TProps>) {
        for (const [key, selector] of Object.entries(arg)) {
            if (selector) {
                effect(() =>
                    store.pipe(select(selector)).subscribe(value => {
                        state[key].setValue(value, { markDirty: true })
                    }),
                )
            }
        }
    }
}

export function useShouldComponentUpdate() {
    const effect = useEffect()
    const cdr = use(ChangeDetectorRef)
    return function(source: Observable<boolean>) {
        cdr.detach()
        effect(() =>
            source.pipe(distinctUntilChanged()).subscribe(shouldUpdate => {
                if (shouldUpdate) {
                    cdr.reattach()
                } else {
                    cdr.detach()
                }
            }),
        )
    }
}
