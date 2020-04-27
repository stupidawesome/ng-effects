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
import { ConnectableComponent } from "./connectable/connectable.component"
import { ConnectableChildComponent } from "./connectable-child/connectable-child.component"

@Injectable()
export class ModuleEffects {
    @Effect()
    public moduleEffect() {
        return of("")
    }
}

@NgModule({
    declarations: [AppComponent, TestComponent, ConnectableComponent, ConnectableChildComponent],
    imports: [BrowserModule, HttpClientModule],
    providers: [USE_EXPERIMENTAL_RENDER_API, dispatchAdapter(Store), Effects, ModuleEffects],
    // providers: [dispatchAdapter(Store), Effects, ModuleEffects],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(connect: Connect) {
        connect(this)
    }
    @Effect()
    public moduleEffect() {
        return of("")
    }
}
