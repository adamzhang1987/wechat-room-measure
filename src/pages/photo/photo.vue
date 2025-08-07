<template>
	<view class="photo-container">
		<!-- 顶部工具栏 -->
		<view class="top-toolbar">
			<view class="toolbar-left">
				<text class="back-btn" @click="goBack">取消</text>
			</view>
			<view class="toolbar-center">
				<text class="title">实景标注</text>
			</view>
			<view class="toolbar-right">
				<text class="settings-btn" @click="showSettings">设置</text>
				<text class="complete-btn" @click="completeAnnotation">完成</text>
			</view>
		</view>

		<!-- 照片显示区域 -->
		<view class="photo-area">
			<image 
				v-if="photoSrc" 
				:src="photoSrc" 
				class="photo-image"
				mode="aspectFit"
				@load="onPhotoLoad"
			></image>
			<view v-else class="photo-placeholder" @click="takePhoto">
				<image src="/static/icon-camera.png" class="camera-icon"></image>
				<text class="placeholder-text">点击拍照或选择照片</text>
			</view>

			<!-- 标注层 -->
			<canvas 
				v-if="photoSrc"
				id="annotationCanvas"
				class="annotation-canvas"
				:style="canvasStyle"
				@touchstart="onTouchStart"
				@touchmove="onTouchMove"
				@touchend="onTouchEnd"
				@touchcancel="onTouchCancel"
			></canvas>

			<!-- 文字标注显示层 -->
			<view v-if="photoSrc" class="text-annotations">
				<view 
					v-for="(annotation, index) in textAnnotations" 
					:key="annotation.id"
					class="text-annotation"
					:style="{
						left: annotation.position.x + 'px',
						top: annotation.position.y + 'px',
						color: annotation.color
					}"
					@click="editTextAnnotation(index)"
				>
					<text class="annotation-text">{{ annotation.text }}</text>
					<view v-if="annotation.showLine" class="annotation-line" :style="{
						left: annotation.lineEndPoint.x + 'px',
						top: annotation.lineEndPoint.y + 'px'
					}"></view>
				</view>
			</view>

			<!-- 尺寸标注显示层 -->
			<view v-if="photoSrc" class="dimension-annotations">
				<view 
					v-for="(dimension, index) in dimensionAnnotations" 
					:key="dimension.id"
					class="dimension-annotation"
				>
					<!-- 尺寸线 -->
					<view class="dimension-line" :style="{
						left: dimension.startPoint.x + 'px',
						top: dimension.startPoint.y + 'px',
						width: Math.abs(dimension.endPoint.x - dimension.startPoint.x) + 'px',
						height: Math.abs(dimension.endPoint.y - dimension.startPoint.y) + 'px'
					}"></view>
					<!-- 起点标记 -->
					<view class="dimension-point start" :style="{
						left: dimension.startPoint.x + 'px',
						top: dimension.startPoint.y + 'px'
					}"></view>
					<!-- 终点标记 -->
					<view class="dimension-point end" :style="{
						left: dimension.endPoint.x + 'px',
						top: dimension.endPoint.y + 'px'
					}"></view>
					<!-- 尺寸文字 -->
					<view class="dimension-text" :style="{
						left: (dimension.startPoint.x + dimension.endPoint.x) / 2 + 'px',
						top: (dimension.startPoint.y + dimension.endPoint.y) / 2 + 'px'
					}">
						<text>{{ dimension.actualLength }}mm</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="bottom-toolbar">
			<view class="tool-item" :class="{active: currentTool === 'line'}" @click="selectTool('line')">
				<image src="/static/icon-line-tool.png" class="tool-icon"></image>
				<text class="tool-text">线段</text>
			</view>
			<view class="tool-item" :class="{active: currentTool === 'dimension'}" @click="selectTool('dimension')">
				<image src="/static/icon-dimension.png" class="tool-icon"></image>
				<text class="tool-text">尺寸</text>
			</view>
			<view class="tool-item" :class="{active: currentTool === 'text'}" @click="selectTool('text')">
				<image src="/static/icon-text.png" class="tool-icon"></image>
				<text class="tool-text">文字</text>
			</view>
			<view class="tool-item" @click="undoAnnotation">
				<image src="/static/icon-undo.png" class="tool-icon"></image>
				<text class="tool-text">撤销</text>
			</view>
			<view class="tool-item" @click="clearAnnotations">
				<image src="/static/icon-clear.png" class="tool-icon"></image>
				<text class="tool-text">清除</text>
			</view>
		</view>

		<!-- 工具选项面板 -->
		<view v-if="showToolOptions" class="tool-options">
			<view v-if="currentTool === 'line'" class="line-options">
				<text class="option-title">线条颜色</text>
				<view class="color-options">
					<view class="option-item" @click="setLineColor('#ff0000')">
						<view class="color-dot red" :class="{active: currentLineColor === '#ff0000'}"></view>
						<text>红色</text>
					</view>
					<view class="option-item" @click="setLineColor('#00ff00')">
						<view class="color-dot green" :class="{active: currentLineColor === '#00ff00'}"></view>
						<text>绿色</text>
					</view>
					<view class="option-item" @click="setLineColor('#0000ff')">
						<view class="color-dot blue" :class="{active: currentLineColor === '#0000ff'}"></view>
						<text>蓝色</text>
					</view>
					<view class="option-item" @click="setLineColor('#ffff00')">
						<view class="color-dot yellow" :class="{active: currentLineColor === '#ffff00'}"></view>
						<text>黄色</text>
					</view>
				</view>
				<text class="option-title">线条粗细</text>
				<view class="width-options">
					<view class="width-item" :class="{active: currentLineWidth === 2}" @click="setLineWidth(2)">
						<view class="width-line thin"></view>
						<text>细</text>
					</view>
					<view class="width-item" :class="{active: currentLineWidth === 4}" @click="setLineWidth(4)">
						<view class="width-line medium"></view>
						<text>中</text>
					</view>
					<view class="width-item" :class="{active: currentLineWidth === 6}" @click="setLineWidth(6)">
						<view class="width-line thick"></view>
						<text>粗</text>
					</view>
				</view>
			</view>
			
			<view v-if="currentTool === 'text'" class="text-options">
				<view class="text-input-group">
					<text class="option-title">文字内容</text>
					<input 
						class="text-input" 
						placeholder="输入标注文字"
						v-model="pendingTextContent"
						@confirm="confirmTextInput"
					/>
				</view>
				<view class="text-style-options">
					<text class="option-title">文字颜色</text>
					<view class="color-options">
						<view class="option-item" @click="setTextColor('#ff0000')">
							<view class="color-dot red" :class="{active: currentTextColor === '#ff0000'}"></view>
							<text>红色</text>
						</view>
						<view class="option-item" @click="setTextColor('#000000')">
							<view class="color-dot black" :class="{active: currentTextColor === '#000000'}"></view>
							<text>黑色</text>
						</view>
						<view class="option-item" @click="setTextColor('#ffffff')">
							<view class="color-dot white" :class="{active: currentTextColor === '#ffffff'}"></view>
							<text>白色</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 尺寸输入弹窗 -->
		<view v-if="showDimensionInput" class="dimension-modal">
			<view class="modal-backdrop" @click="cancelDimension"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">输入实际尺寸</text>
					<text class="modal-close" @click="cancelDimension">×</text>
				</view>
				<view class="modal-body">
					<view class="input-group">
						<text class="input-label">实际长度:</text>
						<input 
							class="dimension-input" 
							type="number"
							placeholder="请输入长度"
							v-model="pendingDimensionLength"
							@input="onDimensionInput"
						/>
						<text class="input-unit">mm</text>
					</view>
					<view class="input-group">
						<text class="input-label">标注说明:</text>
						<input 
							class="dimension-input" 
							type="text"
							placeholder="可选说明文字"
							v-model="pendingDimensionNote"
						/>
					</view>
					<view v-if="pixelDistance > 0" class="ratio-info">
						<text class="ratio-text">像素距离: {{ pixelDistance.toFixed(1) }}px</text>
						<text v-if="pendingDimensionLength" class="ratio-text">
							比例: 1px = {{ (pendingDimensionLength / pixelDistance).toFixed(2) }}mm
						</text>
					</view>
				</view>
				<view class="modal-footer">
					<text class="modal-btn cancel" @click="cancelDimension">取消</text>
					<text class="modal-btn confirm" @click="confirmDimension">确定</text>
				</view>
			</view>
		</view>

		<!-- 文字编辑弹窗 -->
		<view v-if="showTextEdit" class="text-edit-modal">
			<view class="modal-backdrop" @click="cancelTextEdit"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">编辑文字标注</text>
					<text class="modal-close" @click="cancelTextEdit">×</text>
				</view>
				<view class="modal-body">
					<view class="input-group">
						<text class="input-label">文字内容:</text>
						<input 
							class="text-edit-input" 
							type="text"
							placeholder="输入文字内容"
							v-model="editingTextContent"
						/>
					</view>
					<view class="checkbox-group">
						<label class="checkbox-item">
							<checkbox :checked="editingTextShowLine" @change="onShowLineChange"/>
							<text>显示引出线</text>
						</label>
					</view>
				</view>
				<view class="modal-footer">
					<text class="modal-btn delete" @click="deleteTextAnnotation">删除</text>
					<text class="modal-btn cancel" @click="cancelTextEdit">取消</text>
					<text class="modal-btn confirm" @click="confirmTextEdit">确定</text>
				</view>
			</view>
		</view>

		<!-- 保存选项弹窗 -->
		<view v-if="showSaveOptions" class="save-modal">
			<view class="modal-backdrop" @click="hideSaveOptions"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">保存标注照片</text>
					<text class="modal-close" @click="hideSaveOptions">×</text>
				</view>
				<view class="modal-body">
					<view class="save-option" @click="saveToLocal">
						<image src="/static/icon-local.png" class="save-icon"></image>
						<view class="save-info">
							<text class="save-title">保存到本地</text>
							<text class="save-desc">保存为JPG格式到相册</text>
						</view>
					</view>
					<view class="save-option" @click="saveToCloud">
						<image src="/static/icon-cloud.png" class="save-icon"></image>
						<view class="save-info">
							<text class="save-title">保存到云端</text>
							<text class="save-desc">上传到云端存储</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			// 照片相关
			photoSrc: '',
			photoWidth: 0,
			photoHeight: 0,
			
			// 工具状态
			currentTool: 'line',
			showToolOptions: false,
			
			// Canvas相关
			canvas: null,
			canvasContext: null,
			canvasStyle: {
				width: '100%',
				height: '100%'
			},
			
			// 绘制状态
			isDrawing: false,
			startPoint: null,
			endPoint: null,
			tempLine: null,
			
			// 线条样式
			currentLineColor: '#ff0000',
			currentLineWidth: 3,
			
			// 文字样式
			currentTextColor: '#ff0000',
			pendingTextContent: '',
			pendingTextPosition: null,
			
			// 标注数据
			lineAnnotations: [],
			textAnnotations: [],
			dimensionAnnotations: [],
			
			// 尺寸标注
			showDimensionInput: false,
			pendingDimensionLength: '',
			pendingDimensionNote: '',
			pixelDistance: 0,
			pendingDimensionData: null,
			
			// 文字编辑
			showTextEdit: false,
			editingTextIndex: -1,
			editingTextContent: '',
			editingTextShowLine: false,
			
			// 保存选项
			showSaveOptions: false,
			
			// 历史记录
			annotationHistory: [],
			historyIndex: -1
		}
	},
	
	onLoad() {
		// 检查是否有传入的照片路径
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		if (currentPage.options.photoPath) {
			this.photoSrc = currentPage.options.photoPath
		}
	},
	
	onReady() {
		this.$nextTick(() => {
			if (this.photoSrc) {
				this.setupCanvas()
			}
		})
	},
	
	methods: {
		/**
		 * 返回上一页
		 */
		goBack() {
			if (this.hasUnsavedChanges()) {
				uni.showModal({
					title: '提示',
					content: '有未保存的标注，确定要离开吗？',
					success: (res) => {
						if (res.confirm) {
							uni.navigateBack()
						}
					}
				})
			} else {
				uni.navigateBack()
			}
		},
		
		/**
		 * 显示设置
		 */
		showSettings() {
			uni.showActionSheet({
				itemList: ['标注样式设置', '测量单位设置', '导出格式设置', '重置所有设置'],
				success: (res) => {
					switch(res.tapIndex) {
						case 0:
							this.showAnnotationStyleSettings()
							break
						case 1:
							this.showUnitSettings()
							break
						case 2:
							this.showExportSettings()
							break
						case 3:
							this.resetSettings()
							break
					}
				}
			})
		},
		
		/**
		 * 完成标注
		 */
		completeAnnotation() {
			if (this.hasAnnotations()) {
				this.showSaveOptions = true
			} else {
				uni.showToast({
					title: '请先添加标注',
					icon: 'none'
				})
			}
		},
		
		/**
		 * 拍照或选择照片
		 */
		takePhoto() {
			uni.showActionSheet({
				itemList: ['拍照', '从相册选择'],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.chooseImage('camera')
					} else {
						this.chooseImage('album')
					}
				}
			})
		},
		
		/**
		 * 选择图片
		 */
		chooseImage(sourceType) {
			uni.chooseImage({
				count: 1,
				sourceType: [sourceType],
				sizeType: ['original'],
				success: (res) => {
					this.photoSrc = res.tempFilePaths[0]
					this.clearAllAnnotations()
					this.$nextTick(() => {
						this.setupCanvas()
					})
				},
				fail: (err) => {
					console.error('选择图片失败:', err)
					uni.showToast({
						title: '选择图片失败',
						icon: 'none'
					})
				}
			})
		},
		
		/**
		 * 照片加载完成
		 */
		onPhotoLoad(e) {
			this.photoWidth = e.detail.width
			this.photoHeight = e.detail.height
			this.$nextTick(() => {
				this.setupCanvas()
			})
		},
		
		/**
		 * 设置Canvas
		 */
		setupCanvas() {
			const query = uni.createSelectorQuery().in(this)
			query.select('#annotationCanvas').node().exec((res) => {
				if (res[0] && res[0].node) {
					this.canvas = res[0].node
					this.canvasContext = this.canvas.getContext('2d')
					
					// 设置Canvas尺寸
					const dpr = uni.getSystemInfoSync().pixelRatio
					this.canvas.width = res[0].width * dpr
					this.canvas.height = res[0].height * dpr
					this.canvasContext.scale(dpr, dpr)
					
					// 设置默认样式
					this.canvasContext.lineCap = 'round'
					this.canvasContext.lineJoin = 'round'
					
					this.redrawCanvas()
				}
			})
		},
		
		/**
		 * 选择工具
		 */
		selectTool(tool) {
			this.currentTool = tool
			this.showToolOptions = (tool === 'line' || tool === 'text')
			
			// 清除临时状态
			this.clearTempStates()
		},
		
		/**
		 * 触摸开始
		 */
		onTouchStart(e) {
			if (!this.canvas) return
			
			const touch = e.touches[0]
			const point = this.getTouchPoint(touch)
			
			switch (this.currentTool) {
				case 'line':
				case 'dimension':
					this.startDrawing(point)
					break
				case 'text':
					this.startTextAnnotation(point)
					break
			}
		},
		
		/**
		 * 触摸移动
		 */
		onTouchMove(e) {
			if (!this.isDrawing) return
			
			const touch = e.touches[0]
			const point = this.getTouchPoint(touch)
			
			if (this.currentTool === 'line' || this.currentTool === 'dimension') {
				this.updateDrawing(point)
			}
		},
		
		/**
		 * 触摸结束
		 */
		onTouchEnd(e) {
			if (!this.isDrawing) return
			
			this.finishDrawing()
		},
		
		/**
		 * 触摸取消
		 */
		onTouchCancel(e) {
			this.cancelDrawing()
		},
		
		/**
		 * 获取触摸点坐标
		 */
		getTouchPoint(touch) {
			const rect = this.canvas.getBoundingClientRect()
			return {
				x: touch.clientX - rect.left,
				y: touch.clientY - rect.top
			}
		},
		
		/**
		 * 开始绘制
		 */
		startDrawing(point) {
			this.isDrawing = true
			this.startPoint = point
			this.endPoint = point
		},
		
		/**
		 * 更新绘制
		 */
		updateDrawing(point) {
			this.endPoint = point
			this.redrawCanvas()
			this.drawTempLine()
		},
		
		/**
		 * 完成绘制
		 */
		finishDrawing() {
			if (!this.startPoint || !this.endPoint) {
				this.cancelDrawing()
				return
			}
			
			// 计算像素距离
			this.pixelDistance = Math.sqrt(
				Math.pow(this.endPoint.x - this.startPoint.x, 2) + 
				Math.pow(this.endPoint.y - this.startPoint.y, 2)
			)
			
			if (this.pixelDistance < 10) {
				// 距离太短，取消绘制
				this.cancelDrawing()
				return
			}
			
			if (this.currentTool === 'line') {
				this.addLineAnnotation()
			} else if (this.currentTool === 'dimension') {
				this.showDimensionInputDialog()
			}
		},
		
		/**
		 * 取消绘制
		 */
		cancelDrawing() {
			this.isDrawing = false
			this.startPoint = null
			this.endPoint = null
			this.redrawCanvas()
		},
		
		/**
		 * 绘制临时线条
		 */
		drawTempLine() {
			if (!this.startPoint || !this.endPoint) return
			
			this.canvasContext.save()
			this.canvasContext.strokeStyle = this.currentLineColor
			this.canvasContext.lineWidth = this.currentLineWidth
			this.canvasContext.setLineDash([5, 5]) // 虚线
			
			this.canvasContext.beginPath()
			this.canvasContext.moveTo(this.startPoint.x, this.startPoint.y)
			this.canvasContext.lineTo(this.endPoint.x, this.endPoint.y)
			this.canvasContext.stroke()
			
			this.canvasContext.restore()
		},
		
		/**
		 * 添加线条标注
		 */
		addLineAnnotation() {
			const annotation = {
				type: 'line',
				startPoint: { ...this.startPoint },
				endPoint: { ...this.endPoint },
				color: this.currentLineColor,
				width: this.currentLineWidth,
				timestamp: Date.now()
			}
			
			this.lineAnnotations.push(annotation)
			this.saveToHistory()
			this.redrawCanvas()
			this.clearTempStates()
		},
		
		/**
		 * 开始文字标注
		 */
		startTextAnnotation(point) {
			this.pendingTextPosition = point
			if (this.pendingTextContent.trim()) {
				this.addTextAnnotation()
			} else {
				// 如果没有预设文字，显示输入框
				this.showToolOptions = true
			}
		},
		
		/**
		 * 确认文字输入
		 */
		confirmTextInput() {
			if (this.pendingTextContent.trim() && this.pendingTextPosition) {
				this.addTextAnnotation()
			}
		},
		
		/**
		 * 添加文字标注
		 */
		addTextAnnotation() {
			if (!this.pendingTextContent.trim() || !this.pendingTextPosition) return
			
			const annotation = {
				id: 'text_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
				type: 'text',
				text: this.pendingTextContent.trim(),
				position: { ...this.pendingTextPosition },
				color: this.currentTextColor,
				showLine: false,
				lineEndPoint: null,
				timestamp: Date.now()
			}
			
			this.textAnnotations.push(annotation)
			this.saveToHistory()
			
			// 清除临时状态
			this.pendingTextContent = ''
			this.pendingTextPosition = null
			this.showToolOptions = false
		},
		
		/**
		 * 显示尺寸输入对话框
		 */
		showDimensionInputDialog() {
			this.pendingDimensionData = {
				startPoint: { ...this.startPoint },
				endPoint: { ...this.endPoint },
				pixelDistance: this.pixelDistance
			}
			this.showDimensionInput = true
		},
		
		/**
		 * 尺寸输入变化
		 */
		onDimensionInput(e) {
			this.pendingDimensionLength = e.detail.value
		},
		
		/**
		 * 确认尺寸标注
		 */
		confirmDimension() {
			if (!this.pendingDimensionLength || !this.pendingDimensionData) {
				uni.showToast({
					title: '请输入有效的长度',
					icon: 'none'
				})
				return
			}
			
			const annotation = {
				id: 'dim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
				type: 'dimension',
				startPoint: this.pendingDimensionData.startPoint,
				endPoint: this.pendingDimensionData.endPoint,
				actualLength: parseFloat(this.pendingDimensionLength),
				pixelDistance: this.pendingDimensionData.pixelDistance,
				note: this.pendingDimensionNote.trim(),
				ratio: parseFloat(this.pendingDimensionLength) / this.pendingDimensionData.pixelDistance,
				timestamp: Date.now()
			}
			
			this.dimensionAnnotations.push(annotation)
			this.saveToHistory()
			this.hideDimensionInput()
			this.clearTempStates()
		},
		
		/**
		 * 取消尺寸标注
		 */
		cancelDimension() {
			this.hideDimensionInput()
			this.clearTempStates()
		},
		
		/**
		 * 隐藏尺寸输入对话框
		 */
		hideDimensionInput() {
			this.showDimensionInput = false
			this.pendingDimensionLength = ''
			this.pendingDimensionNote = ''
			this.pendingDimensionData = null
			this.pixelDistance = 0
		},
		
		/**
		 * 重绘Canvas
		 */
		redrawCanvas() {
			if (!this.canvasContext) return
			
			// 清除画布
			this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
			
			// 绘制线条标注
			this.lineAnnotations.forEach(annotation => {
				this.drawLineAnnotation(annotation)
			})
		},
		
		/**
		 * 绘制线条标注
		 */
		drawLineAnnotation(annotation) {
			this.canvasContext.save()
			this.canvasContext.strokeStyle = annotation.color
			this.canvasContext.lineWidth = annotation.width
			this.canvasContext.setLineDash([])
			
			this.canvasContext.beginPath()
			this.canvasContext.moveTo(annotation.startPoint.x, annotation.startPoint.y)
			this.canvasContext.lineTo(annotation.endPoint.x, annotation.endPoint.y)
			this.canvasContext.stroke()
			
			this.canvasContext.restore()
		},
		
		/**
		 * 获取文字标注样式
		 */
		getTextAnnotationStyle(annotation) {
			return {
				left: annotation.position.x + 'px',
				top: annotation.position.y + 'px',
				color: annotation.color
			}
		},
		
		/**
		 * 获取引出线样式
		 */
		getLineStyle(annotation) {
			if (!annotation.showLine || !annotation.lineEndPoint) return {}
			
			const dx = annotation.lineEndPoint.x - annotation.position.x
			const dy = annotation.lineEndPoint.y - annotation.position.y
			const length = Math.sqrt(dx * dx + dy * dy)
			const angle = Math.atan2(dy, dx) * 180 / Math.PI
			
			return {
				width: length + 'px',
				transform: `rotate(${angle}deg)`,
				transformOrigin: '0 50%',
				backgroundColor: annotation.color
			}
		},
		
		/**
		 * 获取尺寸线样式
		 */
		getDimensionLineStyle(dimension) {
			const dx = dimension.endPoint.x - dimension.startPoint.x
			const dy = dimension.endPoint.y - dimension.startPoint.y
			const length = Math.sqrt(dx * dx + dy * dy)
			const angle = Math.atan2(dy, dx) * 180 / Math.PI
			
			return {
				position: 'absolute',
				left: dimension.startPoint.x + 'px',
				top: dimension.startPoint.y + 'px',
				width: length + 'px',
				height: '2px',
				backgroundColor: '#ff0000',
				transform: `rotate(${angle}deg)`,
				transformOrigin: '0 50%'
			}
		},
		
		/**
		 * 获取尺寸点样式
		 */
		getDimensionPointStyle(point) {
			return {
				left: (point.x - 4) + 'px',
				top: (point.y - 4) + 'px'
			}
		},
		
		/**
		 * 获取尺寸文字样式
		 */
		getDimensionTextStyle(dimension) {
			const centerX = (dimension.startPoint.x + dimension.endPoint.x) / 2
			const centerY = (dimension.startPoint.y + dimension.endPoint.y) / 2
			
			return {
				left: centerX + 'px',
				top: (centerY - 15) + 'px',
				transform: 'translate(-50%, -50%)'
			}
		},
		
		/**
		 * 设置线条颜色
		 */
		setLineColor(color) {
			this.currentLineColor = color
		},
		
		/**
		 * 设置线条宽度
		 */
		setLineWidth(width) {
			this.currentLineWidth = width
		},
		
		/**
		 * 设置文字颜色
		 */
		setTextColor(color) {
			this.currentTextColor = color
		},
		
		/**
		 * 编辑文字标注
		 */
		editTextAnnotation(index) {
			this.editingTextIndex = index
			const annotation = this.textAnnotations[index]
			this.editingTextContent = annotation.text
			this.editingTextShowLine = annotation.showLine
			this.showTextEdit = true
		},
		
		/**
		 * 显示引出线变化
		 */
		onShowLineChange(e) {
			this.editingTextShowLine = e.detail.value
		},
		
		/**
		 * 确认文字编辑
		 */
		confirmTextEdit() {
			if (this.editingTextIndex >= 0 && this.editingTextContent.trim()) {
				this.textAnnotations[this.editingTextIndex].text = this.editingTextContent.trim()
				this.textAnnotations[this.editingTextIndex].showLine = this.editingTextShowLine
				this.saveToHistory()
			}
			this.cancelTextEdit()
		},
		
		/**
		 * 取消文字编辑
		 */
		cancelTextEdit() {
			this.showTextEdit = false
			this.editingTextIndex = -1
			this.editingTextContent = ''
			this.editingTextShowLine = false
		},
		
		/**
		 * 删除文字标注
		 */
		deleteTextAnnotation() {
			if (this.editingTextIndex >= 0) {
				this.textAnnotations.splice(this.editingTextIndex, 1)
				this.saveToHistory()
			}
			this.cancelTextEdit()
		},
		
		/**
		 * 撤销标注
		 */
		undoAnnotation() {
			if (this.historyIndex > 0) {
				this.historyIndex--
				this.restoreFromHistory()
			} else {
				uni.showToast({
					title: '没有可撤销的操作',
					icon: 'none'
				})
			}
		},
		
		/**
		 * 清除所有标注
		 */
		clearAnnotations() {
			uni.showModal({
				title: '确认清除',
				content: '确定要清除所有标注吗？',
				success: (res) => {
					if (res.confirm) {
						this.clearAllAnnotations()
					}
				}
			})
		},
		
		/**
		 * 清除所有标注
		 */
		clearAllAnnotations() {
			this.lineAnnotations = []
			this.textAnnotations = []
			this.dimensionAnnotations = []
			this.annotationHistory = []
			this.historyIndex = -1
			this.redrawCanvas()
		},
		
		/**
		 * 清除临时状态
		 */
		clearTempStates() {
			this.isDrawing = false
			this.startPoint = null
			this.endPoint = null
			this.tempLine = null
		},
		
		/**
		 * 保存到历史记录
		 */
		saveToHistory() {
			const state = {
				lineAnnotations: JSON.parse(JSON.stringify(this.lineAnnotations)),
				textAnnotations: JSON.parse(JSON.stringify(this.textAnnotations)),
				dimensionAnnotations: JSON.parse(JSON.stringify(this.dimensionAnnotations))
			}
			
			// 删除当前位置之后的历史记录
			this.annotationHistory = this.annotationHistory.slice(0, this.historyIndex + 1)
			this.annotationHistory.push(state)
			this.historyIndex = this.annotationHistory.length - 1
			
			// 限制历史记录数量
			if (this.annotationHistory.length > 20) {
				this.annotationHistory.shift()
				this.historyIndex--
			}
		},
		
		/**
		 * 从历史记录恢复
		 */
		restoreFromHistory() {
			if (this.historyIndex >= 0 && this.historyIndex < this.annotationHistory.length) {
				const state = this.annotationHistory[this.historyIndex]
				this.lineAnnotations = JSON.parse(JSON.stringify(state.lineAnnotations))
				this.textAnnotations = JSON.parse(JSON.stringify(state.textAnnotations))
				this.dimensionAnnotations = JSON.parse(JSON.stringify(state.dimensionAnnotations))
				this.redrawCanvas()
			}
		},
		
		/**
		 * 检查是否有未保存的更改
		 */
		hasUnsavedChanges() {
			return this.hasAnnotations()
		},
		
		/**
		 * 检查是否有标注
		 */
		hasAnnotations() {
			return this.lineAnnotations.length > 0 || 
				   this.textAnnotations.length > 0 || 
				   this.dimensionAnnotations.length > 0
		},
		
		/**
		 * 隐藏保存选项
		 */
		hideSaveOptions() {
			this.showSaveOptions = false
		},
		
		/**
		 * 保存到本地
		 */
		saveToLocal() {
			uni.showLoading({
				title: '保存中...'
			})
			
			// 这里应该实现将Canvas内容和照片合成并保存到本地的逻辑
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				})
				this.hideSaveOptions()
			}, 1000)
		},
		
		/**
		 * 保存到云端
		 */
		saveToCloud() {
			uni.showLoading({
				title: '上传中...'
			})
			
			// 这里应该实现上传到云端的逻辑
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '上传成功',
					icon: 'success'
				})
				this.hideSaveOptions()
			}, 2000)
		},
		
		/**
		 * 显示标注样式设置
		 */
		showAnnotationStyleSettings() {
			uni.showToast({
				title: '标注样式设置功能开发中',
				icon: 'none'
			})
		},
		
		/**
		 * 显示单位设置
		 */
		showUnitSettings() {
			uni.showToast({
				title: '单位设置功能开发中',
				icon: 'none'
			})
		},
		
		/**
		 * 显示导出设置
		 */
		showExportSettings() {
			uni.showToast({
				title: '导出设置功能开发中',
				icon: 'none'
			})
		},
		
		/**
		 * 重置设置
		 */
		resetSettings() {
			uni.showModal({
				title: '重置设置',
				content: '确定要重置所有设置吗？',
				success: (res) => {
					if (res.confirm) {
						this.currentLineColor = '#ff0000'
						this.currentLineWidth = 3
						this.currentTextColor = '#ff0000'
						uni.showToast({
							title: '设置已重置',
							icon: 'success'
						})
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.photo-container {
	position: relative;
	width: 100vw;
	height: 100vh;
	background-color: #f5f5f5;
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
	border-bottom: 1rpx solid #e5e5e5;
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

.photo-area {
	position: absolute;
	top: 88rpx;
	left: 0;
	right: 0;
	bottom: 120rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #000;
}

.photo-image {
	max-width: 100%;
	max-height: 100%;
}

.photo-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 400rpx;
	height: 300rpx;
	border: 2rpx dashed #ccc;
	border-radius: 16rpx;
	background-color: #fff;
}

.camera-icon {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 20rpx;
}

.placeholder-text {
	font-size: 28rpx;
	color: #999;
}

.annotation-canvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: auto;
}

.text-annotations {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}

.text-annotation {
	position: absolute;
	pointer-events: auto;
	z-index: 10;
}

.annotation-text {
	background-color: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 8rpx 12rpx;
	border-radius: 6rpx;
	font-size: 24rpx;
	white-space: nowrap;
}

.annotation-line {
	position: absolute;
	height: 2rpx;
	background-color: currentColor;
}

.dimension-annotations {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
}

.dimension-annotation {
	position: relative;
	width: 100%;
	height: 100%;
}

.dimension-line {
	position: absolute;
}

.dimension-point {
	position: absolute;
	width: 8rpx;
	height: 8rpx;
	background-color: #ff0000;
	border-radius: 50%;
}

.dimension-text {
	position: absolute;
	background-color: rgba(255, 0, 0, 0.9);
	color: white;
	padding: 6rpx 12rpx;
	border-radius: 6rpx;
	font-size: 20rpx;
	white-space: nowrap;
}

.bottom-toolbar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 120rpx;
	background-color: #ffffff;
	border-top: 1rpx solid #e5e5e5;
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 0 20rpx;
	z-index: 1000;
}

.tool-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx;
	border-radius: 12rpx;
	min-width: 80rpx;
}

.tool-item.active {
	background-color: #e3f2fd;
}

.tool-item.active .tool-text {
	color: #007aff;
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

.tool-options {
	position: fixed;
	bottom: 120rpx;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-top: 1rpx solid #e5e5e5;
	padding: 20rpx;
	z-index: 999;
	max-height: 300rpx;
	overflow-y: auto;
}

.option-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 16rpx;
}

.color-options, .width-options {
	display: flex;
	justify-content: space-around;
	margin-bottom: 20rpx;
}

.option-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12rpx;
	border-radius: 8rpx;
}

.color-dot {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	margin-bottom: 8rpx;
	border: 3rpx solid transparent;
}

.color-dot.active {
	border-color: #007aff;
}

.color-dot.red { background-color: #ff0000; }
.color-dot.green { background-color: #00ff00; }
.color-dot.blue { background-color: #0000ff; }
.color-dot.yellow { background-color: #ffff00; }
.color-dot.black { background-color: #000000; }
.color-dot.white { 
	background-color: #ffffff; 
	border: 1rpx solid #ccc;
}

.width-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12rpx;
	border-radius: 8rpx;
}

.width-item.active {
	background-color: #e3f2fd;
}

.width-line {
	width: 60rpx;
	background-color: #333;
	margin-bottom: 8rpx;
}

.width-line.thin { height: 2rpx; }
.width-line.medium { height: 4rpx; }
.width-line.thick { height: 6rpx; }

.text-input-group {
	margin-bottom: 20rpx;
}

.text-input {
	width: 100%;
	height: 60rpx;
	border: 1rpx solid #ccc;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	margin-top: 12rpx;
}

.text-style-options {
	margin-top: 20rpx;
}

/* 弹窗样式 */
.dimension-modal, .text-edit-modal, .save-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
	background-color: #ffffff;
	border-radius: 16rpx;
	width: 600rpx;
	max-width: 90vw;
	max-height: 80vh;
	overflow: hidden;
	position: relative;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 40rpx 20rpx 20rpx;
	border-bottom: 1rpx solid #e5e5e5;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.modal-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
}

.modal-body {
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

.dimension-input, .text-edit-input {
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

.ratio-info {
	margin-top: 20rpx;
	padding: 16rpx;
	background-color: #f5f5f5;
	border-radius: 8rpx;
}

.ratio-text {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin-bottom: 8rpx;
}

.checkbox-group {
	margin-top: 20rpx;
}

.checkbox-item {
	display: flex;
	align-items: center;
	font-size: 28rpx;
	color: #333;
}

.modal-footer {
	display: flex;
	border-top: 1rpx solid #e5e5e5;
}

.modal-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
}

.modal-btn.cancel {
	color: #666;
	border-right: 1rpx solid #e5e5e5;
}

.modal-btn.confirm {
	color: #007aff;
	font-weight: bold;
}

.modal-btn.delete {
	color: #ff3b30;
	border-right: 1rpx solid #e5e5e5;
}

.save-option {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #e5e5e5;
}

.save-icon {
	width: 60rpx;
	height: 60rpx;
	margin-right: 20rpx;
}

.save-info {
	flex: 1;
}

.save-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.save-desc {
	font-size: 24rpx;
	color: #666;
}
</style>

