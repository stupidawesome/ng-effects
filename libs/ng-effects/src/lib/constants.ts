import { InjectionToken } from "@angular/core"
import { ConnectableFunction } from "./interfaces"

export const CONNECTABLE = new InjectionToken<ConnectableFunction[]>("CONNECTABLE")
