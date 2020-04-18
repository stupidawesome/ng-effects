import { BrowserModule } from "@angular/platform-browser"
import { Injectable, NgModule } from "@angular/core"

import { AppComponent } from "./app.component"
import { TestComponent } from "./test/test.component"
import { HttpClientModule } from "@angular/common/http"
// noinspection ES6UnusedImports
import { Connect, Effect, effects, Effects, USE_EXPERIMENTAL_RENDER_API } from "@ng9/ng-effects"
import { Store } from "./store"
import { dispatchAdapter } from "./dispatch-adapter"
import { of } from "rxjs"
import { CompositionComponent } from "./composition/composition.component"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"

@Injectable()
export class ModuleEffects {
    @Effect()
    public moduleEffect() {
        return of("")
    }
}

@NgModule({
    declarations: [AppComponent, TestComponent, CompositionComponent],
    imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule],
    providers: [USE_EXPERIMENTAL_RENDER_API, dispatchAdapter(Store)],
    // providers: [dispatchAdapter(Store), Effects, ModuleEffects],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor() {
        // connect(this)
    }
    @Effect()
    public moduleEffect() {
        return of("")
    }
}
