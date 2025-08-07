# 微信量房小程序

一个基于uni-app开发的专业量房小程序，提供完整的CAD绘图、实景照片标注、图纸管理等功能。

## 功能特性

### 🎨 专业绘图
- 完整的2D CAD绘图引擎
- 支持直线、矩形、圆形、圆弧等基础图形
- 专业的尺寸标注系统
- 多图层管理
- 撤销重做功能
- 对象捕捉和对齐

### 📷 实景标注
- 拍照或选择照片进行标注
- 在照片上添加尺寸标注
- 实际测量值输入
- 标注数据与照片关联存储

### 📁 文件管理
- 完整的文件系统
- 支持文件夹分类管理
- 文件搜索和筛选
- 导入导出功能
- 批量操作支持

### 🧩 图块库
- 丰富的内置图块（门窗、家具、卫浴等）
- 自定义图块创建
- 图块分类和搜索
- 使用历史记录

### 📱 移动优化
- 针对触摸操作优化
- 支持手势缩放和拖拽
- 响应式界面设计
- 性能优化和内存管理

## 技术架构

- **框架**: uni-app + Vue.js + TypeScript
- **绘图**: Canvas 2D API
- **存储**: uni-app本地存储
- **构建**: Vue CLI + uni-app插件

## 快速开始

### 环境要求
- Node.js 14.0+
- npm 6.0+
- 微信开发者工具

### 安装步骤

1. **安装依赖**
```bash
npm install
# 或使用yarn
yarn install
```

2. **导入微信开发者工具**
- 打开微信开发者工具
- 选择"导入项目"
- 选择项目目录
- 填写AppID
- 点击"导入"

3. **编译运行**
- 在微信开发者工具中点击"编译"
- 在模拟器中预览效果

## 项目结构

```
wechat-room-measure/
├── src/
│   ├── pages/                 # 页面文件
│   │   ├── index/            # 首页
│   │   ├── drawing/          # CAD绘制页面
│   │   ├── photo/            # 实景照片标注页面
│   │   ├── files/            # 图纸管理页面
│   │   └── blocks/           # 图块管理页面
│   ├── utils/                # 工具类
│   │   ├── canvas/           # Canvas绘图引擎
│   │   ├── storage/          # 数据存储管理
│   │   ├── blocks/           # 图块库管理
│   │   ├── testing/          # 测试套件
│   │   └── optimization/     # 性能优化
│   ├── static/               # 静态资源
│   ├── pages.json            # 页面配置
│   └── App.vue               # 应用入口
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 核心功能

### Canvas绘图引擎
```javascript
import { CanvasEngine } from './utils/canvas/CanvasEngine.js'
import { Line, Rectangle, Circle } from './utils/canvas/shapes/'

// 创建绘图引擎
const engine = new CanvasEngine(canvas)

// 添加图形
const line = new Line(startPoint, endPoint)
engine.addObject(line)

// 渲染
engine.render()
```

### 文件管理器
```javascript
import { FileManager } from './utils/storage/FileManager.js'

const fileManager = new FileManager()

// 创建图纸
const drawing = fileManager.createDrawing('新图纸')

// 保存数据
fileManager.saveDrawingData(drawing.id, drawingData)
```

### 图块库
```javascript
import { blockLibrary } from './utils/blocks/BlockLibrary.js'

// 获取图块
const door = blockLibrary.getBlock('单开门')

// 搜索图块
const results = blockLibrary.searchBlocks('门')
```

## 功能使用

### 绘图功能
1. 选择绘图工具（直线、矩形、圆形等）
2. 在画布上绘制图形
3. 使用双指缩放调整视图
4. 添加尺寸标注

### 照片标注
1. 拍照或选择照片
2. 在照片上绘制标注线
3. 输入实际测量值
4. 保存标注结果

### 图块使用
1. 浏览图块库
2. 选择需要的图块
3. 插入到画布
4. 调整位置和大小

## 性能优化

- **Canvas双缓冲**: 避免绘制闪烁
- **对象池**: 重用频繁创建的对象
- **内存监控**: 实时监控内存使用
- **批量处理**: 大量数据分批处理
- **懒加载**: 按需加载资源

## 测试

项目包含完整的测试套件，覆盖所有核心功能。

## 部署

### 微信小程序
1. 在微信开发者工具中上传代码
2. 在微信公众平台提交审核
3. 审核通过后发布

### 其他平台
```bash
# 编译H5版本
npm run build:h5

# 编译App版本
npm run build:app
```

## 版本历史

- **v1.0.0** (2024-01-01)
  - 初始版本发布
  - 完整的CAD绘图功能
  - 实景照片标注
  - 图纸和图块管理
  - 性能优化

## 许可证

本项目采用 MIT 许可证

---

**微信量房小程序** - 让量房绘图更简单、更专业！
