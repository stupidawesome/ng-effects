import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core"
import {
    action,
    computed,
    effect,
    Fx,
    reactive,
    ref,
    watch,
    watchEffect,
} from "@ng9/ng-effects"
import { delay, map } from "rxjs/operators"

@Component({
    selector: "ngfx-test",
    template: ` <div>Num: {{ num }}</div> `,
    inputs: ["num"],
    outputs: ["test"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Test extends Fx(T) {}

function T() {
    const num = ref(3)
    const test = new EventEmitter()

    watch(num, (val) => {
        console.log("value!", num.value)
    })

    setInterval(() => {
        test.emit()
    }, 2000)

    return {
        num,
        test,
    }
}

@Component({
    selector: "ngfx-root",
    template: `
        <p>Count: {{ count }}</p>
        <p>Offset: {{ offset }}</p>
        <button (click)="increment(2)" #list>Increment</button>
        <ngfx-test [num]="count * 5" (test)="count = 0" #test></ngfx-test>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    queries: {
        list: new ViewChildren("list"),
        button: new ViewChild("list", { static: true }),
        test: new ViewChild("test", { static: true }),
    },
})
export class AppComponent extends Fx(App) {}

function App() {
    const count = ref(10)
    const offset = computed(() => count.value * 2)
    const list = ref(new QueryList<any>())
    const button = ref<HTMLElement>()
    const test = ref<Test>()
    const [increment] = action<number>().map(() => 3)
    const map1 = new Map()

    const state = reactive({
        count,
        offset,
        increment,
        list,
        button,
        test,
        map1,
    })

    state.increment(2)

    const [onIncrement] = effect(increment).run(
        delay(1000),
        map((num) => num * 5),
    )

    watch(increment, (value) => {
        count.value += value
    })

    watch(onIncrement, (value) => {
        count.value += value
    })

    watchEffect(() => {
        for (const div of list.value.toArray()) {
            console.log("div", div)
        }
    })

    watch(button, (value) => {
        console.log("button", value)
    })

    watch(test, (value) => {
        console.log("test", value)
    })

    return state
}
