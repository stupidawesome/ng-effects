import { filter, take } from "rxjs/operators"
import { Subject } from "rxjs"

const ngAfterViewInit = new Subject()
const ngOnInit = new Subject()

export function AfterViewInit(target) {
    const orig = target.prototype.ngAfterViewInit
    target.prototype.ngAfterViewInit = function () {
        if (orig) {
            orig.apply(this)
        }
        ngAfterViewInit.next(this)
    }
}

export function OnInit(target) {
    const orig = target.prototype.ngOnInit
    target.prototype.ngOnInit = function () {
        if (orig) {
            orig.apply(this)
        }
        ngOnInit.next(this)
    }
}

export function With(...mixins): any {
    return function (target) {
        for (const mixin of mixins) {
            const returnValue = mixin(target)
            if (returnValue) {
                target = returnValue
            }
        }
        return target
    }
}

export function afterViewInit(ctx) {
    return ngAfterViewInit.pipe(
        filter(value => value === ctx),
        take(1)
    )
}

export function onInit(ctx) {
    return ngOnInit.pipe(
        filter(value => value === ctx),
        take(1)
    )
}
