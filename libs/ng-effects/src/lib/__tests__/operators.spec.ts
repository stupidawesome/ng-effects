import { createDirective } from "./test-utils"
import { Connect, HOST_EFFECTS } from "../providers"
import { changes, createEffect, latestFrom } from "../utils"
import { State } from "../interfaces"
import { from } from "rxjs"
import { mergeAll } from "rxjs/operators"
import fn = jest.fn
import Mock = jest.Mock

describe("Some use cases for the operators exported by this library", () => {
    describe("How to use the `changes` operator", () => {
        it("should skip the initial value [3 overloads]", () => {
            let AppDirective, expected: number[][], spy1: Mock, spy2: Mock, spy3: Mock, spy4: Mock

            given: spy1 = fn()
            given: spy2 = fn()
            given: spy3 = fn()
            given: spy4 = fn()
            given: expected = [[1], [2], [3], [4], [5]]
            given: AppDirective = class {
                count = 0
                // noinspection JSUnusedGlobalSymbols
                emitChanges = createEffect(
                    (state: State<any>) => {
                        changes(state.count).subscribe(spy1)
                        state.count.pipe(changes).subscribe(spy2)
                        state.count.pipe(changes()).subscribe(spy3)
                        state.count.subscribe(spy4)
                        return from(expected).pipe(mergeAll())
                    },
                    { bind: "count" },
                )
                constructor(connect: Connect) {
                    connect(this)
                }
            }

            when: createDirective(AppDirective, [Connect], HOST_EFFECTS)

            then: expect(spy1.mock.calls).toEqual(expected)
            then: expect(spy2.mock.calls).toEqual(expected)
            then: expect(spy3.mock.calls).toEqual(expected)
            then: expect(spy4.mock.calls).toEqual([[0], ...expected])
        })
    })

    describe("How to use the `latestFrom` operator [ex]", () => {
        it("Should take a dictionary object of observable inputs and return an observable that combines the latest values", () => {
            let AppDirective, expected: any[][], spy: Mock

            given: spy = fn()
            given: expected = [
                [{ name: "Peter", age: 0 }],
                [{ name: "Peter", age: 29 }],
                [{ name: "Julia", age: 29 }],
                [{ name: "Julia", age: 26 }],
            ]
            given: AppDirective = class {
                name = ""
                age = 0
                // noinspection JSUnusedGlobalSymbols
                emitChanges = createEffect(
                    ({ name, age }: State<any>) => {
                        latestFrom({ name, age })
                            .pipe(changes)
                            .subscribe(spy)
                        return from(expected).pipe(mergeAll())
                    },
                    { assign: true },
                )
                constructor(connect: Connect) {
                    connect(this)
                }
            }

            when: createDirective(AppDirective, [Connect], HOST_EFFECTS)

            then: expect(spy.mock.calls).toEqual(expected)
        })
    })
})
