<template>
	<view class="drawing-container">
		<!-- 状态栏白色透明蒙层，跟首页一致风格 -->
		<view class="status-bar-mask" :style="{ height: statusBarHeightPx + 'px' }"></view>
		<!-- 顶部工具栏 -->
		<view class="top-toolbar" :style="{ top: statusBarHeightPx + 'px', paddingRight: toolbarRightPaddingPx + 'px' }">
			<view class="toolbar-left">
				<text class="back-btn" @click="goBack">撤销</text>
			</view>
			<view class="toolbar-center">
				<text class="title">手画CAD</text>
			</view>
			<view class="toolbar-right">
				<text class="toggle-panel-btn" @click="toggleRightPanel">{{ rightPanelToggleText }}</text>
				<text class="settings-btn" @click="showSettings">设置</text>
				<text class="complete-btn" @click="completeDraw">完成</text>
			</view>
		</view>

		<!-- 二级工具栏 -->
		<view class="secondary-toolbar" :style="{ top: secondaryToolbarTopPx + 'px', paddingRight: toolbarRightPaddingPx + 'px' }">
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
		<view class="canvas-container" :style="{ right: showRightPanel ? '120rpx' : '0', top: canvasTopPx + 'px' }">
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
			
			<!-- 调试信息显示 -->
			<view v-if="debugMode && debugPoints.length > 0" class="debug-info">
				<view class="debug-title">调试信息（最新触摸）</view>
				<view class="debug-item" v-for="(point, index) in debugPoints.slice(-1)" :key="index">
					<text class="debug-label">原始触摸:</text>
					<text class="debug-value">{{ point.touch.x.toFixed(1) }}, {{ point.touch.y.toFixed(1) }}</text>
					<text class="debug-label">Canvas偏移:</text>
					<text class="debug-value">{{ point.canvasOffset.x.toFixed(1) }}, {{ point.canvasOffset.y.toFixed(1) }}</text>
					<text class="debug-label">屏幕坐标:</text>
					<text class="debug-value">{{ point.screen.x.toFixed(1) }}, {{ point.screen.y.toFixed(1) }}</text>
					<text class="debug-label">世界坐标:</text>
					<text class="debug-value">{{ point.world.x.toFixed(1) }}, {{ point.world.y.toFixed(1) }}</text>
				</view>
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
		<view class="right-panel" v-if="showRightPanel" :style="{ top: canvasTopPx + 'px' }">
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

		<!-- 浮动切换按钮，确保始终可见 -->
		<view
			class="right-panel-toggle-fab"
			:style="{ right: showRightPanel ? '140rpx' : '20rpx' }"
			@click="toggleRightPanel"
		>
			<text class="fab-text">{{ showRightPanel ? '隐藏' : '显示' }}</text>
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
			
			// UI
			showRightPanel: true,
			statusBarHeightPx: 0,
			secondaryToolbarTopPx: 0,
			canvasTopPx: 0,
			rpxToPx: 1,
			toolbarRightPaddingPx: 0,
			
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
			
			// 图形绘制优化相关
			currentEndPoint: null,
			renderTimer: null,
			
			// 调试模式
			debugMode: false,
			debugPoints: [],
			
			// 初始化重试机制
			initRetryCount: 0,
			maxInitRetries: 5,
		}
	},
	computed: {
		rightPanelToggleText() {
			return this.showRightPanel ? '隐藏工具栏' : '显示工具栏'
		}
	},
	
	onLoad() {
		console.log('页面onLoad触发')
		this.computeLayoutMetrics()
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
		// 进入页面/返回页面时重新计算一次安全区与布局
		this.computeLayoutMetrics()
			// 只在canvasReady为false时才初始化
			if (!this.canvasReady) {
				setTimeout(() => {
					console.log('onShow中延迟初始化Canvas')
					this.setupCanvas()
				}, 200)
			} else {
				// 如果canvas已经准备好，更新偏移量缓存
				setTimeout(() => {
					this.updateCanvasOffset()
				}, 100)
			}
		},
		
		onUnload() {
			console.log('页面onUnload触发')
			// 重置初始化重试计数
			this.initRetryCount = 0
			// 清理Canvas引擎
			if (this.canvasEngine) {
				this.canvasEngine = null
			}
			this.canvas = null
			this.canvasReady = false
		},
	
	methods: {
		/**
		 * 计算状态栏、胶囊、工具栏与画布的动态布局参数
		 */
		computeLayoutMetrics() {
			try {
				const sys = uni.getSystemInfoSync()
				this.rpxToPx = sys.windowWidth / 750
				const statusBar = sys.statusBarHeight || 0
				const topToolbarPx = Math.round(88 * this.rpxToPx)
				const secondToolbarPx = Math.round(100 * this.rpxToPx)
				this.statusBarHeightPx = statusBar
				this.secondaryToolbarTopPx = statusBar + topToolbarPx
				this.canvasTopPx = statusBar + topToolbarPx + secondToolbarPx

				let menuRect = null
				if (typeof uni !== 'undefined' && typeof uni.getMenuButtonBoundingClientRect === 'function') {
					try { menuRect = uni.getMenuButtonBoundingClientRect() } catch (e) { /* ignore */ }
				} else if (typeof wx !== 'undefined' && typeof wx.getMenuButtonBoundingClientRect === 'function') {
					try { menuRect = wx.getMenuButtonBoundingClientRect() } catch (e) { /* ignore */ }
				}
				if (menuRect && menuRect.left) {
					this.toolbarRightPaddingPx = Math.max(0, sys.windowWidth - menuRect.left + 8)
				} else {
					this.toolbarRightPaddingPx = 0
				}
				console.log('布局参数:', {
					statusBar: this.statusBarHeightPx,
					secondaryTop: this.secondaryToolbarTopPx,
					canvasTop: this.canvasTopPx,
					rpxToPx: this.rpxToPx,
					toolbarRightPaddingPx: this.toolbarRightPaddingPx,
					menuRect
				})
			} catch (e) {
				console.warn('计算布局参数失败，使用默认值', e)
				const sys = uni.getSystemInfoSync()
				this.rpxToPx = sys.windowWidth / 750
				this.statusBarHeightPx = sys.statusBarHeight || 0
				this.secondaryToolbarTopPx = this.statusBarHeightPx + Math.round(88 * this.rpxToPx)
				this.canvasTopPx = this.secondaryToolbarTopPx + Math.round(100 * this.rpxToPx)
				this.toolbarRightPaddingPx = 0
			}
		},
		/**
		 * 初始化Canvas
		 */
		initCanvas() {
			// 获取系统信息
			uni.getSystemInfo({
				success: (res) => {
					// 按动态顶部区域计算画布显示高度
					const bottomToolbarPx = Math.round(120 * (res.windowWidth / 750))
					const heightPx = Math.max(0, res.windowHeight - this.canvasTopPx - bottomToolbarPx)
					this.canvasStyle = { width: res.windowWidth + 'px', height: heightPx + 'px' }
				}
			})
		},
		
		/**
		 * 设置Canvas
		 */
		setupCanvas() {
			console.log('开始设置Canvas...重试次数:', this.initRetryCount)
			
			// 检查重试次数
			if (this.initRetryCount >= this.maxInitRetries) {
				console.error('Canvas初始化重试次数过多，初始化失败')
				uni.showToast({
					title: 'Canvas初始化失败',
					icon: 'error'
				})
				return
			}
			
			const query = uni.createSelectorQuery().in(this)
			query.select('#drawingCanvas').node().exec((res) => {
				console.log('Canvas查询结果:', res, '重试次数:', this.initRetryCount)
				if (res[0] && res[0].node) {
					this.canvas = res[0].node
					console.log('Canvas节点:', this.canvas)
					// 获取canvas的CSS宽高
					uni.createSelectorQuery().in(this).select('#drawingCanvas').boundingClientRect(rect => {
						if (rect) {
							const dpr = uni.getSystemInfoSync().pixelRatio || 1
							console.log('boundingClientRect:', rect, 'dpr:', dpr)
							
							// 缓存canvas的偏移量用于触摸坐标计算
							this.canvasOffsetX = rect.left
							this.canvasOffsetY = rect.top
							console.log('Canvas偏移量已缓存:', this.canvasOffsetX, this.canvasOffsetY)
							
							// 使用实际的canvas尺寸，不设置最大限制
							const width = rect.width * dpr
							const height = rect.height * dpr
							this.canvas.width = width
							this.canvas.height = height
							
							// 注意：在微信小程序中，不能直接设置canvas.style，Canvas的显示尺寸由CSS控制
							console.log('Canvas尺寸设置完成:', width, 'x', height, 'DPR:', dpr)
							
							const ctx = this.canvas.getContext('2d')
							if (ctx) {
								// 重要：不要在这里应用DPR缩放，让Canvas引擎处理坐标转换
								// ctx.scale(dpr, dpr) // 移除这行
								this.initCanvasContext(ctx, dpr)
								this.canvasReady = true
								this.initRetryCount = 0 // 重置重试次数
								console.log('Canvas初始化完成，canvasReady:', this.canvasReady, '实际尺寸:', width, 'x', height, '显示尺寸:', rect.width, 'x', rect.height)
							} else {
								console.error('无法获取Canvas 2D上下文')
								this.retryCanvasInit()
							}
						} else {
							console.error('boundingClientRect获取失败')
							// 如果boundingClientRect失败，重新计算偏移量
							this.resetCanvasOffset()
							const dpr = uni.getSystemInfoSync().pixelRatio || 1
							const systemInfo = uni.getSystemInfoSync()
							const rpxToPx = systemInfo.windowWidth / 750
							const rightPanelPx = this.showRightPanel ? Math.round(120 * rpxToPx) : 0
							const bottomToolbarPx = Math.round(120 * rpxToPx)
							const defaultWidth = systemInfo.windowWidth - rightPanelPx
							const defaultHeight = Math.max(0, systemInfo.windowHeight - this.canvasTopPx - bottomToolbarPx)
							this.canvas.width = defaultWidth * dpr
							this.canvas.height = defaultHeight * dpr
							
							// 在微信小程序中，不能直接设置canvas.style
							console.log('使用默认Canvas尺寸:', defaultWidth, 'x', defaultHeight, 'DPR:', dpr)
							
							const ctx = this.canvas.getContext('2d')
							if (ctx) {
								// 重要：不要在这里应用DPR缩放，让Canvas引擎处理坐标转换
								// ctx.scale(dpr, dpr) // 移除这行
								this.initCanvasContext(ctx, dpr)
								this.canvasReady = true
								this.initRetryCount = 0 // 重置重试次数
								console.log('Canvas初始化完成（使用默认值），canvasReady:', this.canvasReady)
							} else {
								console.error('无法获取Canvas 2D上下文（默认值模式）')
								this.retryCanvasInit()
							}
						}
					}).exec()
				} else {
					console.error('Canvas节点获取失败', res)
					this.retryCanvasInit()
				}
			})
		},
		
		/**
		 * 重试Canvas初始化
		 */
		retryCanvasInit() {
			this.initRetryCount++
			console.log('Canvas初始化失败，准备重试...当前重试次数:', this.initRetryCount)
			
			if (this.initRetryCount < this.maxInitRetries) {
				const delay = Math.min(1000 * this.initRetryCount, 3000) // 递增延迟，最大3秒
				setTimeout(() => {
					console.log('重试Canvas初始化，延迟:', delay + 'ms')
					this.setupCanvas()
				}, delay)
			} else {
				console.error('Canvas初始化重试次数已达上限')
				uni.showModal({
					title: '初始化失败',
					content: 'Canvas初始化失败，请重新进入页面或重启应用',
					showCancel: false
				})
			}
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
			
			// 初始化完成后，自动校准一次坐标
			setTimeout(() => {
				this.autoCalibrate()
			}, 100)
			
			console.log('Canvas初始化完成', {
				width: this.canvas.width,
				height: this.canvas.height,
				dpr: dpr
			})
		},
		
		/**
		 * 自动校准坐标
		 */
		autoCalibrate() {
			console.log('开始自动校准坐标...')
			// 更新Canvas偏移量缓存
			this.updateCanvasOffset()
			console.log('自动校准完成')
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
			console.log('触摸事件触发，canvasReady:', this.canvasReady, 'canvasEngine:', !!this.canvasEngine, 'canvas:', !!this.canvas)
			if (!this.canvasReady || !this.canvasEngine || !this.canvas) {
				console.error('Canvas引擎未初始化，尝试重新初始化...')
				// 尝试重新初始化Canvas
				if (!this.canvas) {
					this.setupCanvas()
				}
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
			
			// 更新调试标记
			if (this.canvasEngine && this.debugMode) {
				this.canvasEngine.setLastTouchPoint(point)
			}
			
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
			
			// 获取原始触摸坐标 - 在小程序/APP端使用x/y（已是相对Canvas坐标），在H5中使用clientX/clientY（相对视口）
			let relativeX = 0
			let relativeY = 0
			let touchX = 0
			let touchY = 0
			const hasLocalXY = typeof touch.x === 'number' && typeof touch.y === 'number'
			if (hasLocalXY) {
				// 小程序/APP：touch.x、touch.y 已经是相对Canvas的坐标（CSS像素）
				touchX = touch.x
				touchY = touch.y
				relativeX = touch.x
				relativeY = touch.y
			} else {
				// H5：使用clientX/clientY并减去Canvas在视口中的偏移
				touchX = touch.clientX || 0
				touchY = touch.clientY || 0
				// 确保已有Canvas偏移
				this.ensureCanvasOffset()
				relativeX = touchX - this.canvasOffsetX
				relativeY = touchY - this.canvasOffsetY
			}
			
			console.log('原始触摸坐标:', touchX, touchY, '是否本地坐标(hasLocalXY):', hasLocalXY)
			
			console.log('Canvas偏移量:', this.canvasOffsetX, this.canvasOffsetY)
			console.log('相对Canvas坐标:', relativeX, relativeY)
			
			// 获取Canvas的显示尺寸
			const canvasRect = this.getCanvasDisplaySize()
			
			// 确保坐标在Canvas范围内
			relativeX = Math.max(0, Math.min(relativeX, canvasRect.width))
			relativeY = Math.max(0, Math.min(relativeY, canvasRect.height))
			
			console.log('Canvas显示尺寸:', canvasRect.width, 'x', canvasRect.height)
			console.log('限制后坐标:', relativeX, relativeY)
			console.log('DPR信息:', {
				dpr: uni.getSystemInfoSync().pixelRatio,
				canvasActualSize: this.canvas ? `${this.canvas.width}x${this.canvas.height}` : 'unknown',
				canvasDisplaySize: `${canvasRect.width}x${canvasRect.height}`
			})
			
			// 创建屏幕坐标点
			const screenPoint = new Point(relativeX, relativeY)
			
			// 转换为世界坐标
			const worldPoint = this.canvasEngine.transform.screenToWorld(screenPoint)
			
			console.log('屏幕坐标:', screenPoint)
			console.log('世界坐标:', worldPoint)
			console.log('Transform状态:', {
				scale: this.canvasEngine.transform.scale,
				offsetX: this.canvasEngine.transform.offsetX,
				offsetY: this.canvasEngine.transform.offsetY,
				rotation: this.canvasEngine.transform.rotation
			})
			
			// 调试模式：记录触摸点
			if (this.debugMode) {
				this.debugPoints.push({
					touch: { x: touchX, y: touchY },
					screen: screenPoint,
					world: worldPoint,
					canvasOffset: { x: this.canvasOffsetX, y: this.canvasOffsetY },
					canvasSize: canvasRect,
					timestamp: Date.now()
				})
				
				// 限制调试点数量
				if (this.debugPoints.length > 10) {
					this.debugPoints.shift()
				}
			}
			
			return worldPoint
		},
		
		/**
		 * 获取Canvas显示尺寸
		 */
		getCanvasDisplaySize() {
			// 获取Canvas的显示尺寸（不是实际像素尺寸）
			const dpr = uni.getSystemInfoSync().pixelRatio || 1
			
			// Canvas的实际像素尺寸除以DPR得到显示尺寸
			if (this.canvas) {
				return {
					width: this.canvas.width / dpr,
					height: this.canvas.height / dpr
				}
			}
			
			// 降级：从CSS样式计算Canvas的显示尺寸
			const systemInfo = uni.getSystemInfoSync()
			const rpxToPx = systemInfo.windowWidth / 750
			
			// 根据动态 CSS/状态计算
			const rightPanelPx = this.showRightPanel ? Math.round(120 * rpxToPx) : 0
			const bottomToolbarPx = Math.round(120 * rpxToPx)
			const width = systemInfo.windowWidth - rightPanelPx
			const height = Math.max(0, systemInfo.windowHeight - this.canvasTopPx - bottomToolbarPx)
			
			return { width, height }
		},
		
		/**
		 * 切换右侧工具面板显示
		 */
		toggleRightPanel() {
			this.showRightPanel = !this.showRightPanel
			this.$nextTick(() => {
				this.recalculateCanvasSize()
				this.updateCanvasOffset()
				if (this.canvasEngine) {
					this.canvasEngine.markDirty()
					this.canvasEngine.render()
				}
			})
		},
		
		/**
		 * 面板显隐后，按当前容器重新计算Canvas实际像素尺寸
		 */
		recalculateCanvasSize() {
			if (!this.canvas) return
			const query = uni.createSelectorQuery().in(this)
			query.select('#drawingCanvas').boundingClientRect(rect => {
				if (rect) {
					const dpr = uni.getSystemInfoSync().pixelRatio || 1
					this.canvas.width = rect.width * dpr
					this.canvas.height = rect.height * dpr
				}
			}).exec()
		},
		
		/**
		 * 确保Canvas偏移量有效
		 */
		ensureCanvasOffset() {
			// 如果偏移量无效，重新计算
			if (this.canvasOffsetX === 0 && this.canvasOffsetY === 0) {
				// 使用动态布局参数计算偏移量
				const systemInfo = uni.getSystemInfoSync()
				this.canvasOffsetX = 0 // left: 0
				this.canvasOffsetY = this.canvasTopPx
				console.log('重新计算Canvas偏移量(动态):', {
					windowWidth: systemInfo.windowWidth,
					canvasTopPx: this.canvasTopPx,
					canvasOffsetX: this.canvasOffsetX,
					canvasOffsetY: this.canvasOffsetY
				})
			}
		},
		
		/**
		 * 更新Canvas偏移量缓存
		 */
		updateCanvasOffset() {
			const query = uni.createSelectorQuery().in(this)
			query.select('#drawingCanvas').boundingClientRect(rect => {
				if (rect) {
					this.canvasOffsetX = rect.left
					this.canvasOffsetY = rect.top
					console.log('Canvas偏移量已更新:', this.canvasOffsetX, this.canvasOffsetY, rect)
					
					// 验证偏移量的合理性
					this.validateCanvasOffset()
				} else {
					console.warn('无法获取Canvas位置，将重置为计算值')
					this.resetCanvasOffset()
				}
			}).exec()
		},
		
		/**
		 * 验证Canvas偏移量的合理性
		 */
		validateCanvasOffset() {
			const expectedOffsetY = this.canvasTopPx
			
			// 如果偏移量差异过大，说明可能有问题
			if (Math.abs(this.canvasOffsetY - expectedOffsetY) > 50) {
				console.warn('Canvas偏移量异常，期望值:', expectedOffsetY, '实际值:', this.canvasOffsetY)
				// 使用计算值
				this.resetCanvasOffset()
			}
		},
		
		/**
		 * 重置Canvas偏移量为计算值
		 */
		resetCanvasOffset() {
			try {
				this.canvasOffsetX = 0
				this.canvasOffsetY = this.canvasTopPx
				console.log('Canvas偏移量已重置为动态计算值:', this.canvasOffsetX, this.canvasOffsetY)
			} catch (e) {
				console.error('重置Canvas偏移失败:', e)
				this.canvasOffsetX = 0
				this.canvasOffsetY = 94
			}
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
			
			// 为所有图形工具使用优化的渲染策略
			this.handleOptimizedDrawMove(snapPoint)
		},
		
		/**
		 * 统一的优化绘制移动处理
		 */
		handleOptimizedDrawMove(snapPoint) {
			// 基础距离检查 - 避免微小移动
			if (this.startPoint && this.startPoint.distanceTo(snapPoint) < 5) {
				return
			}
			
			// 检查移动距离，避免频繁更新
			if (this.currentEndPoint) {
				const moveDistance = this.currentEndPoint.distanceTo(snapPoint)
				if (moveDistance < 3) {
					return // 移动距离太小，跳过渲染
				}
			}
			
			// 存储当前鼠标位置
			this.currentEndPoint = snapPoint
			
			// 使用防抖机制减少渲染频率
			if (this.renderTimer) {
				clearTimeout(this.renderTimer)
			}
			
			this.renderTimer = setTimeout(() => {
				this.updateTempObjectAndRender()
			}, 16) // 约60fps的渲染频率
		},
		
		/**
		 * 更新临时对象并渲染
		 */
		updateTempObjectAndRender() {
			if (!this.tempObject || !this.currentEndPoint) return
			
			// 更新临时对象
			this.updateTempObject(this.currentEndPoint)
			
			// 设置临时对象并渲染
			this.canvasEngine.tempObject = this.tempObject
			this.canvasEngine.markDirty()
			this.canvasEngine.render()
		},
		
		/**
		 * 处理绘制结束
		 */
		handleDrawEnd() {
			if (!this.isDrawing || !this.tempObject) return
			
			// 清除渲染定时器
			if (this.renderTimer) {
				clearTimeout(this.renderTimer)
				this.renderTimer = null
			}
			
			// 确保使用最新的终点位置
			if (this.currentEndPoint) {
				this.updateTempObject(this.currentEndPoint)
			}
			
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
			
			// 清除临时对象和状态
			this.clearTempObject()
			this.currentEndPoint = null
			
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
			// 清除渲染定时器
			if (this.renderTimer) {
				clearTimeout(this.renderTimer)
				this.renderTimer = null
			}
			
			this.tempObject = null
			this.currentEndPoint = null
			this.canvasEngine.tempObject = null
			this.canvasEngine.markDirty()
			this.canvasEngine.render()
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		showSettings() {
			uni.showActionSheet({
				itemList: ['网格设置', '捕捉设置', '图层设置', '样式设置', '校准触摸坐标', this.debugMode ? '关闭调试模式' : '开启调试模式', '测试触摸精度'],
				success: (res) => {
					console.log('选择了第' + (res.tapIndex + 1) + '个选项')
					switch(res.tapIndex) {
						case 4: // 校准触摸坐标
							this.calibrateTouchCoordinates()
							break
						case 5: // 调试模式
							this.toggleDebugMode()
							break
						case 6: // 测试触摸精度
							this.testTouchAccuracy()
							break
						default:
							// 其他设置选项的处理
							break
					}
				}
			})
		},
		
		/**
		 * 校准触摸坐标
		 */
		calibrateTouchCoordinates() {
			uni.showModal({
				title: '校准触摸坐标',
				content: '将重新计算触摸坐标偏移量，这可能会修复触摸位置与绘图位置不一致的问题。',
				success: (res) => {
					if (res.confirm) {
						console.log('开始校准触摸坐标...')
						
						// 清除缓存的偏移量
						this.canvasOffsetX = 0
						this.canvasOffsetY = 0
						
						// 重新获取偏移量
						this.updateCanvasOffset()
						
						// 重置Canvas引擎的变换矩阵
						if (this.canvasEngine) {
							this.canvasEngine.transform.reset()
							this.canvasEngine.markDirty()
							this.canvasEngine.render()
						}
						
						console.log('触摸坐标校准完成')
						
						uni.showToast({
							title: '坐标已校准',
							icon: 'success'
						})
					}
				}
			})
		},
		
		/**
		 * 切换调试模式
		 */
		toggleDebugMode() {
			this.debugMode = !this.debugMode
			this.debugPoints = []
			
			// 同步到Canvas引擎
			if (this.canvasEngine) {
				this.canvasEngine.setDebugMode(this.debugMode)
			}
			
			const message = this.debugMode ? 
				'调试模式已开启\n触摸时会在控制台输出详细坐标信息并显示红色标记' : 
				'调试模式已关闭'
			
			uni.showToast({
				title: message,
				icon: 'none',
				duration: 2000
			})
			
			console.log('调试模式:', this.debugMode ? '开启' : '关闭')
		},
		
		/**
		 * 测试触摸精度
		 */
		testTouchAccuracy() {
			// 开启调试模式
			if (!this.debugMode) {
				this.debugMode = true
				if (this.canvasEngine) {
					this.canvasEngine.setDebugMode(true)
				}
			}
			
			uni.showModal({
				title: '触摸精度测试',
				content: '请在Canvas上点击几个不同位置，观察调试信息中的坐标变化。红色十字标记表示计算出的实际绘制位置。',
				showCancel: false,
				confirmText: '开始测试',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({
							title: '调试模式已开启，请开始触摸测试',
							icon: 'none',
							duration: 3000
						})
					}
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

.status-bar-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.92);
    z-index: 1000;
}

.top-toolbar {
    position: fixed;
    /* top 与 paddingRight 动态由 :style 控制 */
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

.toggle-panel-btn {
	font-size: 28rpx;
	color: #007aff;
	margin-right: 20rpx;
}

.title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.secondary-toolbar {
    position: fixed;
    /* top 动态由 :style 控制 */
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
    /* top 与 right 动态由 :style 控制 */
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

.debug-info {
	position: absolute;
	bottom: 20rpx;
	left: 20rpx;
	background-color: rgba(0, 0, 0, 0.8);
	color: white;
	padding: 16rpx;
	border-radius: 8rpx;
	font-size: 18rpx;
	max-width: 400rpx;
}

.debug-title {
	font-weight: bold;
	margin-bottom: 8rpx;
	color: #00ff00;
}

.debug-item {
	margin-bottom: 8rpx;
}

.debug-label {
	display: inline-block;
	width: 120rpx;
	color: #ffff00;
}

.debug-value {
	color: #ffffff;
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
    /* top 动态由 :style 控制 */
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

.right-panel-toggle-fab {
	position: fixed;
	bottom: 180rpx;
	/* 动态 right 由 :style 控制 */
	background-color: #ffffff;
	border: 1rpx solid #e5e5e5;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.12);
	border-radius: 999rpx;
	padding: 16rpx 24rpx;
	z-index: 1500;
}

.fab-text {
	font-size: 26rpx;
	color: #007aff;
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

