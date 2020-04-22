import {
    AfterViewChecked,
    AfterViewInit,
    Directive,
    DoCheck,
    Inject,
    INJECTOR,
    Injector,
    OnDestroy,
    OnInit,
} from "@angular/core"
import { check, connect, destroy, init, viewInit, viewChecked } from "./connect"
import { OnConnect } from "./interfaces"

export interface Connectable extends OnConnect {}

@Directive()
export abstract class Connectable
    implements OnInit, DoCheck, AfterViewInit, AfterViewChecked, OnDestroy {
    protected constructor(@Inject(INJECTOR) injector: Injector) {
        connect(injector)
    }

    ngOnInit() {
        init(this)
    }

    ngDoCheck() {
        check(this)
    }

    ngAfterViewInit() {
        viewInit(this)
    }

    ngAfterViewChecked() {
        viewChecked(this)
    }

    ngOnDestroy() {
        destroy(this)
    }
}
