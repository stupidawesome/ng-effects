import { BehaviorSubject } from "rxjs"
import { skip } from "rxjs/operators"

export function observe(obj: any, props: string[]) {
    const observer = {}
    for (const name of props) {
        const property = new BehaviorSubject(obj[name])

        Object.defineProperty(property, "changes", {
            value: property.asObservable().pipe(skip(1)),
        })

        Object.defineProperty(observer, name, {
            get() {
                return property
            },
            set(source) {
                source.subscribe((value: any) => {
                    obj[name] = value
                })
            },
        })
    }

    return observer
}

export function injectAll(...deps: any[]) {
    return deps
}
