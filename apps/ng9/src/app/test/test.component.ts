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
import { of, Subject, timer } from "rxjs"
import {
    Connect,
    createEffect,
    Effect,
    Effects,
    effects,
    Events,
    HostRef,
    State,
} from "@ng9/ng-effects"
import { increment } from "../utils"
import { delay, mapTo, repeat, switchMapTo, take } from "rxjs/operators"

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
    /**
     * Effect factory with explicit binding example
     */
    public name = createEffect(
        (state: State<TestState>, ctx: TestComponent) => {
            return timer(1000).pipe(mapTo("stupidawesome"))
        },
        { bind: "name", markDirty: true },
    )

    // noinspection JSUnusedLocalSymbols
    /**
     * Injector example with special tokens
     * HostRef can be injected to get host context
     */
    constructor(private elementRef: ElementRef, hostRef: HostRef<TestComponent>) {}

    /**
     * Effect decorator with explicit binding example
     */
    @Effect("name") // or
    @Effect({ bind: "name" })
    public bindName(_: State<TestState>) {
        return of("abc")
    }

    /**
     * Apply example
     */
    @Effect({ apply: true })
    public bindAll(_: State<TestState>) {
        return of({
            name: "111",
        }).pipe(delay(500))
    }

    /**
     * Suppress binding type check when type cannot be inferred from arguments
     * Bindings will still be checked at runtime
     */
    @Effect<any>("name")
    public suppressTypeChecking() {
        // do unsafe side effect
    }

    /**
     * Void effect example
     */
    @Effect()
    public withNoArgs() {
        // do side effect
    }

    /**
     * Property binding example
     */
    @Effect()
    public age(state: State<TestState>) {
        return timer(1000).pipe(switchMapTo(state.age), increment(1), take(1), repeat())
    }

    /**
     * Output binding example
     */
    @Effect()
    public ageChange(state: State<TestState>, ctx: TestComponent) {
        return state.age.changes.subscribe(ctx.ageChange)
    }

    /**
     * Pure side effect example
     */
    @Effect()
    public sideEffect(state: State<TestState>) {
        return state.age.changes.subscribe(() => {
            // do something here
        })
    }

    /**
     * Template event binding example
     */
    @Effect()
    public clicked(state: State<TestState>, ctx: TestComponent) {
        return ctx.events.subscribe(event => console.log(`click:`, event))
    }

    /**
     * ViewChild example
     */
    @Effect({ whenRendered: true })
    public viewChild(state: State<TestState>) {
        return state.viewChild.subscribe()
    }

    /**
     * ViewChildren example
     */
    @Effect({ whenRendered: true })
    public viewChildren(state: State<TestState>) {
        return state.viewChildren.subscribe()
    }

    /**
     * TeardownLogic example
     */
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
    providers: [effects(TestEffects, { markDirty: true })],
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
