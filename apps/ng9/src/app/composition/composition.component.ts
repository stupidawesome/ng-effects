import { Component, Input, Output, QueryList, ViewChildren } from "@angular/core"
import { afterViewInit, connect, effect, HostEmitter, setup, useReactive, whenRendered } from "@ng9/ng-effects"
import { timer } from "rxjs"

export const Composition = setup<CompositionComponent>(context => {
    const state = useReactive(context)

    effect(() => {
        console.log("count changed!", state.count)
        context.ageChange(state.count)

        return timer(1000).subscribe(() => {
            state.age += 1
        })
    })

    effect(() => {
        return
    })

    afterViewInit(() => {
        console.log("mounted!")
    })

    whenRendered(() => {
        console.log("rendered!")

        effect(() =>
            timer(500).subscribe(() => {
                console.log("after delay")
            }),
        )
    })
})

export const Multiply = setup<CompositionComponent>(context => {
    const state = useReactive(context)

    // watch(() => state.count, (value) => {
    //     console.log(value)
    // })
})

@Component({
    selector: "app-composition",
    template: `
        <div #element>
            Age: {{ age }}<br />
            Count: {{ count }}
        </div>
        <button (click)="incrementCount()">Increment</button>
    `,
    styleUrls: ["./composition.component.scss"],
    providers: [Composition, Multiply],
})
export class CompositionComponent {
    name: string
    count: number

    @Input()
    age: number

    @Output()
    ageChange: HostEmitter<number>

    @ViewChildren("element")
    viewChildren: QueryList<any>

    constructor() {
        this.name = ""
        this.count = 1
        this.age = 30
        this.ageChange = new HostEmitter<number>(true)
        this.viewChildren = new QueryList()
        connect(this)
    }

    incrementCount() {
        this.count += 1
    }
}
