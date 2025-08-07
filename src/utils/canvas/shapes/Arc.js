import { GraphicsObject } from '../GraphicsObject.js'
import { Point } from '../Point.js'

/**
 * 圆弧类
 */
export class Arc extends GraphicsObject {
  constructor(centerX = 0, centerY = 0, radius = 50, startAngle = 0, endAngle = Math.PI) {
    super('arc')
    this.centerX = centerX
    this.centerY = centerY
    this.radius = radius
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.clockwise = false // 绘制方向
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
   * 设置角度范围
   */
  setAngles(startAngle, endAngle) {
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.markDirty()
    return this
  }

  /**
   * 设置绘制方向
   */
  setClockwise(clockwise) {
    this.clockwise = clockwise
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
   * 获取起点
   */
  getStartPoint() {
    return new Point(
      this.centerX + this.radius * Math.cos(this.startAngle),
      this.centerY + this.radius * Math.sin(this.startAngle)
    )
  }

  /**
   * 获取终点
   */
  getEndPoint() {
    return new Point(
      this.centerX + this.radius * Math.cos(this.endAngle),
      this.centerY + this.radius * Math.sin(this.endAngle)
    )
  }

  /**
   * 获取中点
   */
  getMidPoint() {
    const midAngle = (this.startAngle + this.endAngle) / 2
    return new Point(
      this.centerX + this.radius * Math.cos(midAngle),
      this.centerY + this.radius * Math.sin(midAngle)
    )
  }

  /**
   * 获取弧长
   */
  getArcLength() {
    let angleDiff = this.endAngle - this.startAngle
    if (this.clockwise && angleDiff > 0) {
      angleDiff -= 2 * Math.PI
    } else if (!this.clockwise && angleDiff < 0) {
      angleDiff += 2 * Math.PI
    }
    return Math.abs(angleDiff) * this.radius
  }

  /**
   * 计算边界框
   */
  calculateBoundingBox() {
    const points = [this.getStartPoint(), this.getEndPoint()]
    
    // 检查是否包含关键角度点（0, π/2, π, 3π/2）
    const keyAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]
    keyAngles.forEach(angle => {
      if (this.angleInRange(angle)) {
        points.push(new Point(
          this.centerX + this.radius * Math.cos(angle),
          this.centerY + this.radius * Math.sin(angle)
        ))
      }
    })

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 检查角度是否在弧的范围内
   */
  angleInRange(angle) {
    let start = this.startAngle
    let end = this.endAngle
    
    // 标准化角度到 [0, 2π] 范围
    while (angle < 0) angle += 2 * Math.PI
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
    while (start < 0) start += 2 * Math.PI
    while (start >= 2 * Math.PI) start -= 2 * Math.PI
    while (end < 0) end += 2 * Math.PI
    while (end >= 2 * Math.PI) end -= 2 * Math.PI
    
    if (this.clockwise) {
      return start >= angle && angle >= end
    } else {
      return start <= angle && angle <= end
    }
  }

  /**
   * 绘制圆弧
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

    // 绘制圆弧
    ctx.beginPath()
    ctx.arc(centerScreen.x, centerScreen.y, radiusScreen, this.startAngle, this.endAngle, this.clockwise)
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
    const center = this.getCenter()
    const startPoint = this.getStartPoint()
    const endPoint = this.getEndPoint()
    const midPoint = this.getMidPoint()
    
    const centerScreen = transform.worldToScreen(center)
    const startScreen = transform.worldToScreen(startPoint)
    const endScreen = transform.worldToScreen(endPoint)
    const midScreen = transform.worldToScreen(midPoint)

    ctx.fillStyle = '#007aff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // 绘制端点
    this.drawControlPoint(ctx, startScreen, 4)
    this.drawControlPoint(ctx, endScreen, 4)
    
    // 绘制中点
    ctx.fillStyle = '#00ff00'
    this.drawControlPoint(ctx, midScreen, 3)
    
    // 绘制中心点
    ctx.fillStyle = '#ff0000'
    this.drawControlPoint(ctx, centerScreen, 3)

    // 绘制半径线
    ctx.strokeStyle = '#007aff'
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(centerScreen.x, centerScreen.y)
    ctx.lineTo(startScreen.x, startScreen.y)
    ctx.moveTo(centerScreen.x, centerScreen.y)
    ctx.lineTo(endScreen.x, endScreen.y)
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
    
    // 检查距离是否在半径附近
    if (Math.abs(distance - this.radius) > tolerance) {
      return false
    }
    
    // 检查角度是否在弧的范围内
    const angle = Math.atan2(point.y - this.centerY, point.x - this.centerX)
    return this.angleInRange(angle)
  }

  /**
   * 获取控制点
   */
  getControlPoints() {
    return [
      this.getCenter(),
      this.getStartPoint(),
      this.getEndPoint(),
      this.getMidPoint()
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
    // 圆弧使用平均缩放值
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
   * 通过三点创建圆弧
   */
  static fromThreePoints(p1, p2, p3) {
    // 先计算圆心和半径
    const ax = p1.x, ay = p1.y
    const bx = p2.x, by = p2.y
    const cx = p3.x, cy = p3.y
    
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    
    if (Math.abs(d) < 0.0001) {
      return null // 三点共线
    }
    
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d
    
    const center = new Point(ux, uy)
    const radius = center.distanceTo(p1)
    
    // 计算角度
    const startAngle = Math.atan2(p1.y - uy, p1.x - ux)
    const endAngle = Math.atan2(p3.y - uy, p3.x - ux)
    
    return new Arc(ux, uy, radius, startAngle, endAngle)
  }

  /**
   * 复制对象
   */
  clone() {
    const cloned = new Arc(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle)
    cloned.id = this.generateId()
    cloned.layer = this.layer
    cloned.visible = this.visible
    cloned.style = { ...this.style }
    cloned.clockwise = this.clockwise
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
      radius: this.radius,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      clockwise: this.clockwise
    }
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    const arc = new Arc(data.centerX, data.centerY, data.radius, data.startAngle, data.endAngle)
    arc.id = data.id
    arc.layer = data.layer
    arc.visible = data.visible
    arc.style = data.style
    arc.clockwise = data.clockwise
    arc.rotation = data.rotation
    arc.scaleX = data.scaleX
    arc.scaleY = data.scaleY
    return arc
  }
}

