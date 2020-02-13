import { Component, ɵmarkDirty as markDirty } from "@angular/core"
import { Connect, Effect, HOST_EFFECTS, State } from "@ng9/ng-effects"
import { interval, Observable, SchedulerLike, timer } from "rxjs"
import { distinctUntilChanged, map, mapTo, switchMap, take, tap } from "rxjs/operators"

export function toggleInterval(
    source: Observable<boolean>,
    time: number = 0,
    scheduler?: SchedulerLike,
) {
    return interval(time, scheduler).pipe(
        switchMap(() =>
            source.pipe(
                map(value => !value),
                take(1),
            ),
        ),
    )
}

@Component({
    selector: "app-root",
    template: `
        <app-test [age]="age" (ageChange)="setState(age = $event)">
            <app-test *ngIf="show">Nested!</app-test>
        </app-test>
    `,
    styleUrls: ["./app.component.scss"],
    providers: [HOST_EFFECTS],
})
export class AppComponent {
    title = "ng9"
    show: boolean
    age: number

    constructor(connect: Connect) {
        this.show = false
        this.age = 31
        connect(this)
    }

    /**
     * Inline effect example
     */
    @Effect("age", { markDirty: true })
    public resetAge(state: State<AppComponent>) {
        return interval(4000).pipe(
            mapTo(30)
        )
    }

    @Effect("show", { markDirty: true })
    public toggleShow(state: State<AppComponent>) {
        return state.age.pipe(
            tap(() => console.log('age changed!')),
            map((age) => age > 33),
        )
    }

    public setState(args: any) {
        markDirty(this)
    }
}
