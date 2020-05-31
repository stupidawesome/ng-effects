<img src="https://i.imgur.com/ty4iIj3.png" alt="Reactive hooks for Angular." />

Reactive hooks for Angular. Inspired by [Vue Composition API](https://composition-api.vuejs.org/).

```ts
@Component({
    selector: "app-root",
    inputs: ["count"],
    outputs: ["countChange"]
})
export class AppComponent extends defineComponent(setup) {}

function setup() {
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
}
```

## Installation

Install via NPM.

```bash
npm install ng-effects@next
```

## Usage

[Read the docs](https://ngfx.io)
