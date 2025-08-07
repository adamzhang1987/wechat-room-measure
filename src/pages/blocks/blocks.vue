<template>
	<view class="blocks-container">
		<!-- 顶部工具栏 -->
		<view class="top-toolbar">
			<view class="toolbar-left">
				<text class="back-btn" @click="goBack">取消</text>
			</view>
			<view class="toolbar-center">
				<text class="title">模组</text>
			</view>
			<view class="toolbar-right">
				<text class="more-btn" @click="showMore">更多</text>
			</view>
		</view>

		<!-- 标签页 -->
		<view class="tabs-container">
			<view class="tabs">
				<view 
					class="tab" 
					:class="{active: currentTab === 'recommended'}"
					@click="switchTab('recommended')"
				>
					<text class="tab-text">推荐模组</text>
				</view>
				<view 
					class="tab" 
					:class="{active: currentTab === 'recent'}"
					@click="switchTab('recent')"
				>
					<text class="tab-text">最近使用</text>
				</view>
				<view 
					class="tab" 
					:class="{active: currentTab === 'custom'}"
					@click="switchTab('custom')"
				>
					<text class="tab-text">我创建的</text>
				</view>
			</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-section">
			<view class="search-input-wrapper">
				<image src="/static/icon-search.png" class="search-icon"></image>
				<input 
					class="search-input" 
					placeholder="搜索模组"
					v-model="searchKeyword"
					@input="onSearch"
				/>
			</view>
		</view>

		<!-- 分类筛选 -->
		<view class="category-filter">
			<scroll-view class="category-scroll" scroll-x="true">
				<view class="category-list">
					<view 
						class="category-item" 
						:class="{active: selectedCategory === 'all'}"
						@click="selectCategory('all')"
					>
						<text class="category-text">全部</text>
					</view>
					<view 
						v-for="category in categories" 
						:key="category"
						class="category-item" 
						:class="{active: selectedCategory === category}"
						@click="selectCategory(category)"
					>
						<text class="category-text">{{ category }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 分类标题 -->
		<view class="category-header">
			<text class="category-title">{{ getCategoryTitle() }}</text>
			<view class="category-actions">
				<text class="view-mode" @click="toggleViewMode">{{ viewMode === 'grid' ? '列表' : '网格' }}</text>
				<text class="collapse-btn" @click="toggleCollapse">{{ isCollapsed ? '展开' : '收起' }}</text>
			</view>
		</view>

		<!-- 图块网格/列表 -->
		<view class="blocks-container-inner" v-if="!isCollapsed">
			<!-- 网格视图 -->
			<view v-if="viewMode === 'grid'" class="blocks-grid">
				<view 
					class="block-item" 
					v-for="(block, index) in filteredBlocks" 
					:key="block.name"
					@click="selectBlock(block)"
					@longpress="showBlockMenu(block, index)"
				>
					<view class="block-preview">
						<canvas 
							:canvas-id="'block-preview-' + index"
							class="block-canvas"
							@touchstart="preventTouch"
						></canvas>
					</view>
					<text class="block-name">{{ block.name }}</text>
					<text class="block-category">{{ block.category }}</text>
				</view>

				<!-- 添加自定义图块 -->
				<view v-if="currentTab === 'custom'" class="block-item add-block" @click="createCustomBlock">
					<view class="block-preview add-preview">
						<image src="/static/icon-add-block.png" class="add-icon"></image>
					</view>
					<text class="block-name">添加模组</text>
				</view>
			</view>

			<!-- 列表视图 -->
			<view v-else class="blocks-list">
				<view 
					class="list-item" 
					v-for="(block, index) in filteredBlocks" 
					:key="block.name"
					@click="selectBlock(block)"
					@longpress="showBlockMenu(block, index)"
				>
					<view class="list-preview">
						<canvas 
							:canvas-id="'block-list-' + index"
							class="list-canvas"
							@touchstart="preventTouch"
						></canvas>
					</view>
					<view class="list-info">
						<text class="list-name">{{ block.name }}</text>
						<text class="list-description">{{ block.description }}</text>
						<text class="list-category">分类: {{ block.category }}</text>
					</view>
					<view class="list-actions">
						<image src="/static/icon-more.png" class="more-icon" @click.stop="showBlockMenu(block, index)"></image>
					</view>
				</view>

				<!-- 添加自定义图块 -->
				<view v-if="currentTab === 'custom'" class="list-item add-item" @click="createCustomBlock">
					<view class="list-preview add-preview">
						<image src="/static/icon-add-block.png" class="add-icon"></image>
					</view>
					<view class="list-info">
						<text class="list-name">添加模组</text>
						<text class="list-description">创建自定义图块</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-if="filteredBlocks.length === 0 && !isCollapsed" class="empty-state">
			<image src="/static/icon-empty-blocks.png" class="empty-icon"></image>
			<text class="empty-text">{{ getEmptyText() }}</text>
			<text class="empty-hint" v-if="currentTab === 'custom'">点击"添加模组"创建自定义图块</text>
		</view>

		<!-- 图块详情弹窗 -->
		<view v-if="showBlockDetail" class="block-detail-modal">
			<view class="modal-backdrop" @click="hideBlockDetail"></view>
			<view class="detail-content">
				<view class="detail-header">
					<text class="detail-title">{{ selectedBlock.name }}</text>
					<text class="detail-close" @click="hideBlockDetail">×</text>
				</view>
				<view class="detail-body">
					<view class="detail-preview">
						<canvas 
							canvas-id="block-detail-preview"
							class="detail-canvas"
							@touchstart="preventTouch"
						></canvas>
					</view>
					<view class="detail-info">
						<text class="detail-description">{{ selectedBlock.description || '暂无描述' }}</text>
						<text class="detail-category">分类: {{ selectedBlock.category }}</text>
						<text class="detail-objects">包含对象: {{ selectedBlock.objects ? selectedBlock.objects.length : 0 }}个</text>
						<text class="detail-author" v-if="selectedBlock.author">作者: {{ selectedBlock.author }}</text>
						<text class="detail-time">创建时间: {{ formatTime(selectedBlock.createTime) }}</text>
					</view>
				</view>
				<view class="detail-footer">
					<text class="detail-btn cancel" @click="hideBlockDetail">取消</text>
					<text class="detail-btn confirm" @click="insertBlock">插入</text>
				</view>
			</view>
		</view>

		<!-- 图块操作菜单 -->
		<view v-if="showBlockMenuModal" class="block-menu">
			<view class="menu-backdrop" @click="hideBlockMenu"></view>
			<view class="menu-content">
				<view class="menu-item" @click="insertBlock">
					<image src="/static/icon-insert.png" class="menu-icon"></image>
					<text class="menu-text">插入</text>
				</view>
				<view class="menu-item" @click="previewBlock">
					<image src="/static/icon-preview.png" class="menu-icon"></image>
					<text class="menu-text">预览</text>
				</view>
				<view class="menu-item" @click="editBlock" v-if="currentTab === 'custom'">
					<image src="/static/icon-edit.png" class="menu-icon"></image>
					<text class="menu-text">编辑</text>
				</view>
				<view class="menu-item" @click="copyBlock">
					<image src="/static/icon-copy.png" class="menu-icon"></image>
					<text class="menu-text">复制</text>
				</view>
				<view class="menu-item" @click="exportBlock">
					<image src="/static/icon-export.png" class="menu-icon"></image>
					<text class="menu-text">导出</text>
				</view>
				<view class="menu-item" @click="shareBlock">
					<image src="/static/icon-share.png" class="menu-icon"></image>
					<text class="menu-text">分享</text>
				</view>
				<view class="menu-item danger" @click="deleteBlock" v-if="currentTab === 'custom'">
					<image src="/static/icon-delete.png" class="menu-icon"></image>
					<text class="menu-text">删除</text>
				</view>
			</view>
		</view>

		<!-- 创建图块弹窗 -->
		<view v-if="showCreateModal" class="create-modal">
			<view class="modal-backdrop" @click="hideCreateModal"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">创建图块</text>
				</view>
				<view class="modal-body">
					<view class="form-group">
						<text class="form-label">图块名称</text>
						<input class="form-input" v-model="newBlockName" placeholder="请输入图块名称" />
					</view>
					<view class="form-group">
						<text class="form-label">描述</text>
						<textarea class="form-textarea" v-model="newBlockDescription" placeholder="请输入图块描述（可选）"></textarea>
					</view>
					<view class="form-group">
						<text class="form-label">分类</text>
						<picker :range="categories" @change="onCategoryChange">
							<view class="picker-view">
								<text>{{ newBlockCategory || '请选择分类' }}</text>
								<image src="/static/icon-arrow-down.png" class="arrow-icon"></image>
							</view>
						</picker>
					</view>
				</view>
				<view class="modal-footer">
					<text class="modal-btn cancel" @click="hideCreateModal">取消</text>
					<text class="modal-btn confirm" @click="confirmCreateBlock">确定</text>
				</view>
			</view>
		</view>

		<!-- 更多操作弹窗 -->
		<view v-if="showMoreModal" class="more-modal">
			<view class="modal-backdrop" @click="hideMoreModal"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">更多操作</text>
				</view>
				<view class="modal-body">
					<view class="more-item" @click="importBlocks">
						<image src="/static/icon-import.png" class="more-icon"></image>
						<view class="more-info">
							<text class="more-title">导入图块</text>
							<text class="more-desc">从文件或其他来源导入图块</text>
						</view>
					</view>
					<view class="more-item" @click="exportBlocks">
						<image src="/static/icon-export.png" class="more-icon"></image>
						<view class="more-info">
							<text class="more-title">导出图块库</text>
							<text class="more-desc">导出所有自定义图块</text>
						</view>
					</view>
					<view class="more-item" @click="showBlockStats">
						<image src="/static/icon-stats.png" class="more-icon"></image>
						<view class="more-info">
							<text class="more-title">图块统计</text>
							<text class="more-desc">查看图块库统计信息</text>
						</view>
					</view>
					<view class="more-item" @click="clearRecentBlocks">
						<image src="/static/icon-clear.png" class="more-icon"></image>
						<view class="more-info">
							<text class="more-title">清空最近使用</text>
							<text class="more-desc">清除最近使用的图块记录</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 统计信息弹窗 -->
		<view v-if="showStatsModal" class="stats-modal">
			<view class="modal-backdrop" @click="hideStatsModal"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">图块统计</text>
				</view>
				<view class="modal-body">
					<view class="stats-item">
						<text class="stats-label">内置图块</text>
						<text class="stats-value">{{ blockStats.builtInBlocks }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">自定义图块</text>
						<text class="stats-value">{{ blockStats.customBlocks }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">总图块数</text>
						<text class="stats-value">{{ blockStats.totalBlocks }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">分类数量</text>
						<text class="stats-value">{{ blockStats.categories }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">最近使用</text>
						<text class="stats-value">{{ recentBlocks.length }}</text>
					</view>
				</view>
				<view class="modal-footer">
					<text class="modal-btn confirm" @click="hideStatsModal">确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { blockLibrary, Block, BlockInstance } from '../../utils/blocks/BlockLibrary.js'

export default {
	data() {
		return {
			currentTab: 'recommended',
			searchKeyword: '',
			selectedCategory: 'all',
			isCollapsed: false,
			viewMode: 'grid', // grid 或 list
			showBlockDetail: false,
			showBlockMenuModal: false,
			showCreateModal: false,
			showMoreModal: false,
			showStatsModal: false,
			selectedBlock: null,
			selectedIndex: -1,
			newBlockName: '',
			newBlockDescription: '',
			newBlockCategory: '',
			blockStats: {},
			recentBlocks: [],
			canvasContexts: new Map() // 存储canvas上下文
		}
	},
	
	computed: {
		categories() {
			return blockLibrary.getCategories()
		},
		
		filteredBlocks() {
			let blocks = []
			
			switch (this.currentTab) {
				case 'recommended':
					blocks = blockLibrary.getBlocksByCategory('门窗')
						.concat(blockLibrary.getBlocksByCategory('家具'))
						.concat(blockLibrary.getBlocksByCategory('卫浴'))
						.concat(blockLibrary.getBlocksByCategory('厨房'))
					break
				case 'recent':
					blocks = this.recentBlocks
					break
				case 'custom':
					blocks = Array.from(blockLibrary.blocks.values()).filter(block => !block.isBuiltIn)
					break
			}
			
			// 按分类筛选
			if (this.selectedCategory !== 'all') {
				blocks = blocks.filter(block => block.category === this.selectedCategory)
			}
			
			// 按关键词搜索
			if (this.searchKeyword) {
				blocks = blocks.filter(block => 
					block.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
					block.description.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
					block.tags.some(tag => tag.toLowerCase().includes(this.searchKeyword.toLowerCase()))
				)
			}
			
			return blocks
		}
	},
	
	onLoad() {
		this.loadRecentBlocks()
		this.loadBlockStats()
	},
	
	onReady() {
		// 页面渲染完成后绘制图块预览
		this.$nextTick(() => {
			this.renderBlockPreviews()
		})
	},
	
	onShow() {
		// 页面显示时重新渲染预览
		this.$nextTick(() => {
			this.renderBlockPreviews()
		})
	},
	
	methods: {
		/**
		 * 加载最近使用的图块
		 */
		loadRecentBlocks() {
			try {
				const data = uni.getStorageSync('recent_blocks')
				this.recentBlocks = data ? JSON.parse(data) : []
			} catch (error) {
				console.error('加载最近使用图块失败:', error)
				this.recentBlocks = []
			}
		},
		
		/**
		 * 保存最近使用的图块
		 */
		saveRecentBlocks() {
			try {
				uni.setStorageSync('recent_blocks', JSON.stringify(this.recentBlocks))
			} catch (error) {
				console.error('保存最近使用图块失败:', error)
			}
		},
		
		/**
		 * 加载图块统计
		 */
		loadBlockStats() {
			this.blockStats = blockLibrary.getStats()
		},
		
		/**
		 * 渲染图块预览
		 */
		renderBlockPreviews() {
			this.filteredBlocks.forEach((block, index) => {
				this.renderBlockPreview(block, index)
			})
		},
		
		/**
		 * 渲染单个图块预览
		 */
		renderBlockPreview(block, index) {
			const canvasId = this.viewMode === 'grid' ? `block-preview-${index}` : `block-list-${index}`
			
			uni.createCanvasContext(canvasId, this).then(ctx => {
				if (!ctx) return
				
				// 设置画布大小
				const size = this.viewMode === 'grid' ? 120 : 80
				ctx.clearRect(0, 0, size, size)
				
				// 计算缩放比例
				if (block.bounds && block.bounds.width > 0 && block.bounds.height > 0) {
					const scale = Math.min(
						(size - 20) / block.bounds.width,
						(size - 20) / block.bounds.height
					)
					
					ctx.save()
					ctx.translate(size / 2, size / 2)
					ctx.scale(scale, scale)
					ctx.translate(-block.bounds.width / 2, -block.bounds.height / 2)
					
					// 绘制图块
					block.draw(ctx)
					
					ctx.restore()
				}
				
				ctx.draw()
			})
		},
		
		/**
		 * 防止触摸事件冒泡
		 */
		preventTouch(e) {
			e.stopPropagation()
		},
		
		/**
		 * 返回上一页
		 */
		goBack() {
			uni.navigateBack()
		},
		
		/**
		 * 显示更多操作
		 */
		showMore() {
			this.showMoreModal = true
		},
		
		/**
		 * 隐藏更多操作
		 */
		hideMoreModal() {
			this.showMoreModal = false
		},
		
		/**
		 * 切换标签页
		 */
		switchTab(tab) {
			this.currentTab = tab
			this.selectedCategory = 'all'
			this.$nextTick(() => {
				this.renderBlockPreviews()
			})
		},
		
		/**
		 * 搜索处理
		 */
		onSearch() {
			this.$nextTick(() => {
				this.renderBlockPreviews()
			})
		},
		
		/**
		 * 选择分类
		 */
		selectCategory(category) {
			this.selectedCategory = category
			this.$nextTick(() => {
				this.renderBlockPreviews()
			})
		},
		
		/**
		 * 获取分类标题
		 */
		getCategoryTitle() {
			if (this.selectedCategory !== 'all') {
				return this.selectedCategory
			}
			
			switch (this.currentTab) {
				case 'recommended':
					return '推荐图块'
				case 'recent':
					return '最近使用'
				case 'custom':
					return '我的图块'
				default:
					return '图块'
			}
		},
		
		/**
		 * 获取空状态文字
		 */
		getEmptyText() {
			if (this.searchKeyword) {
				return '未找到相关图块'
			}
			
			switch (this.currentTab) {
				case 'recent':
					return '暂无最近使用的图块'
				case 'custom':
					return '暂无自定义图块'
				default:
					return '暂无图块'
			}
		},
		
		/**
		 * 切换视图模式
		 */
		toggleViewMode() {
			this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'
			this.$nextTick(() => {
				this.renderBlockPreviews()
			})
		},
		
		/**
		 * 切换折叠状态
		 */
		toggleCollapse() {
			this.isCollapsed = !this.isCollapsed
		},
		
		/**
		 * 选择图块
		 */
		selectBlock(block) {
			this.selectedBlock = block
			this.showBlockDetail = true
			
			// 渲染详情预览
			this.$nextTick(() => {
				this.renderDetailPreview(block)
			})
		},
		
		/**
		 * 渲染详情预览
		 */
		renderDetailPreview(block) {
			uni.createCanvasContext('block-detail-preview', this).then(ctx => {
				if (!ctx) return
				
				const size = 200
				ctx.clearRect(0, 0, size, size)
				
				if (block.bounds && block.bounds.width > 0 && block.bounds.height > 0) {
					const scale = Math.min(
						(size - 40) / block.bounds.width,
						(size - 40) / block.bounds.height
					)
					
					ctx.save()
					ctx.translate(size / 2, size / 2)
					ctx.scale(scale, scale)
					ctx.translate(-block.bounds.width / 2, -block.bounds.height / 2)
					
					block.draw(ctx)
					
					ctx.restore()
				}
				
				ctx.draw()
			})
		},
		
		/**
		 * 隐藏图块详情
		 */
		hideBlockDetail() {
			this.showBlockDetail = false
			this.selectedBlock = null
		},
		
		/**
		 * 显示图块菜单
		 */
		showBlockMenu(block, index) {
			this.selectedBlock = block
			this.selectedIndex = index
			this.showBlockMenuModal = true
		},
		
		/**
		 * 隐藏图块菜单
		 */
		hideBlockMenu() {
			this.showBlockMenuModal = false
			this.selectedBlock = null
			this.selectedIndex = -1
		},
		
		/**
		 * 插入图块
		 */
		insertBlock() {
			if (this.selectedBlock) {
				// 添加到最近使用
				const existingIndex = this.recentBlocks.findIndex(b => b.name === this.selectedBlock.name)
				if (existingIndex > -1) {
					this.recentBlocks.splice(existingIndex, 1)
				}
				this.recentBlocks.unshift(this.selectedBlock)
				
				// 限制最近使用数量
				if (this.recentBlocks.length > 20) {
					this.recentBlocks = this.recentBlocks.slice(0, 20)
				}
				
				this.saveRecentBlocks()
				
				// 通过页面参数传递选中的图块
				const pages = getCurrentPages()
				const prevPage = pages[pages.length - 2]
				if (prevPage && prevPage.route.includes('drawing')) {
					prevPage.$vm.insertBlockFromLibrary(this.selectedBlock)
				}
				
				uni.showToast({
					title: '图块已插入',
					icon: 'success'
				})
				
				// 返回绘图页面
				setTimeout(() => {
					uni.navigateBack()
				}, 1000)
			}
			this.hideBlockDetail()
			this.hideBlockMenu()
		},
		
		/**
		 * 预览图块
		 */
		previewBlock() {
			this.selectBlock(this.selectedBlock)
			this.hideBlockMenu()
		},
		
		/**
		 * 编辑图块
		 */
		editBlock() {
			uni.showToast({
				title: '编辑功能开发中',
				icon: 'none'
			})
			this.hideBlockMenu()
		},
		
		/**
		 * 复制图块
		 */
		copyBlock() {
			if (this.selectedBlock) {
				const newBlock = this.selectedBlock.clone()
				blockLibrary.addBlock(newBlock)
				this.loadBlockStats()
				
				uni.showToast({
					title: '复制成功',
					icon: 'success'
				})
				
				// 刷新列表
				this.$nextTick(() => {
					this.renderBlockPreviews()
				})
			}
			this.hideBlockMenu()
		},
		
		/**
		 * 导出图块
		 */
		exportBlock() {
			if (this.selectedBlock) {
				const exportData = this.selectedBlock.toJSON()
				console.log('导出图块数据:', exportData)
				
				uni.showToast({
					title: '导出成功',
					icon: 'success'
				})
			}
			this.hideBlockMenu()
		},
		
		/**
		 * 分享图块
		 */
		shareBlock() {
			uni.showActionSheet({
				itemList: ['分享到微信', '分享到朋友圈', '复制链接', '生成二维码'],
				success: (res) => {
					console.log('选择了第' + (res.tapIndex + 1) + '个分享方式')
					uni.showToast({
						title: '分享功能开发中',
						icon: 'none'
					})
				}
			})
			this.hideBlockMenu()
		},
		
		/**
		 * 删除图块
		 */
		deleteBlock() {
			if (this.currentTab === 'custom' && this.selectedBlock) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除"${this.selectedBlock.name}"吗？`,
					success: (res) => {
						if (res.confirm) {
							blockLibrary.removeBlock(this.selectedBlock.name)
							this.loadBlockStats()
							
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							
							// 刷新列表
							this.$nextTick(() => {
								this.renderBlockPreviews()
							})
						}
					}
				})
			}
			this.hideBlockMenu()
		},
		
		/**
		 * 创建自定义图块
		 */
		createCustomBlock() {
			this.newBlockName = ''
			this.newBlockDescription = ''
			this.newBlockCategory = ''
			this.showCreateModal = true
		},
		
		/**
		 * 隐藏创建弹窗
		 */
		hideCreateModal() {
			this.showCreateModal = false
		},
		
		/**
		 * 分类选择变化
		 */
		onCategoryChange(e) {
			this.newBlockCategory = this.categories[e.detail.value]
		},
		
		/**
		 * 确认创建图块
		 */
		confirmCreateBlock() {
			if (!this.newBlockName.trim()) {
				uni.showToast({
					title: '请输入图块名称',
					icon: 'none'
				})
				return
			}
			
			if (!this.newBlockCategory) {
				uni.showToast({
					title: '请选择分类',
					icon: 'none'
				})
				return
			}
			
			// 创建新图块
			const block = new Block(this.newBlockName.trim(), this.newBlockDescription.trim())
			block.setCategory(this.newBlockCategory)
			block.author = '用户'
			
			blockLibrary.addBlock(block)
			this.loadBlockStats()
			
			uni.showToast({
				title: '图块创建成功',
				icon: 'success'
			})
			
			this.hideCreateModal()
			
			// 刷新列表
			this.$nextTick(() => {
				this.renderBlockPreviews()
			})
		},
		
		/**
		 * 导入图块
		 */
		importBlocks() {
			uni.showToast({
				title: '导入功能开发中',
				icon: 'none'
			})
			this.hideMoreModal()
		},
		
		/**
		 * 导出图块库
		 */
		exportBlocks() {
			const exportData = blockLibrary.exportLibrary()
			console.log('导出图块库:', exportData)
			
			uni.showToast({
				title: '导出成功',
				icon: 'success'
			})
			this.hideMoreModal()
		},
		
		/**
		 * 显示图块统计
		 */
		showBlockStats() {
			this.loadBlockStats()
			this.showStatsModal = true
			this.hideMoreModal()
		},
		
		/**
		 * 隐藏统计弹窗
		 */
		hideStatsModal() {
			this.showStatsModal = false
		},
		
		/**
		 * 清空最近使用
		 */
		clearRecentBlocks() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空最近使用的图块记录吗？',
				success: (res) => {
					if (res.confirm) {
						this.recentBlocks = []
						this.saveRecentBlocks()
						
						uni.showToast({
							title: '清空成功',
							icon: 'success'
						})
					}
				}
			})
			this.hideMoreModal()
		},
		
		/**
		 * 格式化时间
		 */
		formatTime(isoString) {
			if (!isoString) return ''
			
			const date = new Date(isoString)
			const now = new Date()
			const diff = now - date
			
			if (diff < 60000) { // 1分钟内
				return '刚刚'
			} else if (diff < 3600000) { // 1小时内
				return Math.floor(diff / 60000) + '分钟前'
			} else if (diff < 86400000) { // 1天内
				return Math.floor(diff / 3600000) + '小时前'
			} else if (diff < 604800000) { // 1周内
				return Math.floor(diff / 86400000) + '天前'
			} else {
				return date.toLocaleDateString()
			}
		}
	}
}
</script>

<style scoped>
.blocks-container {
	background-color: #f5f5f5;
	min-height: 100vh;
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
	width: 120rpx;
}

.back-btn, .more-btn {
	font-size: 28rpx;
	color: #007aff;
}

.title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.tabs-container {
	position: fixed;
	top: 88rpx;
	left: 0;
	right: 0;
	background-color: #ffffff;
	z-index: 999;
	border-bottom: 1rpx solid #e5e5e5;
}

.tabs {
	display: flex;
	padding: 0 20rpx;
}

.tab {
	flex: 1;
	text-align: center;
	padding: 30rpx 0;
	position: relative;
}

.tab.active .tab-text {
	color: #007aff;
	font-weight: bold;
}

.tab.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background-color: #007aff;
}

.tab-text {
	font-size: 28rpx;
	color: #666;
}

.search-section {
	margin-top: 176rpx;
	padding: 20rpx;
	background-color: #ffffff;
}

.search-input-wrapper {
	display: flex;
	align-items: center;
	background-color: #f5f5f5;
	border-radius: 20rpx;
	padding: 0 20rpx;
}

.search-icon {
	width: 32rpx;
	height: 32rpx;
	margin-right: 16rpx;
}

.search-input {
	flex: 1;
	height: 60rpx;
	font-size: 28rpx;
	border: none;
	background: transparent;
}

.category-filter {
	background-color: #ffffff;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.category-scroll {
	white-space: nowrap;
}

.category-list {
	display: flex;
	padding: 0 20rpx;
}

.category-item {
	flex-shrink: 0;
	padding: 12rpx 24rpx;
	margin-right: 20rpx;
	border-radius: 20rpx;
	border: 1rpx solid #e5e5e5;
	background-color: #ffffff;
}

.category-item.active {
	background-color: #007aff;
	border-color: #007aff;
}

.category-item.active .category-text {
	color: #ffffff;
}

.category-text {
	font-size: 24rpx;
	color: #666;
}

.category-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 20rpx 20rpx;
	background-color: #ffffff;
}

.category-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.category-actions {
	display: flex;
	align-items: center;
}

.view-mode {
	font-size: 24rpx;
	color: #007aff;
	margin-right: 20rpx;
}

.collapse-btn {
	font-size: 24rpx;
	color: #007aff;
}

.blocks-container-inner {
	background-color: #ffffff;
	padding-bottom: 40rpx;
}

.blocks-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 0 20rpx;
}

.block-item {
	width: calc(33.333% - 20rpx);
	margin: 0 10rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.block-preview {
	width: 120rpx;
	height: 120rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #fafafa;
	margin-bottom: 16rpx;
	overflow: hidden;
}

.block-canvas {
	width: 120rpx;
	height: 120rpx;
}

.add-preview {
	border: 2rpx dashed #ccc;
	background-color: #f9f9f9;
}

.add-icon {
	width: 60rpx;
	height: 60rpx;
}

.block-name {
	font-size: 24rpx;
	color: #333;
	text-align: center;
	line-height: 1.2;
	margin-bottom: 4rpx;
}

.block-category {
	font-size: 20rpx;
	color: #999;
	text-align: center;
}

.blocks-list {
	padding: 0 20rpx;
}

.list-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.list-item:last-child {
	border-bottom: none;
}

.list-preview {
	width: 80rpx;
	height: 80rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #fafafa;
	margin-right: 20rpx;
	overflow: hidden;
}

.list-canvas {
	width: 80rpx;
	height: 80rpx;
}

.list-info {
	flex: 1;
}

.list-name {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
	display: block;
	margin-bottom: 8rpx;
}

.list-description {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 4rpx;
}

.list-category {
	font-size: 20rpx;
	color: #999;
}

.list-actions {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.more-icon {
	width: 24rpx;
	height: 24rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 100rpx 20rpx;
	background-color: #ffffff;
}

.empty-icon {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 40rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #999;
	margin-bottom: 16rpx;
}

.empty-hint {
	font-size: 24rpx;
	color: #ccc;
	text-align: center;
}

/* 弹窗通用样式 */
.block-detail-modal, .block-menu, .create-modal, .more-modal, .stats-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 2000;
}

.modal-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
}

.detail-content, .modal-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-radius: 20rpx 20rpx 0 0;
	max-height: 80vh;
	overflow: hidden;
}

.detail-header, .modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 40rpx 20rpx 20rpx;
	border-bottom: 1rpx solid #e5e5e5;
}

.detail-title, .modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.detail-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
}

.detail-body, .modal-body {
	padding: 40rpx 20rpx;
	max-height: 60vh;
	overflow-y: auto;
}

.detail-preview {
	width: 200rpx;
	height: 200rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 12rpx;
	margin: 0 auto 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #fafafa;
	overflow: hidden;
}

.detail-canvas {
	width: 200rpx;
	height: 200rpx;
}

.detail-info {
	text-align: center;
}

.detail-description, .detail-category, .detail-objects, .detail-author, .detail-time {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin-bottom: 12rpx;
}

.detail-footer, .modal-footer {
	display: flex;
	border-top: 1rpx solid #e5e5e5;
}

.detail-btn, .modal-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
}

.detail-btn.cancel, .modal-btn.cancel {
	color: #666;
	border-right: 1rpx solid #e5e5e5;
}

.detail-btn.confirm, .modal-btn.confirm {
	color: #007aff;
	font-weight: bold;
}

.menu-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-radius: 20rpx 20rpx 0 0;
	padding: 20rpx 0;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 30rpx 40rpx;
}

.menu-item.danger .menu-text {
	color: #ff3b30;
}

.menu-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 20rpx;
}

.menu-text {
	font-size: 28rpx;
	color: #333;
}

/* 表单样式 */
.form-group {
	margin-bottom: 30rpx;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 12rpx;
}

.form-input, .form-textarea {
	width: 100%;
	border: 1rpx solid #e5e5e5;
	border-radius: 8rpx;
	padding: 20rpx;
	font-size: 28rpx;
	background-color: #fafafa;
}

.form-input {
	height: 80rpx;
}

.form-textarea {
	height: 120rpx;
}

.picker-view {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 80rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 8rpx;
	padding: 0 20rpx;
	background-color: #fafafa;
}

.arrow-icon {
	width: 24rpx;
	height: 24rpx;
}

/* 更多操作样式 */
.more-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #e5e5e5;
}

.more-icon {
	width: 60rpx;
	height: 60rpx;
	margin-right: 20rpx;
}

.more-info {
	flex: 1;
}

.more-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.more-desc {
	font-size: 24rpx;
	color: #666;
}

/* 统计样式 */
.stats-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.stats-item:last-child {
	border-bottom: none;
}

.stats-label {
	font-size: 28rpx;
	color: #333;
}

.stats-value {
	font-size: 28rpx;
	font-weight: bold;
	color: #007aff;
}
</style>

