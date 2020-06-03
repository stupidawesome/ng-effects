import { Effect, effect, observe, observeError } from "../rx"
import { fakeAsync, flush, tick } from "@angular/core/testing"
import { delay, map, mergeMap, switchMap } from "rxjs/operators"
import fn = jest.fn
import { of, throwError } from "rxjs"

describe("effect", () => {
    it("should create an effect", () => {
        let subject, expected

        subject = effect()
        expected = Effect

        expect(subject).toBeInstanceOf(expected)
    })

    it("should emit values asynchronously", fakeAsync(() => {
        let subject, expected, spy

        spy = fn()
        subject = effect()
        expected = [0, 10, 20]

        observe(subject, spy)

        for (let value of expected) {
            subject.next(value)
            expect(spy).not.toHaveBeenCalled()
            flush()
            expect(spy).toHaveBeenCalledWith(value)
            spy.mockClear()
        }
    }))

    it("should return a new effect after piping operators", () => {
        let subject1, subject2, expected

        subject1 = effect()
        expected = Effect

        subject2 = subject1.pipe(delay(1000))

        expect(subject2).not.toBe(subject1)
        expect(subject2).toBeInstanceOf(expected)
    })

    it("should emit piped values", fakeAsync(() => {
        let subject, expected: number

        expected = 1337
        subject = effect<number>().pipe(
            delay(1000),
            map((value) => value.toString()),
        )

        subject.next(expected)

        observe(subject, (value) => expect(value).toBe(expected.toString()))

        tick(1000)

        expect.assertions(1)
    }))

    it("should keep alive after error", fakeAsync(() => {
        let subject: any, expected: number
        let count = 0

        subject = effect().pipe(
            mergeMap(() => {
                count++
                return count % 2 === 1 ? throwError("ERR") : of("OK")
            }),
        )

        observe(subject, (value) => {
            expect(value).toBe("OK")
        })
        observeError(subject, (err) => {
            expect(err).toBe("ERR")
        })

        subject.next() // ERR
        flush()
        subject.next() // OK
        flush()
        subject.next() // ERR
        flush()
        subject.next() // OK
        flush()

        expect.assertions(4)
    }))
})
