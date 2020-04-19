import { Component, Input, Output, QueryList, ViewChildren } from "@angular/core"
import { afterViewInit, connect, HostEmitter, onChanges, setup, use, useContext, useState, watch, whenRendered } from "@ng9/ng-effects"
import { useStore } from "./utils"
import { AppState } from "../test/test.component"
import { Store } from "../store"
import { HttpClient } from "@angular/common/http"
import { timer } from "rxjs"

export const Composition = setup(() => {
    const http = use(HttpClient)
    const { ageChange } = useContext<CompositionComponent>()
    const state = useState<CompositionComponent>()
    const dispatch = useStore<AppState, CompositionComponent>(Store, {
        age: state => state.age,
    })

    afterViewInit(() => {
        watch(() => state.count, () => {
            console.log('hi!')
        })
        // console.log('mounted!', state.viewChildren.length)
    })

    whenRendered(() => {
        // console.log('rendered!')
    })

    onChanges(() => {
        // console.log('updated!')
    })
})

export const Multiply = setup(() => {
    const { ageChange } = useContext<CompositionComponent>()
    const state = useState<CompositionComponent>()

    watch(() => state.age, () => {
        return timer(1000).subscribe(() => {
            state.age += 1
            ageChange(state.age)
        })
    })

    watch(() => state.count, (value) => {
        console.log(value)
    })
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
