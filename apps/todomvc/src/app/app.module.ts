import { BrowserModule } from "@angular/platform-browser"
import { NgModule } from "@angular/core"
import { AppComponent } from "./app.component"
import { RoutingModule } from "./routing.module"
import { HttpClientModule } from "@angular/common/http"

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, RoutingModule, HttpClientModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
