import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Injectable,
    Input,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core"
import { Observable, of, OperatorFunction, timer } from "rxjs"
import {
    changes,
    connect,
    Context,
    Effect,
    EffectAdapter,
    effects,
    HostEmitter,
    HostRef,
    Observe,
    State,
} from "@ng9/ng-effects"
import { increment } from "../utils"
import { distinctUntilChanged, map, repeat, switchMapTo, take } from "rxjs/operators"
import { Dispatch } from "../dispatch-adapter"

interface TestState {
    name: string
    age: number
    viewChild?: ElementRef
    viewChildren?: QueryList<ElementRef>
    event: HostEmitter<MouseEvent | undefined>
    ageChange: HostEmitter<number>
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
     * Injector example with special tokens
     * HostRef can be injected to get host context.
     */
    constructor(private elementRef: ElementRef, hostRef: HostRef, private cdr: ChangeDetectorRef) {}

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
    public bindAll(state: State<TestComponent>) {
        return changes(state).pipe(take(1))
    }

    /**
     * Void effect example
     */
    @Effect()
    public withNoArgs() {
        // do side effect
    }

    // noinspection JSUnusedLocalSymbols
    /**
     * Side effect with default options example
     */
    @Effect({ bind: "name", whenRendered: true })
    public withDefaultArgs(
        context: State<TestComponent>,
        state: Context<TestComponent>,
        observer: Observable<TestComponent>,
    ) {
        // do side effect
        return of("")
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
    public ageChange(state: State<TestState>) {
        return changes(state.age).subscribe(state.ageChange)
    }

    // noinspection JSUnusedLocalSymbols
    /**
     * Pure side effect example
     */
    @Effect()
    public sideEffect(
        state: State<TestState>,
        context: Context<TestState>,
        observer: Observable<TestState>,
    ) {
        return changes(state.age).subscribe(() => {
            // do something here
        })
    }

    /**
     * Template event binding example
     */
    @Effect()
    public clicked(@Context() context: Context<TestState>) {
        // return state.event.subscribe()
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
    public dispatch(_: State<TestComponent>) {
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
        return state.event.pipe(toggleSwitch(show))
    }
}

export interface IShouldComponentUpdate {
    shouldComponentUpdate(): boolean
}

@Injectable()
export class ShouldComponentUpdate implements EffectAdapter<boolean> {
    constructor(private cdr: ChangeDetectorRef) {
        this.cdr.detach()
    }

    public next(value: boolean): void {
        if (value) {
            this.cdr.reattach()
        } else {
            this.cdr.detach()
        }
    }

    @Effect(ShouldComponentUpdate)
    shouldComponentUpdate(
        @Observe() observer: Observable<any>,
        @Context() context: Context<IShouldComponentUpdate>,
    ): Observable<boolean> {
        return observer.pipe(map(context.shouldComponentUpdate, context), distinctUntilChanged())
    }
}

export const NONE = undefined

@Component({
    selector: "app-test",
    template: `
        <p (click)="event($event)">test works!</p>
        <p>Name: {{ name }}</p>
        <p>Age: {{ age }}</p>
        <div #test *ngIf="show">Showing</div>
        <p>
            <ng-content></ng-content>
        </p>
    `,
    styleUrls: ["./test.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [effects([TestEffects, ShouldComponentUpdate])],
})
export class TestComponent implements TestState, IShouldComponentUpdate {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: HostEmitter<number>

    @ViewChild("test")
    public viewChild?: ElementRef = NONE

    @ViewChildren("test")
    public viewChildren?: QueryList<ElementRef> = NONE

    public show: boolean

    @HostListener("ageChange")
    public event: HostEmitter<MouseEvent | undefined>

    constructor() {
        this.name = "abc"
        this.age = 0
        this.ageChange = new HostEmitter()
        this.event = new HostEmitter()
        this.show = true

        connect(this)
    }

    shouldComponentUpdate() {
        return this.age > 35
    }
}
