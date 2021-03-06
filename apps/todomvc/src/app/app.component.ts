import { ChangeDetectionStrategy, Component, Injectable } from "@angular/core"
import {
    defineComponent,
    defineInjectable,
    effect,
    Effect,
    inject,
    observe,
    observeError,
    reactive,
    toRefs,
    watchEffect,
} from "@ng-effects/ng-effects"
import { mergeMap } from "rxjs/operators"
import { of, throwError } from "rxjs"

// TODO: update this file to use current API so it can be used as a real example

@Injectable()
export class AppService extends defineInjectable(() => {
    const state = reactive({
        count: 0,
    })

    watchEffect(() => {
        console.log("in service", state.count)
    })

    return toRefs(state)
}) {}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {},
    inputs: [],
    outputs: [],
    providers: [AppService],
    queries: {},
    selector: "ngfx-root",
    template: `
        <button (click)="increment()">Toggle visibility</button>
        <div>Count: {{ count }}</div>
        <router-outlet *ngIf="visible"></router-outlet>
    `,
})
export class AppComponent extends defineComponent(() => {
    const { count } = inject(AppService)
    const state = reactive({
        increment,
        count,
        visible: true,
    })
    const onIncrement: Effect<number> = effect<number>().pipe(
        mergeMap(() => {
            return Math.random() > 0.5 ? throwError("ERR") : of(3)
        }),
    )

    function increment() {
        onIncrement.next(1)
    }

    observe(onIncrement, (value) => {
        state.count += value
    })

    observeError(onIncrement, (value) => {
        console.error("error", value)
    })

    return state
}) {}
