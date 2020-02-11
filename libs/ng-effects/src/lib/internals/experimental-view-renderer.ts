import {
    Inject,
    Injectable,
    ɵdetectChanges as detectChanges,
    ɵmarkDirty as markDirty,
    ɵwhenRendered as whenRendered,
} from "@angular/core"
import { RenderApi } from "./interfaces"
import { Observable, ReplaySubject } from "rxjs"
import { share, switchMap } from "rxjs/operators"
import { APPLICATION_BOOTSTRAP } from "./constants"

@Injectable()
export class ExperimentalIvyViewRenderer implements RenderApi {
    private whenBootstrap: ReplaySubject<boolean>
    constructor(@Inject(APPLICATION_BOOTSTRAP) whenBootstrap: Promise<any>) {
        this.whenBootstrap = new ReplaySubject()
        whenBootstrap.then(() => this.whenBootstrap.next(true))
    }

    public detectChanges(componentOrView: any): void {
        detectChanges(componentOrView)
    }

    public markDirty(componentOrView: any): void {
        markDirty(componentOrView)
    }

    public whenRendered(componentOrView: any): Observable<null> {
        return this.whenBootstrap.pipe(
            switchMap(() => whenRendered(componentOrView)),
            share(),
        )
    }
}
