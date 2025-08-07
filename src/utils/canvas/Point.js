/**
 * 点类 - 表示二维坐标点
 */
export class Point {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  /**
   * 复制点
   */
  clone() {
    return new Point(this.x, this.y)
  }

  /**
   * 设置坐标
   */
  set(x, y) {
    this.x = x
    this.y = y
    return this
  }

  /**
   * 加法运算
   */
  add(point) {
    return new Point(this.x + point.x, this.y + point.y)
  }

  /**
   * 减法运算
   */
  subtract(point) {
    return new Point(this.x - point.x, this.y - point.y)
  }

  /**
   * 乘法运算（标量）
   */
  multiply(scalar) {
    return new Point(this.x * scalar, this.y * scalar)
  }

  /**
   * 计算到另一点的距离
   */
  distanceTo(point) {
    const dx = this.x - point.x
    const dy = this.y - point.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 计算到另一点的角度（弧度）
   */
  angleTo(point) {
    return Math.atan2(point.y - this.y, point.x - this.x)
  }

  /**
   * 旋转点
   */
  rotate(angle, center = new Point(0, 0)) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = this.x - center.x
    const dy = this.y - center.y
    
    return new Point(
      center.x + dx * cos - dy * sin,
      center.y + dx * sin + dy * cos
    )
  }

  /**
   * 判断是否等于另一点
   */
  equals(point, tolerance = 0.001) {
    return Math.abs(this.x - point.x) < tolerance && 
           Math.abs(this.y - point.y) < tolerance
  }

  /**
   * 转换为字符串
   */
  toString() {
    return `Point(${this.x}, ${this.y})`
  }

  /**
   * 转换为数组
   */
  toArray() {
    return [this.x, this.y]
  }

  /**
   * 从数组创建点
   */
  static fromArray(arr) {
    return new Point(arr[0], arr[1])
  }

  /**
   * 计算两点的中点
   */
  static midpoint(p1, p2) {
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
  }

  /**
   * 计算两点的距离
   */
  static distance(p1, p2) {
    return p1.distanceTo(p2)
  }
}

