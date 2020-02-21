import { Connect, HOST_EFFECTS, USE_EXPERIMENTAL_RENDER_API } from "../providers"
import { State } from "../interfaces"
import { of } from "rxjs"
import { createComponent, createDirective } from "./test-utils"
import { createEffect } from "../utils"
import { delay } from "rxjs/operators"
import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { ChangeDetectorRef } from "@angular/core"
import { DETECT_CHANGES, MARK_DIRTY } from "../internals/providers"
import Mock = jest.Mock
import fn = jest.fn

describe("How change detection works", () => {
    it("should mark the view dirty asynchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, cdr

        given: fakeDelay = 1000
        given: AppComponent = class {
            count = 0
            // noinspection JSUnusedGlobalSymbols
            bindCount = createEffect(
                ({}: State<any>) => {
                    return of(1337).pipe(delay(fakeDelay))
                },
                { bind: "count", markDirty: true },
            )
            constructor(connect: Connect) {
                connect(this)
            }
        }

        when: createDirective(AppComponent, [Connect], HOST_EFFECTS)

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: expect(cdr.markForCheck).not.toHaveBeenCalled()
        then: tick(fakeDelay)
        then: expect(cdr.markForCheck).toHaveBeenCalledTimes(1)
    }))

    it("should detect changes synchronously when an effect emits", fakeAsync(() => {
        let AppComponent, fakeDelay: number, cdr

        given: fakeDelay = 1000
        given: AppComponent = class {
            count = 0
            // noinspection JSUnusedGlobalSymbols
            bindCount = createEffect(
                ({}: State<any>) => {
                    return of(1337)
                },
                { bind: "count", detectChanges: true },
            )
            constructor(connect: Connect) {
                connect(this)
            }
        }

        when: createDirective(AppComponent, [Connect], HOST_EFFECTS)

        then: cdr = TestBed.inject(ChangeDetectorRef)
        then: expect(cdr.detectChanges).toHaveBeenCalledTimes(1)
        then: tick(fakeDelay)
        then: expect(cdr.detectChanges).toHaveBeenCalledTimes(1)
    }))

    it("should defer the effect until the view has rendered", async () => {
        let AppComponent, fixture, spy: Mock

        given: spy = fn()
        given: AppComponent = class {
            count = 0
            // noinspection JSUnusedGlobalSymbols
            deferredEffect = createEffect(spy, { whenRendered: true })
            constructor(connect: Connect) {
                connect(this)
            }
        }

        when: fixture = createComponent({
            component: AppComponent,
            deps: [Connect],
            providers: [HOST_EFFECTS],
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
        given: AppComponent = class {
            count = 0
            // noinspection JSUnusedGlobalSymbols
            bindCount = createEffect(
                ({}: State<any>) => {
                    return of(1337).pipe(delay(fakeDelay))
                },
                { bind: "count", markDirty: true },
            )
            constructor(connect: Connect) {
                connect(this)
            }
        }

        when: createDirective(
            AppComponent,
            [Connect],
            [
                HOST_EFFECTS,
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
        given: AppComponent = class {
            count = 0
            // noinspection JSUnusedGlobalSymbols
            bindCount = createEffect(
                ({}: State<any>) => {
                    return of(1337)
                },
                { bind: "count", detectChanges: true },
            )
            constructor(connect: Connect) {
                connect(this)
            }
        }

        when: createDirective(
            AppComponent,
            [Connect],
            [
                HOST_EFFECTS,
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
        given: AppComponent = class {
            count = 0
            // noinspection JSUnusedGlobalSymbols
            deferredEffect = createEffect(spy, { whenRendered: true })
            constructor(connect: Connect) {
                connect(this)
            }
        }

        when: fixture = createComponent({
            component: AppComponent,
            deps: [Connect],
            providers: [HOST_EFFECTS],
            rootProviders: [USE_EXPERIMENTAL_RENDER_API],
        })

        then: expect(spy).toHaveBeenCalledTimes(0)
        then: fixture.detectChanges()
        then: expect(spy).toHaveBeenCalledTimes(1)
    })
})
