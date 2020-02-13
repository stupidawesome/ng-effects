# ng-effects

Reactive local state management for Angular.

```typescript
interface AppState {
    count: number
}

@Component({
    selector: "app-root",
    template: `
        <div>Count: {{ count }}</div>
    `,
    providers: [HOST_EFFECTS],
})
export class AppComponent implements AppState {

    @Input()
    count: number = 0

    constructor(connect: Connect) {
        connect(this)
    }

    @Effect("count", { markDirty: true })
    incrementCount(state: State<AppState>) {
        return timer(1000).pipe(
            switchMapTo(state.count),
            take(1),
            increment(1),
            repeat()
        )
    }
}
```

## Installation

```bash
npm install ng-effects
```

## Usage

[Read the docs](https://github.com/stupidawesome/ng-effects)
