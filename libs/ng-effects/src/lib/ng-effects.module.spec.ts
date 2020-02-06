import { async, TestBed } from "@angular/core/testing"
import { NgEffectsModule } from "@ng9/ng-effects"

describe("NgEffectsModule", () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [NgEffectsModule],
        }).compileComponents()
    }))

    it("should create", () => {
        expect(NgEffectsModule).toBeDefined()
    })
})
