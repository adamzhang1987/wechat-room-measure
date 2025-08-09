import { GraphicsObject } from '../GraphicsObject.js'
import { Point } from '../Point.js'

/**
 * 圆形类
 */
export class Circle extends GraphicsObject {
  constructor(centerX = 0, centerY = 0, radius = 50) {
    super('circle')
    this.centerX = centerX
    this.centerY = centerY
    this.radius = radius
  }

  /**
   * 设置圆心
   */
  setCenter(x, y) {
    this.centerX = x
    this.centerY = y
    this.markDirty()
    return this
  }

  /**
   * 设置半径
   */
  setRadius(radius) {
    this.radius = Math.max(0, radius)
    this.markDirty()
    return this
  }

  /**
   * 获取圆心
   */
  getCenter() {
    return new Point(this.centerX, this.centerY)
  }

  /**
   * 获取直径
   */
  getDiameter() {
    return this.radius * 2
  }

  /**
   * 获取周长
   */
  getCircumference() {
    return 2 * Math.PI * this.radius
  }

  /**
   * 获取周长（别名）
   */
  getPerimeter() {
    return this.getCircumference()
  }

  /**
   * 获取面积
   */
  getArea() {
    return Math.PI * this.radius * this.radius
  }

  /**
   * 计算边界框
   */
  calculateBoundingBox() {
    return {
      x: this.centerX - this.radius,
      y: this.centerY - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    }
  }

  /**
   * 绘制圆形
   */
  draw(ctx, transform) {
    if (!this.visible) return

    const centerScreen = transform.worldToScreen(new Point(this.centerX, this.centerY))
    const radiusScreen = this.radius * transform.scale

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

    // 绘制圆形
    ctx.beginPath()
    ctx.arc(centerScreen.x, centerScreen.y, radiusScreen, 0, Math.PI * 2)
    
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
    const center = new Point(this.centerX, this.centerY)
    const centerScreen = transform.worldToScreen(center)
    
    // 四个方向的控制点
    const controlPoints = [
      new Point(this.centerX, this.centerY - this.radius), // 上
      new Point(this.centerX + this.radius, this.centerY), // 右
      new Point(this.centerX, this.centerY + this.radius), // 下
      new Point(this.centerX - this.radius, this.centerY)  // 左
    ]

    ctx.fillStyle = '#007aff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // 绘制边界控制点
    controlPoints.forEach(point => {
      const screenPoint = transform.worldToScreen(point)
      this.drawControlPoint(ctx, screenPoint, 4)
    })

    // 绘制中心点
    ctx.fillStyle = '#ff0000'
    this.drawControlPoint(ctx, centerScreen, 3)

    // 绘制半径线（当选中时）
    ctx.strokeStyle = '#007aff'
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(centerScreen.x, centerScreen.y)
    ctx.lineTo(centerScreen.x + this.radius * transform.scale, centerScreen.y)
    ctx.stroke()
    ctx.setLineDash([])
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
    const center = new Point(this.centerX, this.centerY)
    const distance = point.distanceTo(center)
    
    // 如果填充不透明，点在内部就算命中
    if (this.style.fillColor !== 'transparent') {
      return distance <= this.radius + tolerance
    }
    
    // 否则只检查边界
    return Math.abs(distance - this.radius) <= tolerance
  }

  /**
   * 获取控制点
   */
  getControlPoints() {
    return [
      new Point(this.centerX, this.centerY), // 中心
      new Point(this.centerX, this.centerY - this.radius), // 上
      new Point(this.centerX + this.radius, this.centerY), // 右
      new Point(this.centerX, this.centerY + this.radius), // 下
      new Point(this.centerX - this.radius, this.centerY)  // 左
    ]
  }

  /**
   * 移动对象
   */
  move(deltaX, deltaY) {
    this.centerX += deltaX
    this.centerY += deltaY
    this.markDirty()
    return this
  }

  /**
   * 缩放对象
   */
  scale(scaleX, scaleY = scaleX, center) {
    // 圆形使用平均缩放值
    const avgScale = (scaleX + scaleY) / 2
    this.radius *= avgScale
    
    if (center && !center.equals(this.getCenter())) {
      // 绕指定点缩放
      const currentCenter = this.getCenter()
      const direction = currentCenter.subtract(center)
      const newCenter = center.add(direction.multiply(avgScale))
      this.centerX = newCenter.x
      this.centerY = newCenter.y
    }
    
    this.markDirty()
    return this
  }

  /**
   * 通过三点创建圆
   */
  static fromThreePoints(p1, p2, p3) {
    // 计算三点确定的圆心和半径
    const ax = p1.x
    const ay = p1.y
    const bx = p2.x
    const by = p2.y
    const cx = p3.x
    const cy = p3.y
    
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    
    if (Math.abs(d) < 0.0001) {
      // 三点共线，无法确定圆
      return null
    }
    
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d
    
    const center = new Point(ux, uy)
    const radius = center.distanceTo(p1)
    
    return new Circle(ux, uy, radius)
  }

  /**
   * 复制对象
   */
  clone() {
    const cloned = new Circle(this.centerX, this.centerY, this.radius)
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
      centerX: this.centerX,
      centerY: this.centerY,
      radius: this.radius
    }
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    const circle = new Circle(data.centerX, data.centerY, data.radius)
    circle.id = data.id
    circle.layer = data.layer
    circle.visible = data.visible
    circle.style = data.style
    circle.rotation = data.rotation
    circle.scaleX = data.scaleX
    circle.scaleY = data.scaleY
    return circle
  }
}

