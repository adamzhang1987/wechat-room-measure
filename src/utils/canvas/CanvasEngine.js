import { Point } from './Point.js'
import { Transform } from './Transform.js'
import { Line } from './shapes/Line.js'
import { Rectangle } from './shapes/Rectangle.js'
import { Circle } from './shapes/Circle.js'
import { Arc } from './shapes/Arc.js'

/**
 * Canvas绘图引擎
 */
export class CanvasEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.transform = new Transform()
    
    // 图形对象管理
    this.objects = []
    this.selectedObjects = []
    this.layers = new Map()
    this.currentLayer = 'default'
    
    // 历史记录
    this.history = []
    this.historyIndex = -1
    this.maxHistorySize = 50
    
    // 绘制状态
    this.isDirty = true
    this.isDrawing = false
    this.currentTool = 'select'
    this.tempObject = null
    
    // 性能优化
    this.enableDoubleBuffer = true
    this.offscreenCanvas = null
    this.offscreenCtx = null
    
    // 对象捕捉
    this.snapEnabled = true
    this.snapTolerance = 10
    this.snapTypes = ['endpoint', 'midpoint', 'center', 'intersection']
    
    // 事件处理
    this.eventHandlers = new Map()
    
    this.init()
  }

  /**
   * 初始化引擎
   */
  init() {
    // 创建默认图层
    this.createLayer('default')
    
    // 初始化双缓冲
    if (this.enableDoubleBuffer) {
      this.initDoubleBuffer()
    }
    
    // 保存初始状态
    this.saveState()
  }

  /**
   * 初始化双缓冲
   */
  initDoubleBuffer() {
    // 在微信小程序环境中，document可能不存在，跳过双缓冲
    if (typeof document !== 'undefined' && document.createElement) {
      this.offscreenCanvas = document.createElement('canvas')
      this.offscreenCanvas.width = this.canvas.width
      this.offscreenCanvas.height = this.canvas.height
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')
    } else {
      console.log('微信小程序环境，跳过双缓冲初始化')
      this.enableDoubleBuffer = false
    }
  }

  /**
   * 设置画布尺寸
   */
  setSize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    
    // 重新初始化离屏画布以防止内存泄漏
    if (this.offscreenCanvas) {
      // 清理旧的离屏画布
      this.offscreenCtx = null
      this.offscreenCanvas = null
      
      // 重新创建
      if (typeof document !== 'undefined' && document.createElement) {
        this.offscreenCanvas = document.createElement('canvas')
        this.offscreenCanvas.width = width
        this.offscreenCanvas.height = height
        this.offscreenCtx = this.offscreenCanvas.getContext('2d')
      }
    }
    
    this.markDirty()
  }

  /**
   * 创建图层
   */
  createLayer(name, visible = true) {
    this.layers.set(name, {
      name,
      visible,
      locked: false,
      objects: []
    })
  }

  /**
   * 设置当前图层
   */
  setCurrentLayer(name) {
    if (this.layers.has(name)) {
      this.currentLayer = name
    }
  }

  /**
   * 添加图形对象
   */
  addObject(object) {
    object.layer = this.currentLayer
    this.objects.push(object)
    
    // 添加到对应图层
    const layer = this.layers.get(this.currentLayer)
    if (layer) {
      layer.objects.push(object)
    }
    
    this.markDirty()
    this.saveState()
    
    this.emit('objectAdded', { object })
    return object
  }

  /**
   * 删除图形对象
   */
  removeObject(object) {
    const index = this.objects.indexOf(object)
    if (index > -1) {
      this.objects.splice(index, 1)
      
      // 从图层中删除
      const layer = this.layers.get(object.layer)
      if (layer) {
        const layerIndex = layer.objects.indexOf(object)
        if (layerIndex > -1) {
          layer.objects.splice(layerIndex, 1)
        }
      }
      
      // 从选择中删除
      this.deselectObject(object)
      
      this.markDirty()
      this.saveState()
      
      this.emit('objectRemoved', { object })
    }
  }

  /**
   * 选择对象
   */
  selectObject(object, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection()
    }
    
    if (!this.selectedObjects.includes(object)) {
      object.selected = true
      this.selectedObjects.push(object)
      this.markDirty()
      
      this.emit('selectionChanged', { 
        selectedObjects: this.selectedObjects 
      })
    }
  }

  /**
   * 取消选择对象
   */
  deselectObject(object) {
    const index = this.selectedObjects.indexOf(object)
    if (index > -1) {
      object.selected = false
      this.selectedObjects.splice(index, 1)
      this.markDirty()
      
      this.emit('selectionChanged', { 
        selectedObjects: this.selectedObjects 
      })
    }
  }

  /**
   * 清除选择
   */
  clearSelection() {
    this.selectedObjects.forEach(obj => {
      obj.selected = false
    })
    this.selectedObjects = []
    this.markDirty()
    
    this.emit('selectionChanged', { 
      selectedObjects: this.selectedObjects 
    })
  }

  /**
   * 点击测试
   */
  hitTest(point, tolerance = 5) {
    // 从后往前测试（后绘制的在上层）
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const object = this.objects[i]
      if (object.visible && object.hitTest(point, tolerance)) {
        return object
      }
    }
    return null
  }

  /**
   * 区域选择
   */
  selectInRegion(startPoint, endPoint) {
    const minX = Math.min(startPoint.x, endPoint.x)
    const minY = Math.min(startPoint.y, endPoint.y)
    const maxX = Math.max(startPoint.x, endPoint.x)
    const maxY = Math.max(startPoint.y, endPoint.y)
    
    this.clearSelection()
    
    this.objects.forEach(object => {
      const bounds = object.getBoundingBox()
      if (bounds &&
          bounds.x >= minX &&
          bounds.y >= minY &&
          bounds.x + bounds.width <= maxX &&
          bounds.y + bounds.height <= maxY) {
        this.selectObject(object, true)
      }
    })
  }

  /**
   * 对象捕捉
   */
  snap(point) {
    if (!this.snapEnabled) return point

    let snapPoint = null
    let minDistance = this.snapTolerance

    this.objects.forEach(object => {
      if (!object.visible) return

      const controlPoints = object.getControlPoints()
      controlPoints.forEach(cp => {
        const distance = point.distanceTo(cp)
        if (distance < minDistance) {
          minDistance = distance
          snapPoint = cp
        }
      })
    })

    return snapPoint || point
  }

  /**
   * 缩放视图
   */
  zoom(factor, center) {
    this.transform.zoom(factor, center)
    this.markDirty()
    
    this.emit('viewChanged', { 
      transform: this.transform.clone() 
    })
  }

  /**
   * 平移视图
   */
  pan(deltaX, deltaY) {
    this.transform.pan(deltaX, deltaY)
    this.markDirty()
    
    this.emit('viewChanged', { 
      transform: this.transform.clone() 
    })
  }

  /**
   * 适应视图
   */
  fitToView(padding = 50) {
    const bounds = this.getBounds()
    if (bounds) {
      this.transform.fitToView(bounds, this.canvas.width, this.canvas.height, padding)
      this.markDirty()
      
      this.emit('viewChanged', { 
        transform: this.transform.clone() 
      })
    }
  }

  /**
   * 获取所有对象的边界框
   */
  getBounds() {
    if (this.objects.length === 0) return null

    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    this.objects.forEach(object => {
      if (!object.visible) return
      
      const bounds = object.getBoundingBox()
      if (bounds) {
        minX = Math.min(minX, bounds.x)
        minY = Math.min(minY, bounds.y)
        maxX = Math.max(maxX, bounds.x + bounds.width)
        maxY = Math.max(maxY, bounds.y + bounds.height)
      }
    })

    if (minX === Infinity) return null

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 标记需要重绘
   */
  markDirty() {
    this.isDirty = true
  }

  /**
   * 渲染场景
   */
  render() {
    if (!this.isDirty) return

    const ctx = this.enableDoubleBuffer ? this.offscreenCtx : this.ctx
    console.log('开始渲染，使用上下文:', ctx, '对象数量:', this.objects.length, '临时对象:', !!this.tempObject, '画布尺寸:', this.canvas.width, 'x', this.canvas.height)
    
    // 清除画布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 设置背景
    ctx.fillStyle = '#f0f0f0'  // 改为浅灰色，便于观察
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制网格（可选）
    this.drawGrid(ctx)
    
    // 绘制所有对象
    this.objects.forEach((object, index) => {
      if (object.visible) {
        console.log('绘制对象:', object.type, object)
        object.draw(ctx, this.transform)
      }
    })
    
    // 绘制临时对象
    if (this.tempObject) {
      console.log('绘制临时对象:', this.tempObject.type, this.tempObject)
      this.tempObject.draw(ctx, this.transform)
    }
    
    // 双缓冲：复制到主画布
    if (this.enableDoubleBuffer) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.drawImage(this.offscreenCanvas, 0, 0)
    }
    
    this.isDirty = false
    console.log('渲染完成')
    
    this.emit('rendered')
  }

  /**
   * 绘制网格
   */
  drawGrid(ctx) {
    const gridSize = 20 * this.transform.scale
    if (gridSize < 5) return // 网格太小时不绘制

    ctx.save()
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    ctx.setLineDash([])

    const startX = -this.transform.offsetX % gridSize
    const startY = -this.transform.offsetY % gridSize

    // 绘制垂直线
    for (let x = startX; x < this.canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, this.canvas.height)
      ctx.stroke()
    }

    // 绘制水平线
    for (let y = startY; y < this.canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.canvas.width, y)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * 保存状态
   */
  saveState() {
    const state = {
      objects: this.objects.map(obj => obj.toJSON()),
      transform: this.transform.clone()
    }
    
    // 删除当前位置之后的历史记录
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // 添加新状态
    this.history.push(JSON.stringify(state))
    this.historyIndex++
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
      this.historyIndex--
    }
    
    this.emit('stateChanged', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    })
  }

  /**
   * 撤销
   */
  undo() {
    if (this.canUndo()) {
      this.historyIndex--
      this.loadState(this.history[this.historyIndex])
      
      this.emit('stateChanged', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      })
    }
  }

  /**
   * 重做
   */
  redo() {
    if (this.canRedo()) {
      this.historyIndex++
      this.loadState(this.history[this.historyIndex])
      
      this.emit('stateChanged', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      })
    }
  }

  /**
   * 是否可以撤销
   */
  canUndo() {
    return this.historyIndex > 0
  }

  /**
   * 是否可以重做
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1
  }

  /**
   * 加载状态
   */
  loadState(stateJson) {
    const state = JSON.parse(stateJson)
    
    // 清除当前对象
    this.objects = []
    this.selectedObjects = []
    this.layers.forEach(layer => {
      layer.objects = []
    })
    
    // 恢复对象
    state.objects.forEach(objData => {
      let object
      switch (objData.type) {
        case 'line':
          object = Line.fromJSON(objData)
          break
        case 'rectangle':
          object = Rectangle.fromJSON(objData)
          break
        case 'circle':
          object = Circle.fromJSON(objData)
          break
        case 'arc':
          object = Arc.fromJSON(objData)
          break
        default:
          return
      }
      
      this.objects.push(object)
      
      // 添加到图层
      const layer = this.layers.get(object.layer)
      if (layer) {
        layer.objects.push(object)
      }
    })
    
    // 恢复变换
    this.transform = state.transform
    
    this.markDirty()
  }

  /**
   * 事件处理
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
  }

  /**
   * 移除事件处理器
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data = {}) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        handler(data)
      })
    }
  }

  /**
   * 清除所有对象
   */
  clear() {
    this.objects = []
    this.selectedObjects = []
    this.layers.forEach(layer => {
      layer.objects = []
    })
    this.markDirty()
    this.saveState()
    
    this.emit('cleared')
  }

  /**
   * 导出为JSON
   */
  exportToJSON() {
    return {
      objects: this.objects.map(obj => obj.toJSON()),
      layers: Array.from(this.layers.entries()),
      transform: this.transform.clone()
    }
  }

  /**
   * 从JSON导入
   */
  importFromJSON(data) {
    this.clear()
    
    // 恢复图层
    if (data.layers) {
      this.layers.clear()
      data.layers.forEach(([name, layerData]) => {
        this.layers.set(name, { ...layerData, objects: [] })
      })
    }
    
    // 恢复对象
    if (data.objects) {
      data.objects.forEach(objData => {
        let object
        switch (objData.type) {
          case 'line':
            object = Line.fromJSON(objData)
            break
          case 'rectangle':
            object = Rectangle.fromJSON(objData)
            break
          case 'circle':
            object = Circle.fromJSON(objData)
            break
          case 'arc':
            object = Arc.fromJSON(objData)
            break
          default:
            return
        }
        
        this.addObject(object)
      })
    }
    
    // 恢复变换
    if (data.transform) {
      this.transform = data.transform
    }
    
    this.markDirty()
    this.saveState()
    
    this.emit('imported', data)
  }
}

