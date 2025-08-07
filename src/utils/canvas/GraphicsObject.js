import { Point } from './Point.js'

/**
 * 图形对象基类
 */
export class GraphicsObject {
  constructor(type) {
    this.id = this.generateId()
    this.type = type
    this.layer = 'default'
    this.visible = true
    this.selected = false
    this.locked = false
    
    // 样式属性
    this.style = {
      strokeColor: '#000000',
      strokeWidth: 1,
      fillColor: 'transparent',
      lineType: 'solid', // solid, dashed, dotted
      opacity: 1.0
    }
    
    // 变换属性
    this.position = new Point(0, 0)
    this.rotation = 0
    this.scaleX = 1
    this.scaleY = 1
    
    // 边界框缓存
    this._boundingBox = null
    this._dirty = true
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 设置样式
   */
  setStyle(style) {
    Object.assign(this.style, style)
    this.markDirty()
    return this
  }

  /**
   * 设置位置
   */
  setPosition(x, y) {
    this.position.set(x, y)
    this.markDirty()
    return this
  }

  /**
   * 移动对象
   */
  move(deltaX, deltaY) {
    this.position.x += deltaX
    this.position.y += deltaY
    this.markDirty()
    return this
  }

  /**
   * 旋转对象
   */
  rotate(angle, center) {
    this.rotation += angle
    
    if (center && !center.equals(this.position)) {
      // 绕指定点旋转
      this.position = this.position.rotate(angle, center)
    }
    
    this.markDirty()
    return this
  }

  /**
   * 缩放对象
   */
  scale(scaleX, scaleY = scaleX, center) {
    this.scaleX *= scaleX
    this.scaleY *= scaleY
    
    if (center && !center.equals(this.position)) {
      // 绕指定点缩放
      const direction = this.position.subtract(center)
      this.position = center.add(direction.multiply(scaleX))
    }
    
    this.markDirty()
    return this
  }

  /**
   * 标记为脏数据
   */
  markDirty() {
    this._dirty = true
    this._boundingBox = null
  }

  /**
   * 获取边界框
   */
  getBoundingBox() {
    if (!this._boundingBox || this._dirty) {
      this._boundingBox = this.calculateBoundingBox()
      this._dirty = false
    }
    return this._boundingBox
  }

  /**
   * 计算边界框（子类需要实现）
   */
  calculateBoundingBox() {
    throw new Error('calculateBoundingBox must be implemented by subclass')
  }

  /**
   * 绘制对象（子类需要实现）
   */
  draw(ctx, transform) {
    throw new Error('draw must be implemented by subclass')
  }

  /**
   * 点击测试
   */
  hitTest(point, tolerance = 5) {
    const bounds = this.getBoundingBox()
    if (!bounds) return false
    
    return point.x >= bounds.x - tolerance &&
           point.x <= bounds.x + bounds.width + tolerance &&
           point.y >= bounds.y - tolerance &&
           point.y <= bounds.y + bounds.height + tolerance
  }

  /**
   * 获取控制点
   */
  getControlPoints() {
    const bounds = this.getBoundingBox()
    if (!bounds) return []
    
    return [
      new Point(bounds.x, bounds.y), // 左上
      new Point(bounds.x + bounds.width, bounds.y), // 右上
      new Point(bounds.x + bounds.width, bounds.y + bounds.height), // 右下
      new Point(bounds.x, bounds.y + bounds.height), // 左下
      new Point(bounds.x + bounds.width / 2, bounds.y), // 上中
      new Point(bounds.x + bounds.width, bounds.y + bounds.height / 2), // 右中
      new Point(bounds.x + bounds.width / 2, bounds.y + bounds.height), // 下中
      new Point(bounds.x, bounds.y + bounds.height / 2) // 左中
    ]
  }

  /**
   * 复制对象
   */
  clone() {
    const cloned = new this.constructor()
    cloned.type = this.type
    cloned.layer = this.layer
    cloned.visible = this.visible
    cloned.style = { ...this.style }
    cloned.position = this.position.clone()
    cloned.rotation = this.rotation
    cloned.scaleX = this.scaleX
    cloned.scaleY = this.scaleY
    return cloned
  }

  /**
   * 序列化为JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      layer: this.layer,
      visible: this.visible,
      style: this.style,
      position: this.position.toArray(),
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY
    }
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(data) {
    const obj = new this()
    obj.id = data.id
    obj.type = data.type
    obj.layer = data.layer
    obj.visible = data.visible
    obj.style = data.style
    obj.position = Point.fromArray(data.position)
    obj.rotation = data.rotation
    obj.scaleX = data.scaleX
    obj.scaleY = data.scaleY
    return obj
  }
}

