import { inject as oinject, InjectionToken, Type } from "@angular/core"
import { asapScheduler, BehaviorSubject, Observable, scheduled, TeardownLogic } from "rxjs"
import { AssignSources, EmitSources } from "./interfaces"
import { DestroyObserver } from "../connect/destroy-observer"
import { take } from "rxjs/operators"
import { ViewRenderer } from "../scheduler/view-renderer"
import { latest } from "../operators/latest"
import { HostRef } from "../connect/interfaces"
import { changes } from "../operators/changes"
import { ChangeNotifier } from "../connect/providers"

export function inject<T>(token: { prototype: T } | Type<T> | InjectionToken<T>): T {
    return oinject(token as any)
}

export const use = inject

export function useHostRef<T extends any>(): HostRef<T> {
    return use(HostRef) as HostRef<T>
}

export function useContext<T extends any>() {
    return useHostRef<T>().context
}

export function whenRendered(fn: () => any): void {
    const viewRenderer = use(ViewRenderer)
    const teardown = useTeardown()
    teardown(scheduled(viewRenderer.whenRendered().pipe(take(1)), asapScheduler).subscribe(fn))
}

export interface StateSubject<T> extends BehaviorSubject<T> {
    changes: Observable<T>
    setValue: (value: T, flags?: { markDirty: boolean }) => void
}

export type UseState<T> = {
    [key in keyof T]-?: StateSubject<T[key]>
}

export function stateFactory<T>(context: T, changeNotifier: ChangeNotifier): <U extends keyof T>(key: U) => StateSubject<T[U]> {
    const teardown = useTeardown()
    return function<U extends keyof T>(key: U) {
        class StateSubject<U extends keyof T> extends BehaviorSubject<T[U]> {
            get changes() {
                return changes(this)
            }

            setValue(value: any, flags: any = { markDirty: true }) {
                context[key] = value
                this.next(value)
                changeNotifier.next(flags)
            }

            constructor(private key: U) {
                super(context[key])
                teardown(
                    changeNotifier.subscribe(() => {
                        if (context[key] !== this.value) {
                            this.next(context[key])
                        }
                    }),
                )
            }
        }
        return new StateSubject(key)
    }
}

function mapState(state: any, context: any, factory: any) {
    return Object.entries(context).reduce((acc, [key, _value]) => {
        return Object.defineProperty(acc, key, {
            configurable: true,
            get() {
                Object.defineProperty(acc, key, {
                    enumerable: true,
                    value: factory(key),
                })
                return acc[key]
            },
        })
    }, state)
}

export function useState<T>(): UseState<T> {
    const context = useContext()
    const changeNotifier = use(ChangeNotifier)
    const factory = stateFactory(context, changeNotifier)
    const state = {} as UseState<T>

    whenRendered(() => mapState(state, context, factory))

    return mapState(state, context, factory)
}

export function useAssign<T extends any>() {
    const effect = useEffect()
    const state = useState<T>()

    return function assign(source: AssignSources<T>, opts: any = { markDirty: true }) {
        effect(() =>
            latest(source).subscribe(obj => {
                for (const key in obj) {
                    if (state[key]) {
                        state[key].setValue(obj[key], opts)
                    }
                }
            }),
        )
    }
}

export function useEmit<T extends any>() {
    const context = useContext<T>()
    const effect = useEffect()
    return function emit(source: EmitSources<T>) {
        effect(() =>
            latest(source).subscribe(obj => {
                for (const [key, value] of Object.entries(obj)) {
                    context[key].next(value)
                }
            }),
        )
    }
}

export function useTeardown() {
    const effect = useEffect()
    return function(source: TeardownLogic) {
        effect(() => source)
    }
}

export function useEffect<T extends any>() {
    const destroy = use(DestroyObserver)
    return function effect(factory: () => TeardownLogic) {
        destroy.add(factory())
    }
}
