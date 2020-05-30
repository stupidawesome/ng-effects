import { Ref, ref, watch } from "../ngfx"
import Mock = jest.Mock
import fn = jest.fn

describe("watch", () => {
    it("should watch a single ref", () => {
        let subject: Ref<number>, initial: number
        initial = 0
        subject = ref(initial)

        watch(
            subject,
            (value, prev) => {
                expect(prev).toBe(initial)
                expect(subject.value).toBe(value)
            },
            { flush: "sync" },
        )

        subject.value = 10

        expect.assertions(2)
    })

    it("should watch multiple refs", () => {
        let subject1: Ref<number>,
            subject2: Ref<string>,
            initial: [number, string],
            spy: Mock
        initial = [0, ""]
        subject1 = ref(initial[0])
        subject2 = ref(initial[1])
        spy = fn()

        watch(
            [subject1, subject2],
            (values, prev) => {
                spy(prev)
                expect(subject1.value).toBe(values[0])
                expect(subject2.value).toBe(values[1])
            },
            { flush: "sync" },
        )

        subject1.value = 10
        subject2.value = "BOGUS"

        expect(spy.mock.calls).toEqual([[[0, ""]], [[10, ""]]])
        expect.assertions(5)
    })
})
