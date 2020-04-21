import { ChangeDetectionStrategy, Component, ViewChild } from "@angular/core"
import { changes, Effect, HostRef, State } from "@ng9/ng-effects"
import { distinctUntilChanged, map } from "rxjs/operators"

@Component({
    selector: "app-root",
    template: `
        <app-composition [(count)]="count"></app-composition>
        <button (click)="incrementCount()">Increment</button>
        <!--        <app-test [age]="age" (ageChange)="age = $event">-->
        <!--            <app-test *ngIf="show">Nested!</app-test>-->
        <!--        </app-test>-->
    `,
    styleUrls: ["./app.component.scss"],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    title = "ng9"
    show: boolean
    age: number
    count = 10

    @ViewChild(HostRef)
    ref?: HostRef

    constructor() {
        this.show = false
        this.age = 31

        // imperative change detection should propagate to effects
        // ie. when inputs are changed
        // interval(10000).subscribe(() => {
        //     this.age = 30
        //     viewRenderer.markDirty(this, cdr)
        // })

        // connect(this)
    }

    /**
     * Inline effect example
     */

    @Effect("show", { whenRendered: true })
    public toggleShow(state: State<AppComponent>) {
        return changes(state.age).pipe(
            map(age => age > 35),
            distinctUntilChanged(),
        )
    }

    incrementCount() {
        this.count += 10
    }
}
