import { Component } from "@angular/core"
import { Connect, Connectable, connectable, effect, inject, useReactive } from "@ng9/ng-effects"
import { timer } from "rxjs"
import { HttpClient } from "@angular/common/http"

function useButton(context: CompositionComponent) {
    const state = useReactive(context)

    effect(() => {
        console.log("count changed!", state.count)
        // context.ageChange(state.count)

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
        <button (click)="incrementCount()">Increment</button>
    `,
    styleUrls: ["./composition.component.scss"],
    providers: [Connectable],
})
@Connect()
export class CompositionComponent implements Connectable {
    count: number = 0

    incrementCount() {
        this.count += 1
    }

    ngOnConnect() {
        const http = inject(HttpClient)

        effect(() => {
            console.log(this.count)
        })
    }
}
