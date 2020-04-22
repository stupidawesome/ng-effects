import { ChangeDetectorRef } from "@angular/core"

export function reactiveFactory<T extends object>(context: T, changeDetector: ChangeDetectorRef) {
    return new Proxy(context, {})
}
