import { Component, InjectionToken, Input, Output } from "@angular/core"
import { connectable, Connectable, effect, HostEmitter } from "@ng9/ng-effects"
import { interval, timer } from "rxjs"

export const MyConnectable = connectable<ConnectableComponent>(state => {
    effect(() => {
        return interval(250).subscribe(() => {
            state.count2 += 1
        })
    })
})

export const TEST = new InjectionToken<number>("TEST")

@Component({
    selector: "app-connectable",
    template: `
        <div>Count: {{ count }}</div>
        <div>Count + 1: {{ offset }}</div>
        <br />
        <div>Count2: {{ count2 }}</div>
        <app-connectable-child></app-connectable-child>
    `,
    styleUrls: ["./connectable.component.scss"],
    providers: [
        MyConnectable,
        {
            provide: TEST,
            useExisting: ConnectableComponent,
        },
    ],
})
export class ConnectableComponent extends Connectable {
    @Input()
    count = 0
    count2 = 0
    offset = 1

    @Output()
    countChange = new HostEmitter<number>()

    incrementCount() {
        this.count += 1
    }

    ngOnConnect() {
        effect(() => {
            console.log(this.count)
            this.offset = this.count + 1
            this.countChange.emit(this.count)
            return timer(1000).subscribe(() => {
                this.incrementCount()
            })
        })
    }
}
