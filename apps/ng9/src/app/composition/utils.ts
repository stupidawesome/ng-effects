import { Observable } from "rxjs"
import { use, useState, useTeardown } from "@ng9/ng-effects"
import { ChangeDetectorRef, Type } from "@angular/core"
import { MapStateToProps, select } from "../utils"
import { distinctUntilChanged } from "rxjs/operators"

interface Dispatcher extends Observable<any> {
    dispatch(action: any): any
}

export function useStore<TState extends any, TProps extends any>(
    token: Type<Dispatcher>,
    mapStateToProps?: MapStateToProps<TState, TProps>,
) {
    const dispatcher = use(token)
    if (mapStateToProps) {
        useMapStateToProps<TState, TProps>(token, mapStateToProps)
    }
    return function(action: any) {
        dispatcher.dispatch(action)
    }
}

export function useMapStateToProps<TState extends any, TProps extends any>(
    token: Type<Observable<TState>>,
    arg: MapStateToProps<TState, TProps>,
) {
    const state = useState<TState>()
    const store = use(token)
    const effect = useTeardown()
    for (const [key, selector] of Object.entries(arg)) {
        if (selector) {
            effect(() =>
                store.pipe(select(selector)).subscribe(value => {
                    state[key] = value
                }),
            )
        }
    }
}

export function useShouldComponentUpdate(source: Observable<boolean>) {
    const effect = useTeardown()
    const cdr = use(ChangeDetectorRef)
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
