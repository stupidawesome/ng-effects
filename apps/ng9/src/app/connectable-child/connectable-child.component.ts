import { Component, InjectFlags } from "@angular/core"
import { Connectable, inject } from "@ng9/ng-effects"
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
    ngOnConnect(): void {
        console.log("child!", inject(TEST))
    }
}
