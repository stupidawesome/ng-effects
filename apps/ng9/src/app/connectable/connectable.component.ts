import { Component, ContentChildren, InjectionToken, Input, Output, QueryList } from "@angular/core"
import {
    afterViewInit,
    connectable,
    Connectable,
    effect,
    HostEmitter,
    inject,
    reactive,
    watchEffect,
} from "@ng9/ng-effects"
import { interval, timer } from "rxjs"
import { HttpClient } from "@angular/common/http"

export const MyConnectable = connectable<ConnectableComponent>(ctx => {
    const test = reactive({
        test: {
            test: 1,
        },
    })

    watchEffect(() => {
        void test.test.test
        return timer(1000).subscribe(() => {
            test.test.test++
        })
    })

    effect(() => {
        return interval(250).subscribe(() => {
            ctx.count2 += 1
        })
    })

    afterViewInit(() => {
        // console.log(ctx.children)
    })

    watchEffect(() => {
        ctx.offset = ctx.count + 1
        ctx.countChange.emit(ctx.count)
        return timer(1000).subscribe(() => {
            ctx.incrementCount()
        })
    })
})

export const TEST = new InjectionToken<number>("TEST")

@Component({
    selector: "app-connectable",
    template: `
        <div>Count: {{ count }}</div>
        <div>Count + 1: {{ offset }}</div>
        <br />
        <div>Count2: {{ count2 }}</div>
        <app-connectable-child [count]="count2"></app-connectable-child>
        <ng-content></ng-content>
    `,
    styleUrls: ["./connectable.component.scss"],
    providers: [
        MyConnectable,
        {
            provide: TEST,
            useExisting: ConnectableComponent,
        },
    ],
})
export class ConnectableComponent extends Connectable {
    @Input()
    count = 0
    count2 = 1
    offset = 2

    http = inject(HttpClient)

    @Output()
    countChange = new HostEmitter<number>()

    @ContentChildren("test")
    children: QueryList<any> = new QueryList()

    incrementCount() {
        this.count += 1
    }
}
