import { Component, Injectable } from "@angular/core"
import { Connect, Effect, effects, State } from "@ng9/ng-effects"
import { interval, Observable, SchedulerLike } from "rxjs"
import { map, switchMap, take } from "rxjs/operators"

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

@Injectable()
export class AppEffects {
    @Effect({ markDirty: true })
    public show({ show }: State<AppComponent>) {
        return toggleInterval(show, 2000)
    }
}

@Component({
    selector: "app-root",
    template: `
        <app-test [age]="31">
            <app-test *ngIf="show">Nested!</app-test>
        </app-test>
    `,
    styleUrls: ["./app.component.scss"],
    providers: [effects([AppEffects])],
})
export class AppComponent {
    title = "ng9"
    show: boolean

    constructor(connect: Connect) {
        this.show = false
        connect(this)
    }
}
