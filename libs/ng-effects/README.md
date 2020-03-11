<img src="https://i.imgur.com/A1924dn.png" alt="" />

Reactive extensions for Angular.

```typescript
@Component({
    selector: "app-root",
    template: `
        <div>Count: {{ count }}</div>
    `,
    providers: [Effects],
})
export class AppComponent{
    @Input()
    count: number = 0

    @Effect("count")
    incrementCount(state: State<AppState>) {
        return state.count.pipe(
            take(1),
            increment(1),
            repeatInterval(1000)
        )
    }

    constructor() {
        connect(this)
    }
}
```

## Installation

Install via NPM.

```bash
npm install ng-effects
```

## Usage

[Read the docs](https://ngfx.io)
