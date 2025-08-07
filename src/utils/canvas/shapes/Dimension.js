import { GraphicsObject } from '../GraphicsObject.js'
import { Point } from '../Point.js'

/**
 * 尺寸标注类 - 符合CAD标准的尺寸标注
 */
export class Dimension extends GraphicsObject {
	constructor(startPoint, endPoint, offset = 20, text = '') {
		super()
		this.startPoint = startPoint instanceof Point ? startPoint : new Point(startPoint.x, startPoint.y)
		this.endPoint = endPoint instanceof Point ? endPoint : new Point(endPoint.x, endPoint.y)
		this.offset = offset // 标注线偏移距离
		this.text = text // 标注文字
		this.actualLength = 0 // 实际长度
		this.unit = 'mm' // 单位
		this.precision = 0 // 小数位数
		this.showExtensionLines = true // 显示延伸线
		this.arrowSize = 8 // 箭头大小
		this.textHeight = 12 // 文字高度
		this.textOffset = 4 // 文字偏移
		
		// 计算标注线位置
		this.updateDimensionLine()
	}
	
	/**
	 * 更新标注线位置
	 */
	updateDimensionLine() {
		// 计算垂直于测量线的方向向量
		const dx = this.endPoint.x - this.startPoint.x
		const dy = this.endPoint.y - this.startPoint.y
		const length = Math.sqrt(dx * dx + dy * dy)
		
		if (length === 0) return
		
		// 单位向量
		const ux = dx / length
		const uy = dy / length
		
		// 垂直向量（向上偏移）
		const vx = -uy
		const vy = ux
		
		// 标注线起点和终点
		this.dimLineStart = new Point(
			this.startPoint.x + vx * this.offset,
			this.startPoint.y + vy * this.offset
		)
		this.dimLineEnd = new Point(
			this.endPoint.x + vx * this.offset,
			this.endPoint.y + vy * this.offset
		)
		
		// 延伸线
		this.extLine1Start = this.startPoint.clone()
		this.extLine1End = new Point(
			this.startPoint.x + vx * (this.offset + 10),
			this.startPoint.y + vy * (this.offset + 10)
		)
		
		this.extLine2Start = this.endPoint.clone()
		this.extLine2End = new Point(
			this.endPoint.x + vx * (this.offset + 10),
			this.endPoint.y + vy * (this.offset + 10)
		)
		
		// 文字位置（标注线中点）
		this.textPosition = new Point(
			(this.dimLineStart.x + this.dimLineEnd.x) / 2,
			(this.dimLineStart.y + this.dimLineEnd.y) / 2 - this.textOffset
		)
		
		// 计算像素长度
		this.pixelLength = length
		
		// 如果没有设置实际长度，使用像素长度
		if (this.actualLength === 0) {
			this.actualLength = Math.round(length)
		}
		
		// 更新边界框
		this.updateBounds()
	}
	
	/**
	 * 设置实际长度
	 */
	setActualLength(length) {
		this.actualLength = length
		return this
	}
	
	/**
	 * 设置标注文字
	 */
	setText(text) {
		this.text = text
		return this
	}
	
	/**
	 * 设置偏移距离
	 */
	setOffset(offset) {
		this.offset = offset
		this.updateDimensionLine()
		return this
	}
	
	/**
	 * 设置单位
	 */
	setUnit(unit) {
		this.unit = unit
		return this
	}
	
	/**
	 * 设置精度
	 */
	setPrecision(precision) {
		this.precision = precision
		return this
	}
	
	/**
	 * 获取显示文字
	 */
	getDisplayText() {
		if (this.text) {
			return this.text
		}
		
		const value = this.precision > 0 ? 
			this.actualLength.toFixed(this.precision) : 
			Math.round(this.actualLength)
		
		return `${value}${this.unit}`
	}
	
	/**
	 * 绘制标注
	 */
	draw(ctx) {
		if (!this.visible) return
		
		ctx.save()
		
		// 应用变换
		this.applyTransform(ctx)
		
		// 设置样式
		ctx.strokeStyle = this.style.strokeColor || '#000000'
		ctx.lineWidth = this.style.strokeWidth || 1
		ctx.fillStyle = this.style.textColor || this.style.strokeColor || '#000000'
		ctx.font = `${this.textHeight}px Arial`
		ctx.textAlign = 'center'
		ctx.textBaseline = 'bottom'
		
		// 绘制延伸线
		if (this.showExtensionLines) {
			this.drawExtensionLine(ctx, this.extLine1Start, this.extLine1End)
			this.drawExtensionLine(ctx, this.extLine2Start, this.extLine2End)
		}
		
		// 绘制标注线
		this.drawDimensionLine(ctx)
		
		// 绘制箭头
		this.drawArrow(ctx, this.dimLineStart, this.dimLineEnd, true)
		this.drawArrow(ctx, this.dimLineEnd, this.dimLineStart, true)
		
		// 绘制文字
		this.drawText(ctx)
		
		ctx.restore()
	}
	
	/**
	 * 绘制延伸线
	 */
	drawExtensionLine(ctx, start, end) {
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}
	
	/**
	 * 绘制标注线
	 */
	drawDimensionLine(ctx) {
		ctx.beginPath()
		ctx.moveTo(this.dimLineStart.x, this.dimLineStart.y)
		ctx.lineTo(this.dimLineEnd.x, this.dimLineEnd.y)
		ctx.stroke()
	}
	
	/**
	 * 绘制箭头
	 */
	drawArrow(ctx, from, to, filled = true) {
		const dx = to.x - from.x
		const dy = to.y - from.y
		const length = Math.sqrt(dx * dx + dy * dy)
		
		if (length === 0) return
		
		const ux = dx / length
		const uy = dy / length
		
		// 箭头顶点
		const arrowTip = from.clone()
		
		// 箭头底边的两个点
		const arrowBase1 = new Point(
			arrowTip.x - ux * this.arrowSize + uy * this.arrowSize * 0.5,
			arrowTip.y - uy * this.arrowSize - ux * this.arrowSize * 0.5
		)
		const arrowBase2 = new Point(
			arrowTip.x - ux * this.arrowSize - uy * this.arrowSize * 0.5,
			arrowTip.y - uy * this.arrowSize + ux * this.arrowSize * 0.5
		)
		
		ctx.beginPath()
		ctx.moveTo(arrowTip.x, arrowTip.y)
		ctx.lineTo(arrowBase1.x, arrowBase1.y)
		ctx.lineTo(arrowBase2.x, arrowBase2.y)
		ctx.closePath()
		
		if (filled) {
			ctx.fill()
		} else {
			ctx.stroke()
		}
	}
	
	/**
	 * 绘制文字
	 */
	drawText(ctx) {
		const text = this.getDisplayText()
		if (!text) return
		
		// 计算文字背景
		const metrics = ctx.measureText(text)
		const textWidth = metrics.width
		const textHeight = this.textHeight
		
		// 绘制文字背景（可选）
		if (this.style.textBackground) {
			ctx.fillStyle = this.style.textBackground
			ctx.fillRect(
				this.textPosition.x - textWidth / 2 - 2,
				this.textPosition.y - textHeight - 2,
				textWidth + 4,
				textHeight + 4
			)
		}
		
		// 绘制文字
		ctx.fillStyle = this.style.textColor || this.style.strokeColor || '#000000'
		ctx.fillText(text, this.textPosition.x, this.textPosition.y)
	}
	
	/**
	 * 更新边界框
	 */
	updateBounds() {
		const points = [
			this.startPoint,
			this.endPoint,
			this.dimLineStart,
			this.dimLineEnd,
			this.extLine1Start,
			this.extLine1End,
			this.extLine2Start,
			this.extLine2End,
			this.textPosition
		]
		
		let minX = Infinity, minY = Infinity
		let maxX = -Infinity, maxY = -Infinity
		
		points.forEach(point => {
			minX = Math.min(minX, point.x)
			minY = Math.min(minY, point.y)
			maxX = Math.max(maxX, point.x)
			maxY = Math.max(maxY, point.y)
		})
		
		// 扩展边界以包含箭头和文字
		const margin = Math.max(this.arrowSize, this.textHeight) + 5
		this.bounds = {
			x: minX - margin,
			y: minY - margin,
			width: maxX - minX + 2 * margin,
			height: maxY - minY + 2 * margin
		}
	}
	
	/**
	 * 点击测试
	 */
	hitTest(point, tolerance = 5) {
		// 测试标注线
		if (this.pointToLineDistance(point, this.dimLineStart, this.dimLineEnd) <= tolerance) {
			return true
		}
		
		// 测试延伸线
		if (this.showExtensionLines) {
			if (this.pointToLineDistance(point, this.extLine1Start, this.extLine1End) <= tolerance) {
				return true
			}
			if (this.pointToLineDistance(point, this.extLine2Start, this.extLine2End) <= tolerance) {
				return true
			}
		}
		
		// 测试文字区域
		const textWidth = this.getDisplayText().length * this.textHeight * 0.6 // 估算文字宽度
		const textBounds = {
			x: this.textPosition.x - textWidth / 2,
			y: this.textPosition.y - this.textHeight,
			width: textWidth,
			height: this.textHeight
		}
		
		if (point.x >= textBounds.x && point.x <= textBounds.x + textBounds.width &&
			point.y >= textBounds.y && point.y <= textBounds.y + textBounds.height) {
			return true
		}
		
		return false
	}
	
	/**
	 * 计算点到线段的距离
	 */
	pointToLineDistance(point, lineStart, lineEnd) {
		const A = point.x - lineStart.x
		const B = point.y - lineStart.y
		const C = lineEnd.x - lineStart.x
		const D = lineEnd.y - lineStart.y
		
		const dot = A * C + B * D
		const lenSq = C * C + D * D
		
		if (lenSq === 0) {
			return Math.sqrt(A * A + B * B)
		}
		
		let param = dot / lenSq
		
		let xx, yy
		
		if (param < 0) {
			xx = lineStart.x
			yy = lineStart.y
		} else if (param > 1) {
			xx = lineEnd.x
			yy = lineEnd.y
		} else {
			xx = lineStart.x + param * C
			yy = lineStart.y + param * D
		}
		
		const dx = point.x - xx
		const dy = point.y - yy
		return Math.sqrt(dx * dx + dy * dy)
	}
	
	/**
	 * 移动标注
	 */
	move(deltaX, deltaY) {
		this.startPoint.x += deltaX
		this.startPoint.y += deltaY
		this.endPoint.x += deltaX
		this.endPoint.y += deltaY
		this.updateDimensionLine()
		return this
	}
	
	/**
	 * 克隆标注
	 */
	clone() {
		const dimension = new Dimension(this.startPoint.clone(), this.endPoint.clone(), this.offset, this.text)
		dimension.actualLength = this.actualLength
		dimension.unit = this.unit
		dimension.precision = this.precision
		dimension.showExtensionLines = this.showExtensionLines
		dimension.arrowSize = this.arrowSize
		dimension.textHeight = this.textHeight
		dimension.textOffset = this.textOffset
		dimension.copyStyleFrom(this)
		return dimension
	}
	
	/**
	 * 序列化为JSON
	 */
	toJSON() {
		return {
			type: 'Dimension',
			startPoint: this.startPoint.toJSON(),
			endPoint: this.endPoint.toJSON(),
			offset: this.offset,
			text: this.text,
			actualLength: this.actualLength,
			unit: this.unit,
			precision: this.precision,
			showExtensionLines: this.showExtensionLines,
			arrowSize: this.arrowSize,
			textHeight: this.textHeight,
			textOffset: this.textOffset,
			style: this.style,
			visible: this.visible,
			selectable: this.selectable,
			transform: this.transform.toJSON()
		}
	}
	
	/**
	 * 从JSON反序列化
	 */
	static fromJSON(data) {
		const dimension = new Dimension(
			Point.fromJSON(data.startPoint),
			Point.fromJSON(data.endPoint),
			data.offset,
			data.text
		)
		
		dimension.actualLength = data.actualLength || 0
		dimension.unit = data.unit || 'mm'
		dimension.precision = data.precision || 0
		dimension.showExtensionLines = data.showExtensionLines !== false
		dimension.arrowSize = data.arrowSize || 8
		dimension.textHeight = data.textHeight || 12
		dimension.textOffset = data.textOffset || 4
		dimension.style = data.style || {}
		dimension.visible = data.visible !== false
		dimension.selectable = data.selectable !== false
		
		if (data.transform) {
			dimension.transform.fromJSON(data.transform)
		}
		
		dimension.updateDimensionLine()
		return dimension
	}
}

export default Dimension

