import { Component } from "@angular/core"
import { connectable, Connectable, effect } from "@ng9/ng-effects"
import { timer } from "rxjs"

export const MyConnectable = connectable<ConnectableComponent>(state => {
    effect(() => {
        state.offset = state.count + 1
        return timer(1000).subscribe(() => {
            state.incrementCount()
        })
    })
})

@Component({
    selector: "app-connectable",
    template: `
        <div>Count: {{ count }}</div>
        <div>Count + 1: {{ offset }}</div>
    `,
    styleUrls: ["./connectable.component.scss"],
    providers: [MyConnectable],
})
export class ConnectableComponent extends Connectable {
    count = 0
    offset = 1

    incrementCount() {
        this.count += 1
    }

    ngOnConnect() {
        effect(() => {
            console.log(this.count)
            this.offset = this.count + 1
            return timer(1000).subscribe(() => {
                this.incrementCount()
            })
        })
    }
}
