export function apply(target: any, ...sources: any[]) {
    for (const source of sources) {
        Object.defineProperties(
            target.prototype || target,
            Object.getOwnPropertyDescriptors(source.prototype || source),
        )
    }
}
