import {
    AbstractType,
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    ChangeDetectorRef,
    Directive,
    DoCheck,
    inject as rootInject,
    Injectable,
    InjectFlags,
    InjectionToken,
    Injector,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    Type,
    ɵNG_COMP_DEF,
    ɵNG_DIR_DEF,
    ɵsetCurrentInjector as setCurrentInjector,
    ɵɵdirectiveInject as directiveInject,
    ɵɵNgOnChangesFeature,
} from "@angular/core"
import { Context, Lifecycle, LifecycleHooks } from "./interfaces"
import { isProxy } from "./utils"
import { onCheck, onContentChecked, onViewChecked, runHook } from "./lifecycle"
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

const waiter = Promise.resolve()

function bindRef(ctx: Context, key: PropertyKey, ref: any) {
    let previousValue = ref.value
    const cdr = changeDectorRefs.get(ctx)

    watch(
        ref,
        async (value) => {
            const phase = getPhase()
            previousValue = value
            Reflect.set(ctx, key, value)
            if (
                phase === Lifecycle.OnContentChecked ||
                phase === Lifecycle.OnContentInit
            ) {
                await waiter
            }
            if (phase !== Lifecycle.OnDestroy) {
                cdr.markForCheck()
            }
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
    onContentChecked(checkRef)
    onViewChecked(checkRef)

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

function setup<T>(factory: () => Partial<T> | void) {
    changeDectorRefs.set(
        getContext(),
        inject(ChangeDetectorRef, InjectFlags.Optional),
    )
    assign(getContext(), factory())
}

export const changeDectorRefs = new WeakMap()

function fixNgOnChanges(instance: any) {
    const type = Object.getPrototypeOf(instance).constructor
    const def = type[ɵNG_COMP_DEF] || type[ɵNG_DIR_DEF]

    if (def === undefined) {
        throw new Error("Ivy is not enabled.")
    }

    if (def.onChanges === null && instance.ngOnChanges) {
        ;(<any>ɵɵNgOnChangesFeature)()(def)
    }
}

export function defineDirective<T extends object>(
    factory: () => T,
): Type<LifecycleHooks & UnwrapRefs<T>>
export function defineDirective(factory?: () => void): Type<LifecycleHooks>
export function defineDirective<T>(
    factory: () => T | void = () => {},
): new () => unknown {
    @Directive()
    class BaseDirective
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
            fixNgOnChanges(this)
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
    return BaseDirective
}

export function defineInjectable<T extends object>(
    factory: () => T,
): Type<{ ngOnDestroy(): void } & T>
export function defineInjectable(
    factory?: () => void,
): Type<{ ngOnDestroy(): void }>
export function defineInjectable<T>(factory: () => T | void = () => {}) {
    @Injectable()
    class BaseInjectable implements OnDestroy {
        constructor() {
            runInContext(this, Lifecycle.OnConnect, () =>
                Object.assign(this, factory()),
            )
        }
        ngOnDestroy() {
            runInContext(this, Lifecycle.OnDestroy, runHook)
        }
    }
    return BaseInjectable
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
