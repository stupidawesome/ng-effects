import {
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    Inject,
    INJECTOR,
    Injector,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
} from "@angular/core"
import { OnConnect } from "./interfaces"
import {
    changes,
    connect,
    contentChecked,
    contentInit,
    destroy,
    init,
    viewChecked,
    viewInit,
} from "./connect"

export interface Connectable extends OnConnect {}

export class Connectable
    implements
        OnChanges,
        OnInit,
        AfterViewInit,
        AfterViewChecked,
        AfterContentInit,
        AfterContentChecked,
        OnDestroy {
    constructor(@Inject(INJECTOR) injector: Injector) {
        return connect(this, injector)
    }

    ngOnConnect?(): void

    ngOnInit() {
        init(this)
    }

    ngOnChanges(simpleChanges: SimpleChanges) {
        changes(this, simpleChanges)
    }

    ngAfterContentInit() {
        contentInit(this)
    }

    ngAfterContentChecked() {
        contentChecked(this)
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
