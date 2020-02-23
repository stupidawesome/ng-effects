import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from "@angular/core"
import { changes, Connect, Effect, HOST_EFFECTS, HostRef, State } from "@ng9/ng-effects"
import { interval } from "rxjs"
import { distinctUntilChanged, map } from "rxjs/operators"
import { TestComponent } from "./test/test.component"
import { ViewRenderer } from "../../../../libs/ng-effects/src/lib/internals/view-renderer"

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

    constructor(
        connect: Connect,
        cdr: ChangeDetectorRef,
        viewRenderer: ViewRenderer,
        host: HostRef,
    ) {
        this.show = false
        this.age = 31

        // imperative change detection should propagate to effects
        // ie. when inputs are changed
        interval(10000).subscribe(() => {
            this.age = 30
            viewRenderer.markDirty(host, cdr)
        })

        connect(this)
    }

    /**
     * Inline effect example
     */

    @Effect("show", { markDirty: true })
    public toggleShow(state: State<AppComponent>) {
        return changes(state.age).pipe(
            map(age => age > 35),
            distinctUntilChanged(),
        )
    }
}
