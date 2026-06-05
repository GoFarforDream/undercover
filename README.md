# 穿越仙界：六大仙修圆桌斩魔

```bash
src/
├── views/
│   ├── Home.vue          # 仙府首页/仙府记录
│   ├── Room.vue          # 仙府创建/仙友入定页面
│   ├── Game.vue          # 仙魔圆桌主界面（核心）
│   └── Result.vue        # 仙魔终局页
├── components/
│   ├── common/           # 通用组件（按钮、弹窗、加载中）
│   └── game/             # 仙魔圆桌专属组件
│       ├── PlayerCard.vue    # 仙友卡片（显示仙魔身份/陈词状态）
│       ├── WordCard.vue      # 灵契组件（显示魔修词/仙修词）
│       └── VotePanel.vue     # 诛仙令面板
├── api/
│   ├── room.js           # 仙府相关接口
│   ├── game.js           # 仙魔局流程接口
│   └── user.js           # 仙友相关接口
├── store/
│   ├── index.js          # 状态管理入口
│   ├── modules/
│   │   ├── room.js       # 仙府状态
│   │   └── game.js       # 仙魔局状态（轮次、灵契、仙友状态）
└── utils/
    ├── word.js           # 灵契处理工具（随机生成魔修词）
    └── game.js           # 仙魔局逻辑工具（洗牌、诛仙令统计）
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
