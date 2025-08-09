import { GraphicsObject } from '../GraphicsObject.js'
import { Point } from '../Point.js'

/**
 * 矩形类
 */
export class Rectangle extends GraphicsObject {
  constructor(x = 0, y = 0, width = 100, height = 100) {
    super('rectangle')
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  /**
   * 设置矩形参数
   */
  setRect(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.markDirty()
    return this
  }

  /**
   * 获取中心点
   */
  getCenter() {
    return new Point(this.x + this.width / 2, this.y + this.height / 2)
  }

  /**
   * 获取四个角点
   */
  getCorners() {
    return [
      new Point(this.x, this.y), // 左上
      new Point(this.x + this.width, this.y), // 右上
      new Point(this.x + this.width, this.y + this.height), // 右下
      new Point(this.x, this.y + this.height) // 左下
    ]
  }

  /**
   * 计算边界框
   */
  calculateBoundingBox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  /**
   * 计算面积
   */
  getArea() {
    return Math.abs(this.width * this.height)
  }

  /**
   * 计算周长
   */
  getPerimeter() {
    return Math.abs(this.width * 2) + Math.abs(this.height * 2)
  }

  /**
   * 绘制矩形
   */
  draw(ctx, transform) {
    if (!this.visible) return

    const topLeft = transform.worldToScreen(new Point(this.x, this.y))
    const bottomRight = transform.worldToScreen(new Point(this.x + this.width, this.y + this.height))
    
    const screenWidth = bottomRight.x - topLeft.x
    const screenHeight = bottomRight.y - topLeft.y

    ctx.save()
    
    // 设置样式
    ctx.strokeStyle = this.style.strokeColor
    ctx.lineWidth = this.style.strokeWidth
    ctx.fillStyle = this.style.fillColor
    ctx.globalAlpha = this.style.opacity
    
    // 设置线型
    if (this.style.lineType === 'dashed') {
      ctx.setLineDash([5, 5])
    } else if (this.style.lineType === 'dotted') {
      ctx.setLineDash([2, 2])
    } else {
      ctx.setLineDash([])
    }

    // 绘制矩形
    ctx.beginPath()
    ctx.rect(topLeft.x, topLeft.y, screenWidth, screenHeight)
    
    if (this.style.fillColor !== 'transparent') {
      ctx.fill()
    }
    ctx.stroke()

    // 如果选中，绘制控制点
    if (this.selected) {
      this.drawControlPoints(ctx, transform)
    }

    ctx.restore()
  }

  /**
   * 绘制控制点
   */
  drawControlPoints(ctx, transform) {
    const corners = this.getCorners()
    const center = this.getCenter()
    
    // 边中点
    const midPoints = [
      new Point(this.x + this.width / 2, this.y), // 上中
      new Point(this.x + this.width, this.y + this.height / 2), // 右中
      new Point(this.x + this.width / 2, this.y + this.height), // 下中
      new Point(this.x, this.y + this.height / 2) // 左中
    ]

    ctx.fillStyle = '#007aff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // 绘制角点
    corners.forEach(corner => {
      const screenPoint = transform.worldToScreen(corner)
      this.drawControlPoint(ctx, screenPoint, 4)
    })

    // 绘制边中点
    ctx.fillStyle = '#00ff00'
    midPoints.forEach(midPoint => {
      const screenPoint = transform.worldToScreen(midPoint)
      this.drawControlPoint(ctx, screenPoint, 3)
    })

    // 绘制中心点
    ctx.fillStyle = '#ff0000'
    const centerScreen = transform.worldToScreen(center)
    this.drawControlPoint(ctx, centerScreen, 2)
  }

  /**
   * 绘制单个控制点
   */
  drawControlPoint(ctx, point, size = 4) {
    ctx.beginPath()
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  /**
   * 点击测试
   */
  hitTest(point, tolerance = 5) {
    // 检查点是否在矩形内或边界附近
    const inBounds = point.x >= this.x - tolerance &&
                    point.x <= this.x + this.width + tolerance &&
                    point.y >= this.y - tolerance &&
                    point.y <= this.y + this.height + tolerance

    if (!inBounds) return false

    // 如果填充不透明，点在内部就算命中
    if (this.style.fillColor !== 'transparent') {
      return point.x >= this.x && point.x <= this.x + this.width &&
             point.y >= this.y && point.y <= this.y + this.height
    }

    // 否则只检查边界
    const onLeftEdge = Math.abs(point.x - this.x) <= tolerance &&
                      point.y >= this.y - tolerance &&
                      point.y <= this.y + this.height + tolerance

    const onRightEdge = Math.abs(point.x - (this.x + this.width)) <= tolerance &&
                       point.y >= this.y - tolerance &&
                       point.y <= this.y + this.height + tolerance

    const onTopEdge = Math.abs(point.y - this.y) <= tolerance &&
                     point.x >= this.x - tolerance &&
                     point.x <= this.x + this.width + tolerance

    const onBottomEdge = Math.abs(point.y - (this.y + this.height)) <= tolerance &&
                        point.x >= this.x - tolerance &&
                        point.x <= this.x + this.width + tolerance

    return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge
  }

  /**
   * 获取控制点
   */
  getControlPoints() {
    const corners = this.getCorners()
    const midPoints = [
      new Point(this.x + this.width / 2, this.y), // 上中
      new Point(this.x + this.width, this.y + this.height / 2), // 右中
      new Point(this.x + this.width / 2, this.y + this.height), // 下中
      new Point(this.x, this.y + this.height / 2) // 左中
    ]
    
    return [...corners, ...midPoints, this.getCenter()]
  }

  /**
   * 移动对象
   */
  move(deltaX, deltaY) {
    this.x += deltaX
    this.y += deltaY
    this.markDirty()
    return this
  }

  /**
   * 缩放对象
   */
  scale(scaleX, scaleY = scaleX, center) {
    if (!center) {
      center = this.getCenter()
    }

    // 计算新的位置和尺寸
    const newWidth = this.width * scaleX
    const newHeight = this.height * scaleY
    
    this.x = center.x - (center.x - this.x) * scaleX
    this.y = center.y - (center.y - this.y) * scaleY
    this.width = newWidth
    this.height = newHeight
    
    this.markDirty()
    return this
  }

  /**
   * 复制对象
   */
  clone() {
    const cloned = new Rectangle(this.x, this.y, this.width, this.height)
    cloned.id = this.generateId()
    cloned.layer = this.layer
    cloned.visible = this.visible
    cloned.style = { ...this.style }
    cloned.rotation = this.rotation
    cloned.scaleX = this.scaleX
    cloned.scaleY = this.scaleY
    return cloned
  }

  /**
   * 序列化为JSON
   */
  toJSON() {
    const base = super.toJSON()
    return {
      ...base,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    const rect = new Rectangle(data.x, data.y, data.width, data.height)
    rect.id = data.id
    rect.layer = data.layer
    rect.visible = data.visible
    rect.style = data.style
    rect.rotation = data.rotation
    rect.scaleX = data.scaleX
    rect.scaleY = data.scaleY
    return rect
  }
}

