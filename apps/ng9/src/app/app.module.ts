import { BrowserModule } from "@angular/platform-browser"
import { NgModule } from "@angular/core"

import { AppComponent } from "./app.component"
import { TestComponent } from "./test/test.component"
import { HttpClientModule } from "@angular/common/http"
// noinspection ES6UnusedImports
import { effects, USE_EXPERIMENTAL_RENDER_API } from "@ng9/ng-effects"
import { Store } from "./store"
import { dispatchAdapter } from "./dispatch-adapter"

@NgModule({
    declarations: [AppComponent, TestComponent],
    imports: [BrowserModule, HttpClientModule],
    providers: [USE_EXPERIMENTAL_RENDER_API, dispatchAdapter(Store)],
    // providers: [dispatchAdapter(Store)],
    bootstrap: [AppComponent],
})
export class AppModule {}
