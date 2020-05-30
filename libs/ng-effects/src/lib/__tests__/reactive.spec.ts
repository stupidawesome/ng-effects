import { isProxy, reactive, ref, shallowReactive, toRaw } from "../ngfx"

describe("reactive", () => {
    it("should create a deep proxy", () => {
        let subject, expected

        subject = reactive({ count: { value: 0 } })
        expected = true

        expect(isProxy(subject)).toBe(expected)
        expect(isProxy(subject.count)).toBe(expected)
    })

    it("should set a plain value", () => {
        let subject, expected

        subject = reactive({ value: {} })
        expected = { count: 2 }

        subject.value = expected

        expect(subject.value).not.toBe(expected)
        expect(toRaw(subject).value).toBe(expected)
        expect(subject.value).toBe(subject.value)
        expect(subject.value).toEqual(expected)
    })

    it("should unwrap and create a two-way binding with refs", () => {
        let value, subject, expected

        value = ref(0)
        subject = reactive({ value })
        expected = 2

        subject.value = expected

        expect(subject.value).toBe(expected)
        expect(value.value).toBe(expected)

        expected = 10

        value.value = expected

        expect(subject.value).toBe(expected)
        expect(value.value).toBe(expected)
    })

    it("should create a shallow proxy", () => {
        let subject, expected

        subject = shallowReactive({ count: { value: 0 } })
        expected = true

        expect(isProxy(subject)).toBe(expected)
        expect(isProxy(subject.count)).not.toBe(expected)
    })

    it("should return the raw value", () => {
        let subject, expected

        expected = { count: { value: 0 } }
        subject = reactive(expected)

        expect(toRaw(subject)).toBe(expected)
        expect(toRaw(subject.count)).toBe(expected.count)
        expect(toRaw(expected)).toBe(expected)
    })
})
