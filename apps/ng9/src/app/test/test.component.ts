import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Injectable,
    Input,
    Output,
    QueryList,
    ViewChildren,
} from "@angular/core"
import { of } from "rxjs"
import { Connect, Effect, Effects, effects, State } from "@ng9/ng-effects"
import { $event, delayBounce, increment } from "../utils"

export type Maybe<T> = T | undefined

interface TestState {
    name: string
    age: number
    viewChild?: ElementRef
    viewChildren?: QueryList<ElementRef>
}

@Injectable()
export class TestEffects implements Effects<TestComponent> {
    constructor(http: ElementRef) {
        console.log("injector works", http)
    }

    @Effect()
    public name() {
        /** this.http.get("someUrl") // could do something with http here **/
        return of("Stupidawesome")
    }

    @Effect()
    public age(state: State<TestComponent>) {
        return state.age.pipe(delayBounce(1000), increment(1))
    }

    @Effect()
    public ageChange(state: State<TestComponent>, component: TestComponent) {
        return state.age.subscribe(component.ageChange)
    }

    @Effect()
    public sideEffect(state: State<TestComponent>) {
        return state.age.subscribe(age => console.log(`age changed: ${age}`))
    }

    @Effect()
    public clicked(state: State<TestComponent>) {
        return state.clicked.changes.subscribe(event => console.log(`click:`, event))
    }

    @Effect()
    public viewChild(state: State<TestComponent>) {
        return state.viewChild.subscribe(value => console.log("view child available:", value))
    }
}

@Component({
    selector: "app-test",
    template: `
        <p>test works!</p>
        <p>Name: {{ name }}</p>
        <p>Age: {{ age }}</p>
        <div *ngIf="show" #test>Showing</div>
    `,
    styleUrls: ["./test.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [effects([TestEffects], { whenRendered: true, markDirty: true })],
    host: {
        "(click)": $event("clicked"),
    },
})
export class TestComponent implements TestState {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: EventEmitter<number>

    @ViewChildren("test")
    public viewChild: Maybe<ElementRef>

    @ViewChildren("test")
    public viewChildren: Maybe<QueryList<ElementRef>>

    public clicked: Maybe<MouseEvent>

    public show: boolean

    constructor(cdr: ChangeDetectorRef, connect: Connect) {
        this.name = "abc"
        this.age = 0
        this.ageChange = new EventEmitter()
        this.show = false
        this.clicked = undefined
        this.viewChild = undefined
        this.viewChildren = undefined

        connect(this)
    }
}
