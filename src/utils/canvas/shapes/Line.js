import { GraphicsObject } from '../GraphicsObject.js'
import { Point } from '../Point.js'

/**
 * 直线类
 */
export class Line extends GraphicsObject {
  constructor(startPoint = new Point(), endPoint = new Point()) {
    super('line')
    this.startPoint = startPoint.clone()
    this.endPoint = endPoint.clone()
  }

  /**
   * 设置起点
   */
  setStartPoint(point) {
    this.startPoint = point.clone()
    this.markDirty()
    return this
  }

  /**
   * 设置终点
   */
  setEndPoint(point) {
    this.endPoint = point.clone()
    this.markDirty()
    return this
  }

  /**
   * 获取长度
   */
  getLength() {
    return this.startPoint.distanceTo(this.endPoint)
  }

  /**
   * 获取角度
   */
  getAngle() {
    return this.startPoint.angleTo(this.endPoint)
  }

  /**
   * 获取中点
   */
  getMidpoint() {
    return Point.midpoint(this.startPoint, this.endPoint)
  }

  /**
   * 计算边界框
   */
  calculateBoundingBox() {
    const minX = Math.min(this.startPoint.x, this.endPoint.x)
    const minY = Math.min(this.startPoint.y, this.endPoint.y)
    const maxX = Math.max(this.startPoint.x, this.endPoint.x)
    const maxY = Math.max(this.startPoint.y, this.endPoint.y)
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 绘制直线
   */
  draw(ctx, transform) {
    if (!this.visible) return

    const startScreen = transform.worldToScreen(this.startPoint)
    const endScreen = transform.worldToScreen(this.endPoint)
    
    console.log('Line绘制 - 起点世界坐标:', this.startPoint, '屏幕坐标:', startScreen)
    console.log('Line绘制 - 终点世界坐标:', this.endPoint, '屏幕坐标:', endScreen)
    console.log('Line绘制 - 样式:', this.style)

    ctx.save()
    
    // 设置样式
    ctx.strokeStyle = this.style.strokeColor
    ctx.lineWidth = this.style.strokeWidth
    ctx.globalAlpha = this.style.opacity
    
    // 设置线型
    if (this.style.lineType === 'dashed') {
      ctx.setLineDash([5, 5])
    } else if (this.style.lineType === 'dotted') {
      ctx.setLineDash([2, 2])
    } else {
      ctx.setLineDash([])
    }

    // 绘制线条
    ctx.beginPath()
    ctx.moveTo(startScreen.x, startScreen.y)
    ctx.lineTo(endScreen.x, endScreen.y)
    ctx.stroke()
    
    console.log('Line绘制完成')

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
    const startScreen = transform.worldToScreen(this.startPoint)
    const endScreen = transform.worldToScreen(this.endPoint)
    const midScreen = transform.worldToScreen(this.getMidpoint())

    ctx.fillStyle = '#007aff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // 绘制端点
    this.drawControlPoint(ctx, startScreen)
    this.drawControlPoint(ctx, endScreen)
    
    // 绘制中点
    ctx.fillStyle = '#00ff00'
    this.drawControlPoint(ctx, midScreen, 3)
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
    // 计算点到直线的距离
    const distance = this.distanceToPoint(point)
    return distance <= tolerance
  }

  /**
   * 计算点到直线的距离
   */
  distanceToPoint(point) {
    const A = this.endPoint.y - this.startPoint.y
    const B = this.startPoint.x - this.endPoint.x
    const C = this.endPoint.x * this.startPoint.y - this.startPoint.x * this.endPoint.y
    
    const distance = Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B)
    
    // 检查点是否在线段范围内
    const dotProduct = (point.x - this.startPoint.x) * (this.endPoint.x - this.startPoint.x) +
                      (point.y - this.startPoint.y) * (this.endPoint.y - this.startPoint.y)
    
    // 正确计算线段的平方长度：使用坐标差的平方和
    const dx = this.endPoint.x - this.startPoint.x
    const dy = this.endPoint.y - this.startPoint.y
    const squaredLength = dx * dx + dy * dy
    
    if (dotProduct < 0 || dotProduct > squaredLength) {
      // 点在线段延长线上，计算到端点的距离
      const distToStart = point.distanceTo(this.startPoint)
      const distToEnd = point.distanceTo(this.endPoint)
      return Math.min(distToStart, distToEnd)
    }
    
    return distance
  }

  /**
   * 获取控制点
   */
  getControlPoints() {
    return [
      this.startPoint.clone(),
      this.endPoint.clone(),
      this.getMidpoint()
    ]
  }

  /**
   * 移动对象
   */
  move(deltaX, deltaY) {
    this.startPoint.x += deltaX
    this.startPoint.y += deltaY
    this.endPoint.x += deltaX
    this.endPoint.y += deltaY
    this.markDirty()
    return this
  }

  /**
   * 复制对象
   */
  clone() {
    const cloned = new Line(this.startPoint, this.endPoint)
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
      startPoint: this.startPoint.toArray(),
      endPoint: this.endPoint.toArray()
    }
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    const line = new Line(
      Point.fromArray(data.startPoint),
      Point.fromArray(data.endPoint)
    )
    line.id = data.id
    line.layer = data.layer
    line.visible = data.visible
    line.style = data.style
    line.rotation = data.rotation
    line.scaleX = data.scaleX
    line.scaleY = data.scaleY
    return line
  }
}

