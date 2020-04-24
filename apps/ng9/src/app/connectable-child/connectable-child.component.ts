import { Component, Input } from "@angular/core"
import { Connectable, effect } from "@ng9/ng-effects"
import { TEST } from "../connectable/connectable.component"

@Component({
    selector: "app-connectable-child",
    templateUrl: "./connectable-child.component.html",
    styleUrls: ["./connectable-child.component.scss"],
    providers: [
        {
            provide: TEST,
            useExisting: ConnectableChildComponent,
        },
    ],
})
export class ConnectableChildComponent extends Connectable {
    @Input()
    count = 0

    ngOnConnect(): void {
        effect(() => {
            // double whatever input value is
            this.count *= 2
        })
    }
}
