import { async, ComponentFixture, TestBed } from "@angular/core/testing"

import { ConnectableChildComponent } from "./connectable-child.component"

describe("ConnectableChildComponent", () => {
    let component: ConnectableChildComponent
    let fixture: ComponentFixture<ConnectableChildComponent>

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConnectableChildComponent],
        }).compileComponents()
    }))

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectableChildComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it("should create", () => {
        expect(component).toBeTruthy()
    })
})
