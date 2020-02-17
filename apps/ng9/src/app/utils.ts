import { MonoTypeOperatorFunction, Subject } from "rxjs"
import { map } from "rxjs/operators"
import { ɵmarkDirty as markDirty } from "@angular/core"

export function increment(by: number = 1): MonoTypeOperatorFunction<number> {
    return function(source) {
        return source.pipe(map(value => value + by))
    }
}

export class Events<T> extends Subject<T> {}

export interface Update {
    <T>(args?: T): T | undefined
}
export class Update {
    constructor() {
        return function<T>(this: any, arg?: T): T | undefined {
            markDirty(this)
            return arg
        }
    }
}
