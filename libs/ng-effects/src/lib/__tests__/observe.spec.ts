import { from, interval, Notification, of, throwError, timer } from "rxjs"
import { observe, observeError } from "../rx"
import { fakeAsync, flush, tick } from "@angular/core/testing"
import { repeat } from "rxjs/operators"
import fn = jest.fn
import Mock = jest.Mock

describe("observe", () => {
    it("should subscribe to the source to an observer", fakeAsync(() => {
        let subject, expected, spy: Mock

        spy = fn()
        expected = [1, 2, 3]
        subject = from(expected)

        observe(subject, spy)

        flush()

        for (const [index, num] of expected.entries()) {
            expect(spy).toHaveBeenNthCalledWith(index + 1, num)
        }
    }))

    it("should unsubscribe when stopped manually", fakeAsync(() => {
        let subject, expected: Mock, stop

        expected = fn()
        subject = timer(1000).pipe(repeat())

        stop = observe(subject, expected)

        tick(2000)
        stop()
        tick(2000)

        expect(expected).toHaveBeenCalledTimes(2)
    }))

    it("should observe errors", fakeAsync(() => {
        let subject, expected, spy: Mock

        spy = fn()
        expected = "ERROR THROWN"
        subject = throwError(expected)

        observeError(subject, spy)

        flush()

        expect(spy).toHaveBeenCalledWith(expected)
    }))

    it("should dematerialize notifications", fakeAsync(() => {
        let subject

        subject = of(
            Notification.createNext("NEXT"),
            Notification.createError("ERR"),
            Notification.createComplete(),
        )

        observe(subject, {
            next(value) {
                expect(value).toBe("NEXT")
            },
            error(err) {
                expect(err).toBe("ERR")
            },
            complete(value?: void) {
                expect(value).toBeUndefined()
            },
        })

        flush()

        expect.assertions(4) // N, E, C then C again because of() completes
    }))

    it("should not complete when stopped", fakeAsync(() => {
        let subject, stop: Function

        subject = interval(1000)

        stop = observe(subject, {
            complete() {
                throw new Error("Should not be completed")
            },
        })

        tick(2000)

        expect(() => stop()).not.toThrow()
    }))
})
