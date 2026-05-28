# 谁是卧底

```bash
src/
├── views/
│   ├── Home.vue          # 首页/房间列表
│   ├── Room.vue          # 房间创建/加入页面
│   ├── Game.vue          # 游戏主界面（核心）
│   └── Result.vue        # 游戏结算页
├── components/
│   ├── common/           # 通用组件（按钮、弹窗、加载中）
│   └── game/             # 游戏专属组件
│       ├── PlayerCard.vue    # 玩家卡片（显示身份/发言状态）
│       ├── WordCard.vue      # 词卡组件（显示卧底词/平民词）
│       └── VotePanel.vue     # 投票面板
├── api/
│   ├── room.js           # 房间相关接口
│   ├── game.js           # 游戏流程接口
│   └── user.js           # 用户相关接口
├── store/
│   ├── index.js          # 状态管理入口
│   ├── modules/
│   │   ├── room.js       # 房间状态
│   │   └── game.js       # 游戏状态（轮次、词库、玩家状态）
└── utils/
    ├── word.js           # 词库处理工具（随机生成卧底词）
    └── game.js           # 游戏逻辑工具（洗牌、投票统计）
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
