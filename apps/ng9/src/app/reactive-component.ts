import {
    Inject,
    Injectable,
    InjectionToken,
    OnDestroy,
    ɵmarkDirty as markDirty,
} from "@angular/core"
import { asapScheduler, MonoTypeOperatorFunction, Observable, Subject, Subscription } from "rxjs"
import { filter, subscribeOn, takeUntil, tap } from "rxjs/operators"

export type State<T extends object> = {
    [key in keyof T]: Observable<T[key]> & { changes: Observable<T[key]> }
}

const destroyed = new Subject()

export function markDirtyOn<T>(inst: any): MonoTypeOperatorFunction<T> {
    return source => source.pipe(tap(() => markDirty(inst)))
}

export function takeUntilDestroy<T>(obj: any): MonoTypeOperatorFunction<T> {
    return source => source.pipe(takeUntil(destroyed.pipe(filter(value => value === obj))))
}

export function dispose(inst: any) {
    destroyed.next(inst)
}

export type Effect<T extends object> = {
    [key in keyof T]?: (state: State<T>, context: T) => Observable<T[key]> | Subscription | void
}

export const EFFECTS = new InjectionToken("EFFECTS")

export function injectAll(...deps: any[]) {
    return deps
}

export function withEffects(...effects: any[]) {
    return [
        {
            provide: EFFECTS,
            deps: effects,
            useFactory: injectAll,
        },
        Effects,
        effects,
    ]
}

export const __effect__ = Symbol()

export function Effect(options?: any): MethodDecorator {
    return function(target: any, prop) {
        target[prop][__effect__] = options || {}
    }
}

@Injectable()
export class Effects implements OnDestroy {
    private readonly subs: Subscription
    private instance: object | null

    constructor(@Inject(EFFECTS) private effects: any[]) {
        this.subs = new Subscription()
        this.instance = null
    }

    public run(instance: any, observer: any) {
        this.instance = instance
        for (const effect of this.effects) {
            for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(effect))) {
                const value = effect[key]
                const options = value[__effect__]
                if (value && options) {
                    let returnValue = value(observer, instance)
                    if (returnValue) {
                        if (returnValue instanceof Observable) {
                            returnValue = returnValue.pipe(
                                subscribeOn(asapScheduler),
                                takeUntilDestroy(instance),
                            )
                            if (options.markDirty) {
                                returnValue = returnValue.pipe(markDirtyOn(instance))
                            }
                            observer[key] = returnValue
                        }
                        if (returnValue instanceof Subscription) {
                            this.subs.add(returnValue)
                        }
                    }
                }
            }
        }
    }

    public ngOnDestroy() {
        if (this.instance) {
            dispose(this.instance)
        }
        this.subs.unsubscribe()
    }
}
