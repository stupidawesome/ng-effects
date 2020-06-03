import { reactive, shallowReactive } from "../reactive"
import { isProxy, isReactive, markRaw, toRaw } from "../utils"
import { computed, isRef, ref } from "../ref"
import { createEffect } from "../effect"

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

    test("Object", () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
        // get
        expect(observed.foo).toBe(1)
        // has
        expect("foo" in observed).toBe(true)
        // ownKeys
        expect(Object.keys(observed)).toEqual(["foo"])
    })

    test("proto", () => {
        const obj = {}
        const reactiveObj = reactive(obj)
        expect(isReactive(reactiveObj)).toBe(true)
        // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
        // @ts-ignore
        const prototype = reactiveObj["__proto__"]
        const otherObj = { data: ["a"] }
        expect(isReactive(otherObj)).toBe(false)
        const reactiveOther = reactive(otherObj)
        expect(isReactive(reactiveOther)).toBe(true)
        expect(reactiveOther.data[0]).toBe("a")
    })

    test("nested reactives", () => {
        const original = {
            nested: {
                foo: 1,
            },
            array: [{ bar: 2 }],
        }
        const observed = reactive(original)
        expect(isReactive(observed.nested)).toBe(true)
        expect(isReactive(observed.array)).toBe(true)
        expect(isReactive(observed.array[0])).toBe(true)
    })

    test("observed value should proxy mutations to original (Object)", () => {
        const original: any = { foo: 1 }
        const observed = reactive(original)
        // set
        observed.bar = 1
        expect(observed.bar).toBe(1)
        expect(original.bar).toBe(1)
        // delete
        delete observed.foo
        expect("foo" in observed).toBe(false)
        expect("foo" in original).toBe(false)
    })

    test("setting a property with an unobserved value should wrap with reactive", () => {
        const observed = reactive<{ foo?: object }>({})
        const raw = {}
        observed.foo = raw
        expect(observed.foo).not.toBe(raw)
        expect(isReactive(observed.foo)).toBe(true)
    })

    test("observing already observed value should return same Proxy", () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(observed)
        expect(observed2).toBe(observed)
    })

    test("observing the same value multiple times should return same Proxy", () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(original)
        expect(observed2).toBe(observed)
    })

    test("should not pollute original object with Proxies", () => {
        const original: any = { foo: 1 }
        const original2 = { bar: 2 }
        const observed = reactive(original)
        const observed2 = reactive(original2)
        observed.bar = observed2
        expect(observed.bar).toBe(observed2)
        expect(original.bar).toBe(original2)
    })

    test("unwrap", () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(toRaw(observed)).toBe(original)
        expect(toRaw(original)).toBe(original)
    })

    test("should not unwrap Ref<T>", () => {
        const observedNumberRef = reactive(ref(1))
        const observedObjectRef = reactive(ref({ foo: 1 }))

        expect(isRef(observedNumberRef)).toBe(true)
        expect(isRef(observedObjectRef)).toBe(true)
    })

    test("should unwrap computed refs", () => {
        // readonly
        const a = computed(() => 1)
        // writable
        const b = computed({
            get: () => 1,
            set: () => {},
        })
        const obj = reactive({ a, b })
        // check type
        obj.a + 1
        obj.b + 1
        expect(typeof obj.a).toBe(`number`)
        expect(typeof obj.b).toBe(`number`)
    })

    test("non-observable values", () => {
        // const assertValue = (value: any) => {
        //     reactive(value)
        //     expect(
        //         `value cannot be made reactive: ${String(value)}`
        //     ).toHaveBeenWarnedLast()
        // }
        //
        // // number
        // assertValue(1)
        // // string
        // assertValue('foo')
        // // boolean
        // assertValue(false)
        // // null
        // assertValue(null)
        // // undefined
        // assertValue(undefined)
        // // symbol
        // const s = Symbol()
        // assertValue(s)

        // built-ins should work and return same value
        const p = Promise.resolve()
        expect(reactive(p)).toBe(p)
        const r = new RegExp("")
        expect(reactive(r)).toBe(r)
        const d = new Date()
        expect(reactive(d)).toBe(d)
    })

    test("markRaw", () => {
        const obj = reactive({
            foo: { a: 1 },
            bar: markRaw({ b: 2 }),
        })
        expect(isReactive(obj.foo)).toBe(true)
        expect(isReactive(obj.bar)).toBe(false)
    })

    test("should not observe frozen objects", () => {
        const obj = reactive({
            foo: Object.freeze({ a: 1 }),
        })
        expect(isReactive(obj.foo)).toBe(false)
    })

    describe("shallowReactive", () => {
        test("should not make non-reactive properties reactive", () => {
            const props = shallowReactive({ n: { foo: 1 } })
            expect(isReactive(props.n)).toBe(false)
        })

        test("should keep reactive properties reactive", () => {
            const props: any = shallowReactive({ n: reactive({ foo: 1 }) })
            props.n = reactive({ foo: 2 })
            expect(isReactive(props.n)).toBe(true)
        })

        test("should not observe when iterating", () => {
            const shallowSet = shallowReactive(new Set())
            const a = {}
            shallowSet.add(a)

            const spreadA = [...shallowSet][0]
            expect(isReactive(spreadA)).toBe(false)
        })

        test("should not get reactive entry", () => {
            const shallowMap = shallowReactive(new Map())
            const a = {}
            const key = "a"

            shallowMap.set(key, a)

            expect(isReactive(shallowMap.get(key))).toBe(false)
        })

        test("should not get reactive on foreach", () => {
            const shallowSet = shallowReactive(new Set())
            const a = {}
            shallowSet.add(a)

            shallowSet.forEach((x) => expect(isReactive(x)).toBe(false))
        })
    })
})

describe("reactive array", () => {
    test("should make Array reactive", () => {
        const original = [{ foo: 1 }]
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(isProxy(observed)).toBe(true)
        expect(isProxy(original)).toBe(false)
        expect(isProxy(observed[0])).toBe(true)
        // get
        expect(observed[0].foo).toBe(1)
        // has
        expect(0 in observed).toBe(true)
        // ownKeys
        expect(Object.keys(observed)).toEqual(["0"])
    })

    test("cloned reactive Array should point to observed values", () => {
        const original = [{ foo: 1 }]
        const observed = reactive(original)
        const clone = observed.slice()
        expect(isProxy(clone[0])).toBe(true)
        expect(clone[0]).not.toBe(original[0])
        expect(clone[0]).toBe(observed[0])
    })

    test("observed value should proxy mutations to original (Array)", () => {
        const original: any[] = [{ foo: 1 }, { bar: 2 }]
        const observed = reactive(original)
        // set
        const value = { baz: 3 }
        const reactiveValue = reactive(value)
        observed[0] = value
        expect(observed[0]).toBe(reactiveValue)
        expect(original[0]).toBe(value)
        // delete
        delete observed[0]
        expect(observed[0]).toBeUndefined()
        expect(original[0]).toBeUndefined()
        // mutating methods
        observed.push(value)
        expect(observed[2]).toBe(reactiveValue)
        expect(original[2]).toBe(value)
    })

    test("Array identity methods should work with raw values", () => {
        const raw = {}
        const arr = reactive([{}, {}])
        arr.push(raw)
        expect(arr.indexOf(raw)).toBe(2)
        expect(arr.indexOf(raw, 3)).toBe(-1)
        expect(arr.includes(raw)).toBe(true)
        expect(arr.includes(raw, 3)).toBe(false)
        expect(arr.lastIndexOf(raw)).toBe(2)
        expect(arr.lastIndexOf(raw, 1)).toBe(-1)

        // should work also for the observed version
        const observed = arr[2]
        expect(arr.indexOf(observed)).toBe(2)
        expect(arr.indexOf(observed, 3)).toBe(-1)
        expect(arr.includes(observed)).toBe(true)
        expect(arr.includes(observed, 3)).toBe(false)
        expect(arr.lastIndexOf(observed)).toBe(2)
        expect(arr.lastIndexOf(observed, 1)).toBe(-1)
    })

    test("Array identity methods should work if raw value contains reactive objects", () => {
        const raw = []
        const obj = reactive({})
        raw.push(obj)
        const arr = reactive(raw)
        expect(arr.includes(obj)).toBe(true)
    })

    test("Array identity methods should be reactive", () => {
        const obj = {}
        const arr = reactive([obj, {}])

        let index: number = -1
        createEffect(() => {
            index = arr.indexOf(obj)
        })
        expect(index).toBe(0)
        arr.reverse()
        expect(index).toBe(1)
    })

    test("delete on Array should not trigger length dependency", () => {
        const arr = reactive([1, 2, 3])
        const fn = jest.fn()
        createEffect(() => {
            fn(arr.length)
        })
        expect(fn).toHaveBeenCalledTimes(1)
        delete arr[1]
        expect(fn).toHaveBeenCalledTimes(1)
    })

    describe("Array methods w/ refs", () => {
        let original: any[]
        beforeEach(() => {
            original = reactive([1, ref(2)])
        })

        // read + copy
        test("read only copy methods", () => {
            const res = original.concat([3, ref(4)])
            const raw = toRaw(res)
            expect(isRef(raw[1])).toBe(true)
            expect(isRef(raw[3])).toBe(true)
        })

        // read + write
        test("read + write mutating methods", () => {
            const res = original.copyWithin(0, 1, 2)
            const raw = toRaw(res)
            expect(isRef(raw[0])).toBe(true)
            expect(isRef(raw[1])).toBe(true)
        })

        test("read + identity", () => {
            const ref = original[1]
            expect(ref).toBe(toRaw(original)[1])
            expect(original.indexOf(ref)).toBe(1)
        })
    })
})
