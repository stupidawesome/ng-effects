import Mock = jest.Mock
import fn = jest.fn
import {
    computed,
    customRef,
    isRef,
    ref,
    Ref,
    shallowRef,
    toRef,
    toRefs,
    unref,
} from "../ref"
import { reactive } from "../reactive"
import { createEffect } from "../effect"
import { isProxy } from "../utils"

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

describe("computed test", () => {
    it("should hold a value", () => {
        const a = ref(1)
        expect(a.value).toBe(1)
        a.value = 2
        expect(a.value).toBe(2)
    })

    it("should be reactive", () => {
        const a = ref(1)
        let dummy
        let calls = 0
        createEffect(() => {
            calls++
            dummy = a.value
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
        // same value should not trigger
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
    })

    it("should make nested properties reactive", () => {
        const a = ref({
            count: 1,
        })
        let dummy
        createEffect(() => {
            dummy = a.value.count
        })
        expect(dummy).toBe(1)
        a.value.count = 2
        expect(dummy).toBe(2)
    })

    it("should work without initial value", () => {
        const a = ref()
        let dummy
        createEffect(() => {
            dummy = a.value
        })
        expect(dummy).toBe(undefined)
        a.value = 2
        expect(dummy).toBe(2)
    })

    it("should work like a normal property when nested in a reactive object", () => {
        const a = ref(1)
        const obj = reactive({
            a,
            b: {
                c: a,
            },
        })

        let dummy1: number
        let dummy2: number

        createEffect(() => {
            dummy1 = obj.a
            dummy2 = obj.b.c
        })

        const assertDummiesEqualTo = (val: number) =>
            [dummy1, dummy2].forEach((dummy) => expect(dummy).toBe(val))

        assertDummiesEqualTo(1)
        a.value++
        assertDummiesEqualTo(2)
        obj.a++
        assertDummiesEqualTo(3)
        obj.b.c++
        assertDummiesEqualTo(4)
    })

    it("should unwrap nested ref in types", () => {
        const a = ref(0)
        const b = ref(a)

        expect(typeof (b.value + 1)).toBe("number")
    })

    it("should unwrap nested values in types", () => {
        const a = {
            b: ref(0),
        } as any

        const c = ref(a)

        expect(typeof (c.value.b + 1)).toBe("number")
    })

    it("should NOT unwrap ref types nested inside arrays", () => {
        const arr = ref([1, ref(1)]).value
        ;(arr[0] as number)++
        ;(arr[1] as Ref<number>).value++

        const arr2 = ref([1, new Map<string, any>(), ref("1")]).value
        const value = arr2[0]
        if (isRef(value)) {
            value + "foo"
        } else if (typeof value === "number") {
            value + 1
        } else {
            // should narrow down to Map type
            // and not contain any Ref type
            value.has("foo")
        }
    })

    it("should keep tuple types", () => {
        const tuple: [
            number,
            string,
            { a: number },
            () => number,
            Ref<number>,
        ] = [0, "1", { a: 1 }, () => 0, ref(0)]
        const tupleRef = ref(tuple)

        tupleRef.value[0]++
        expect(tupleRef.value[0]).toBe(1)
        tupleRef.value[1] += "1"
        expect(tupleRef.value[1]).toBe("11")
        tupleRef.value[2].a++
        expect(tupleRef.value[2].a).toBe(2)
        expect(tupleRef.value[3]()).toBe(0)
        tupleRef.value[4].value++
        expect(tupleRef.value[4].value).toBe(1)
    })

    it("should keep symbols", () => {
        const customSymbol = Symbol()
        const obj = {
            [Symbol.asyncIterator]: { a: 1 },
            [Symbol.unscopables]: { b: "1" },
            [customSymbol]: { c: [1, 2, 3] },
        }

        const objRef = ref(obj)

        expect(objRef.value[Symbol.asyncIterator]).toBe(
            obj[Symbol.asyncIterator],
        )
        expect(objRef.value[Symbol.unscopables]).toBe(obj[Symbol.unscopables])
        expect(objRef.value[customSymbol]).toStrictEqual(obj[customSymbol])
    })

    test("unref", () => {
        expect(unref(1)).toBe(1)
        expect(unref(ref(1))).toBe(1)
    })

    test("shallowRef", () => {
        const sref = shallowRef({ a: 1 })
        expect(isProxy(sref.value)).toBe(false)

        let dummy
        createEffect(() => {
            dummy = sref.value.a
        })
        expect(dummy).toBe(1)

        sref.value = { a: 2 }
        expect(isProxy(sref.value)).toBe(false)
        expect(dummy).toBe(2)
    })

    test("shallowRef force trigger", () => {
        const sref = shallowRef({ a: 1 })
        let dummy
        createEffect(() => {
            dummy = sref.value.a
        })
        expect(dummy).toBe(1)

        sref.value.a = 2
        expect(dummy).toBe(1) // should not trigger yet

        // force trigger
        sref.value = { ...sref.value }
        expect(dummy).toBe(2)
    })

    test("isRef", () => {
        expect(isRef(ref(1))).toBe(true)
        expect(isRef(computed(() => 1))).toBe(true)

        expect(isRef(0)).toBe(false)
        expect(isRef(1)).toBe(false)
        // an object that looks like a ref isn't necessarily a ref
        expect(isRef({ value: 0 })).toBe(false)
    })

    test("toRef", () => {
        const a = reactive({
            x: 1,
        })
        const x = toRef(a, "x")
        expect(isRef(x)).toBe(true)
        expect(x.value).toBe(1)

        // source -> proxy
        a.x = 2
        expect(x.value).toBe(2)

        // proxy -> source
        x.value = 3
        expect(a.x).toBe(3)

        // reactivity
        let dummyX
        createEffect(() => {
            dummyX = x.value
        })
        expect(dummyX).toBe(x.value)

        // mutating source should trigger createEffect using the proxy refs
        a.x = 4
        expect(dummyX).toBe(4)
    })

    test("toRefs", () => {
        const a = reactive({
            x: 1,
            y: 2,
        })

        const { x, y } = toRefs(a)

        expect(isRef(x)).toBe(true)
        expect(isRef(y)).toBe(true)
        expect(x.value).toBe(1)
        expect(y.value).toBe(2)

        // source -> proxy
        a.x = 2
        a.y = 3
        expect(x.value).toBe(2)
        expect(y.value).toBe(3)

        // proxy -> source
        x.value = 3
        y.value = 4
        expect(a.x).toBe(3)
        expect(a.y).toBe(4)

        // reactivity
        let dummyX, dummyY
        createEffect(() => {
            dummyX = x.value
            dummyY = y.value
        })
        expect(dummyX).toBe(x.value)
        expect(dummyY).toBe(y.value)

        // mutating source should trigger createEffect using the proxy refs
        a.x = 4
        a.y = 5
        expect(dummyX).toBe(4)
        expect(dummyY).toBe(5)
    })

    test("customRef", () => {
        let value = 1
        let _trigger: () => void

        const custom = customRef((track, trigger) => ({
            get() {
                track()
                return value
            },
            set(newValue: number) {
                value = newValue
                _trigger = trigger
            },
        }))

        expect(isRef(custom)).toBe(true)

        let dummy
        createEffect(() => {
            dummy = custom.value
        })
        expect(dummy).toBe(1)

        custom.value = 2
        // should not trigger yet
        expect(dummy).toBe(1)

        _trigger!()
        expect(dummy).toBe(2)
    })
})
