import { MonoTypeOperatorFunction, SchedulerLike, timer } from "rxjs"
import { map, mapTo, switchMap } from "rxjs/operators"

export function increment(by: number = 1): MonoTypeOperatorFunction<number> {
    return function(source) {
        return source.pipe(map(value => value + by))
    }
}

export function delayBounce<T>(
    time: number = 0,
    scheduler?: SchedulerLike,
): MonoTypeOperatorFunction<T> {
    return function(source) {
        return source.pipe(switchMap(age => timer(time, scheduler).pipe(mapTo(age))))
    }
}
