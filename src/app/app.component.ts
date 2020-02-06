import { Component } from "@angular/core"

@Component({
    selector: "app-root",
    template: `
        <app-test [age]="31"></app-test>
    `,
    styleUrls: ["./app.component.scss"],
    providers: [],
})
export class AppComponent {
    title = "ng9"

    constructor() {}
}
