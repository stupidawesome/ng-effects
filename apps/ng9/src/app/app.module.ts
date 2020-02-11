import { BrowserModule } from "@angular/platform-browser"
import { NgModule } from "@angular/core"

import { AppComponent } from "./app.component"
import { TestComponent } from "./test/test.component"
import { HttpClientModule } from "@angular/common/http"
// noinspection ES6UnusedImports
import { USE_EXPERIMENTAL_RENDER_API } from "@ng9/ng-effects"

@NgModule({
    declarations: [AppComponent, TestComponent],
    imports: [BrowserModule, HttpClientModule],
    // providers: [USE_EXPERIMENTAL_RENDER_API],
    bootstrap: [AppComponent],
})
export class AppModule {}
