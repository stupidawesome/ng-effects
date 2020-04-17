import { async, ComponentFixture, TestBed } from "@angular/core/testing"

import { CompositionComponent } from "./composition.component"

describe("CompositionComponent", () => {
    let component: CompositionComponent
    let fixture: ComponentFixture<CompositionComponent>

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CompositionComponent],
        }).compileComponents()
    }))

    beforeEach(() => {
        fixture = TestBed.createComponent(CompositionComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it("should create", () => {
        expect(component).toBeTruthy()
    })
})
