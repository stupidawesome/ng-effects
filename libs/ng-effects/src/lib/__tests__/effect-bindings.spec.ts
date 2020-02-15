import { createEffect } from "../utils"
import { of } from "rxjs"
import { State } from "../interfaces"
import { createDirective } from "./test-utils"
import { Connect, effects } from "../providers"
import { Type } from "@angular/core"
import { fakeAsync, tick } from "@angular/core/testing"
import objectContaining = jasmine.objectContaining

describe("How to use effect bindings using factories", () => {
    it("should throw an error when trying to bind effects to an uninitialised property", fakeAsync(() => {
        let AppDirective: Type<any>, AppEffects: Type<any>

        given: AppDirective = class {
            count?: number
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: AppEffects = class {
            binding = createEffect(
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
            binding = createEffect(
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
        let AppDirective, AppEffects2, result, expected: number

        given: expected = 1337
        given: AppDirective = class {
            count = 0
            constructor(connect: Connect) {
                connect(this)
            }
        }
        given: AppEffects2 = class {
            binding = createEffect(
                (_: State<{ count: number }>) => {
                    return of(expected)
                },
                { bind: "count" },
            )
        }

        when: result = createDirective(AppDirective, [Connect], effects(AppEffects2))

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
            binding = createEffect(
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
