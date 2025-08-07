import { Point } from './Point.js'

/**
 * 变换类 - 处理坐标系变换
 */
export class Transform {
  constructor() {
    this.scale = 1.0
    this.offsetX = 0
    this.offsetY = 0
    this.rotation = 0
  }

  /**
   * 设置缩放
   */
  setScale(scale) {
    this.scale = Math.max(0.1, Math.min(10, scale))
    return this
  }

  /**
   * 设置偏移
   */
  setOffset(x, y) {
    this.offsetX = x
    this.offsetY = y
    return this
  }

  /**
   * 设置旋转角度
   */
  setRotation(angle) {
    this.rotation = angle
    return this
  }

  /**
   * 世界坐标转换为屏幕坐标
   */
  worldToScreen(worldPoint) {
    // 先旋转，再缩放，最后平移
    const rotated = worldPoint.rotate(this.rotation)
    return new Point(
      rotated.x * this.scale + this.offsetX,
      rotated.y * this.scale + this.offsetY
    )
  }

  /**
   * 屏幕坐标转换为世界坐标
   */
  screenToWorld(screenPoint) {
    // 逆变换：先平移，再缩放，最后旋转
    const translated = new Point(
      (screenPoint.x - this.offsetX) / this.scale,
      (screenPoint.y - this.offsetY) / this.scale
    )
    return translated.rotate(-this.rotation)
  }

  /**
   * 缩放操作
   */
  zoom(factor, center) {
    const oldScale = this.scale
    this.setScale(this.scale * factor)
    
    if (center) {
      // 以指定点为中心缩放
      const scaleFactor = this.scale / oldScale
      this.offsetX = center.x - (center.x - this.offsetX) * scaleFactor
      this.offsetY = center.y - (center.y - this.offsetY) * scaleFactor
    }
    
    return this
  }

  /**
   * 平移操作
   */
  pan(deltaX, deltaY) {
    this.offsetX += deltaX
    this.offsetY += deltaY
    return this
  }

  /**
   * 旋转操作
   */
  rotate(angle, center) {
    this.rotation += angle
    
    if (center) {
      // 以指定点为中心旋转
      const offset = new Point(this.offsetX, this.offsetY)
      const rotated = offset.rotate(angle, center)
      this.offsetX = rotated.x
      this.offsetY = rotated.y
    }
    
    return this
  }

  /**
   * 重置变换
   */
  reset() {
    this.scale = 1.0
    this.offsetX = 0
    this.offsetY = 0
    this.rotation = 0
    return this
  }

  /**
   * 复制变换
   */
  clone() {
    const transform = new Transform()
    transform.scale = this.scale
    transform.offsetX = this.offsetX
    transform.offsetY = this.offsetY
    transform.rotation = this.rotation
    return transform
  }

  /**
   * 适应视图
   */
  fitToView(bounds, viewWidth, viewHeight, padding = 50) {
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return this
    }

    // 计算缩放比例
    const scaleX = (viewWidth - padding * 2) / bounds.width
    const scaleY = (viewHeight - padding * 2) / bounds.height
    this.scale = Math.min(scaleX, scaleY)

    // 计算偏移，使内容居中
    this.offsetX = viewWidth / 2 - (bounds.x + bounds.width / 2) * this.scale
    this.offsetY = viewHeight / 2 - (bounds.y + bounds.height / 2) * this.scale

    return this
  }

  /**
   * 获取变换矩阵
   */
  getMatrix() {
    const cos = Math.cos(this.rotation)
    const sin = Math.sin(this.rotation)
    
    return {
      a: this.scale * cos,
      b: this.scale * sin,
      c: -this.scale * sin,
      d: this.scale * cos,
      e: this.offsetX,
      f: this.offsetY
    }
  }

  /**
   * 应用变换到Canvas上下文
   */
  applyToContext(ctx) {
    const matrix = this.getMatrix()
    ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
  }
}

