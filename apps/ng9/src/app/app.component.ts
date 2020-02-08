import { Component, Injectable } from "@angular/core"
import { Connect, Effect, effects } from "@ng9/ng-effects"
import { interval } from "rxjs"
import { animationFrame } from "rxjs/internal/scheduler/animationFrame"
import { map } from "rxjs/operators"

@Injectable()
export class AppEffects {
    @Effect({ markDirty: true })
    public show(_: any, ctx: AppComponent) {
        return interval(2000, animationFrame).pipe(map(() => !ctx.show))
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
