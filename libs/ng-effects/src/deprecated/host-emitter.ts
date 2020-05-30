import { Observable, Subject } from "rxjs"
import { EventEmitter } from "@angular/core"
import { Callable } from "./internals/callable"
import { apply } from "./internals/apply"

/**
 * @deprecated Will be removed in 10.0.0
 */
export interface HostEmitter<T> extends Subject<T> {
    (): void
    (...value: T extends Array<infer U> ? T : [T]): void
    emit(value?: T): void
}

/**
 * @deprecated Will be removed in 10.0.0
 */
export class HostEmitter<T> extends Callable<(next: T) => void> {
    // noinspection JSUnusedLocalSymbols
    private mixin = apply(HostEmitter, Observable, Subject, EventEmitter)
    constructor(isAsync?: boolean) {
        super((...values: any) => {
            if (values.length <= 1) {
                this.next(values[0])
                return values[0]
            } else {
                this.next(values)
                return values
            }
        })
        apply(this, new EventEmitter(isAsync))
    }

    public set event(event: any) {
        this.next(event)
    }
}
