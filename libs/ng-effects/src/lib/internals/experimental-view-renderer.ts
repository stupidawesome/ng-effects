import {
    Injectable,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
    ɵwhenRendered as whenRendered,
} from "@angular/core"
import { RenderApi } from "./interfaces"
import { defer, Observable } from "rxjs"

@Injectable()
export class ExperimentalIvyViewRenderer implements RenderApi {
    constructor() {}

    public detectChanges(componentOrView: any): void {
        detectChanges(componentOrView)
    }

    public markDirty(componentOrView: any): void {
        markDirty(componentOrView)
    }

    public whenRendered(componentOrView: any): Observable<null> {
        return defer(() => whenRendered(componentOrView))
    }
}
