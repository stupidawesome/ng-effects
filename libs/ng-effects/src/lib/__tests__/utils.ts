import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Directive,
    ElementRef,
    Injectable,
    NO_ERRORS_SCHEMA,
    Provider,
} from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { Effect } from "../decorators"
import { Connect } from "../providers"
import { EffectOptions } from "../interfaces"
import fn = jest.fn

// noinspection AngularMissingOrInvalidDeclarationInModule
@Directive()
class SimpleDirective {
    constructor(connect: Connect) {
        connect(this)
    }
}

// noinspection AngularMissingOrInvalidDeclarationInModule
@Component({
    template: "",
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class SimpleComponent {
    constructor(connect: Connect) {
        connect(this)
    }
}

export function createSimpleDirective(providers: Provider[] = []) {
    return TestBed.configureTestingModule({
        providers: [
            SimpleDirective,
            providers,
            {
                provide: ChangeDetectorRef,
                useClass: ChangeDetectorRef,
            },
            {
                provide: ElementRef,
                useValue: {
                    nativeElement: document.createElement("div"),
                },
            },
        ],
    }).inject(SimpleDirective)
}

export function createSimpleComponent(providers: Provider[] = []) {
    void TestBed.configureTestingModule({
        declarations: [SimpleComponent],
        schemas: [NO_ERRORS_SCHEMA],
    })
        .overrideComponent(SimpleComponent, {
            add: {
                providers,
            },
        })
        .compileComponents()
    return TestBed.createComponent(SimpleComponent)
}

export function createEffectsClass(options?: EffectOptions) {
    @Injectable()
    class VoidEffects {
        spy = fn()
        @Effect(options)
        effect() {
            this.spy()
        }
    }
    return VoidEffects
}
