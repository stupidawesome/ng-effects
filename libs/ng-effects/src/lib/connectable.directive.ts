import {
    AbstractType,
    AfterViewChecked,
    AfterViewInit,
    Directive,
    DoCheck,
    Inject,
    INJECTOR,
    Injector,
    OnDestroy,
    OnInit,
    Type,
} from "@angular/core"
import { OnConnect } from "./interfaces"
import { check, connect, destroy, init, viewChecked, viewInit } from "./connect"

export interface Connectable extends OnConnect {}

export class Connectable
    implements OnInit, DoCheck, AfterViewInit, AfterViewChecked, OnDestroy {
    constructor(@Inject(INJECTOR) injector: Injector) {
        return connect(this, injector)
    }

    ngOnConnect?(): void

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
