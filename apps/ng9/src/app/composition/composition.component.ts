import { Component, EventEmitter, Input, Output } from "@angular/core"
import { Connect, Connectable, connectable, effect, useContext, useReactive } from "@ng9/ng-effects"
import { interval, timer } from "rxjs"

function useButton(context: CompositionComponent) {
    const state = useReactive(context)

    effect(() => {
        console.log("count changed!", state.count)

        return timer(1000).subscribe(() => {
            state.count += 1
        })
    })
    //
    // effect(() => {
    //     return
    // })
    //
    // afterViewInit(() => {
    //     console.log("mounted!")
    // })
    //
    // whenRendered(() => {
    //     console.log("rendered!")
    //
    //     effect(() =>
    //         timer(500).subscribe(() => {
    //             console.log("after delay")
    //         }),
    //     )
    // })
}

export const Multiply = connectable<CompositionComponent>(context => {
    const state = useReactive(context)

    // watch(() => state.count, (value) => {
    //     console.log(value)
    // })
})

@Component({
    selector: "app-composition",
    template: `
        <div>Count: {{ count }}</div>
        <div>Target: {{ target }}</div>
    `,
    styleUrls: ["./composition.component.scss"],
    providers: [Connectable],
})
export class CompositionComponent implements Connectable {
    @Input()
    count: number = 0

    @Output()
    countChange = new EventEmitter()

    target: string = ""

    incrementCount() {
        this.count += 1
    }

    ngOnConnect() {
        const { countChange } = this
        effect(() => {
            this.target = `target is ${this.count}`
            countChange.emit(this.count)
        })
        effect(() => {
            return interval(1000).subscribe(() => this.incrementCount())
        })
    }

    constructor(connect: Connect) {
        connect(this)
    }
}
