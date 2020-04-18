import { Component, Input, Output, QueryList, ViewChildren } from "@angular/core"
import { connect, HostEmitter, setup, use, useContext, useEffect, useState } from "@ng9/ng-effects"
import { share } from "rxjs/operators"
import { useStore } from "./utils"
import { AppState } from "../test/test.component"
import { Store } from "../store"
import { HttpClient } from "@angular/common/http"
import { interval } from "rxjs"

const sharedTimer = interval(1000).pipe(share())

export const Composition = setup(() => {
    const http = use(HttpClient)
    const { ageChange } = useContext<CompositionComponent>()
    const {
        age: [age, setAge],
        name: [name],
        count: [count],
    } = useState<CompositionComponent>()
    const dispatch = useStore<AppState, CompositionComponent>(Store, {
        age: state => state.age,
    })

    useEffect(() => {
        dispatch({
            type: "NameChange",
            payload: age(),
        })
    }, [name])

    useEffect(() => ageChange.emit(age()), [age])

    useEffect(() => {
        return http.get<any>(name()).subscribe(res => console.log(res))
    }, [name])

    useEffect(() => {
        return sharedTimer.subscribe(() => {
            setAge(age() + 1)
        })
    }, [age])

    useEffect(() => {
        console.log("rendered", count())
    })
})

export const Multiply = setup(() => {
    const {
        count: [count, setCount],
    } = useState<CompositionComponent>()

    useEffect(() => {
        return sharedTimer.subscribe(() => {
            setCount(count() + 1)
        })
    }, [count])
})

@Component({
    selector: "app-composition",
    template: `
        <div #element>
            Age: {{ age }}<br />
            Count: {{ count }}
        </div>
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
    viewChildren?: QueryList<any>

    constructor() {
        this.name = ""
        this.count = 1
        this.age = 30
        this.ageChange = new HostEmitter<number>(true)
        this.viewChildren = undefined
        connect(this)
    }
}
