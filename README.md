# BlackJack Omega Counter using YOLOv5 and Tensorflow.js

![love](https://img.shields.io/badge/Made%20with-🖤-white)
![tensorflow.js](https://img.shields.io/badge/tensorflow.js-white?logo=tensorflow)


Object Detection application right in your browser. Serving YOLOv5 in browser using tensorflow.js
with `webgl` backend.

**Setup**

```bash
git clone https://github.com/mihkuno/BLACKOMEGA.git
cd BLACKOMEGA
pnpm install #Install dependencies
```

**Scripts**

```bash
pnpm run dev # Start dev server
pnpm run build # Build for productions
pnpm run preview # Preview production
```

**Configs**

```jsx
...
// App.jsx
const modelName = "blackjack*"; // change to new model name
const classThreshold = 0.25;
...
```


## Reference

https://github.com/ultralytics/yolov5
