import { NgModule } from "@angular/core"
import { RouterModule } from "@angular/router"

@NgModule({
    imports: [
        RouterModule.forRoot([
            {
                path: "",
                loadChildren: () =>
                    import("./todolist.component").then(
                        (m) => m.TodolistModule,
                    ),
            },
        ]),
    ],
    exports: [RouterModule],
})
export class RoutingModule {}
