<img src="https://i.imgur.com/A1924dn.png" alt="" />

Reactive hooks for Angular. Inspired by [Vue Composition API](https://composition-api.vuejs.org/).

```html
<div>Count: {{ count }}</div>
<button (click)="increment()">Increment</button>
```
```ts
const App = defineComponent(() => {
    const count = ref(0)
    const countChange = new EventEmitter<number>()

    function increment() {
        count.value += 1
    }

    watchEffect(() => {
        countChange.emit(count.value)
    })

    return {
        count,
        countChange,
        increment,
    }
})

@Component({
    selector: "app-root",
    inputs: ["count"],
    outputs: ["countChange"]
})
export class AppComponent extends App {}
```

## Installation

Install via NPM.

```bash
npm install ng-effects@next
```

## Usage

[Read the docs](https://ngfx.io)
