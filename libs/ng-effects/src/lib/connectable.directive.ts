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
import { OnConnect } from "./interfaces"
import { check, connect, destroy, init, viewChecked, viewInit } from "./connect"

export interface Connectable extends OnConnect {}

@Directive()
export abstract class Connectable
    implements OnInit, DoCheck, AfterViewInit, AfterViewChecked, OnDestroy {
    constructor(@Inject(INJECTOR) injector: Injector) {
        connect(this, injector)
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
