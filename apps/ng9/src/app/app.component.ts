import { ChangeDetectionStrategy, Component } from "@angular/core"
import { Connect, Effect, HOST_EFFECTS, State } from "@ng9/ng-effects"
import { animationFrameScheduler, interval } from "rxjs"
import { distinctUntilChanged, map, mapTo } from "rxjs/operators"

@Component({
    selector: "app-root",
    template: `
        <app-test *ngFor="let t of a" [age]="age"></app-test>
    `,
    styleUrls: ["./app.component.scss"],
    providers: [HOST_EFFECTS],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    title = "ng9"
    show: boolean
    age: number
    a = Array.from({ length: 500 })

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
        return interval(1000, animationFrameScheduler).pipe(mapTo(30))
    }

    @Effect("show", { markDirty: true })
    public toggleShow(state: State<AppComponent>) {
        return state.age.pipe(
            map(age => age > 35),
            distinctUntilChanged(),
        )
    }
}
