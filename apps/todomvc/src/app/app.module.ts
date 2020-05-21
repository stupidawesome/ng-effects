import { BrowserModule } from "@angular/platform-browser"
import { NgModule } from "@angular/core"

import { AppComponent, Test } from "./app.component"
import { RoutingModule } from "./routing.module"
import { HttpClientModule } from "@angular/common/http"
import { TestComponent } from "./todolist.component"

@NgModule({
    declarations: [AppComponent, TestComponent, Test],
    imports: [BrowserModule, RoutingModule, HttpClientModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
