import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Injectable,
    Input,
    Output,
    ViewChild,
} from "@angular/core"
import { mapTo, switchMap } from "rxjs/operators"
import { of, timer } from "rxjs"
import { HttpClient } from "@angular/common/http"
import { Effect, Effects, RunEffects, State, UseEffects, withEffects } from "@ng9/ng-effects"

@Injectable()
export class TestEffects implements Effect<TestComponent> {
    constructor(http: HttpClient) {
        console.log("injector works", http)
    }

    @Effect({ markDirty: true })
    public name() {
        /** this.http.get("someUrl") // could do something with http here **/
        return of("Stupidawesome")
    }

    @Effect({ markDirty: true })
    public age(state: State<TestComponent>) {
        return state.age.pipe(switchMap(age => timer(1000).pipe(mapTo(age + 1))))
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
        return state.viewChild.changes.subscribe(value =>
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
        <div #test></div>
    `,
    styleUrls: ["./test.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [withEffects(TestEffects)],
    host: {
        "(click)": "clicked = $event",
    },
})
@RunEffects()
export class TestComponent {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: EventEmitter<number>

    @ViewChild("test", { static: false })
    public viewChild: ElementRef | null

    public clicked: MouseEvent | null

    constructor(@UseEffects() effects: Effects) {
        this.name = ""
        this.age = 0
        this.ageChange = new EventEmitter()
        this.clicked = null
        this.viewChild = null
    }
}
