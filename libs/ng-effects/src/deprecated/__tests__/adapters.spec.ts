import Mock = jest.Mock
import fn = jest.fn
import { EffectMetadata, NextEffectAdapter } from "../interfaces"
import { Directive, Type } from "@angular/core"
import { of } from "rxjs"
import { createDirective } from "./test-utils"
import { Effect } from "../decorators"
import { Connect } from "../connect"
import { Effects } from "../providers"

describe("How to use Adapters to hook into effects", () => {
    it("should observe values emitted by effects", () => {
        let LogAdapter: Type<NextEffectAdapter<any, { prefix: string }>>, AppDirective, spy: Mock

        given: spy = fn()
        given: LogAdapter = class implements NextEffectAdapter<any, { prefix: string }> {
            next(value: string, metadata: EffectMetadata<{ prefix: string }>): void {
                spy(`${metadata.options.prefix}: ${value}`)
            }
        }
        given: {
            @Directive()
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

        when: createDirective(AppDirective, [Connect], [LogAdapter, Effects])

        then: expect(spy).toBeCalledWith("[LogAdapter]: this value should be logged")
    })
})
