import Mock = jest.Mock
import fn = jest.fn
import { computed, ref, Ref } from "../ref"
import { reactive } from "../reactive"
import { createEffect } from "../effect"

describe("computed", () => {
    it("should create a computed value", () => {
        let subject, expected

        subject = computed(() => 1 + 2)
        expected = 3

        expect(subject.value).toBe(expected)
    })

    it("should be readonly", () => {
        let subject: Ref<number>

        subject = computed(() => 1 + 2)

        expect(() => {
            // @ts-ignore
            subject.value = 10
        }).toThrow()
    })

    it("should track reactive dependencies", () => {
        let subject,
            expected,
            ref1: Ref<number>,
            ref2: { count: { value: number } }

        ref1 = ref(2)
        ref2 = reactive({ count: { value: 10 } })
        subject = computed(() => ref1.value * ref2.count.value)
        expected = 20

        expect(subject.value).toBe(expected)

        ref1.value = 10
        ref2.count.value = 5

        expected = 50

        expect(subject.value).toBe(expected)
    })

    it("should only recalculate values that have changed", () => {
        let subject1: Ref<any>,
            subject2: Ref<any>,
            subject3: Ref<any>,
            value1: Ref<number>,
            value2: any,
            value3: any,
            spy1: Mock,
            spy2: Mock,
            spy3: Mock

        spy1 = fn()
        spy2 = fn()
        spy3 = fn()
        value1 = ref(5)
        value2 = reactive({ count: { value: 10 } })
        value3 = reactive({ text: "bogus" })
        subject1 = computed(() => {
            spy1()
            return value1.value * 10
        })
        subject2 = computed(() => {
            spy2()
            return subject1.value + value2.count.value
        })
        subject3 = computed(() => {
            spy3()
            return value3.text + (subject1.value + subject2.value)
        })

        // reading value should not compute property
        void subject1.value
        void subject2.value
        void subject3.value

        expect(subject1.value).toBe(50)
        expect(subject2.value).toBe(60)
        expect(subject3.value).toBe("bogus110")
        expect(spy1).toHaveBeenCalledTimes(1)
        expect(spy2).toHaveBeenCalledTimes(1)
        expect(spy3).toHaveBeenCalledTimes(1)

        value1.value = 10

        expect(subject1.value).toBe(100)
        expect(subject2.value).toBe(110)
        expect(subject3.value).toBe("bogus210")
        expect(spy1).toHaveBeenCalledTimes(2)
        expect(spy2).toHaveBeenCalledTimes(2)
        expect(spy3).toHaveBeenCalledTimes(2)
    })

    it("should create a writable ref", () => {
        let subject, expected: Ref<number>

        expected = ref(3)
        subject = computed({
            get: () => expected.value,
            set: (val) => (expected.value = val - 1),
        })

        expect(subject.value).toBe(expected.value)

        subject.value = 10

        expect(expected.value).toBe(10 - 1)
        expect(subject.value).toBe(expected.value)
    })
})

describe("reactivity/computed", () => {
    // mockWarn()

    it("should return updated value", () => {
        const value = reactive<{ foo?: number }>({})
        const cValue = computed(() => value.foo)
        expect(cValue.value).toBe(undefined)
        value.foo = 1
        expect(cValue.value).toBe(1)
    })

    it("should compute lazily", () => {
        const value = reactive<{ foo?: number }>({})
        const getter = jest.fn(() => value.foo)
        const cValue = computed(getter)

        // lazy
        expect(getter).not.toHaveBeenCalled()

        expect(cValue.value).toBe(undefined)
        expect(getter).toHaveBeenCalledTimes(1)

        // should not compute again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(1)

        // should not compute until needed
        value.foo = 1
        expect(getter).toHaveBeenCalledTimes(1)

        // now it should compute
        expect(cValue.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(2)

        // should not compute again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(2)
    })

    it("should trigger createEffect", () => {
        const value = reactive<{ foo?: number }>({})
        const cValue = computed(() => value.foo)
        let dummy
        createEffect(() => {
            dummy = cValue.value
        })
        expect(dummy).toBe(undefined)
        value.foo = 1
        expect(dummy).toBe(1)
    })

    it("should work when chained", () => {
        const value = reactive({ foo: 0 })
        const c1 = computed(() => value.foo)
        const c2 = computed(() => c1.value + 1)
        expect(c2.value).toBe(1)
        expect(c1.value).toBe(0)
        value.foo++
        expect(c2.value).toBe(2)
        expect(c1.value).toBe(1)
    })

    it("should trigger createEffect when chained", () => {
        const value = reactive({ foo: 0 })
        const getter1 = jest.fn(() => value.foo)
        const getter2 = jest.fn(() => {
            return c1.value + 1
        })
        const c1 = computed(getter1)
        const c2 = computed(getter2)

        let dummy
        createEffect(() => {
            dummy = c2.value
        })
        expect(dummy).toBe(1)
        expect(getter1).toHaveBeenCalledTimes(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        value.foo++
        expect(dummy).toBe(2)
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2)
        expect(getter2).toHaveBeenCalledTimes(2)
    })

    it("should trigger createEffect when chained (mixed invocations)", () => {
        const value = reactive({ foo: 0 })
        const getter1 = jest.fn(() => value.foo)
        const getter2 = jest.fn(() => {
            return c1.value + 1
        })
        const c1 = computed(getter1)
        const c2 = computed(getter2)

        let dummy
        createEffect(() => {
            dummy = c1.value + c2.value
        })
        expect(dummy).toBe(1)

        expect(getter1).toHaveBeenCalledTimes(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        value.foo++
        expect(dummy).toBe(3)
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2)
        expect(getter2).toHaveBeenCalledTimes(2)
    })

    // it('should no longer update when stopped', () => {
    //     const value = reactive<{ foo?: number }>({})
    //     const cValue = computed(() => value.foo)
    //     let dummy
    //     createEffect(() => {
    //         dummy = cValue.value
    //     })
    //     expect(dummy).toBe(undefined)
    //     value.foo = 1
    //     expect(dummy).toBe(1)
    //     stop(cValue.effect)
    //     value.foo = 2
    //     expect(dummy).toBe(1)
    // })

    it("should support setter", () => {
        const n = ref(1)
        const plusOne = computed({
            get: () => n.value + 1,
            set: (val) => {
                n.value = val - 1
            },
        })

        expect(plusOne.value).toBe(2)
        n.value++
        expect(plusOne.value).toBe(3)

        plusOne.value = 0
        expect(n.value).toBe(-1)
    })

    it("should trigger createEffect w/ setter", () => {
        const n = ref(1)
        const plusOne = computed({
            get: () => n.value + 1,
            set: (val) => {
                n.value = val - 1
            },
        })

        let dummy
        createEffect(() => {
            dummy = n.value
        })
        expect(dummy).toBe(1)

        plusOne.value = 0
        expect(dummy).toBe(-1)
    })

    // it('should warn if trying to set a readonly computed', () => {
    //     const n = ref(1)
    //     const plusOne = computed(() => n.value + 1)
    //     ;(plusOne as WritableComputedRef<number>).value++ // Type cast to prevent TS from preventing the error
    //
    //     expect(
    //         'Write operation failed: computed value is readonly'
    //     ).toHaveBeenWarnedLast()
    // })
})
