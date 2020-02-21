import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Injectable,
    Input,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core"
import { Observable, of, OperatorFunction, timer } from "rxjs"
import { changes, Connect, Context, createEffect, Effect, effects, HostRef, latestFrom, State } from "@ng9/ng-effects"
import { Events, increment } from "../utils"
import { map, mapTo, repeat, switchMapTo, take } from "rxjs/operators"
import { Dispatch } from "../dispatch-adapter"

interface TestState {
    name: string
    age: number
    viewChild?: ElementRef
    viewChildren?: QueryList<ElementRef>
    events: MouseEvent | undefined
}

function toggleSwitch(source: Observable<boolean>): OperatorFunction<any, boolean> {
    return stream =>
        stream.pipe(
            switchMapTo(source),
            take(1),
            map(value => !value),
            repeat(),
        )
}

@Injectable()
export class TestEffects {
    // noinspection JSUnusedLocalSymbols
    /**
     * Effect factory with explicit binding example
     */
    public name = createEffect(
        (state: State<TestState>, context: Context<TestComponent>) => {
            return of({
                type: ""
            })
        },
        { adapter: Dispatch },
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
     * Assign example
     */
    @Effect({ assign: true })
    public bindAll(state: State<TestState>) {
        return latestFrom(state).pipe(mapTo({}))
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
    @Effect("age")
    public age(state: State<TestState>) {
        return timer(1000).pipe(switchMapTo(state.age), increment(1), take(1), repeat())
    }

    /**
     * Output binding example
     */
    @Effect({ whenRendered: true })
    public ageChange(state: State<TestState>, context: Context<TestComponent>) {
        return changes(state.age).subscribe(context.ageChange)
    }

    /**
     * Pure side effect example
     */
    @Effect()
    public sideEffect(state: State<TestState>) {
        return changes(state.age).subscribe(() => {
            // do something here
        })
    }

    /**
     * Template event binding example
     */
    @Effect()
    public clicked(state: State<TestState>) {
        return changes(state.events).subscribe(event => console.log(`click:`, event))
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

    /**
     * Dispatch adapter example
     */
    @Effect(Dispatch, { whenRendered: true })
    public dispatch() {
        return of({
            type: "MY_ACTION",
            payload: {
                value: "any",
            },
        })
    }

    @Effect("show")
    public toggleShow(state: State<TestComponent>) {
        const { show } = state
        return changes(state.events).pipe(toggleSwitch(show))
    }
}

@Component({
    selector: "app-test",
    template: `
        <p>test works!</p>
        <p>Name: {{ name }}</p>
        <p>Age: {{ age }}</p>
        <div #test *ngIf="show">Showing</div>
        <p>
            <ng-content></ng-content>
        </p>
    `,
    styleUrls: ["./test.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [effects(TestEffects, { markDirty: true })],
    host: {
        "(click)": "events= $event //noinspection UnresolvedVariable",
    },
})
export class TestComponent implements TestState {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: Events<number>

    @ViewChild("test")
    public viewChild?: ElementRef

    @ViewChildren("test")
    public viewChildren?: QueryList<ElementRef>

    public show: boolean

    public events: MouseEvent | undefined

    constructor(connect: Connect) {
        this.name = "abc"
        this.age = 0
        this.ageChange = new Events()
        this.events = undefined
        this.show = true

        connect(this)
    }
}
