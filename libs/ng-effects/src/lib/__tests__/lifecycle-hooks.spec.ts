import {
    createEffect,
    defineComponent,
    LifecycleHooks,
    onChanges,
    onCheck,
    onContentChecked,
    onContentInit,
    onDestroy,
    onInit,
    onViewChecked,
    onViewInit,
} from "../ngfx"
import fn = jest.fn
import Mock = jest.Mock

const hooks = new Map([
    [(component: LifecycleHooks) => component.ngOnInit(), onInit],
    [(component: LifecycleHooks) => component.ngOnChanges({}), onChanges],
    [(component: LifecycleHooks) => component.ngDoCheck(), onCheck],
    [
        (component: LifecycleHooks) => component.ngAfterContentInit(),
        onContentInit,
    ],
    [
        (component: LifecycleHooks) => component.ngAfterContentChecked(),
        onContentChecked,
    ],
    [(component: LifecycleHooks) => component.ngAfterViewInit(), onViewInit],
    [
        (component: LifecycleHooks) => component.ngAfterViewChecked(),
        onViewChecked,
    ],
    [(component: LifecycleHooks) => component.ngOnDestroy(), onDestroy],
])

describe("lifecycle hooks", () => {
    for (const [action, hook] of hooks) {
        it(`should execute the ${hook.name} hook`, () => {
            let component, subject: Mock, expected

            subject = fn()
            expected = 3

            component = defineComponent(() => {
                hook(subject.bind(null))
                hook(subject.bind(null))
                hook(subject.bind(null))
            })

            action(new component())

            expect(subject).toHaveBeenCalledTimes(expected)
        })
    }
    for (const [action, hook] of hooks) {
        it(`should invalidate and restart effects when the ${hook.name} hook is called multiple times`, () => {
            let component, effect: Mock, invalidate: Mock, expected

            effect = fn()
            invalidate = fn()
            expected = 9

            component = new (defineComponent(() => {
                for (let i = 3; i > 0; i--) {
                    hook(() =>
                        createEffect(
                            (onInvalidate) => {
                                effect()
                                onInvalidate(invalidate)
                            },
                            { flush: "sync" },
                        ),
                    )
                }
            }))()

            action(component) // create effect
            action(component) // invalidate and restart
            action(component) // invalidate and restart

            expect(effect).toHaveBeenCalledTimes(expected)
            expect(invalidate).toHaveBeenCalledTimes(expected - 3)
        })
    }
})
