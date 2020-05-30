import { createEffect, customRef, Ref, ref, shallowRef } from "../ngfx"
import fn = jest.fn
import Mock = jest.Mock

describe("ref", () => {
    it("should create a ref", () => {
        let subject, expected

        expected = Ref
        subject = ref()

        expect(subject).toBeInstanceOf(expected)
    })

    it("should get the value", () => {
        let subject, expected

        expected = 0
        subject = ref(expected)

        expect(subject.value).toBe(expected)
    })

    it("should set the value", () => {
        let subject, expected

        expected = 0
        subject = ref()

        subject.value = expected

        expect(subject.value).toBe(expected)
    })

    it("should be reactive", () => {
        let subject: Ref<any>, expected, spy: Mock

        spy = fn()
        subject = ref({ count: 0 })
        expected = 10

        createEffect(
            () => {
                spy(subject.value.count)
            },
            { flush: "sync" },
        )

        subject.value.count = expected

        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenLastCalledWith(expected)
    })

    it("should be shallow reactive", () => {
        let subject: Ref<any>, expected, spy: Mock

        spy = fn()
        expected = 0
        subject = shallowRef({ count: expected })

        createEffect(
            () => {
                spy(subject.value.count)
            },
            { flush: "sync" },
        )

        subject.value.count = 10

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenLastCalledWith(expected)
    })

    it("should control when values are tracked", () => {
        let subject: Ref<any>, spy: Mock

        spy = fn()
        subject = customRef((track, trigger) => {
            return {
                get() {
                    track()
                },
                set() {
                    trigger()
                },
            }
        })

        createEffect(
            () => {
                spy(subject.value)
            },
            { flush: "sync" },
        )

        subject.value = undefined

        expect(spy).toHaveBeenCalledTimes(2)
    })

    it("should unwrap refs before creating a new one", () => {
        let subject, expected

        expected = { count: 0 }
        subject = ref(expected)
        subject = ref(subject)

        expect(subject.value).toEqual(expected)
    })
})
