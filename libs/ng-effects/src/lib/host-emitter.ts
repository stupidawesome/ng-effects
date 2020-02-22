import { Observable, Subject } from "rxjs"
import { EventEmitter } from "@angular/core"
import { Callable } from "./internals/callable"
import { apply } from "./internals/apply"

export interface HostEmitter<T> extends Subject<T> {
    (value?: T): void
    (...value: T extends Array<infer U> ? T : never[]): void
    emit(value?: T): void
}

export class HostEmitter<T> extends Callable<(next: T) => void> {
    // noinspection JSUnusedLocalSymbols
    private mixin = apply(HostEmitter, Observable, Subject, EventEmitter)
    constructor(isAsync?: boolean) {
        super((...values: any) => {
            if (values.length <= 1) {
                this.next(values[0])
            } else {
                this.next(values)
            }
        })
        apply(this, new EventEmitter(isAsync))
    }
}
