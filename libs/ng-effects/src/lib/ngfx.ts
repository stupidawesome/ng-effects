import {
    AbstractType,
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    DoCheck,
    inject as rootInject,
    InjectFlags,
    InjectionToken,
    Injector,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    Type,
    ɵmarkDirty as markDirty,
    ɵsetCurrentInjector as setCurrentInjector,
    ɵɵdirectiveInject as directiveInject,
} from "@angular/core"
import { Context, Lifecycle, LifecycleHooks } from "./interfaces"
import { isProxy } from "./utils"
import { onCheck, runHook } from "./lifecycle"
import { Ref, toRefs, UnwrapRefs } from "./ref"
import { watch } from "./effect"

const rootContext = {}
let activeContext: Context = rootContext
let activePhase: Lifecycle | undefined

export function getContext() {
    return activeContext
}

function setContext(context: Context) {
    activeContext = context
}

export function getPhase() {
    return activePhase
}

function setPhase(phase?: Lifecycle) {
    activePhase = phase
}

let injectorDepth = 0
let previousInjector: undefined | null | Injector

export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
): T
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags: InjectFlags,
): T | null
export function inject<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    flags: InjectFlags = InjectFlags.Default,
): unknown {
    previousInjector = setCurrentInjector(undefined)
    setCurrentInjector(previousInjector)
    const injector =
        previousInjector ?? injectorDepth ? rootInject : directiveInject
    injectorDepth++
    const value = injector(token as any, flags)
    injectorDepth--
    return value
}

export function runInContext<T, U extends any[]>(
    context: Context,
    phase: Lifecycle | undefined,
    run: (...args: U) => T,
    ...args: U
): T {
    let result,
        previousContext = getContext(),
        previousPhase = getPhase()
    setContext(context)
    setPhase(phase)
    result = run(...args)
    setContext(previousContext)
    setPhase(previousPhase)
    return result
}

function bindRef(ctx: Context, key: PropertyKey, ref: any) {
    let previousValue = ref.value

    watch(
        ref,
        (value) => {
            previousValue = value
            Reflect.set(ctx, key, value)
            markDirty(ctx)
        },
        { flush: "sync" },
    )

    function checkRef() {
        const viewValue = Reflect.get(ctx, key)
        if (viewValue !== previousValue) {
            previousValue = viewValue
            ref.value = viewValue
        }
    }
    onCheck(checkRef)
    Reflect.set(ctx, key, previousValue)
}

export function isRootContext(context: any) {
    return previousInjector || injectorDepth || context === rootContext
}

function assign(context: Context, partial: object | void): void {
    if (!partial) {
        return
    }
    if (isProxy(partial)) {
        return assign(context, toRefs(partial))
    }
    for (const [key, ref] of Object.entries(partial)) {
        if (ref instanceof Ref) {
            bindRef(context, key, ref)
        } else {
            Reflect.set(context, key, ref)
        }
    }
}

function setup<T>(factory: () => Partial<T> | void, unwrap = true) {
    assign(getContext(), factory())
}

export function defineDirective<T extends object>(
    factory: () => T,
): Type<LifecycleHooks & UnwrapRefs<T>>
export function defineDirective(factory?: () => void): Type<LifecycleHooks>
export function defineDirective<T>(
    factory: () => T | void = () => {},
): new () => unknown {
    return class Directive
        implements
            OnChanges,
            OnInit,
            DoCheck,
            AfterContentInit,
            AfterContentChecked,
            AfterViewInit,
            AfterViewChecked,
            OnDestroy {
        constructor() {
            runInContext(this, Lifecycle.OnConnect, setup, factory)
        }
        ngOnChanges(changes: SimpleChanges) {
            runInContext(this, Lifecycle.OnChanges, runHook, changes)
        }
        ngOnInit() {
            runInContext(this, Lifecycle.OnInit, runHook)
        }
        ngDoCheck() {
            runInContext(this, Lifecycle.OnCheck, runHook)
        }
        ngAfterContentInit() {
            runInContext(this, Lifecycle.OnContentInit, runHook)
        }
        ngAfterContentChecked() {
            runInContext(this, Lifecycle.OnContentChecked, runHook)
        }
        ngAfterViewInit() {
            runInContext(this, Lifecycle.OnViewInit, runHook)
        }
        ngAfterViewChecked() {
            runInContext(this, Lifecycle.OnViewChecked, runHook)
        }
        ngOnDestroy() {
            runInContext(this, Lifecycle.OnDestroy, runHook)
        }
    }
}

export function defineInjectable<T extends object>(
    factory: () => T,
): Type<{ ngOnDestroy(): void } & T>
export function defineInjectable(
    factory?: () => void,
): Type<{ ngOnDestroy(): void }>
export function defineInjectable<T>(factory: () => T | void = () => {}) {
    return class Injectable implements OnDestroy {
        constructor() {
            runInContext(this, Lifecycle.OnConnect, () =>
                Object.assign(this, factory()),
            )
        }
        ngOnDestroy() {
            runInContext(this, Lifecycle.OnDestroy, runHook)
        }
    }
}

export function defineComponent<T extends object>(
    factory: () => T,
): Type<LifecycleHooks & UnwrapRefs<T>>
export function defineComponent(factory?: () => void): Type<LifecycleHooks>
export function defineComponent<T>(
    factory: () => T | void = () => {},
): new () => unknown {
    return defineDirective(factory)
}
