<img src="https://i.imgur.com/A1924dn.png" alt="" />

Reactive hooks for Angular.

```ts
@Component({
    selector: "app-root",
    template: `
        <div>Count: {{ count }}</div>
    `,
})
export class AppComponent extends Connectable {
    @Input()
    count: number = 0

    ngOnConnect() {
        effect(() =>
            interval(1000).subscribe(() =>
                this.count += 1
            )
        )
    }
}
```

## Installation

Install via NPM.

```bash
npm install ng-effects@next
```

## Usage

[Read the docs](https://ngfx.io)
