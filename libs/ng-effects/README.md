

<img src="https://i.imgur.com/ty4iIj3.png" alt="Reactive hooks for Angular." />


<p><center>Reactivity system for Angular based on Vue Composition API.</center></p>
<hr>
<p><center><b>⭐ <a href="https://ngfx.io" target="_blank">Github</a> &nbsp;&nbsp;  📝  <a href="https://ngfx.io" target="_blank">API Reference</a> &nbsp;&nbsp; ⚡ <a href="https://stackblitz.com/edit/ng-effects" target="_blank">StackBlitz</a></b></center></p>
<hr>

```ts
@Component({
    selector: "app-root",
    inputs: ["count"],
    outputs: ["countChange"]
})
export class AppRoot extends defineComponent(() => {
    const count = ref(0)
    const countChange = new EventEmitter<number>()

    function increment() {
        count.value += 1
  }

    watchEffect((onInvalidate) => {
        console.log(count.value)
        onInvalidate(() => {
            countChange.emit(count.value)
        })
    })

    return {
        count,
        countChange,
        increment,
    }
}) {}
```

## Installation

Install via NPM.

```bash
npm install ng-effects@next
```
