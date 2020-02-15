import { createEffect } from "../utils"
import { of } from "rxjs"
import { State } from "../interfaces"
import { createDirective } from "./test-utils"
import { Connect, effects } from "../providers"
import { Type } from "@angular/core"
import { fakeAsync, tick } from "@angular/core/testing"
import { Effect } from "../decorators"
import objectContaining = jasmine.objectContaining

describe("How to use effect bindCounts using factories", () => {
    it("should throw an error when trying to bind effects to an uninitialised property", fakeAsync(() => {
        let AppDirective: Type<any>, AppEffects: Type<any>

        given: AppDirective = class {
            count?: number
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: AppEffects = class {
            // noinspection JSUnusedGlobalSymbols
            bindCount = createEffect(
                (_: State<{ count: number }>) => {
                    return of(1377)
                },
                { bind: "count" },
            )
        }

        when: createDirective(AppDirective, [Connect], [effects(AppEffects)])

        then: expect(tick).toThrowError(
            `[ng-effects] Property "count" is not initialised in "AppDirective".`,
        )
    }))

    it("should throw an error when applying effects to uninitialised properties", fakeAsync(() => {
        let AppDirective: Type<any>, AppEffects: Type<any>

        given: AppDirective = class {
            name?: string
            age = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: AppEffects = class {
            // noinspection JSUnusedGlobalSymbols
            bindAll = createEffect(
                (_: State<any>) => {
                    return of({ name: "stupidawesome" })
                },
                { apply: true },
            )
        }

        when: createDirective(AppDirective, [Connect], effects(AppEffects))

        then: expect(tick).toThrowError(
            `[ng-effects] Property "name" is not initialised in "AppDirective".`,
        )
    }))

    it("should bind to a specific property", () => {
        let AppDirective, AppEffects, result, expected: number

        given: expected = 1337
        given: AppDirective = class {
            count = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: AppEffects = class {
            // noinspection JSUnusedGlobalSymbols
            bindCount = createEffect(
                (_: State<{ count: number }>) => {
                    return of(expected)
                },
                { bind: "count" },
            )
        }

        when: result = createDirective(AppDirective, [Connect], effects(AppEffects))

        then: expect(result.count).toBe(expected)
    })

    it("should apply effects to any matching properties", () => {
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
        given: AppEffects = class {
            // noinspection JSUnusedGlobalSymbols
            bindAll = createEffect(
                (_: State<{ name: string; count: number }>) => {
                    return of({ name, age })
                },
                { apply: true },
            )
        }

        when: result = createDirective(AppDirective, [Connect], effects(AppEffects))

        then: expect(result).toEqual(objectContaining({ name, age }))
    })
})

describe("How to use effect bindCounts using decorators", () => {
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

        when: createDirective(AppDirective, [Connect], [effects(AppEffects)])

        then: expect(tick).toThrowError(
            `[ng-effects] Property "count" is not initialised in "AppDirective".`,
        )
    }))

    it("should throw an error when applying effects to uninitialised properties", fakeAsync(() => {
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
                @Effect({ apply: true })
                bindAll(_: State<{ count: number; name: string }>) {
                    return of({ name: "stupidawesome", age: 1377 })
                }
            }
            AppEffects = MockAppEffects
        }

        when: createDirective(AppDirective, [Connect], effects(AppEffects))

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

        when: result = createDirective(AppDirective, [Connect], effects(AppEffects))

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

        when: result = createDirective(AppDirective, [Connect], effects(AppEffects))

        then: expect(result.count).toBe(expected)
    })

    it("should apply effects to any matching properties", () => {
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
                @Effect({ apply: true })
                bindCount(_: State<{ name: string; count: number }>) {
                    return of({ name, age })
                }
            }
            AppEffects = MockAppEffects
        }

        when: result = createDirective(AppDirective, [Connect], effects(AppEffects))

        then: expect(result).toEqual(objectContaining({ name, age }))
    })
})
