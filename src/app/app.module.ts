import { BrowserModule } from "@angular/platform-browser"
import { NgModule } from "@angular/core"

import { AppComponent } from "./app.component"
import { TestComponent } from "./test/test.component"
import { HttpClientModule } from "@angular/common/http"

@NgModule({
    declarations: [AppComponent, TestComponent],
    imports: [BrowserModule, HttpClientModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
