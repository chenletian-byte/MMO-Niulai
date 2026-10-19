# MMO Maths — O-Level E Math (4052) & A Math (4049) 刷题器

一个带账号、进度追踪和游戏化反馈的 O-Level 数学练习网站。

## 运行

需要 Node.js ≥ 22.5（用到内置的 `node:sqlite`，不需要另外装数据库）。

```bash
npm install
npm start            # http://localhost:3000
npm test             # 自检：所有题型 × 所有难度 × 60 个随机种子，答案键必须能判对
```

数据存放在 `data/mmo.sqlite`（可用 `DATA_DIR` / `DB_FILE` 改位置）。

## 环境变量

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `PORT` | 3000 | 端口 |
| `DEEPSEEK_API_KEY` | 无 | 设置后，每 3 小时的学习评价由 DeepSeek 撰写；不设则用规则生成 |
| `DEEPSEEK_MODEL` | deepseek-chat | DeepSeek 模型名 |
| `REVIEW_HOURS` | 3 | 评价周期 |
| `MOCK_WINDOW_HOURS` | 2 | 每隔几小时发布一套新模拟卷 |
| `MOCK_MINUTES` | 60 | 模拟卷限时 |
| `SEED_BOTS` | 1 | `0` = 排行榜不显示虚拟玩家 |
| `BOT_CUTOFF` | 25 | 真实用户达到这个数后自动隐藏虚拟玩家 |
| `SECURE_COOKIE` | 0 | 部署在 HTTPS 时设为 `1` |
| `ADMIN_TOKEN` | 无 | 设置后可 `POST /api/admin/run-reviews`（header `x-admin-token`）手动触发评价 |

## 功能概览

- **出题**：`server/gen/emath.js`、`server/gen/amath.js` 里共 61 个参数化题型，覆盖两份考纲全部章节；每题有 Basic / Challenging / Advanced 三档。答案由程序计算，`npm test` 会逐一验证。
- **自制数学键盘**：答案框是结构化公式编辑器（分数、根号、幂、log、ln、三角、∫、d/dx），网页上全部以数学符号显示，不调用系统键盘；文字输入框（登录、写理由）也用站内键盘，可在设置里切换回设备键盘。
- **证明题**：给出证明过程，学生补空。Basic 用理由块（可点击或拖进括号），Challenging 用几何键盘（∠ △ ∥ ⊥ ≅ ∼）自己写结论，Advanced 自己用英文写理由（关键词判分，如 "alt. ∠s"、"tangent ⊥ radius"）。
- **两条进度条（每科分开）**：学习进度 = 已遇到的题型数 / 总题型数（另显示做过的题数）；准确率 = 只统计**第二次及以后**遇到同一题型时的对错，第一次只算"遇到"。
- **错题库**：完成某科 Basic 教程（12 题）后解锁，带解锁动画；错题会以"同题型、新数字"的形式重出，答对即消除。
- **每 3 小时评价**：服务器定时读取每个学生的日志（答题、正确率、用时、访问次数和时段、模拟卷、休息），零活动跳过，否则生成评价；学生下次打开网站时在屏幕中央弹出。
- **模拟卷**：每 2 小时发布一套（同一时段所有人同卷），限时、按 A1–F9 评级；A1 获得奖章和 Laurel 头像框。
- **游戏化**：XP、等级（Point → Infinity）、连对 combo、17 枚奖章、6 种头像框，奖章显示在排行榜名字后面；头像是参数曲线（玫瑰线、李萨如曲线等）。
- **番茄钟**：默认 40 分钟（可调），到点询问是否休息，可跳过；模拟卷期间不打扰。休息室有呼吸练习、泡泡纸、不会输的贪吃蛇、慢速方块。
- **日/夜主题**、三种阅读字体（Serif 最接近 Claude 的阅读风格）。

## 真题库（Advanced 档）

`server/data/paperbank.json` 可以放入真实的学校试卷题目，来源会显示在题目下方（学校 · 年份 · 考试 · Paper · 题号），Advanced 档有 35% 概率抽到。格式：

```json
{
  "questions": [
    {
      "id": "ri-2023-p2-q7b",
      "subject": "amath",
      "topic": "C1",
      "title": "Stationary points",
      "stem": "The curve $y = x^3 - 6x^2 + 9x + 1$ ...",
      "parts": [
        { "kind": "math", "id": "a", "pre": "x =", "kb": "num", "multi": [{ "type": "num", "v": "1" }, { "type": "num", "v": "3" }], "open": true }
      ],
      "solution": ["$\\frac{dy}{dx} = 3x^2 - 12x + 9$", "..."],
      "source": { "school": "Raffles Institution", "year": 2023, "exam": "Prelim", "paper": 2, "question": "7(b)" }
    }
  ]
}
```

答案语法：`@sqrt(2)`、`@pi`、`@e`、`@ln(x)`、`@sin(x)`，分数写 `(3/4)`；`acc` 可为 `exact`、`sf3`、`dp1`、`dp2`。

## 发布上线

**Render（推荐，一键）**：在 Render 选 *New → Blueprint*，连接本仓库，它会读取 `render.yaml` 自动建好网站和 1 GB 持久磁盘（SQLite 数据放在那里，重启不丢）。需要 DeepSeek 评价时在 Render 后台填 `DEEPSEEK_API_KEY`。

**Docker（任何服务器）**：

```bash
docker build -t mmo-maths .
docker run -d -p 80:3000 -v mmo-data:/data --name mmo mmo-maths
```

上线后用 HTTPS 访问时保持 `SECURE_COOKIE=1`。
