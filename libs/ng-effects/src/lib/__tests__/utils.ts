import {
    Component,
    Inject,
    InjectionToken,
    INJECTOR,
    Injector,
    Optional,
    Provider,
    StaticProvider,
    ViewContainerRef,
} from "@angular/core"
import { Connectable } from "../connectable.directive"
import { TestBed } from "@angular/core/testing"

export const FAKE_INJECTOR = new InjectionToken<Injector>("FAKE_INJECTOR")

// noinspection AngularMissingOrInvalidDeclarationInModule
@Component({
    selector: "app-wut",
    template: ``,
})
export class ConnectedComponent extends Connectable {
    [key: string]: any

    ngOnConnect(): void {}

    constructor(
        @Inject(INJECTOR) injector: Injector,
        @Optional() @Inject(FAKE_INJECTOR) fakeInjector: Injector,
        viewContainerRef: ViewContainerRef,
    ) {
        super(fakeInjector || injector)
    }
}

export async function declare(...declarations: any[]) {
    TestBed.configureTestingModule({
        declarations,
    })
}
export async function provide(...providers: Provider[]) {
    TestBed.configureTestingModule({
        providers,
    })
}

export function createConnectedComponent(providers: Provider[] = []) {
    return TestBed.overrideComponent(ConnectedComponent, {
        set: {
            providers,
        },
    }).createComponent(ConnectedComponent)
}

export function createInjector(providers: StaticProvider[] = []) {
    return Injector.create({ parent: TestBed, providers })
}
