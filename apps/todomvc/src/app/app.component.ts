import { Component } from "@angular/core"

@Component({
    selector: "ngfx-root",
    template: `
        <button (click)="visible = !visible">Toggle visibility</button>
        <router-outlet *ngIf="visible"></router-outlet>
    `,
})
export class AppComponent {
    visible = true
    title = "app"
}
