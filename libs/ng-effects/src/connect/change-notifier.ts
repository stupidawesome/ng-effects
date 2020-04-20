import { Subject } from "rxjs"
import { DefaultEffectOptions } from "../lib/interfaces"

export class ChangeNotifier extends Subject<DefaultEffectOptions | void> {}
