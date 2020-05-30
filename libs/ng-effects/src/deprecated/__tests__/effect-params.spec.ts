import { Directive } from "@angular/core"
import { Context, Observe, State } from "../decorators"
import { Connect } from "../connect"
import { createDirective } from "./test-utils"
import { Effects } from "../providers"
import { Observable } from "rxjs"
import { Effect } from "../effect"
import Mock = jest.Mock
import fn = jest.fn

describe("How to use decorators to select effect parameters", () => {
    it("should have default parameters", () => {
        let AppDirective: any, spy: Mock, expected

        given: spy = fn()
        given: {
            @Directive()
            class MockAppDirective {
                count = 0
                name = "stupidawesome"

                @Effect()
                anyEffect(
                    state: State<any>,
                    context: Context<any>,
                    observe: Observable<any>,
                ) {
                    observe.subscribe(spy).unsubscribe()
                    state.count.subscribe(spy).unsubscribe()
                    spy(context.name)
                }
                constructor(connect: Connect) {
                    if (connect) {
                        connect(this)
                    }
                }
            }
            AppDirective = MockAppDirective
        }
        given: expected = new AppDirective()

        when: createDirective(AppDirective, [Connect], [Effects])

        then: expect(spy).nthCalledWith(1, expected)
        then: expect(spy).nthCalledWith(2, 0)
        then: expect(spy).nthCalledWith(3, "stupidawesome")
    })

    it("should inject the context", () => {
        let AppDirective: any, spy: Mock, expected

        given: spy = fn()
        given: {
            @Directive()
            class MockAppDirective {
                count = 0

                @Effect()
                anyEffect(@Context() context: Context<any>) {
                    spy(context)
                }
                constructor(connect: Connect) {
                    if (connect) {
                        connect(this)
                    }
                }
            }
            AppDirective = MockAppDirective
        }
        given: expected = new AppDirective()

        when: createDirective(AppDirective, [Connect], [Effects])

        then: expect(spy).toHaveBeenCalledWith(expected)
    })

    it("should inject the state", () => {
        let AppDirective: any, spy: Mock

        given: spy = fn()
        given: {
            @Directive()
            class MockAppDirective {
                count = 0

                @Effect()
                anyEffect(@Context() context: any, @State() state: State<any>) {
                    state.count.subscribe(spy).unsubscribe()
                }
                constructor(connect: Connect) {
                    if (connect) {
                        connect(this)
                    }
                }
            }
            AppDirective = MockAppDirective
        }

        when: createDirective(AppDirective, [Connect], [Effects])

        then: expect(spy).toHaveBeenCalledWith(0)
    })

    it("should inject the observer", () => {
        let AppDirective: any, spy: Mock, expected

        given: spy = fn()
        given: {
            @Directive()
            class MockAppDirective {
                count = 0

                @Effect()
                anyEffect(@Observe() observe: Observable<any>) {
                    observe.subscribe(spy).unsubscribe()
                }
                constructor(connect: Connect) {
                    if (connect) {
                        connect(this)
                    }
                }
            }
            AppDirective = MockAppDirective
        }
        given: expected = new AppDirective()

        when: createDirective(AppDirective, [Connect], [Effects])

        then: expect(spy).toHaveBeenCalledWith(expected)
    })

    it("should inject in any order", () => {
        let AppDirective: any, spy: Mock, expected

        given: spy = fn()
        given: {
            @Directive()
            class MockAppDirective {
                count = 0
                name = "stupidawesome"

                @Effect()
                anyEffect(
                    @Observe() observe: Observable<any>,
                    @State() state: State<any>,
                    @Context() context: Context<any>,
                ) {
                    observe.subscribe(spy).unsubscribe()
                    state.count.subscribe(spy).unsubscribe()
                    spy(context.name)
                }
                constructor(connect: Connect) {
                    if (connect) {
                        connect(this)
                    }
                }
            }
            AppDirective = MockAppDirective
        }
        given: expected = new AppDirective()

        when: createDirective(AppDirective, [Connect], [Effects])

        then: expect(spy).nthCalledWith(1, expected)
        then: expect(spy).nthCalledWith(2, 0)
        then: expect(spy).nthCalledWith(3, "stupidawesome")
    })
})
