import { asapScheduler, of, scheduled } from "rxjs"
import { createComponent, createDirective } from "./test-utils"
import { delay } from "rxjs/operators"
import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { ChangeDetectorRef, Directive } from "@angular/core"
import { DETECT_CHANGES, MARK_DIRTY } from "../internals/providers"
import { Connect } from "../connect"
import { State } from "../decorators"
import { Effects, USE_EXPERIMENTAL_RENDER_API } from "../providers"
import { Effect } from "../effect"
import Mock = jest.Mock
import fn = jest.fn

describe("How change detection works", () => {
    it("should not mark the view dirty or detect changes when effects emit synchronously during init", fakeAsync(() => {
        let AppComponent, cdr

        given: {
            @Directive()
            class MockAppComponent {
                count = 0
                // noinspection JSUnusedGlobalSymbols
                @Effect({ bind: "count" })
                markDirty() {
                    return of(1337)
                }
                // noinspection JSUnusedGlobalSymbols
                @Effect({ bind: "count", detectChanges: true })
                detectChanges() {
                    return of(1337)
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(AppComponent, [Connect], [Effects])

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: expect(cdr.markForCheck).toHaveBeenCalledTimes(0)
        then: expect(cdr.markForCheck).toHaveBeenCalledTimes(0)
    }))

    it("should mark the view dirty when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, cdr

        given: fakeDelay = 1000
        given: {
            @Directive()
            class MockAppComponent {
                count = 0
                // noinspection JSUnusedGlobalSymbols
                @Effect({ bind: "count" })
                bindCount({}: State<any>) {
                    return of(1337).pipe(delay(fakeDelay))
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(AppComponent, [Connect], [Effects])

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: tick(fakeDelay)
        then: expect(cdr.markForCheck).toHaveBeenCalledTimes(1)
    }))

    it("should detect changes when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, cdr

        given: fakeDelay = 1000
        given: {
            @Directive()
            class MockAppComponent {
                count = 0
                // noinspection JSUnusedGlobalSymbols
                @Effect({ bind: "count", detectChanges: true })
                bindCount({}: State<any>) {
                    return scheduled(of(1337), asapScheduler)
                }
                constructor(connect: Connect) {
                    connect(this)
                }
            }
            AppComponent = MockAppComponent
        }

        when: createDirective(AppComponent, [Connect], [Effects])

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: tick(fakeDelay)
        then: expect(cdr.detectChanges).toHaveBeenCalledTimes(1)
    }))

    it("should defer the effect until the view has rendered", async () => {
        let AppComponent, fixture, spy: Mock

        given: spy = fn()
        given: {
            @Directive()
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
            providers: [[Effects]],
        })

        then: expect(spy).toHaveBeenCalledTimes(0)
        then: fixture.detectChanges()
        then: expect(spy).toHaveBeenCalledTimes(1)
    })
})

describe("How change detection works [USE_EXPERIMENTAL_RENDER_API]", () => {
    it("should not mark the view dirty or detect changes when effects emit synchronously during init", fakeAsync(() => {
        let AppComponent, spy

        given: spy = fn()
        given: {
            @Directive()
            class MockAppComponent {
                count = 0
                @Effect({ bind: "count" })
                markDirty() {
                    return of(1337)
                }
                @Effect({ bind: "count", detectChanges: true })
                detectChanges() {
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
                [Effects],
                USE_EXPERIMENTAL_RENDER_API,
                {
                    provide: MARK_DIRTY,
                    useValue: spy,
                },
                {
                    provide: DETECT_CHANGES,
                    useValue: spy,
                },
            ],
        )

        then: expect(spy).toHaveBeenCalledTimes(0)
    }))
    it("should mark the view dirty when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, spy

        given: spy = fn()
        given: fakeDelay = 1000
        given: {
            @Directive()
            class MockAppComponent {
                count = 0
                @Effect({ bind: "count" })
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
                [Effects],
                USE_EXPERIMENTAL_RENDER_API,
                {
                    provide: MARK_DIRTY,
                    useValue: spy,
                },
            ],
        )

        then: tick(fakeDelay)
        then: expect(spy).toHaveBeenCalledTimes(1)
    }))

    it("should detect changes synchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, spy

        given: spy = fn()
        given: fakeDelay = 1000
        given: {
            @Directive()
            class MockAppComponent {
                count = 0
                @Effect({ bind: "count", detectChanges: true })
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
                [Effects],
                USE_EXPERIMENTAL_RENDER_API,
                {
                    provide: DETECT_CHANGES,
                    useValue: spy,
                },
            ],
        )

        then: tick(fakeDelay)
        then: expect(spy).toHaveBeenCalledTimes(1)
    }))

    it("should defer the effect until the view has rendered", async () => {
        let AppComponent, fixture, spy: Mock

        given: spy = fn()
        given: {
            @Directive()
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
            providers: [Effects],
            rootProviders: [USE_EXPERIMENTAL_RENDER_API],
        })

        then: expect(spy).toHaveBeenCalledTimes(0)
        then: fixture.detectChanges()
        then: expect(spy).toHaveBeenCalledTimes(1)
    })
})
