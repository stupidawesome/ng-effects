import { ChangeDetectionStrategy, Component, EventEmitter, QueryList, ViewChildren } from "@angular/core"
import { action, computed, effect, Fx, reactive, ref, watch, watchEffect } from "./ngfx"
import { delay, map } from "rxjs/operators"

@Component({
    selector: "ngfx-test",
    template: `
        <div>
            Num: {{ num }}
        </div>
    `,
    inputs: ["num"],
    outputs: ["test"]
})
export class Test extends Fx(T) {
}

function T() {
    const num = ref(3)
    const test = new EventEmitter()

    watch(num, (val) => {
        console.log('value!', num.value)
    })

    setInterval(() => {
        test.emit()
    }, 2000)

    return {
        num,
        test
    }
}

@Component({
    selector: "ngfx-root",
    template: `
        <p>Count: {{ count }}</p>
        <p>Offset: {{ offset }}</p>
        <button (click)="increment(1)" #list>Increment</button>
        <ngfx-test [num]="count * 5" (test)="count = 0"></ngfx-test>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    queries: {
        list: new ViewChildren("list")
    }
})
export class AppComponent extends Fx(App) {}

function App() {
    const count = ref(10)
    const offset = computed({
        get: () => count.value * 2,
        set: (val) => {
            count.value = val - 1
        },
    })
    const list = ref(new QueryList<any>())

    const increment = action<number>()

    const state = reactive({
        count,
        list,
        offset,
        increment
    })

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
            console.log('div', div)
        }
    })

    return {
        count,
        offset,
        increment,
        list
    }
}
