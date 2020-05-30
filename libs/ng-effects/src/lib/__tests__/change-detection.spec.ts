import { createEffect, defineComponent, reactive } from "../ngfx"
import { createFxComponent } from "./utils"
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from "@angular/core/testing"

describe("change detection", () => {
    it("should mark the view dirty when effects are invalidated", fakeAsync(() => {
        let state: { count: number },
            component,
            subject: ComponentFixture<any>,
            expected: number

        expected = 10
        state = reactive({
            count: 0,
        })
        component = createFxComponent(
            defineComponent(() => {
                createEffect(() => {
                    void state.count
                })
                return state
            }),
        )

        TestBed.overrideComponent(component, {
            set: {
                template: `{{count}}`,
            },
        })

        subject = TestBed.createComponent(component)

        state.count = expected
        tick(16) // wait 1 frame for markDirty to trigger change detection run

        expect(subject.debugElement.nativeNode.textContent).toBe(
            expected.toString(),
        )
    }))

    it("should push values to refs when the view is changed", fakeAsync(() => {
        let state: { count: number },
            component,
            subject: ComponentFixture<any>,
            expected: number

        expected = 10
        state = reactive({
            count: 0,
        })
        component = createFxComponent(
            defineComponent(() => {
                return state
            }),
        )
        subject = TestBed.createComponent(component)

        subject.componentInstance.count = expected
        subject.detectChanges()

        expect(state.count).toBe(expected)
    }))
})
