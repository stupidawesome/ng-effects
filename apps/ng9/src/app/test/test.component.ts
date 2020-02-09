import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Injectable,
    Input,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core"
import { animationFrameScheduler, Subject, timer } from "rxjs"
import { Connect, createEffect, Effect, Effects, effects, Events, State } from "@ng9/ng-effects"
import { delayBounce, increment } from "../utils"
import { mapTo } from "rxjs/operators"

export type Maybe<T> = T | undefined

interface TestState {
    name: string
    age: number
    viewChild: Maybe<ElementRef>
    viewChildren: Maybe<QueryList<ElementRef>>
}

@Injectable()
export class TestEffects implements Effects<TestComponent> {
    // noinspection JSUnusedLocalSymbols
    public name = createEffect((state: State<TestState>, component: TestComponent) => {
        return timer(1000).pipe(mapTo("stupidawesome"))
    })

    constructor(http: ElementRef) {
        console.log("injector works", http)
    }

    @Effect()
    public age(state: State<TestState>) {
        return state.age.pipe(delayBounce(1000, animationFrameScheduler), increment(1))
    }

    @Effect()
    public ageChange(state: State<TestState>, component: TestComponent) {
        return state.age.changes.subscribe(component.ageChange)
    }

    @Effect()
    public sideEffect(state: State<TestState>) {
        return state.age.changes.subscribe(age => console.log(`age changed: ${age}`))
    }

    @Effect()
    public clicked(state: State<TestState>, component: TestComponent) {
        return component.events.subscribe(event => console.log(`click:`, event))
    }

    @Effect({ whenRendered: true })
    public viewChild(state: State<TestState>) {
        return state.viewChild.subscribe(value => console.log("viewChild available:", value))
    }

    @Effect({ whenRendered: true })
    public viewChildren(state: State<TestState>) {
        return state.viewChildren.subscribe(value => console.log("viewChildren available:", value))
    }

    @Effect()
    public imperative(state: State<TestState>) {
        const sub = state.age.subscribe()
        return function() {
            // teardown logic
            sub.unsubscribe()
        }
    }
}

@Component({
    selector: "app-test",
    template: `
        <p>test works!</p>
        <p>Name: {{ name }}</p>
        <p>Age: {{ age }}</p>
        <div #test>Showing</div>
        <p>
            <ng-content></ng-content>
        </p>
    `,
    styleUrls: ["./test.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [effects([TestEffects], { markDirty: true })],
    host: {
        "(click)": "events.next($event)",
    },
})
export class TestComponent implements TestState, Events<MouseEvent> {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: EventEmitter<number>

    @ViewChild("test")
    public viewChild: Maybe<ElementRef>

    @ViewChildren("test")
    public viewChildren: Maybe<QueryList<ElementRef>>

    public events: Subject<MouseEvent>

    public show: boolean

    constructor(connect: Connect) {
        this.name = "abc"
        this.age = 0
        this.ageChange = new EventEmitter()
        this.show = true
        this.events = new Subject()
        this.viewChild = undefined
        this.viewChildren = undefined

        connect(this)
    }
}
