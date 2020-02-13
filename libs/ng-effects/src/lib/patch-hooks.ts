import { Subject } from "rxjs"

export const doCheck = new Subject<any>()

function ngDoCheck(this: any) {
    // console.log('doCheck')
    // doCheck.next(this)
}

export function patchHooks() {
    // Object.defineProperty(Object.prototype, "ngDoCheck", {
    //     value: ngDoCheck,
    //     writable: true,
    //     configurable: true
    // })
}

patchHooks()
