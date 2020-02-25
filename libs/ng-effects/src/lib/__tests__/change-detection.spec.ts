import { of } from "rxjs"
import { createComponent, createDirective } from "./test-utils"
import { delay } from "rxjs/operators"
import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { ChangeDetectorRef } from "@angular/core"
import { DETECT_CHANGES, MARK_DIRTY } from "../internals/providers"
import { Connect } from "../connect"
import { Effect, State } from "../decorators"
import { effects, Effects, USE_EXPERIMENTAL_RENDER_API } from "../providers"
import Mock = jest.Mock
import fn = jest.fn

describe("How change detection works", () => {
    it("should mark the view dirty asynchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, cdr

        given: fakeDelay = 1000
        given: {
            class MockAppComponent {
                count = 0
                // noinspection JSUnusedGlobalSymbols
                @Effect({ bind: "count", markDirty: true })
                bindCount({}: State<any>) {
                    return of(1337)
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(AppComponent, [Connect], [Effects, effects([AppComponent])])

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: expect(cdr.markForCheck).not.toHaveBeenCalled()
        then: tick(fakeDelay)
        then: expect(cdr.markForCheck).toHaveBeenCalledTimes(1)
    }))

    it("should detect changes synchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, cdr

        given: fakeDelay = 1000
        given: {
            class MockAppComponent {
                count = 0
                // noinspection JSUnusedGlobalSymbols
                @Effect({ bind: "count", detectChanges: true })
                bindCount({}: State<any>) {
                    return of(1337)
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(AppComponent, [Connect], [Effects, effects([AppComponent])])

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: expect(cdr.detectChanges).toHaveBeenCalledTimes(1)
        then: tick(fakeDelay)
        then: expect(cdr.detectChanges).toHaveBeenCalledTimes(1)
    }))

    it("should defer the effect until the view has rendered", async () => {
        let AppComponent, fixture, spy: Mock

        given: spy = fn()
        given: {
            class MockAppComponent {
                count = 0
                @Effect({ whenRendered: true })
                deferredEffect() {
                    spy()
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: fixture = createComponent({
            component: AppComponent,
            deps: [Connect],
            providers: [[Effects, effects([AppComponent])]],
        })

        then: expect(spy).toHaveBeenCalledTimes(0)
        then: fixture.detectChanges()
        then: expect(spy).toHaveBeenCalledTimes(1)
    })
})

describe("How change detection works [USE_EXPERIMENTAL_RENDER_API]", () => {
    it("should mark the view dirty asynchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, spy

        given: spy = fn()
        given: fakeDelay = 1000
        given: {
            class MockAppComponent {
                count = 0
                @Effect({ bind: "count", markDirty: true })
                bindCount({}: State<any>) {
                    return of(1337).pipe(delay(fakeDelay))
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(
            AppComponent,
            [Connect],
            [
                [Effects, effects([AppComponent])],
                USE_EXPERIMENTAL_RENDER_API,
                {
                    provide: MARK_DIRTY,
                    useValue: spy,
                },
            ],
        )

        then: expect(spy).not.toHaveBeenCalled()
        then: tick(fakeDelay)
        then: expect(spy).toHaveBeenCalledTimes(1)
    }))

    it("should detect changes synchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, spy

        given: spy = fn()
        given: fakeDelay = 1000
        given: {
            class MockAppComponent {
                count = 0
                @Effect({ bind: "count", detectChanges: true })
                bindCount({}: State<any>) {
                    return of(1337)
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(
            AppComponent,
            [Connect],
            [
                [Effects, effects([AppComponent])],
                USE_EXPERIMENTAL_RENDER_API,
                {
                    provide: DETECT_CHANGES,
                    useValue: spy,
                },
            ],
        )

        then: expect(spy).toHaveBeenCalledTimes(1)
        then: tick(fakeDelay)
        then: expect(spy).toHaveBeenCalledTimes(1)
    }))

    it("should defer the effect until the view has rendered", async () => {
        let AppComponent, fixture, spy: Mock

        given: spy = fn()
        given: {
            class MockAppComponent {
                count = 0
                @Effect({ whenRendered: true })
                // noinspection JSUnusedGlobalSymbols
                deferredEffect() {
                    spy()
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: fixture = createComponent({
            component: AppComponent,
            deps: [Connect],
            providers: [Effects, effects([AppComponent])],
            rootProviders: [USE_EXPERIMENTAL_RENDER_API],
        })

        then: expect(spy).toHaveBeenCalledTimes(0)
        then: fixture.detectChanges()
        then: expect(spy).toHaveBeenCalledTimes(1)
    })
})
