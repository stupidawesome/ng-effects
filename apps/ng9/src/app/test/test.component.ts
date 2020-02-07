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
import { map, mapTo, switchMap } from "rxjs/operators"
import { MonoTypeOperatorFunction, of, SchedulerLike, timer } from "rxjs"
import { bindEffects, createEffect, Effect, Effects, queryList, State, withEffects } from "@ng9/ng-effects"

export function increment(by: number = 1): MonoTypeOperatorFunction<number> {
    return function(source) {
        return source.pipe(map(value => value + by))
    }
}

export function delayBounce<T>(
    time: number = 0,
    scheduler?: SchedulerLike,
): MonoTypeOperatorFunction<T> {
    return function(source) {
        return source.pipe(switchMap(age => timer(time, scheduler).pipe(mapTo(age))))
    }
}

export function $event(propName: string) {
    return `${propName} = $event`
}

@Injectable()
export class TestEffects implements Effect<TestComponent> {
    constructor(http: ElementRef) {
        console.log("injector works", http)
    }

    @Effect({ markDirty: true })
    public name() {
        /** this.http.get("someUrl") // could do something with http here **/
        return of("Stupidawesome")
    }

    @Effect({ markDirty: true })
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
        return state.clicked.subscribe(event => console.log(`click:`, event))
    }

    @Effect()
    public viewChild(state: State<TestComponent>) {
        return queryList(state.viewChild).subscribe(value =>
            console.log("view child available:", value),
        )
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
    providers: [withEffects(TestEffects)],
    host: {
        "(click)": $event("clicked"),
    },
})
export class TestComponent {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: EventEmitter<number>

    @ViewChildren("test")
    public viewChild: QueryList<ElementRef>

    public clicked: MouseEvent | null

    public show: boolean

    constructor(cdr: ChangeDetectorRef, effects: Effects) {
        this.name = ""
        this.age = 0
        this.ageChange = new EventEmitter()
        this.show = false
        this.viewChild = new QueryList()
        this.clicked = null

        setInterval(() => {
            this.show = !this.show
            cdr.markForCheck()
        }, 1000)

        effects.bind(this)
    }
}
