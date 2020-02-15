import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Directive,
    ElementRef,
    Injectable,
    NO_ERRORS_SCHEMA,
    Provider,
    Type,
} from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { Effect } from "../decorators"
import { Connect } from "../providers"
import { EffectOptions } from "../interfaces"
import fn = jest.fn

// noinspection AngularMissingOrInvalidDeclarationInModule
@Directive()
export class SimpleDirective {
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
export class SimpleComponent {
    constructor(connect: Connect) {
        connect(this)
    }
    @Effect()
    public hostEffect() {}
}

export function createDirective(directive: Type<any>, deps?: any[], providers?: Provider[]) {
    void TestBed.configureTestingModule({
        providers: [
            {
                provide: directive,
                useClass: directive,
                deps,
            },
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
    }).compileComponents()
    return TestBed.inject(directive)
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
