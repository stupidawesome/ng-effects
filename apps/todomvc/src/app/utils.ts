import { ActionEmitter } from "@ng9/ng-effects"

export function action<T1, T2, T3, T4, T5>(): ActionEmitter<
    [T1, T2, T3, T4, T5]
>
export function action<T1, T2, T3, T4>(): ActionEmitter<[T1, T2, T3, T4]>
export function action<T1, T2, T3>(): ActionEmitter<[T1, T2, T3]>
export function action<T1, T2>(): ActionEmitter<[T1, T2]>
export function action<T1>(): ActionEmitter<T1>
export function action<T>() {
    return new ActionEmitter<T>()
}
