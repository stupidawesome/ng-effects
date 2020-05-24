import {
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    Directive,
    Inject,
    INJECTOR,
    Injector,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
} from "@angular/core"
import {
    changes,
    connect,
    contentChecked,
    contentInit,
    destroy,
    init,
    Refs,
    viewChecked,
    viewInit,
} from "./connect"

@Directive()
export abstract class Connectable
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

    ngOnConnect?(props: this, refs: Refs<this>): void

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
