// Canvas绘图引擎导出文件

export { Point } from './Point.js'
export { Transform } from './Transform.js'
export { GraphicsObject } from './GraphicsObject.js'
export { CanvasEngine } from './CanvasEngine.js'

// 图形类
export { Line } from './shapes/Line.js'
export { Rectangle } from './shapes/Rectangle.js'
export { Circle } from './shapes/Circle.js'
export { Arc } from './shapes/Arc.js'
export { Dimension } from './shapes/Dimension.js'

// 工具函数
export const CanvasUtils = {
  /**
   * 创建Canvas引擎实例
   */
  createEngine(canvas) {
    return new CanvasEngine(canvas)
  },

  /**
   * 角度转弧度
   */
  degToRad(degrees) {
    return degrees * Math.PI / 180
  },

  /**
   * 弧度转角度
   */
  radToDeg(radians) {
    return radians * 180 / Math.PI
  },

  /**
   * 计算两点间距离
   */
  distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  },

  /**
   * 计算两点间角度
   */
  angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x)
  },

  /**
   * 限制数值范围
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  },

  /**
   * 线性插值
   */
  lerp(a, b, t) {
    return a + (b - a) * t
  },

  /**
   * 检查点是否在矩形内
   */
  pointInRect(point, rect) {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height
  },

  /**
   * 检查两个矩形是否相交
   */
  rectIntersect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  },

  /**
   * 计算矩形的并集
   */
  rectUnion(rect1, rect2) {
    const minX = Math.min(rect1.x, rect2.x)
    const minY = Math.min(rect1.y, rect2.y)
    const maxX = Math.max(rect1.x + rect1.width, rect2.x + rect2.width)
    const maxY = Math.max(rect1.y + rect1.height, rect2.y + rect2.height)
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  },

  /**
   * 格式化数值显示
   */
  formatNumber(value, precision = 2) {
    return Number(value.toFixed(precision))
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

