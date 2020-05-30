import { Component, NgModule, Type } from "@angular/core"
import { TestBed } from "@angular/core/testing"

export function createFxComponent<T>(mockComponent: new () => T): Type<T> {
    @Component({
        selector: "fx",
        template: ``,
    })
    class MockComponent extends (mockComponent as any) {}

    @NgModule({
        declarations: [MockComponent],
        exports: [MockComponent],
    })
    class MockModule {}

    TestBed.configureTestingModule({
        imports: [MockModule],
    })

    return MockComponent as Type<T>
}
