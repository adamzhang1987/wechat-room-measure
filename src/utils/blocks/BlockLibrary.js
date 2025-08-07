/**
 * 图块库管理系统 - 管理CAD图块的创建、存储和使用
 */
import { GraphicsObject } from '../canvas/GraphicsObject.js'
import { Point } from '../canvas/Point.js'
import { Line } from '../canvas/shapes/Line.js'
import { Rectangle } from '../canvas/shapes/Rectangle.js'
import { Circle } from '../canvas/shapes/Circle.js'
import { Arc } from '../canvas/shapes/Arc.js'

/**
 * 图块定义类
 */
export class Block extends GraphicsObject {
	constructor(name, description = '') {
		super()
		this.name = name
		this.description = description
		this.objects = [] // 组成图块的图形对象
		this.insertionPoint = new Point(0, 0) // 插入点
		this.category = 'custom' // 图块分类
		this.tags = [] // 标签
		this.thumbnail = null // 缩略图
		this.createTime = new Date().toISOString()
		this.modifyTime = new Date().toISOString()
		this.author = ''
		this.version = '1.0'
		this.isBuiltIn = false // 是否为内置图块
	}
	
	/**
	 * 添加图形对象到图块
	 */
	addObject(object) {
		if (object instanceof GraphicsObject) {
			this.objects.push(object)
			this.updateBounds()
			this.modifyTime = new Date().toISOString()
		}
		return this
	}
	
	/**
	 * 移除图形对象
	 */
	removeObject(object) {
		const index = this.objects.indexOf(object)
		if (index !== -1) {
			this.objects.splice(index, 1)
			this.updateBounds()
			this.modifyTime = new Date().toISOString()
		}
		return this
	}
	
	/**
	 * 设置插入点
	 */
	setInsertionPoint(point) {
		this.insertionPoint = point instanceof Point ? point : new Point(point.x, point.y)
		return this
	}
	
	/**
	 * 设置分类
	 */
	setCategory(category) {
		this.category = category
		return this
	}
	
	/**
	 * 添加标签
	 */
	addTag(tag) {
		if (!this.tags.includes(tag)) {
			this.tags.push(tag)
		}
		return this
	}
	
	/**
	 * 设置缩略图
	 */
	setThumbnail(thumbnail) {
		this.thumbnail = thumbnail
		return this
	}
	
	/**
	 * 创建图块实例
	 */
	createInstance(insertPoint, scale = 1, rotation = 0) {
		const instance = new BlockInstance(this, insertPoint, scale, rotation)
		return instance
	}
	
	/**
	 * 绘制图块（用于预览）
	 */
	draw(ctx) {
		if (!this.visible) return
		
		ctx.save()
		this.applyTransform(ctx)
		
		// 绘制所有对象
		this.objects.forEach(object => {
			object.draw(ctx)
		})
		
		// 绘制插入点（可选）
		if (this.showInsertionPoint) {
			ctx.fillStyle = '#ff0000'
			ctx.beginPath()
			ctx.arc(this.insertionPoint.x, this.insertionPoint.y, 3, 0, Math.PI * 2)
			ctx.fill()
		}
		
		ctx.restore()
	}
	
	/**
	 * 更新边界框
	 */
	updateBounds() {
		if (this.objects.length === 0) {
			this.bounds = { x: 0, y: 0, width: 0, height: 0 }
			return
		}
		
		let minX = Infinity, minY = Infinity
		let maxX = -Infinity, maxY = -Infinity
		
		this.objects.forEach(object => {
			if (object.bounds) {
				minX = Math.min(minX, object.bounds.x)
				minY = Math.min(minY, object.bounds.y)
				maxX = Math.max(maxX, object.bounds.x + object.bounds.width)
				maxY = Math.max(maxY, object.bounds.y + object.bounds.height)
			}
		})
		
		this.bounds = {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		}
	}
	
	/**
	 * 克隆图块
	 */
	clone() {
		const block = new Block(this.name + '_副本', this.description)
		block.category = this.category
		block.tags = [...this.tags]
		block.insertionPoint = this.insertionPoint.clone()
		block.objects = this.objects.map(obj => obj.clone())
		block.updateBounds()
		return block
	}
	
	/**
	 * 序列化为JSON
	 */
	toJSON() {
		return {
			type: 'Block',
			name: this.name,
			description: this.description,
			category: this.category,
			tags: this.tags,
			insertionPoint: this.insertionPoint.toJSON(),
			objects: this.objects.map(obj => obj.toJSON()),
			thumbnail: this.thumbnail,
			createTime: this.createTime,
			modifyTime: this.modifyTime,
			author: this.author,
			version: this.version,
			isBuiltIn: this.isBuiltIn,
			bounds: this.bounds
		}
	}
	
	/**
	 * 从JSON反序列化
	 */
	static fromJSON(data) {
		const block = new Block(data.name, data.description)
		block.category = data.category || 'custom'
		block.tags = data.tags || []
		block.insertionPoint = Point.fromJSON(data.insertionPoint)
		block.thumbnail = data.thumbnail
		block.createTime = data.createTime
		block.modifyTime = data.modifyTime
		block.author = data.author || ''
		block.version = data.version || '1.0'
		block.isBuiltIn = data.isBuiltIn || false
		block.bounds = data.bounds
		
		// 反序列化对象
		if (data.objects) {
			block.objects = data.objects.map(objData => {
				switch (objData.type) {
					case 'Line':
						return Line.fromJSON(objData)
					case 'Rectangle':
						return Rectangle.fromJSON(objData)
					case 'Circle':
						return Circle.fromJSON(objData)
					case 'Arc':
						return Arc.fromJSON(objData)
					default:
						return null
				}
			}).filter(obj => obj !== null)
		}
		
		return block
	}
}

/**
 * 图块实例类 - 图块在图纸中的具体实例
 */
export class BlockInstance extends GraphicsObject {
	constructor(block, insertPoint, scale = 1, rotation = 0) {
		super()
		this.block = block
		this.insertPoint = insertPoint instanceof Point ? insertPoint : new Point(insertPoint.x, insertPoint.y)
		this.scale = scale
		this.rotation = rotation // 弧度
		this.updateBounds()
	}
	
	/**
	 * 设置缩放
	 */
	setScale(scale) {
		this.scale = scale
		this.updateBounds()
		return this
	}
	
	/**
	 * 设置旋转角度
	 */
	setRotation(rotation) {
		this.rotation = rotation
		this.updateBounds()
		return this
	}
	
	/**
	 * 移动到新位置
	 */
	moveTo(point) {
		this.insertPoint = point instanceof Point ? point : new Point(point.x, point.y)
		this.updateBounds()
		return this
	}
	
	/**
	 * 绘制图块实例
	 */
	draw(ctx) {
		if (!this.visible || !this.block) return
		
		ctx.save()
		
		// 应用变换
		this.applyTransform(ctx)
		
		// 移动到插入点
		ctx.translate(this.insertPoint.x, this.insertPoint.y)
		
		// 应用旋转
		if (this.rotation !== 0) {
			ctx.rotate(this.rotation)
		}
		
		// 应用缩放
		if (this.scale !== 1) {
			ctx.scale(this.scale, this.scale)
		}
		
		// 移动到图块的插入点
		ctx.translate(-this.block.insertionPoint.x, -this.block.insertionPoint.y)
		
		// 绘制图块中的所有对象
		this.block.objects.forEach(object => {
			object.draw(ctx)
		})
		
		ctx.restore()
	}
	
	/**
	 * 更新边界框
	 */
	updateBounds() {
		if (!this.block || !this.block.bounds) {
			this.bounds = { x: 0, y: 0, width: 0, height: 0 }
			return
		}
		
		const blockBounds = this.block.bounds
		const scaledWidth = blockBounds.width * this.scale
		const scaledHeight = blockBounds.height * this.scale
		
		// 简化处理，不考虑旋转对边界框的影响
		this.bounds = {
			x: this.insertPoint.x - scaledWidth / 2,
			y: this.insertPoint.y - scaledHeight / 2,
			width: scaledWidth,
			height: scaledHeight
		}
	}
	
	/**
	 * 点击测试
	 */
	hitTest(point, tolerance = 5) {
		if (!this.bounds) return false
		
		return point.x >= this.bounds.x - tolerance &&
			   point.x <= this.bounds.x + this.bounds.width + tolerance &&
			   point.y >= this.bounds.y - tolerance &&
			   point.y <= this.bounds.y + this.bounds.height + tolerance
	}
	
	/**
	 * 克隆实例
	 */
	clone() {
		const instance = new BlockInstance(this.block, this.insertPoint.clone(), this.scale, this.rotation)
		instance.copyStyleFrom(this)
		return instance
	}
	
	/**
	 * 序列化为JSON
	 */
	toJSON() {
		return {
			type: 'BlockInstance',
			blockName: this.block.name,
			insertPoint: this.insertPoint.toJSON(),
			scale: this.scale,
			rotation: this.rotation,
			style: this.style,
			visible: this.visible,
			selectable: this.selectable,
			transform: this.transform.toJSON()
		}
	}
}

/**
 * 图块库管理类
 */
export class BlockLibrary {
	constructor() {
		this.blocks = new Map() // 存储所有图块
		this.categories = new Map() // 分类管理
		this.storageKey = 'room_measure_blocks'
		this.loadBlocks()
		this.initBuiltInBlocks()
	}
	
	/**
	 * 添加图块到库
	 */
	addBlock(block) {
		if (block instanceof Block) {
			this.blocks.set(block.name, block)
			this.addToCategory(block.category, block.name)
			this.saveBlocks()
			return true
		}
		return false
	}
	
	/**
	 * 获取图块
	 */
	getBlock(name) {
		return this.blocks.get(name)
	}
	
	/**
	 * 删除图块
	 */
	removeBlock(name) {
		const block = this.blocks.get(name)
		if (block && !block.isBuiltIn) {
			this.blocks.delete(name)
			this.removeFromCategory(block.category, name)
			this.saveBlocks()
			return true
		}
		return false
	}
	
	/**
	 * 获取分类中的图块
	 */
	getBlocksByCategory(category) {
		const blockNames = this.categories.get(category) || []
		return blockNames.map(name => this.blocks.get(name)).filter(block => block)
	}
	
	/**
	 * 获取所有分类
	 */
	getCategories() {
		return Array.from(this.categories.keys())
	}
	
	/**
	 * 搜索图块
	 */
	searchBlocks(keyword) {
		const results = []
		for (const block of this.blocks.values()) {
			if (block.name.toLowerCase().includes(keyword.toLowerCase()) ||
				block.description.toLowerCase().includes(keyword.toLowerCase()) ||
				block.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))) {
				results.push(block)
			}
		}
		return results
	}
	
	/**
	 * 添加到分类
	 */
	addToCategory(category, blockName) {
		if (!this.categories.has(category)) {
			this.categories.set(category, [])
		}
		const blocks = this.categories.get(category)
		if (!blocks.includes(blockName)) {
			blocks.push(blockName)
		}
	}
	
	/**
	 * 从分类中移除
	 */
	removeFromCategory(category, blockName) {
		const blocks = this.categories.get(category)
		if (blocks) {
			const index = blocks.indexOf(blockName)
			if (index !== -1) {
				blocks.splice(index, 1)
			}
			if (blocks.length === 0) {
				this.categories.delete(category)
			}
		}
	}
	
	/**
	 * 从本地存储加载图块
	 */
	loadBlocks() {
		try {
			const data = uni.getStorageSync(this.storageKey)
			if (data) {
				const blocksData = JSON.parse(data)
				blocksData.forEach(blockData => {
					const block = Block.fromJSON(blockData)
					this.blocks.set(block.name, block)
					this.addToCategory(block.category, block.name)
				})
			}
		} catch (error) {
			console.error('加载图块库失败:', error)
		}
	}
	
	/**
	 * 保存图块到本地存储
	 */
	saveBlocks() {
		try {
			const blocksData = Array.from(this.blocks.values())
				.filter(block => !block.isBuiltIn) // 不保存内置图块
				.map(block => block.toJSON())
			uni.setStorageSync(this.storageKey, JSON.stringify(blocksData))
		} catch (error) {
			console.error('保存图块库失败:', error)
		}
	}
	
	/**
	 * 初始化内置图块
	 */
	initBuiltInBlocks() {
		// 门类图块
		this.createDoorBlocks()
		// 窗类图块
		this.createWindowBlocks()
		// 家具类图块
		this.createFurnitureBlocks()
		// 卫浴类图块
		this.createBathroomBlocks()
		// 厨房类图块
		this.createKitchenBlocks()
	}
	
	/**
	 * 创建门类图块
	 */
	createDoorBlocks() {
		// 单开门
		const singleDoor = new Block('单开门', '标准单开门')
		singleDoor.setCategory('门窗').addTag('门').addTag('单开')
		singleDoor.isBuiltIn = true
		
		// 门框
		const doorFrame = new Rectangle(0, 0, 100, 20)
		doorFrame.setStyle({ strokeColor: '#000000', fillColor: '#ffffff' })
		singleDoor.addObject(doorFrame)
		
		// 门扇
		const doorLeaf = new Arc(0, 10, 80, 0, Math.PI / 2)
		doorLeaf.setStyle({ strokeColor: '#000000', strokeWidth: 2 })
		singleDoor.addObject(doorLeaf)
		
		singleDoor.setInsertionPoint(new Point(50, 10))
		this.addBlock(singleDoor)
		
		// 双开门
		const doubleDoor = new Block('双开门', '标准双开门')
		doubleDoor.setCategory('门窗').addTag('门').addTag('双开')
		doubleDoor.isBuiltIn = true
		
		// 门框
		const doorFrame2 = new Rectangle(0, 0, 160, 20)
		doorFrame2.setStyle({ strokeColor: '#000000', fillColor: '#ffffff' })
		doubleDoor.addObject(doorFrame2)
		
		// 左门扇
		const leftLeaf = new Arc(20, 10, 60, 0, Math.PI / 2)
		leftLeaf.setStyle({ strokeColor: '#000000', strokeWidth: 2 })
		doubleDoor.addObject(leftLeaf)
		
		// 右门扇
		const rightLeaf = new Arc(140, 10, 60, Math.PI / 2, Math.PI)
		rightLeaf.setStyle({ strokeColor: '#000000', strokeWidth: 2 })
		doubleDoor.addObject(rightLeaf)
		
		doubleDoor.setInsertionPoint(new Point(80, 10))
		this.addBlock(doubleDoor)
	}
	
	/**
	 * 创建窗类图块
	 */
	createWindowBlocks() {
		// 普通窗
		const window = new Block('普通窗', '标准窗户')
		window.setCategory('门窗').addTag('窗').addTag('普通')
		window.isBuiltIn = true
		
		// 窗框
		const windowFrame = new Rectangle(0, 0, 120, 20)
		windowFrame.setStyle({ strokeColor: '#000000', fillColor: '#e6f3ff' })
		window.addObject(windowFrame)
		
		// 窗格
		const divider = new Line(new Point(60, 0), new Point(60, 20))
		divider.setStyle({ strokeColor: '#000000', strokeWidth: 1 })
		window.addObject(divider)
		
		window.setInsertionPoint(new Point(60, 10))
		this.addBlock(window)
		
		// 飘窗
		const bayWindow = new Block('飘窗', '凸出式飘窗')
		bayWindow.setCategory('门窗').addTag('窗').addTag('飘窗')
		bayWindow.isBuiltIn = true
		
		// 主窗体
		const mainWindow = new Rectangle(0, 0, 150, 60)
		mainWindow.setStyle({ strokeColor: '#000000', fillColor: '#e6f3ff' })
		bayWindow.addObject(mainWindow)
		
		// 左侧窗
		const leftWindow = new Rectangle(-30, 10, 30, 40)
		leftWindow.setStyle({ strokeColor: '#000000', fillColor: '#e6f3ff' })
		bayWindow.addObject(leftWindow)
		
		// 右侧窗
		const rightWindow = new Rectangle(150, 10, 30, 40)
		rightWindow.setStyle({ strokeColor: '#000000', fillColor: '#e6f3ff' })
		bayWindow.addObject(rightWindow)
		
		bayWindow.setInsertionPoint(new Point(75, 30))
		this.addBlock(bayWindow)
	}
	
	/**
	 * 创建家具类图块
	 */
	createFurnitureBlocks() {
		// 床
		const bed = new Block('双人床', '标准双人床')
		bed.setCategory('家具').addTag('床').addTag('卧室')
		bed.isBuiltIn = true
		
		const bedFrame = new Rectangle(0, 0, 200, 150)
		bedFrame.setStyle({ strokeColor: '#8B4513', fillColor: '#DEB887' })
		bed.addObject(bedFrame)
		
		const pillow1 = new Rectangle(10, 10, 80, 30)
		pillow1.setStyle({ strokeColor: '#8B4513', fillColor: '#F5F5DC' })
		bed.addObject(pillow1)
		
		const pillow2 = new Rectangle(110, 10, 80, 30)
		pillow2.setStyle({ strokeColor: '#8B4513', fillColor: '#F5F5DC' })
		bed.addObject(pillow2)
		
		bed.setInsertionPoint(new Point(100, 75))
		this.addBlock(bed)
		
		// 沙发
		const sofa = new Block('三人沙发', '标准三人沙发')
		sofa.setCategory('家具').addTag('沙发').addTag('客厅')
		sofa.isBuiltIn = true
		
		const sofaBase = new Rectangle(0, 0, 180, 80)
		sofaBase.setStyle({ strokeColor: '#654321', fillColor: '#D2B48C' })
		sofa.addObject(sofaBase)
		
		const sofaBack = new Rectangle(0, 0, 180, 20)
		sofaBack.setStyle({ strokeColor: '#654321', fillColor: '#D2B48C' })
		sofa.addObject(sofaBack)
		
		sofa.setInsertionPoint(new Point(90, 40))
		this.addBlock(sofa)
		
		// 餐桌
		const diningTable = new Block('餐桌', '四人餐桌')
		diningTable.setCategory('家具').addTag('桌子').addTag('餐厅')
		diningTable.isBuiltIn = true
		
		const tableTop = new Rectangle(0, 0, 120, 80)
		tableTop.setStyle({ strokeColor: '#8B4513', fillColor: '#DEB887' })
		diningTable.addObject(tableTop)
		
		diningTable.setInsertionPoint(new Point(60, 40))
		this.addBlock(diningTable)
	}
	
	/**
	 * 创建卫浴类图块
	 */
	createBathroomBlocks() {
		// 马桶
		const toilet = new Block('马桶', '标准马桶')
		toilet.setCategory('卫浴').addTag('马桶').addTag('卫生间')
		toilet.isBuiltIn = true
		
		const toiletBase = new Rectangle(0, 0, 40, 60)
		toiletBase.setStyle({ strokeColor: '#000000', fillColor: '#ffffff' })
		toilet.addObject(toiletBase)
		
		const toiletSeat = new Circle(20, 20, 15)
		toiletSeat.setStyle({ strokeColor: '#000000', fillColor: '#ffffff' })
		toilet.addObject(toiletSeat)
		
		toilet.setInsertionPoint(new Point(20, 30))
		this.addBlock(toilet)
		
		// 洗手池
		const washbasin = new Block('洗手池', '标准洗手池')
		washbasin.setCategory('卫浴').addTag('洗手池').addTag('卫生间')
		washbasin.isBuiltIn = true
		
		const basin = new Circle(30, 30, 25)
		basin.setStyle({ strokeColor: '#000000', fillColor: '#ffffff' })
		washbasin.addObject(basin)
		
		const counter = new Rectangle(0, 20, 60, 20)
		counter.setStyle({ strokeColor: '#000000', fillColor: '#f0f0f0' })
		washbasin.addObject(counter)
		
		washbasin.setInsertionPoint(new Point(30, 30))
		this.addBlock(washbasin)
		
		// 浴缸
		const bathtub = new Block('浴缸', '标准浴缸')
		bathtub.setCategory('卫浴').addTag('浴缸').addTag('卫生间')
		bathtub.isBuiltIn = true
		
		const tub = new Rectangle(0, 0, 170, 80)
		tub.setStyle({ strokeColor: '#000000', fillColor: '#ffffff' })
		bathtub.addObject(tub)
		
		bathtub.setInsertionPoint(new Point(85, 40))
		this.addBlock(bathtub)
	}
	
	/**
	 * 创建厨房类图块
	 */
	createKitchenBlocks() {
		// 灶台
		const stove = new Block('灶台', '双眼灶台')
		stove.setCategory('厨房').addTag('灶台').addTag('厨房')
		stove.isBuiltIn = true
		
		const stoveBase = new Rectangle(0, 0, 60, 60)
		stoveBase.setStyle({ strokeColor: '#000000', fillColor: '#C0C0C0' })
		stove.addObject(stoveBase)
		
		const burner1 = new Circle(20, 20, 8)
		burner1.setStyle({ strokeColor: '#000000', fillColor: '#404040' })
		stove.addObject(burner1)
		
		const burner2 = new Circle(40, 40, 8)
		burner2.setStyle({ strokeColor: '#000000', fillColor: '#404040' })
		stove.addObject(burner2)
		
		stove.setInsertionPoint(new Point(30, 30))
		this.addBlock(stove)
		
		// 冰箱
		const refrigerator = new Block('冰箱', '双门冰箱')
		refrigerator.setCategory('厨房').addTag('冰箱').addTag('厨房')
		refrigerator.isBuiltIn = true
		
		const fridgeBody = new Rectangle(0, 0, 60, 80)
		fridgeBody.setStyle({ strokeColor: '#000000', fillColor: '#F5F5F5' })
		refrigerator.addObject(fridgeBody)
		
		const fridgeDivider = new Line(new Point(30, 0), new Point(30, 80))
		fridgeDivider.setStyle({ strokeColor: '#000000', strokeWidth: 1 })
		refrigerator.addObject(fridgeDivider)
		
		refrigerator.setInsertionPoint(new Point(30, 40))
		this.addBlock(refrigerator)
	}
	
	/**
	 * 导出图块库
	 */
	exportLibrary() {
		const data = {
			blocks: Array.from(this.blocks.values()).map(block => block.toJSON()),
			categories: Object.fromEntries(this.categories),
			exportTime: new Date().toISOString()
		}
		return data
	}
	
	/**
	 * 导入图块库
	 */
	importLibrary(data) {
		try {
			if (data.blocks) {
				data.blocks.forEach(blockData => {
					const block = Block.fromJSON(blockData)
					this.addBlock(block)
				})
			}
			return true
		} catch (error) {
			console.error('导入图块库失败:', error)
			return false
		}
	}
	
	/**
	 * 获取统计信息
	 */
	getStats() {
		const stats = {
			totalBlocks: this.blocks.size,
			builtInBlocks: 0,
			customBlocks: 0,
			categories: this.categories.size
		}
		
		for (const block of this.blocks.values()) {
			if (block.isBuiltIn) {
				stats.builtInBlocks++
			} else {
				stats.customBlocks++
			}
		}
		
		return stats
	}
}

// 创建全局实例
export const blockLibrary = new BlockLibrary()
export default blockLibrary

