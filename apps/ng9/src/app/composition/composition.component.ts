import { Component, Input, Output, QueryList, ViewChildren } from "@angular/core"
import {
    connect,
    HostEmitter,
    useAssign,
    useEmit,
    useState,
    useTeardown,
    whenRendered,
} from "@ng9/ng-effects"
import { debounceTime, map, take } from "rxjs/operators"
import { increment } from "../utils"
import { useDispatch, useMapStateToProps, useShouldComponentUpdate } from "./utils"
import { AppState } from "../test/test.component"
import { Store } from "../store"

export const Composition = connect(() => {
    const state = useState<CompositionComponent>()
    const { age } = state
    const assign = useAssign<CompositionComponent>()
    const emit = useEmit<CompositionComponent>()
    const dispatch = useDispatch(Store)
    const shouldComponentUpdate = useShouldComponentUpdate()
    const teardown = useTeardown()
    const mapStateToProps = useMapStateToProps<AppState, CompositionComponent>(Store)

    assign({
        age: age.pipe(debounceTime(1000), increment(1)),
    })

    emit({
        ageChange: age.changes,
    })

    mapStateToProps({
        age: state => state.age,
    })

    shouldComponentUpdate(age.pipe(map(age => age < 50)))

    teardown(age.subscribe(value => console.log(value)))

    whenRendered(() => {
        dispatch(
            age.pipe(
                map(age => ({
                    type: "NameChange",
                    payload: age,
                })),
                take(1),
            ),
        )
    })
})

export const Multiply = connect(() => {
    const assign = useAssign<CompositionComponent>()
    const { count } = useState<CompositionComponent>()

    assign({
        count: count.pipe(
            debounceTime(1000),
            map(value => value * 2),
        ),
    })
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
    name = ""
    count = 1

    @Input()
    age = 30

    @Output()
    ageChange = new HostEmitter<number>(true)

    @ViewChildren("element")
    viewChildren?: QueryList<any>

    constructor() {
        connect(this)
    }
}
