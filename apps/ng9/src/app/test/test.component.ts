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
import { interval, merge, MonoTypeOperatorFunction, Observable, of, OperatorFunction } from "rxjs"
import {
    changes,
    connect,
    Context,
    Effect,
    EffectAdapter,
    EffectMetadata,
    Effects,
    HostEmitter,
    HostRef,
    Observe,
    State,
} from "@ng9/ng-effects"
import { increment } from "../utils"
import {
    distinctUntilChanged,
    map,
    mapTo,
    repeat,
    repeatWhen,
    switchMapTo,
    take,
} from "rxjs/operators"
import { Dispatch } from "../dispatch-adapter"
import { Store } from "../store"

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
function repeatInterval<T>(time: number): MonoTypeOperatorFunction<T> {
    return function(source) {
        return source.pipe(repeatWhen(() => interval(time)))
    }
}

export function select<T, U>(selector: (state: T) => U): OperatorFunction<T, U> {
    return function(source) {
        return source.pipe(map(selector), distinctUntilChanged())
    }
}

type MapStateToProps<T, U> = {
    [key in keyof U]?: (state: T) => U[key]
}

@Injectable({ providedIn: "root" })
export class Select implements EffectAdapter<MapStateToProps<any, any>> {
    constructor(private store: Store<any>) {}

    public create(mapState: MapStateToProps<any, any>, metadata: EffectMetadata) {
        metadata.options.assign = true

        const sources = Object.entries(mapState).map(([prop, selector]) =>
            this.store.pipe(
                select(selector!),
                map(value => ({ [prop]: value })),
            ),
        )

        return merge(...sources)
    }
}

export interface AppState {
    age: number
}

export const selectAge = (state: AppState) => {
    return state.age || 0
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
        return changes(state).pipe(mapTo({}))
    }

    /**
     * Select adapter example
     */
    @Effect(Select)
    public mapStateToProps(): MapStateToProps<AppState, TestComponent> {
        return {
            age: selectAge,
        }
    }

    /**
     * Unsafe bind example
     */
    @Effect("age")
    public withNoArgs() {
        // return 3
    }

    // noinspection JSUnusedLocalSymbols
    /**
     * Side effect with default options example
     */
    @Effect({ whenRendered: true })
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
        return state.age.pipe(take(1), increment(1), repeatInterval(1000))
    }

    /**
     * Output binding example
     */
    @Effect("ageChange")
    public ageChange(state: State<TestState>) {
        return state.age
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
    public clicked(
        @Context() context: Context<TestState>,
        @Observe() host: Observable<any>,
        @State() state: State<any>,
    ) {
        // console.log('context', context)
        // console.log('state', state)
        // console.log('host', host)
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
        return state.event.pipe(toggleSwitch(show))
    }
}

@Injectable()
export class ShouldComponentUpdate implements EffectAdapter<boolean> {
    constructor(private cdr: ChangeDetectorRef) {
        this.cdr.detach()
    }

    next(shouldUpdate: boolean) {
        if (shouldUpdate) {
            this.cdr.reattach()
        } else {
            this.cdr.detach()
        }
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
    providers: [Effects, TestEffects, ShouldComponentUpdate],
})
export class TestComponent implements TestState {
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
        this.ageChange = new HostEmitter(true)
        this.event = new HostEmitter()
        this.show = true

        connect(this)
    }

    @Effect(ShouldComponentUpdate)
    shouldComponentUpdate(state: State<TestComponent>) {
        return state.age.pipe(mapTo(true))
    }
}
