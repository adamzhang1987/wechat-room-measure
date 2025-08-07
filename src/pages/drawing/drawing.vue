<template>
	<view class="drawing-container">
		<!-- 顶部工具栏 -->
		<view class="top-toolbar">
			<view class="toolbar-left">
				<text class="back-btn" @click="goBack">撤销</text>
			</view>
			<view class="toolbar-center">
				<text class="title">手画CAD</text>
			</view>
			<view class="toolbar-right">
				<text class="settings-btn" @click="showSettings">设置</text>
				<text class="complete-btn" @click="completeDraw">完成</text>
			</view>
		</view>

		<!-- 二级工具栏 -->
		<view class="secondary-toolbar">
			<view class="tool-group">
				<view class="tool-item" @click="undo">
					<image src="/static/icon-undo.png" class="tool-icon"></image>
					<text class="tool-text">撤销</text>
				</view>
				<view class="tool-item" @click="showStyles">
					<image src="/static/icon-style.png" class="tool-icon"></image>
					<text class="tool-text">样式</text>
				</view>
				<view class="tool-item" @click="show3DModel">
					<image src="/static/icon-3d.png" class="tool-icon"></image>
					<text class="tool-text">3D模型</text>
				</view>
				<view class="tool-item" @click="showMore">
					<text class="tool-text">...</text>
				</view>
				<view class="tool-item send-btn" @click="sendDrawing">
					<text class="send-text">发送</text>
				</view>
			</view>
		</view>

		<!-- 绘图画布 -->
		<view class="canvas-container">
			<canvas 
				id="drawingCanvas"
				type="2d"
				class="drawing-canvas"
				:style="canvasStyle"
				@touchstart="onTouchStart"
				@touchmove="onTouchMove"
				@touchend="onTouchEnd"
				@touchcancel="onTouchCancel"
			></canvas>
			
			<!-- 坐标显示 -->
			<view v-if="showCoordinates" class="coordinates-display">
				<text>X: {{ currentCoords.x.toFixed(2) }}</text>
				<text>Y: {{ currentCoords.y.toFixed(2) }}</text>
			</view>
			
			<!-- 画布上的工具提示 -->
			<view class="canvas-overlay" v-if="showAnnotationTools">
				<view class="annotation-tools">
					<view class="tool-item" @click="addAnnotation">
						<image src="/static/icon-annotation.png" class="tool-icon"></image>
						<text class="tool-text">添加标注</text>
					</view>
					<view class="tool-item" @click="decompose">
						<image src="/static/icon-decompose.png" class="tool-icon"></image>
						<text class="tool-text">分解</text>
					</view>
					<view class="tool-item" @click="deleteSelected">
						<image src="/static/icon-delete.png" class="tool-icon"></image>
						<text class="tool-text">删除</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 右侧工具面板 -->
		<view class="right-panel">
			<view class="tool-panel">
				<view class="panel-item" @click="selectTool">
					<image src="/static/icon-select.png" class="panel-icon"></image>
					<text class="panel-text">框选</text>
				</view>
				<view class="panel-item" @click="annotationTool">
					<image src="/static/icon-annotation-tool.png" class="panel-icon"></image>
					<text class="panel-text">标注</text>
				</view>
				<view class="panel-item" @click="insertTool">
					<image src="/static/icon-insert.png" class="panel-icon"></image>
					<text class="panel-text">插入</text>
				</view>
				<view class="panel-item" @click="fillTool">
					<image src="/static/icon-fill.png" class="panel-icon"></image>
					<text class="panel-text">填充</text>
				</view>
				<view class="panel-item" @click="settingsTool">
					<image src="/static/icon-settings.png" class="panel-icon"></image>
					<text class="panel-text">设置</text>
				</view>
				<view class="panel-item" @click="editTool">
					<image src="/static/icon-edit-tool.png" class="panel-icon"></image>
					<text class="panel-text">编辑</text>
				</view>
				<view class="panel-item" @click="expandPanel">
					<image src="/static/icon-expand.png" class="panel-icon"></image>
				</view>
			</view>
		</view>

		<!-- 底部绘图工具栏 -->
		<view class="bottom-toolbar">
			<view class="drawing-tools">
				<view class="tool-item" :class="{active: currentTool === 'line'}" @click="selectDrawTool('line')">
					<image src="/static/icon-line.png" class="tool-icon"></image>
					<text class="tool-text">直线</text>
				</view>
				<view class="tool-item" :class="{active: currentTool === 'arc'}" @click="selectDrawTool('arc')">
					<image src="/static/icon-arc.png" class="tool-icon"></image>
					<text class="tool-text">圆弧</text>
				</view>
				<view class="tool-item" :class="{active: currentTool === 'rectangle'}" @click="selectDrawTool('rectangle')">
					<image src="/static/icon-rectangle.png" class="tool-icon"></image>
					<text class="tool-text">矩形</text>
				</view>
				<view class="tool-item" :class="{active: currentTool === 'circle'}" @click="selectDrawTool('circle')">
					<image src="/static/icon-circle.png" class="tool-icon"></image>
					<text class="tool-text">圆</text>
				</view>
				<view class="tool-item" :class="{active: currentTool === 'dimension'}" @click="selectDrawTool('dimension')">
					<image src="/static/icon-dimension.png" class="tool-icon"></image>
					<text class="tool-text">标注</text>
				</view>
			</view>
		</view>

		<!-- 单位显示 -->
		<view class="unit-display">
			<text>单位:mm</text>
		</view>

		<!-- 尺寸标注弹窗 -->
		<view v-if="showDimensionDialog" class="dimension-dialog">
			<view class="dialog-backdrop" @click="hideDimensionDialog"></view>
			<view class="dialog-content">
				<view class="dialog-header">
					<text class="dialog-title">添加尺寸标注</text>
					<text class="dialog-close" @click="hideDimensionDialog">×</text>
				</view>
				<view class="dialog-body">
					<view class="input-group">
						<text class="input-label">尺寸值:</text>
						<input 
							class="input-field" 
							type="number" 
							v-model="dimensionValue"
							placeholder="输入尺寸"
						/>
						<text class="input-unit">mm</text>
					</view>
					<view class="input-group">
						<text class="input-label">标注文字:</text>
						<input 
							class="input-field" 
							type="text" 
							v-model="dimensionText"
							placeholder="可选说明文字"
						/>
					</view>
				</view>
				<view class="dialog-footer">
					<text class="dialog-btn cancel" @click="hideDimensionDialog">取消</text>
					<text class="dialog-btn confirm" @click="confirmDimension">确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { CanvasEngine, Point, Line, Rectangle, Circle, Arc, Dimension, CanvasUtils } from '../../utils/canvas/index.js'

export default {
	data() {
		return {
			// Canvas引擎
			canvasEngine: null,
			canvas: null,
			
			// 绘图状态
			currentTool: 'line',
			isDrawing: false,
			startPoint: null,
			tempObject: null,
			showAnnotationTools: false,
			
			// 触摸状态
			lastTouchPoint: null,
			touchStartTime: 0,
			touchMoved: false,
			
			// 坐标显示
			showCoordinates: true,
			currentCoords: { x: 0, y: 0 },
			
			// 尺寸标注
			showDimensionDialog: false,
			dimensionValue: '',
			dimensionText: '',
			pendingDimension: null,
			
			// 画布样式
			canvasStyle: {
				width: '100%',
				height: '100%'
			},
			canvasReady: false,
			
			// Canvas偏移缓存
			canvasOffsetX: 0,
			canvasOffsetY: 0,
		}
	},
	
	onLoad() {
		console.log('页面onLoad触发')
		this.initCanvas()
	},
	
			onReady() {
			console.log('页面onReady触发')
			this.setupCanvas()
		},
		
		mounted() {
			console.log('页面mounted触发')
			// 只在canvasReady为false时才初始化
			if (!this.canvasReady) {
				setTimeout(() => {
					console.log('mounted中延迟初始化Canvas')
					this.setupCanvas()
				}, 100)
			}
		},
		
		onShow() {
			console.log('页面onShow触发')
			// 只在canvasReady为false时才初始化
			if (!this.canvasReady) {
				setTimeout(() => {
					console.log('onShow中延迟初始化Canvas')
					this.setupCanvas()
				}, 200)
			}
		},
	
	methods: {
		/**
		 * 初始化Canvas
		 */
		initCanvas() {
			// 获取系统信息
			uni.getSystemInfo({
				success: (res) => {
					this.canvasStyle = {
						width: res.windowWidth + 'px',
						height: (res.windowHeight - 300) + 'px' // 减去工具栏高度
					}
				}
			})
		},
		
		/**
		 * 设置Canvas
		 */
		setupCanvas() {
			console.log('开始设置Canvas...')
			const query = uni.createSelectorQuery().in(this)
			query.select('#drawingCanvas').node().exec((res) => {
				console.log('Canvas查询结果:', res)
				if (res[0] && res[0].node) {
					this.canvas = res[0].node
					console.log('Canvas节点:', this.canvas)
					// 获取canvas的CSS宽高
					uni.createSelectorQuery().in(this).select('#drawingCanvas').boundingClientRect(rect => {
						if (rect) {
							const dpr = uni.getSystemInfoSync().pixelRatio || 1
							console.log('boundingClientRect:', rect, 'dpr:', dpr)
							// 限制canvas的最大尺寸，避免过大
							const maxWidth = 400
							const maxHeight = 300
							const width = Math.min(rect.width, maxWidth) * dpr
							const height = Math.min(rect.height, maxHeight) * dpr
							this.canvas.width = width
							this.canvas.height = height
							const ctx = this.canvas.getContext('2d')
							ctx.scale(dpr, dpr)
							this.initCanvasContext(ctx, dpr)
							this.canvasReady = true
							console.log('Canvas初始化完成，canvasReady:', this.canvasReady)
						} else {
							console.error('boundingClientRect获取失败')
							// 如果boundingClientRect失败，使用默认值
							const dpr = uni.getSystemInfoSync().pixelRatio || 1
							this.canvas.width = 300 * dpr
							this.canvas.height = 200 * dpr
							const ctx = this.canvas.getContext('2d')
							ctx.scale(dpr, dpr)
							this.initCanvasContext(ctx, dpr)
							this.canvasReady = true
							console.log('Canvas初始化完成（使用默认值），canvasReady:', this.canvasReady)
						}
					}).exec()
				} else {
					console.error('Canvas节点获取失败', res)
					setTimeout(() => {
						console.log('Canvas查询失败，延迟重试...')
						this.setupCanvas()
					}, 500)
				}
			})
		},
		
		/**
		 * 初始化Canvas上下文
		 */
		initCanvasContext(ctx, dpr) {
			console.log('开始初始化Canvas上下文, canvas:', this.canvas)
			if (!this.canvas || !ctx) {
				console.error('Canvas对象无效或getContext方法不存在:', this.canvas)
				return
			}
			console.log('成功获取2D上下文:', ctx)
			console.log('设置后画布尺寸:', this.canvas.width, 'x', this.canvas.height)
			// 初始化绘图引擎
			this.canvasEngine = new CanvasEngine(this.canvas)
			console.log('CanvasEngine创建成功:', this.canvasEngine)
			this.setupEngineEvents()
			this.canvasEngine.render()
			console.log('Canvas初始化完成', {
				width: this.canvas.width,
				height: this.canvas.height,
				dpr: dpr
			})
		},
		
		/**
		 * 设置引擎事件监听
		 */
		setupEngineEvents() {
			this.canvasEngine.on('objectAdded', (data) => {
				console.log('对象已添加:', data.object)
			})
			
			this.canvasEngine.on('selectionChanged', (data) => {
				console.log('选择已改变:', data.selectedObjects)
			})
			
			this.canvasEngine.on('stateChanged', (data) => {
				console.log('状态已改变:', data)
			})
		},
		
		/**
		 * 设置绘图工具
		 */
		selectDrawTool(tool) {
			this.currentTool = tool
			this.canvasEngine.currentTool = tool
			
			// 清除临时对象
			this.clearTempObject()
		},
		
		/**
		 * 触摸开始
		 */
		onTouchStart(e) {
			console.log('触摸事件触发，canvasReady:', this.canvasReady, 'canvasEngine:', !!this.canvasEngine)
			if (!this.canvasReady || !this.canvasEngine) {
				console.error('Canvas引擎未初始化')
				return
			}
			console.log('触摸开始', e)
			
			const touch = e.touches[0]
			const point = this.getTouchPoint(touch)
			
			console.log('触摸点坐标', point)
			
			this.lastTouchPoint = point
			this.touchStartTime = Date.now()
			this.touchMoved = false
			this.startPoint = point
			
			// 更新坐标显示
			this.updateCoordinates(point)
			
			// 根据工具处理
			switch (this.currentTool) {
				case 'select':
					this.handleSelectStart(point)
					break
				case 'line':
				case 'rectangle':
				case 'circle':
				case 'arc':
				case 'dimension':
					this.handleDrawStart(point)
					break
			}
		},
		
		/**
		 * 触摸移动
		 */
		onTouchMove(e) {
			console.log('触摸移动事件触发')
			if (!this.canvasReady || !this.canvasEngine) return
			
			const touch = e.touches[0]
			const point = this.getTouchPoint(touch)
			
			console.log('触摸移动坐标:', point)
			
			this.touchMoved = true
			
			// 更新坐标显示
			this.updateCoordinates(point)
			
			// 根据工具处理
			switch (this.currentTool) {
				case 'select':
					this.handleSelectMove(point)
					break
				case 'line':
				case 'rectangle':
				case 'circle':
				case 'arc':
				case 'dimension':
					this.handleDrawMove(point)
					break
			}
			
			this.lastTouchPoint = point
		},
		
		/**
		 * 触摸结束
		 */
		onTouchEnd(e) {
			if (!this.canvasReady || !this.canvasEngine) return
			
			// 根据工具处理
			switch (this.currentTool) {
				case 'select':
					this.handleSelectEnd()
					break
				case 'line':
				case 'rectangle':
				case 'circle':
				case 'arc':
				case 'dimension':
					this.handleDrawEnd()
					break
			}
			
			// 重置状态
			this.isDrawing = false
			this.startPoint = null
			this.lastTouchPoint = null
		},
		
		/**
		 * 触摸取消
		 */
		onTouchCancel(e) {
			if (!this.canvasReady || !this.canvasEngine) return
			this.onTouchEnd(e)
		},
		
		/**
		 * 获取触摸点坐标
		 */
		getTouchPoint(touch) {
			if (!this.canvas || !this.canvasEngine) {
				console.error('Canvas或引擎未初始化')
				return new Point(0, 0)
			}
			const dpr = uni.getSystemInfoSync().pixelRatio || 1
			let relativeX = touch.x || touch.clientX || 0
			let relativeY = touch.y || touch.clientY || 0
			
			// 动态获取canvas的实际位置偏移，而不是使用硬编码值
			const query = uni.createSelectorQuery().in(this)
			query.select('#drawingCanvas').boundingClientRect(rect => {
				if (rect) {
					this.canvasOffsetX = rect.left
					this.canvasOffsetY = rect.top
				}
			}).exec()
			
			// 使用动态获取或缓存的偏移值
			const canvasOffsetX = this.canvasOffsetX || 0
			const canvasOffsetY = this.canvasOffsetY || 97
			
			relativeX = (relativeX - canvasOffsetX)
			relativeY = (relativeY - canvasOffsetY)
			
			console.log('触摸坐标:', touch.x, touch.y, '相对坐标:', relativeX, relativeY)
			
			const screenPoint = new Point(relativeX, relativeY)
			console.log('屏幕坐标:', screenPoint)
			console.log('Transform状态:', {
				scale: this.canvasEngine.transform.scale,
				offsetX: this.canvasEngine.transform.offsetX,
				offsetY: this.canvasEngine.transform.offsetY,
				rotation: this.canvasEngine.transform.rotation
			})
			const worldPoint = this.canvasEngine.transform.screenToWorld(screenPoint)
			console.log('世界坐标:', worldPoint)
			return worldPoint
		},
		
		/**
		 * 更新坐标显示
		 */
		updateCoordinates(point) {
			this.currentCoords = {
				x: point.x,
				y: point.y
			}
		},
		
		/**
		 * 处理选择开始
		 */
		handleSelectStart(point) {
			const hitObject = this.canvasEngine.hitTest(point)
			if (hitObject) {
				this.canvasEngine.selectObject(hitObject)
			} else {
				this.canvasEngine.clearSelection()
			}
			this.canvasEngine.render()
		},
		
		/**
		 * 处理选择移动
		 */
		handleSelectMove(point) {
			if (this.canvasEngine.selectedObjects.length > 0 && this.lastTouchPoint) {
				const deltaX = point.x - this.lastTouchPoint.x
				const deltaY = point.y - this.lastTouchPoint.y
				
				this.canvasEngine.selectedObjects.forEach(obj => {
					obj.move(deltaX, deltaY)
				})
				
				this.canvasEngine.markDirty()
				this.canvasEngine.render()
			}
		},
		
		/**
		 * 处理选择结束
		 */
		handleSelectEnd() {
			if (this.canvasEngine.selectedObjects.length > 0) {
				this.canvasEngine.saveState()
			}
		},
		
		/**
		 * 处理绘制开始
		 */
		handleDrawStart(point) {
			console.log('开始绘制', this.currentTool, point)
			this.isDrawing = true
			
			// 对象捕捉
			const snapPoint = this.canvasEngine.snap(point)
			this.startPoint = snapPoint
			
			// 创建临时对象
			this.createTempObject(snapPoint)
			console.log('创建临时对象', this.tempObject)
		},
		
		/**
		 * 处理绘制移动
		 */
		handleDrawMove(point) {
			if (!this.isDrawing || !this.tempObject) return
			
			// 对象捕捉
			const snapPoint = this.canvasEngine.snap(point)
			
			// 更新临时对象
			this.updateTempObject(snapPoint)
			
			// 重新渲染
			this.canvasEngine.tempObject = this.tempObject
			this.canvasEngine.markDirty()
			this.canvasEngine.render()
		},
		
		/**
		 * 处理绘制结束
		 */
		handleDrawEnd() {
			if (!this.isDrawing || !this.tempObject) return
			
			// 对于尺寸标注，需要弹出输入对话框
			if (this.currentTool === 'dimension') {
				// 计算像素距离
				const pixelDistance = this.startPoint.distanceTo(this.lastTouchPoint)
				if (pixelDistance < 10) {
					// 距离太短，取消绘制
					this.clearTempObject()
					return
				}
				
				// 显示尺寸输入对话框
				this.showDimensionDialog = true
				this.pendingDimension = this.tempObject
				return
			}
			
			// 添加对象到引擎
			this.canvasEngine.addObject(this.tempObject)
			
			// 清除临时对象
			this.clearTempObject()
			
			// 重新渲染
			this.canvasEngine.render()
		},
		
		/**
		 * 创建临时对象
		 */
		createTempObject(startPoint) {
			switch (this.currentTool) {
				case 'line':
					this.tempObject = new Line(startPoint, startPoint)
					break
				case 'rectangle':
					this.tempObject = new Rectangle(startPoint.x, startPoint.y, 0, 0)
					break
				case 'circle':
					this.tempObject = new Circle(startPoint.x, startPoint.y, 0)
					break
				case 'arc':
					this.tempObject = new Arc(startPoint.x, startPoint.y, 0, 0, 0)
					break
				case 'dimension':
					this.tempObject = new Dimension(startPoint, startPoint, 20)
					break
			}
			
			if (this.tempObject) {
				this.tempObject.setStyle({
					strokeColor: '#007aff',
					strokeWidth: 2,
					lineType: 'solid'  // 改为实线
				})
			}
		},
		
		/**
		 * 更新临时对象
		 */
		updateTempObject(currentPoint) {
			if (!this.tempObject || !this.startPoint) return
			
			switch (this.currentTool) {
				case 'line':
					this.tempObject.setEndPoint(currentPoint)
					break
				case 'rectangle':
					const width = currentPoint.x - this.startPoint.x
					const height = currentPoint.y - this.startPoint.y
					this.tempObject.setRect(
						Math.min(this.startPoint.x, currentPoint.x),
						Math.min(this.startPoint.y, currentPoint.y),
						Math.abs(width),
						Math.abs(height)
					)
					break
				case 'circle':
					const radius = this.startPoint.distanceTo(currentPoint)
					this.tempObject.setRadius(radius)
					break
				case 'arc':
					const arcRadius = this.startPoint.distanceTo(currentPoint)
					const startAngle = 0
					const endAngle = Math.PI
					this.tempObject.setRadius(arcRadius)
					this.tempObject.setAngles(startAngle, endAngle)
					break
				case 'dimension':
					this.tempObject.endPoint = currentPoint
					this.tempObject.updateDimensionLine()
					break
			}
		},
		
		/**
		 * 清除临时对象
		 */
		clearTempObject() {
			this.tempObject = null
			this.canvasEngine.tempObject = null
			this.canvasEngine.markDirty()
			this.canvasEngine.render()
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		showSettings() {
			uni.showActionSheet({
				itemList: ['网格设置', '捕捉设置', '图层设置', '样式设置'],
				success: (res) => {
					console.log('选择了第' + (res.tapIndex + 1) + '个选项')
				}
			})
		},
		
		completeDraw() {
			uni.showModal({
				title: '保存图纸',
				content: '是否保存当前图纸？',
				success: (res) => {
					if (res.confirm) {
						this.saveDrawing()
					}
				}
			})
		},
		
		undo() {
			if (this.canvasEngine && this.canvasEngine.canUndo()) {
				this.canvasEngine.undo()
			}
		},
		
		showStyles() {
			uni.showToast({
				title: '样式功能开发中',
				icon: 'none'
			})
		},
		
		show3DModel() {
			uni.showToast({
				title: '3D模型功能开发中',
				icon: 'none'
			})
		},
		
		showMore() {
			uni.showActionSheet({
				itemList: ['图层管理', '测量工具', '导出图纸', '导入图纸'],
				success: (res) => {
					console.log('选择了第' + (res.tapIndex + 1) + '个选项')
				}
			})
		},
		
		sendDrawing() {
			uni.showToast({
				title: '发送功能开发中',
				icon: 'none'
			})
		},
		
		selectTool() {
			this.selectDrawTool('select')
		},
		
		annotationTool() {
			this.showAnnotationTools = !this.showAnnotationTools
		},
		
		insertTool() {
			uni.navigateTo({
				url: '/pages/blocks/blocks'
			})
		},
		
		fillTool() {
			uni.showToast({
				title: '填充功能开发中',
				icon: 'none'
			})
		},
		
		settingsTool() {
			this.showSettings()
		},
		
		editTool() {
			uni.showToast({
				title: '编辑功能开发中',
				icon: 'none'
			})
		},
		
		expandPanel() {
			uni.showToast({
				title: '展开面板功能开发中',
				icon: 'none'
			})
		},
		
		addAnnotation() {
			this.showDimensionDialog = true
		},
		
		decompose() {
			uni.showToast({
				title: '分解功能开发中',
				icon: 'none'
			})
		},
		
		deleteSelected() {
			if (this.canvasEngine.selectedObjects.length > 0) {
				this.canvasEngine.selectedObjects.forEach(obj => {
					this.canvasEngine.removeObject(obj)
				})
				this.canvasEngine.render()
			}
		},
		
		saveDrawing() {
			// 保存图纸逻辑
			const drawingData = this.canvasEngine.exportToJSON()
			console.log('保存图纸数据:', drawingData)
			
			uni.showToast({
				title: '保存成功',
				icon: 'success'
			})
		},
		
		/**
		 * 隐藏尺寸标注对话框
		 */
		hideDimensionDialog() {
			this.showDimensionDialog = false
			this.dimensionValue = ''
			this.dimensionText = ''
			this.pendingDimension = null
		},
		
		/**
		 * 确认尺寸标注
		 */
		confirmDimension() {
			if (this.dimensionValue && this.pendingDimension) {
				// 设置实际长度
				this.pendingDimension.setActualLength(parseFloat(this.dimensionValue))
				
				// 设置标注文字
				if (this.dimensionText) {
					this.pendingDimension.setText(this.dimensionText)
				}
				
				// 添加到引擎
				this.canvasEngine.addObject(this.pendingDimension)
				
				// 重新渲染
				this.canvasEngine.render()
				
				// 清除状态
				this.hideDimensionDialog()
				this.clearTempObject()
			}
		}
	}
}
</script>

<style scoped>
.drawing-container {
	position: relative;
	width: 100vw;
	height: 100vh;
	background-color: #000;
	overflow: hidden;
}

.top-toolbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 88rpx;
	background-color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 20rpx;
	z-index: 1000;
}

.toolbar-left, .toolbar-right {
	display: flex;
	align-items: center;
}

.back-btn, .settings-btn {
	font-size: 28rpx;
	color: #333;
	margin-right: 20rpx;
}

.complete-btn {
	background-color: #007aff;
	color: white;
	padding: 12rpx 24rpx;
	border-radius: 20rpx;
	font-size: 28rpx;
}

.title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.secondary-toolbar {
	position: fixed;
	top: 88rpx;
	left: 0;
	right: 0;
	height: 100rpx;
	background-color: #f5f5f5;
	z-index: 999;
}

.tool-group {
	display: flex;
	align-items: center;
	height: 100%;
	padding: 0 20rpx;
}

.tool-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-right: 40rpx;
}

.tool-icon {
	width: 40rpx;
	height: 40rpx;
	margin-bottom: 8rpx;
}

.tool-text {
	font-size: 20rpx;
	color: #666;
}

.send-btn {
	margin-left: auto;
	background-color: #007aff;
	padding: 20rpx 30rpx;
	border-radius: 20rpx;
}

.send-text {
	color: white;
	font-size: 24rpx;
}

.canvas-container {
	position: absolute;
	top: 188rpx;
	left: 0;
	right: 120rpx;
	bottom: 120rpx;
	background-color: #2a2a2a;
}

.drawing-canvas {
	width: 100%;
	height: 100%;
}

.coordinates-display {
	position: absolute;
	top: 20rpx;
	right: 20rpx;
	background-color: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	font-size: 20rpx;
}

.canvas-overlay {
	position: absolute;
	top: 20rpx;
	left: 20rpx;
	background-color: rgba(0, 0, 0, 0.8);
	border-radius: 12rpx;
	padding: 20rpx;
}

.annotation-tools {
	display: flex;
	flex-direction: column;
}

.annotation-tools .tool-item {
	margin-bottom: 20rpx;
	margin-right: 0;
}

.annotation-tools .tool-text {
	color: white;
}

.right-panel {
	position: fixed;
	top: 188rpx;
	right: 0;
	width: 120rpx;
	bottom: 120rpx;
	background-color: #ffffff;
	border-left: 1rpx solid #e5e5e5;
}

.tool-panel {
	display: flex;
	flex-direction: column;
	padding: 20rpx 0;
}

.panel-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.panel-icon {
	width: 40rpx;
	height: 40rpx;
	margin-bottom: 8rpx;
}

.panel-text {
	font-size: 20rpx;
	color: #666;
}

.bottom-toolbar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 120rpx;
	background-color: #ffffff;
	border-top: 1rpx solid #e5e5e5;
}

.drawing-tools {
	display: flex;
	align-items: center;
	justify-content: space-around;
	height: 100%;
	padding: 0 20rpx;
}

.drawing-tools .tool-item {
	margin-right: 0;
}

.drawing-tools .tool-item.active {
	background-color: #e3f2fd;
	border-radius: 12rpx;
	padding: 16rpx;
}

.drawing-tools .tool-item.active .tool-text {
	color: #007aff;
}

.unit-display {
	position: fixed;
	bottom: 140rpx;
	left: 20rpx;
	background-color: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
}

.dimension-dialog {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 2000;
}

.dialog-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-radius: 20rpx 20rpx 0 0;
	max-height: 80vh;
}

.dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 40rpx 20rpx 20rpx;
	border-bottom: 1rpx solid #e5e5e5;
}

.dialog-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.dialog-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
}

.dialog-body {
	padding: 40rpx 20rpx;
}

.input-group {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.input-label {
	width: 120rpx;
	font-size: 28rpx;
	color: #333;
}

.input-field {
	flex: 1;
	height: 60rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 8rpx;
	padding: 0 16rpx;
	font-size: 28rpx;
	margin: 0 16rpx;
}

.input-unit {
	font-size: 24rpx;
	color: #666;
}

.dialog-footer {
	display: flex;
	border-top: 1rpx solid #e5e5e5;
}

.dialog-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
}

.dialog-btn.cancel {
	color: #666;
	border-right: 1rpx solid #e5e5e5;
}

.dialog-btn.confirm {
	color: #007aff;
	font-weight: bold;
}
</style>

