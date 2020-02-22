import Mock = jest.Mock
import fn = jest.fn
import { EffectHandler } from "../interfaces"
import { HOST_EFFECTS } from "../providers"
import { createEffect } from "../utils"
import { Type } from "@angular/core"
import { of } from "rxjs"
import { createDirective } from "./test-utils"
import { Effect } from "../decorators"
import { Connect } from "../connect"

describe("How to use Adapters to hook into effects", () => {
    it("should observe values emitted by effects", () => {
        let LogAdapter: Type<EffectHandler<any, { prefix: string }>>, AppDirective, spy: Mock

        given: spy = fn()
        given: LogAdapter = class implements EffectHandler<any, { prefix: string }> {
            next(value: any, options: { prefix: string }): void {
                spy(`${options.prefix}: ${value}`)
            }
        }
        given: {
            class MockAppDirective {
                // noinspection JSUnusedGlobalSymbols
                logEffect = createEffect(
                    () => {
                        return of("this value should be logged")
                    },
                    { adapter: LogAdapter, prefix: "[LogAdapter]" },
                )
                constructor(connect: Connect) {
                    connect(this)
                }
                @Effect(LogAdapter, { prefix: "[LogAdapterDecorator]" })
                logEffectUsingDecorator() {
                    return of("this value should also be logged")
                }
            }
            AppDirective = MockAppDirective
        }

        when: createDirective(AppDirective, [Connect], [HOST_EFFECTS, LogAdapter])

        then: expect(spy.mock.calls).toEqual([
            [`[LogAdapterDecorator]: this value should also be logged`],
            [`[LogAdapter]: this value should be logged`],
        ])
    })
})
