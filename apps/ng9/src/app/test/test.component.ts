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
import { Effect, Effects, withEffects, State } from "../reactive-component"
import { mapTo, skip, switchMap } from "rxjs/operators"
import { BehaviorSubject, of, timer } from "rxjs"
import { HttpClient } from "@angular/common/http"

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
}

function observe(obj: any, props: string[]) {
    const observer = {}
    for (const name of props) {
        const property = new BehaviorSubject(obj[name])

        Object.defineProperty(property, "changes", {
            value: property.asObservable().pipe(skip(1)),
        })

        Object.defineProperty(observer, name, {
            get() {
                return property
            },
            set(source) {
                source.subscribe((value: any) => {
                    obj[name] = value
                })
            },
        })
    }

    return observer
}

function RunEffects(): ClassDecorator {
    return function<T extends object & { prototype: any }>(klass: T): any {
        const paramIndex = effectsMap.get(klass)

        return new Proxy(klass, {
            construct(target: any, argArray: any) {
                const obj = new target(...argArray)
                const ownProperties = Object.getOwnPropertyNames(obj)
                const observer: any = observe(obj, ownProperties)

                for (const name of ownProperties) {
                    let value: any
                    const propertyObserver = observer[name]
                    Object.defineProperty(obj, name, {
                        get() {
                            return value
                        },
                        set(_value) {
                            if (value !== _value) {
                                value = _value
                                propertyObserver.next(value)
                            }
                        },
                    })
                }
                const effects: Effects = argArray[paramIndex]

                effects.run(obj, observer)

                return obj
            },
        })
    }
}

const effectsMap = new Map()

function UseEffects(): ParameterDecorator {
    return function(target: any, propertyKey, parameterIndex) {
        effectsMap.set(target, parameterIndex)
    }
}

const host = {
    "(click)": "clicked = $event",
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
    host,
})
@RunEffects()
export class TestComponent {
    @Input()
    public name: string

    @Input()
    public age: number

    @Output()
    public ageChange: EventEmitter<number>

    public clicked: MouseEvent | null

    @ViewChild("test", { static: false })
    public test: ElementRef | null

    constructor(@UseEffects() effects: Effects) {
        this.name = ""
        this.age = 0
        this.ageChange = new EventEmitter()
        this.clicked = null
        this.test = null
    }
}
