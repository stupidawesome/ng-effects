import { defineComponent, Ref, ref } from "../ngfx"
import { Observable } from "rxjs"
import { fromRef } from "../rx"
import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { createFxComponent } from "./utils"
import fn = jest.fn
import Mock = jest.Mock

describe("fromRef", () => {
    it("should create an observable", () => {
        let subject, expected

        subject = ref(0)
        expected = Observable

        expect(fromRef(subject)).toBeInstanceOf(expected)
    })

    it("should not emit initial value on subscribe", fakeAsync(() => {
        let subject, spy

        spy = fn()
        subject = ref(0)

        fromRef(subject).subscribe(spy)

        expect(spy).not.toHaveBeenCalled()
    }))

    it("should emit value on subscribe", fakeAsync(() => {
        let subject, spy

        spy = fn()
        subject = ref(0)

        fromRef(subject, { immediate: true }).subscribe(spy)

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(0)
    }))

    it("should emit synchronously when the ref changes outside a view context", fakeAsync(() => {
        let subject, spy

        spy = fn()
        subject = ref(0)

        fromRef(subject).subscribe(spy)

        expect(spy).not.toHaveBeenCalled()

        subject.value = 1
        tick()
        expect(spy).toHaveBeenLastCalledWith(1)
        expect(spy).toHaveBeenCalledTimes(1)

        subject.value = 2
        expect(spy).toHaveBeenLastCalledWith(2)
        expect(spy).toHaveBeenCalledTimes(2)
    }))

    it("should emit asynchronously when the ref changes within a view context", fakeAsync(() => {
        let subject: Ref<number>, spy: Mock, component, fixture

        spy = fn()
        subject = ref(0)

        component = createFxComponent(
            defineComponent(() => {
                fromRef(subject).subscribe(spy)
            }),
        )

        fixture = TestBed.createComponent(component)

        subject.value = 1
        expect(spy).toHaveBeenCalledTimes(0)
        fixture.detectChanges()
        expect(spy).toHaveBeenLastCalledWith(1)
        subject.value = 2
        expect(spy).toHaveBeenCalledTimes(1)
        fixture.detectChanges()
        expect(spy).toHaveBeenLastCalledWith(2)
    }))

    it("should emit synchronously when the ref changes in a view context with sync option", fakeAsync(() => {
        let subject: Ref<number>, spy: Mock, component

        spy = fn()
        subject = ref(0)

        component = createFxComponent(
            defineComponent(() => {
                fromRef(subject, { flush: "sync" }).subscribe(spy)
            }),
        )

        TestBed.createComponent(component)

        subject.value = 1
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenLastCalledWith(1)
        subject.value = 2
        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenLastCalledWith(2)
    }))
})
