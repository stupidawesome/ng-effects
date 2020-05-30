import { computed, reactive, Ref, ref } from "../ngfx"
import Mock = jest.Mock
import fn = jest.fn

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
        expect(spy3).toHaveBeenCalledTimes(3)
    })

    it("should create a writable ref", () => {
        let subject, expected: number

        expected = 3
        subject = computed({
            get: () => expected,
            set: (val) => (expected = val - 1),
        })

        expect(subject.value).toBe(expected)

        subject.value = 10

        expect(expected).toBe(10 - 1)
        expect(subject.value).toBe(expected)
    })
})
