import Mock = jest.Mock
import fn = jest.fn
import { EffectAdapter, EffectMetadata } from "../interfaces"
import { Type } from "@angular/core"
import { of } from "rxjs"
import { createDirective } from "./test-utils"
import { Effect } from "../decorators"
import { Connect } from "../connect"
import { Effects, effects } from "../providers"

describe("How to use Adapters to hook into effects", () => {
    it("should observe values emitted by effects", () => {
        let LogAdapter: Type<EffectAdapter<any, { prefix: string }>>, AppDirective, spy: Mock

        given: spy = fn()
        given: LogAdapter = class implements EffectAdapter<any, { prefix: string }> {
            next(value: string, metadata: EffectMetadata<{ prefix: string }>): void {
                spy(`${metadata.options.prefix}: ${value}`)
            }
        }
        given: {
            class MockAppDirective {
                constructor(connect: Connect) {
                    connect(this)
                }
                @Effect(LogAdapter, { prefix: "[LogAdapter]" })
                logEffectUsingDecorator() {
                    return of("this value should be logged")
                }
            }
            AppDirective = MockAppDirective
        }

        when: createDirective(
            AppDirective,
            [Connect],
            [LogAdapter, Effects, effects([AppDirective])],
        )

        then: expect(spy).toBeCalledWith("[LogAdapter]: this value should be logged")
    })
})
