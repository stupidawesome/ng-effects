import { Observable, Observer } from "rxjs"

export function subscribe<T>(
    source: Observable<T>,
    observer: (value: T) => void | Observer<T> = () => {},
): () => void {
    const sub = source.subscribe(observer)
    return function () {
        sub.unsubscribe()
    }
}
