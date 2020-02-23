import Mock = jest.Mock
import fn = jest.fn
import { EffectAdapter } from "../interfaces"
import { HOST_EFFECTS } from "../providers"
import { Type } from "@angular/core"
import { of } from "rxjs"
import { createDirective } from "./test-utils"
import { Effect } from "../decorators"
import { Connect } from "../connect"

describe("How to use Adapters to hook into effects", () => {
    it("should observe values emitted by effects", () => {
        let LogAdapter: Type<EffectAdapter<any, { prefix: string }>>, AppDirective, spy: Mock

        given: spy = fn()
        given: LogAdapter = class implements EffectAdapter<any, { prefix: string }> {
            next(value: any, metadata: any): void {
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

        when: createDirective(AppDirective, [Connect], [HOST_EFFECTS, LogAdapter])

        then: expect(spy).toBeCalledWith("[LogAdapter]: this value should be logged")
    })
})
