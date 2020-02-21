import { ChangeDetectionStrategy, Component, ViewChild } from "@angular/core"
import { Connect, Effect, HOST_EFFECTS, HostRef, State } from "@ng9/ng-effects"
import { interval } from "rxjs"
import { distinctUntilChanged, map, mapTo } from "rxjs/operators"
import { TestComponent } from "./test/test.component"

@Component({
    selector: "app-root",
    template: `
        <app-test [age]="age" (ageChange)="age = $event">
            <app-test *ngIf="show">Nested!</app-test>
        </app-test>
    `,
    styleUrls: ["./app.component.scss"],
    providers: [HOST_EFFECTS],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    title = "ng9"
    show: boolean
    age: number

    @ViewChild(TestComponent, { read: HostRef })
    ref?: HostRef<any>

    constructor(connect: Connect) {
        this.show = false
        this.age = 31

        connect(this)
    }

    /**
     * Inline effect example
     */
    @Effect("age", { markDirty: true })
    public resetAge(_: State<AppComponent>) {
        return interval(10000).pipe(mapTo(30))
    }

    @Effect("show", { markDirty: true })
    public toggleShow(state: State<AppComponent>) {
        return state.age.pipe(
            map(age => age > 35),
            distinctUntilChanged(),
        )
    }
}
