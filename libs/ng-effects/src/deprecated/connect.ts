export interface Connect {
    // tslint:disable-next-line
    <T>(context: T): void
}

/**
 * @deprecated Will be replaced by composition API in 10.0.0
 */
export class Connect {}
