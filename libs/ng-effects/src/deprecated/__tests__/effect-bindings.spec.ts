import { of } from "rxjs"
import { createDirective } from "./test-utils"
import { Effects } from "../providers"
import { Type } from "@angular/core"
import { fakeAsync, tick } from "@angular/core/testing"
import { State } from "../decorators"
import { Connect } from "../connect"
import { Effect } from "../../lib/effect"
import objectContaining = jasmine.objectContaining

describe("How to use effect bindCount using decorators", () => {
    it("should throw an error when trying to bind effects to an uninitialised property", fakeAsync(() => {
        let AppDirective: Type<any>, AppEffects: Type<any>

        given: AppDirective = class {
            count?: number
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: {
            class MockAppEffects {
                @Effect("count")
                bindCount(_: State<{ count: number }>) {
                    return of(1377)
                }
            }
            AppEffects = MockAppEffects
        }

        when: createDirective(AppDirective, [Connect], [Effects, AppEffects])

        then: expect(tick).toThrowError(
            `[ng-effects] Property "count" is not initialised in "AppDirective".`,
        )
    }))

    it("should throw an error when attemping to assign to uninitialised properties", fakeAsync(() => {
        let AppDirective: Type<any>, AppEffects: Type<any>

        given: AppDirective = class {
            name?: string
            age = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: {
            class MockAppEffects {
                @Effect({ assign: true })
                bindAll(_: State<{ age: number; name: string }>) {
                    return of({ name: "stupidawesome", age: 1377 })
                }
            }
            AppEffects = MockAppEffects
        }

        when: createDirective(AppDirective, [Connect], [Effects, AppEffects])

        then: expect(tick).toThrowError(
            `[ng-effects] Property "name" is not initialised in "AppDirective".`,
        )
    }))

    it("should bind to a specific property [overload 1]", () => {
        let AppDirective, AppEffects, result, expected: number

        given: expected = 1337
        given: AppDirective = class {
            count = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: {
            class MockAppEffects {
                @Effect("count")
                bindCount(_: State<{ count: number }>) {
                    return of(expected)
                }
            }
            AppEffects = MockAppEffects
        }

        when: result = createDirective(
            AppDirective,
            [Connect],
            [Effects, AppEffects],
        )

        then: expect(result.count).toBe(expected)
    })

    it("should bind to a specific property [overload 2]", () => {
        let AppDirective, AppEffects, result, expected: number

        given: expected = 1337
        given: AppDirective = class {
            count = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: {
            class MockAppEffects {
                @Effect({ bind: "count" })
                bindCount(_: State<{ count: number }>) {
                    return of(expected)
                }
            }
            AppEffects = MockAppEffects
        }

        when: result = createDirective(
            AppDirective,
            [Connect],
            [Effects, AppEffects],
        )

        then: expect(result.count).toBe(expected)
    })

    it("should assign values with matching properties", () => {
        let AppDirective, AppEffects, result, name: string, age: number

        given: name = "stupidawesome"
        given: age = 1337
        given: AppDirective = class {
            name = ""
            age = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: {
            class MockAppEffects {
                @Effect({ assign: true })
                bindCount({}: State<{ name: string; age: number }>) {
                    return of({ name, age })
                }
            }
            AppEffects = MockAppEffects
        }

        when: result = createDirective(
            AppDirective,
            [Connect],
            [Effects, AppEffects],
        )

        then: expect(result).toEqual(objectContaining({ name, age }))
    })
})
