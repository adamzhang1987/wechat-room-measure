<template>
	<view class="files-container">
		<!-- 顶部搜索栏 -->
		<view class="search-bar">
			<view class="search-input-wrapper">
				<image src="/static/icon-search.png" class="search-icon"></image>
				<input 
					class="search-input" 
					placeholder="搜索图纸"
					v-model="searchKeyword"
					@input="onSearch"
				/>
			</view>
			<view class="filter-btn" @click="showFilter">
				<image src="/static/icon-filter.png" class="filter-icon"></image>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-buttons">
			<view class="action-btn" @click="createNewFile">
				<image src="/static/icon-add.png" class="action-icon"></image>
				<text class="action-text">新建图纸</text>
			</view>
			<view class="action-btn" @click="createNewFolder">
				<image src="/static/icon-folder-add.png" class="action-icon"></image>
				<text class="action-text">新建文件夹</text>
			</view>
			<view class="action-btn" @click="importFile">
				<image src="/static/icon-import.png" class="action-icon"></image>
				<text class="action-text">导入</text>
			</view>
			<view class="action-btn" @click="showFileStats">
				<image src="/static/icon-stats.png" class="action-icon"></image>
				<text class="action-text">统计</text>
			</view>
		</view>

		<!-- 文件列表 -->
		<view class="file-list">
			<!-- 面包屑导航 -->
			<view v-if="currentPath.length > 0" class="breadcrumb">
				<text class="breadcrumb-item" @click="navigateToRoot">根目录</text>
				<text v-for="(path, index) in currentPath" :key="index" class="breadcrumb-item">
					/ {{ path.name }}
				</text>
			</view>

			<!-- 返回上级按钮 -->
			<view v-if="currentParentId" class="back-button" @click="navigateBack">
				<image src="/static/icon-back.png" class="back-icon"></image>
				<text class="back-text">返回上级</text>
			</view>

			<!-- 文件项 -->
			<view class="file-item" 
				v-for="(item, index) in filteredFileList" 
				:key="item.id"
				@click="openItem(item)"
				@longpress="showItemMenu(item, index)"
			>
				<view class="file-icon-wrapper">
					<image 
						:src="getFileIcon(item.type)" 
						class="file-icon"
					></image>
					<view v-if="item.type === 'folder' && item.children && item.children.length > 0" class="file-count">
						{{ item.children.length }}
					</view>
				</view>
				<view class="file-info">
					<text class="file-name">{{ item.name }}</text>
					<text class="file-details">{{ formatFileDetails(item) }}</text>
				</view>
				<view class="file-actions">
					<image 
						src="/static/icon-more.png" 
						class="more-icon"
						@click.stop="showItemMenu(item, index)"
					></image>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="filteredFileList.length === 0" class="empty-state">
				<image src="/static/icon-empty.png" class="empty-icon"></image>
				<text class="empty-text">{{ searchKeyword ? '未找到相关文件' : '暂无文件' }}</text>
				<text v-if="!searchKeyword" class="empty-hint">点击上方按钮创建新文件或文件夹</text>
			</view>
		</view>

		<!-- 筛选面板 -->
		<view v-if="showFilterPanel" class="filter-panel">
			<view class="filter-backdrop" @click="hideFilter"></view>
			<view class="filter-content">
				<view class="filter-header">
					<text class="filter-title">筛选条件</text>
					<text class="filter-close" @click="hideFilter">关闭</text>
				</view>
				<view class="filter-body">
					<view class="filter-group">
						<text class="filter-label">文件类型</text>
						<view class="filter-options">
							<view 
								class="filter-option" 
								:class="{active: filterType === 'all'}"
								@click="setFilterType('all')"
							>
								<text>全部</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: filterType === 'folder'}"
								@click="setFilterType('folder')"
							>
								<text>文件夹</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: filterType === 'drawing'}"
								@click="setFilterType('drawing')"
							>
								<text>图纸</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: filterType === 'photo'}"
								@click="setFilterType('photo')"
							>
								<text>照片</text>
							</view>
						</view>
					</view>
					<view class="filter-group">
						<text class="filter-label">排序方式</text>
						<view class="filter-options">
							<view 
								class="filter-option" 
								:class="{active: sortBy === 'name'}"
								@click="setSortBy('name')"
							>
								<text>按名称</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: sortBy === 'date'}"
								@click="setSortBy('date')"
							>
								<text>按时间</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: sortBy === 'size'}"
								@click="setSortBy('size')"
							>
								<text>按大小</text>
							</view>
						</view>
					</view>
					<view class="filter-group">
						<text class="filter-label">时间范围</text>
						<view class="filter-options">
							<view 
								class="filter-option" 
								:class="{active: timeRange === 'all'}"
								@click="setTimeRange('all')"
							>
								<text>全部</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: timeRange === 'today'}"
								@click="setTimeRange('today')"
							>
								<text>今天</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: timeRange === 'week'}"
								@click="setTimeRange('week')"
							>
								<text>本周</text>
							</view>
							<view 
								class="filter-option" 
								:class="{active: timeRange === 'month'}"
								@click="setTimeRange('month')"
							>
								<text>本月</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 操作菜单 -->
		<view v-if="showActionMenu" class="action-menu">
			<view class="menu-backdrop" @click="hideActionMenu"></view>
			<view class="menu-content">
				<view class="menu-item" @click="openItem(selectedItem)">
					<image src="/static/icon-open.png" class="menu-icon"></image>
					<text class="menu-text">打开</text>
				</view>
				<view class="menu-item" @click="renameItem">
					<image src="/static/icon-rename.png" class="menu-icon"></image>
					<text class="menu-text">重命名</text>
				</view>
				<view class="menu-item" @click="moveItem">
					<image src="/static/icon-move.png" class="menu-icon"></image>
					<text class="menu-text">移动</text>
				</view>
				<view class="menu-item" @click="copyItem">
					<image src="/static/icon-copy.png" class="menu-icon"></image>
					<text class="menu-text">复制</text>
				</view>
				<view class="menu-item" @click="exportItem">
					<image src="/static/icon-export.png" class="menu-icon"></image>
					<text class="menu-text">导出</text>
				</view>
				<view class="menu-item" @click="shareItem">
					<image src="/static/icon-share.png" class="menu-icon"></image>
					<text class="menu-text">分享</text>
				</view>
				<view class="menu-item danger" @click="deleteItem">
					<image src="/static/icon-delete.png" class="menu-icon"></image>
					<text class="menu-text">删除</text>
				</view>
			</view>
		</view>

		<!-- 重命名弹窗 -->
		<view v-if="showRenameModal" class="rename-modal">
			<view class="modal-backdrop" @click="cancelRename"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">重命名</text>
				</view>
				<view class="modal-body">
					<input 
						class="rename-input" 
						v-model="newName"
						:placeholder="selectedItem ? selectedItem.name : ''"
						@confirm="confirmRename"
					/>
				</view>
				<view class="modal-footer">
					<text class="modal-btn cancel" @click="cancelRename">取消</text>
					<text class="modal-btn confirm" @click="confirmRename">确定</text>
				</view>
			</view>
		</view>

		<!-- 新建文件夹弹窗 -->
		<view v-if="showNewFolderModal" class="new-folder-modal">
			<view class="modal-backdrop" @click="cancelNewFolder"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">新建文件夹</text>
				</view>
				<view class="modal-body">
					<input 
						class="folder-input" 
						v-model="newFolderName"
						placeholder="请输入文件夹名称"
						@confirm="confirmNewFolder"
					/>
				</view>
				<view class="modal-footer">
					<text class="modal-btn cancel" @click="cancelNewFolder">取消</text>
					<text class="modal-btn confirm" @click="confirmNewFolder">确定</text>
				</view>
			</view>
		</view>

		<!-- 移动文件弹窗 -->
		<view v-if="showMoveModal" class="move-modal">
			<view class="modal-backdrop" @click="cancelMove"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">移动到</text>
				</view>
				<view class="modal-body">
					<view class="folder-tree">
						<view class="tree-item root" @click="selectMoveTarget(null)">
							<image src="/static/icon-folder.png" class="tree-icon"></image>
							<text class="tree-text">根目录</text>
							<image v-if="moveTargetId === null" src="/static/icon-check.png" class="check-icon"></image>
						</view>
						<view v-for="folder in folderList" :key="folder.id" class="tree-item" @click="selectMoveTarget(folder.id)">
							<image src="/static/icon-folder.png" class="tree-icon"></image>
							<text class="tree-text">{{ folder.name }}</text>
							<image v-if="moveTargetId === folder.id" src="/static/icon-check.png" class="check-icon"></image>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<text class="modal-btn cancel" @click="cancelMove">取消</text>
					<text class="modal-btn confirm" @click="confirmMove">确定</text>
				</view>
			</view>
		</view>

		<!-- 文件统计弹窗 -->
		<view v-if="showStatsModal" class="stats-modal">
			<view class="modal-backdrop" @click="hideStats"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">文件统计</text>
				</view>
				<view class="modal-body">
					<view class="stats-item">
						<text class="stats-label">文件夹数量</text>
						<text class="stats-value">{{ fileStats.folderCount }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">图纸数量</text>
						<text class="stats-value">{{ fileStats.drawingCount }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">照片数量</text>
						<text class="stats-value">{{ fileStats.photoCount }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">总文件数</text>
						<text class="stats-value">{{ fileStats.totalFiles }}</text>
					</view>
					<view class="stats-item">
						<text class="stats-label">占用空间</text>
						<text class="stats-value">{{ formatFileSize(fileStats.totalSize) }}</text>
					</view>
				</view>
				<view class="modal-footer">
					<text class="modal-btn confirm" @click="hideStats">确定</text>
				</view>
			</view>
		</view>

		<!-- 导入选项弹窗 -->
		<view v-if="showImportModal" class="import-modal">
			<view class="modal-backdrop" @click="hideImport"></view>
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">导入文件</text>
				</view>
				<view class="modal-body">
					<view class="import-option" @click="importFromAlbum">
						<image src="/static/icon-album.png" class="import-icon"></image>
						<view class="import-info">
							<text class="import-title">从相册导入</text>
							<text class="import-desc">选择相册中的照片</text>
						</view>
					</view>
					<view class="import-option" @click="importFromCamera">
						<image src="/static/icon-camera.png" class="import-icon"></image>
						<view class="import-info">
							<text class="import-title">拍照导入</text>
							<text class="import-desc">使用相机拍摄照片</text>
						</view>
					</view>
					<view class="import-option" @click="importFromFile">
						<image src="/static/icon-file.png" class="import-icon"></image>
						<view class="import-info">
							<text class="import-title">从文件导入</text>
							<text class="import-desc">选择本地文件</text>
						</view>
					</view>
					<view class="import-option" @click="importFromQR">
						<image src="/static/icon-qr.png" class="import-icon"></image>
						<view class="import-info">
							<text class="import-title">扫码导入</text>
							<text class="import-desc">扫描二维码导入</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { fileManager } from '../../utils/storage/FileManager.js'

export default {
	data() {
		return {
			searchKeyword: '',
			currentPath: [],
			currentParentId: null,
			showFilterPanel: false,
			showActionMenu: false,
			showRenameModal: false,
			showNewFolderModal: false,
			showMoveModal: false,
			showStatsModal: false,
			showImportModal: false,
			filterType: 'all',
			sortBy: 'date',
			timeRange: 'all',
			selectedItem: null,
			selectedIndex: -1,
			newName: '',
			newFolderName: '',
			moveTargetId: null,
			fileStats: {},
			fileList: [],
			folderList: []
		}
	},
	
	computed: {
		filteredFileList() {
			let list = this.fileList
			
			// 按类型筛选
			if (this.filterType !== 'all') {
				list = list.filter(item => item.type === this.filterType)
			}
			
			// 按时间范围筛选
			if (this.timeRange !== 'all') {
				const now = new Date()
				list = list.filter(item => {
					const itemDate = new Date(item.modifyTime)
					switch (this.timeRange) {
						case 'today':
							return itemDate.toDateString() === now.toDateString()
						case 'week':
							const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
							return itemDate >= weekAgo
						case 'month':
							const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
							return itemDate >= monthAgo
						default:
							return true
					}
				})
			}
			
			// 按关键词搜索
			if (this.searchKeyword) {
				list = list.filter(item => 
					item.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
				)
			}
			
			// 排序
			list.sort((a, b) => {
				// 文件夹优先
				if (a.type === 'folder' && b.type !== 'folder') return -1
				if (a.type !== 'folder' && b.type === 'folder') return 1
				
				switch (this.sortBy) {
					case 'name':
						return a.name.localeCompare(b.name)
					case 'date':
						return new Date(b.modifyTime) - new Date(a.modifyTime)
					case 'size':
						return (b.size || 0) - (a.size || 0)
					default:
						return 0
				}
			})
			
			return list
		}
	},
	
	onLoad() {
		this.loadFileList()
		this.loadFolderList()
		this.loadFileStats()
	},
	
	onShow() {
		// 页面显示时刷新文件列表
		this.loadFileList()
		this.loadFileStats()
	},
	
	methods: {
		/**
		 * 加载文件列表
		 */
		loadFileList() {
			this.fileList = fileManager.getCurrentFiles(this.currentParentId)
		},
		
		/**
		 * 加载文件夹列表（用于移动文件）
		 */
		loadFolderList() {
			this.folderList = fileManager.getCurrentFiles().filter(file => file.type === 'folder')
		},
		
		/**
		 * 加载文件统计
		 */
		loadFileStats() {
			this.fileStats = fileManager.getFileStats()
		},
		
		/**
		 * 搜索处理
		 */
		onSearch() {
			// 搜索逻辑已在computed中处理
		},
		
		/**
		 * 显示筛选面板
		 */
		showFilter() {
			this.showFilterPanel = true
		},
		
		/**
		 * 隐藏筛选面板
		 */
		hideFilter() {
			this.showFilterPanel = false
		},
		
		/**
		 * 设置筛选类型
		 */
		setFilterType(type) {
			this.filterType = type
		},
		
		/**
		 * 设置排序方式
		 */
		setSortBy(sortBy) {
			this.sortBy = sortBy
		},
		
		/**
		 * 设置时间范围
		 */
		setTimeRange(range) {
			this.timeRange = range
		},
		
		/**
		 * 创建新图纸
		 */
		createNewFile() {
			const fileName = '新建图纸_' + new Date().toLocaleString().replace(/[^\d]/g, '').substr(0, 12)
			const newFile = fileManager.createDrawing(fileName, this.currentParentId)
			
			// 跳转到绘图页面
			uni.navigateTo({
				url: '/pages/drawing/drawing?fileId=' + newFile.id
			})
		},
		
		/**
		 * 创建新文件夹
		 */
		createNewFolder() {
			this.newFolderName = ''
			this.showNewFolderModal = true
		},
		
		/**
		 * 确认新建文件夹
		 */
		confirmNewFolder() {
			if (this.newFolderName.trim()) {
				fileManager.createFolder(this.newFolderName.trim(), this.currentParentId)
				this.loadFileList()
				this.loadFolderList()
				this.loadFileStats()
				
				uni.showToast({
					title: '文件夹创建成功',
					icon: 'success'
				})
			}
			this.cancelNewFolder()
		},
		
		/**
		 * 取消新建文件夹
		 */
		cancelNewFolder() {
			this.showNewFolderModal = false
			this.newFolderName = ''
		},
		
		/**
		 * 导入文件
		 */
		importFile() {
			this.showImportModal = true
		},
		
		/**
		 * 隐藏导入弹窗
		 */
		hideImport() {
			this.showImportModal = false
		},
		
		/**
		 * 从相册导入
		 */
		importFromAlbum() {
			uni.chooseImage({
				count: 9,
				sourceType: ['album'],
				success: (res) => {
					res.tempFilePaths.forEach((path, index) => {
						const fileName = '导入照片_' + (index + 1) + '_' + new Date().toLocaleString().replace(/[^\d]/g, '').substr(0, 12)
						fileManager.createPhoto(fileName, this.currentParentId, path)
					})
					this.loadFileList()
					this.loadFileStats()
					uni.showToast({
						title: '导入成功',
						icon: 'success'
					})
				}
			})
			this.hideImport()
		},
		
		/**
		 * 拍照导入
		 */
		importFromCamera() {
			uni.chooseImage({
				count: 1,
				sourceType: ['camera'],
				success: (res) => {
					const fileName = '拍照_' + new Date().toLocaleString().replace(/[^\d]/g, '').substr(0, 12)
					fileManager.createPhoto(fileName, this.currentParentId, res.tempFilePaths[0])
					this.loadFileList()
					this.loadFileStats()
					uni.showToast({
						title: '拍照成功',
						icon: 'success'
					})
				}
			})
			this.hideImport()
		},
		
		/**
		 * 从文件导入
		 */
		importFromFile() {
			uni.showToast({
				title: '文件导入功能开发中',
				icon: 'none'
			})
			this.hideImport()
		},
		
		/**
		 * 扫码导入
		 */
		importFromQR() {
			uni.scanCode({
				success: (res) => {
					console.log('扫码结果:', res.result)
					uni.showToast({
						title: '扫码导入功能开发中',
						icon: 'none'
					})
				}
			})
			this.hideImport()
		},
		
		/**
		 * 显示文件统计
		 */
		showFileStats() {
			this.loadFileStats()
			this.showStatsModal = true
		},
		
		/**
		 * 隐藏文件统计
		 */
		hideStats() {
			this.showStatsModal = false
		},
		
		/**
		 * 导航到根目录
		 */
		navigateToRoot() {
			this.currentPath = []
			this.currentParentId = null
			this.loadFileList()
		},
		
		/**
		 * 返回上级目录
		 */
		navigateBack() {
			if (this.currentPath.length > 0) {
				this.currentPath.pop()
				this.currentParentId = this.currentPath.length > 0 ? 
					this.currentPath[this.currentPath.length - 1].id : null
				this.loadFileList()
			}
		},
		
		/**
		 * 打开文件或文件夹
		 */
		openItem(item) {
			if (item.type === 'folder') {
				this.currentPath.push(item)
				this.currentParentId = item.id
				this.loadFileList()
			} else if (item.type === 'drawing') {
				uni.navigateTo({
					url: '/pages/drawing/drawing?fileId=' + item.id
				})
			} else if (item.type === 'photo') {
				uni.navigateTo({
					url: '/pages/photo/photo?fileId=' + item.id
				})
			}
		},
		
		/**
		 * 显示文件操作菜单
		 */
		showItemMenu(item, index) {
			this.selectedItem = item
			this.selectedIndex = index
			this.showActionMenu = true
		},
		
		/**
		 * 隐藏操作菜单
		 */
		hideActionMenu() {
			this.showActionMenu = false
			this.selectedItem = null
			this.selectedIndex = -1
		},
		
		/**
		 * 重命名文件
		 */
		renameItem() {
			this.newName = this.selectedItem.name
			this.showRenameModal = true
			this.hideActionMenu()
		},
		
		/**
		 * 确认重命名
		 */
		confirmRename() {
			if (this.newName.trim() && this.newName !== this.selectedItem.name) {
				if (fileManager.renameFile(this.selectedItem.id, this.newName.trim())) {
					this.loadFileList()
					uni.showToast({
						title: '重命名成功',
						icon: 'success'
					})
				}
			}
			this.cancelRename()
		},
		
		/**
		 * 取消重命名
		 */
		cancelRename() {
			this.showRenameModal = false
			this.newName = ''
		},
		
		/**
		 * 移动文件
		 */
		moveItem() {
			this.moveTargetId = this.currentParentId
			this.showMoveModal = true
			this.hideActionMenu()
		},
		
		/**
		 * 选择移动目标
		 */
		selectMoveTarget(targetId) {
			this.moveTargetId = targetId
		},
		
		/**
		 * 确认移动
		 */
		confirmMove() {
			if (this.moveTargetId !== this.selectedItem.parentId) {
				if (fileManager.moveFile(this.selectedItem.id, this.moveTargetId)) {
					this.loadFileList()
					this.loadFolderList()
					uni.showToast({
						title: '移动成功',
						icon: 'success'
					})
				}
			}
			this.cancelMove()
		},
		
		/**
		 * 取消移动
		 */
		cancelMove() {
			this.showMoveModal = false
			this.moveTargetId = null
		},
		
		/**
		 * 复制文件
		 */
		copyItem() {
			const copy = fileManager.copyFile(this.selectedItem.id, this.currentParentId)
			if (copy) {
				this.loadFileList()
				this.loadFileStats()
				uni.showToast({
					title: '复制成功',
					icon: 'success'
				})
			}
			this.hideActionMenu()
		},
		
		/**
		 * 导出文件
		 */
		exportItem() {
			const exportData = fileManager.exportFile(this.selectedItem.id)
			if (exportData) {
				// 这里可以实现具体的导出逻辑，比如保存到相册或分享
				console.log('导出数据:', exportData)
				uni.showToast({
					title: '导出成功',
					icon: 'success'
				})
			}
			this.hideActionMenu()
		},
		
		/**
		 * 分享文件
		 */
		shareItem() {
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
			this.hideActionMenu()
		},
		
		/**
		 * 删除文件
		 */
		deleteItem() {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除"${this.selectedItem.name}"吗？`,
				success: (res) => {
					if (res.confirm) {
						if (fileManager.deleteFile(this.selectedItem.id)) {
							this.loadFileList()
							this.loadFolderList()
							this.loadFileStats()
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
						}
					}
				}
			})
			this.hideActionMenu()
		},
		
		/**
		 * 获取文件图标
		 */
		getFileIcon(type) {
			switch (type) {
				case 'folder':
					return '/static/icon-folder-blue.png'
				case 'drawing':
					return '/static/icon-drawing-file.png'
				case 'photo':
					return '/static/icon-photo-file.png'
				default:
					return '/static/icon-file.png'
			}
		},
		
		/**
		 * 格式化文件详情
		 */
		formatFileDetails(item) {
			const timeText = fileManager.formatTime(item.modifyTime)
			
			if (item.type === 'folder') {
				const count = item.children ? item.children.length : 0
				return `${count}个文件 · ${timeText}`
			} else {
				const sizeText = fileManager.formatFileSize(item.size || 0)
				return `${sizeText} · ${timeText}`
			}
		},
		
		/**
		 * 格式化文件大小
		 */
		formatFileSize(bytes) {
			return fileManager.formatFileSize(bytes)
		}
	}
}
</script>

<style scoped>
.files-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

.search-bar {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background-color: #ffffff;
	border-bottom: 1rpx solid #f0f0f0;
}

.search-input-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	background-color: #f5f5f5;
	border-radius: 20rpx;
	padding: 0 20rpx;
	margin-right: 20rpx;
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

.filter-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.filter-icon {
	width: 32rpx;
	height: 32rpx;
}

.action-buttons {
	display: flex;
	padding: 20rpx;
	background-color: #ffffff;
	margin-bottom: 20rpx;
}

.action-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx;
}

.action-icon {
	width: 48rpx;
	height: 48rpx;
	margin-bottom: 12rpx;
}

.action-text {
	font-size: 24rpx;
	color: #666;
}

.file-list {
	background-color: #ffffff;
	margin: 0 20rpx;
	border-radius: 16rpx;
	overflow: hidden;
}

.breadcrumb {
	padding: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	font-size: 24rpx;
	color: #666;
}

.breadcrumb-item {
	color: #007aff;
}

.back-button {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.back-icon {
	width: 32rpx;
	height: 32rpx;
	margin-right: 12rpx;
}

.back-text {
	font-size: 28rpx;
	color: #007aff;
}

.file-item {
	display: flex;
	align-items: center;
	padding: 30rpx 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.file-item:last-child {
	border-bottom: none;
}

.file-icon-wrapper {
	position: relative;
	margin-right: 20rpx;
}

.file-icon {
	width: 60rpx;
	height: 60rpx;
}

.file-count {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	background-color: #ff3b30;
	color: white;
	font-size: 20rpx;
	padding: 2rpx 8rpx;
	border-radius: 10rpx;
	min-width: 20rpx;
	text-align: center;
}

.file-info {
	flex: 1;
}

.file-name {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.file-details {
	display: block;
	font-size: 24rpx;
	color: #999;
}

.file-actions {
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
}

.filter-panel {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;
}

.filter-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
}

.filter-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-radius: 20rpx 20rpx 0 0;
	max-height: 80vh;
	overflow-y: auto;
}

.filter-header {
	padding: 40rpx 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #e5e5e5;
}

.filter-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.filter-close {
	font-size: 28rpx;
	color: #007aff;
}

.filter-body {
	padding: 20rpx;
}

.filter-group {
	margin-bottom: 40rpx;
}

.filter-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 20rpx;
}

.filter-options {
	display: flex;
	flex-wrap: wrap;
}

.filter-option {
	padding: 16rpx 32rpx;
	margin-right: 20rpx;
	margin-bottom: 20rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 20rpx;
	font-size: 24rpx;
	color: #666;
}

.filter-option.active {
	background-color: #007aff;
	color: white;
	border-color: #007aff;
}

.action-menu {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 2000;
}

.menu-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
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

/* 弹窗通用样式 */
.rename-modal, .new-folder-modal, .move-modal, .stats-modal, .import-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

.modal-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
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
	padding: 40rpx 20rpx 20rpx;
	text-align: center;
	border-bottom: 1rpx solid #e5e5e5;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.modal-body {
	padding: 40rpx 20rpx;
	max-height: 60vh;
	overflow-y: auto;
}

.rename-input, .folder-input {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #ccc;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
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

/* 文件夹树样式 */
.folder-tree {
	max-height: 400rpx;
	overflow-y: auto;
}

.tree-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.tree-item.root {
	background-color: #f5f5f5;
}

.tree-icon {
	width: 32rpx;
	height: 32rpx;
	margin-right: 16rpx;
}

.tree-text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.check-icon {
	width: 24rpx;
	height: 24rpx;
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

/* 导入选项样式 */
.import-option {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 16rpx;
	border: 1rpx solid #e5e5e5;
}

.import-icon {
	width: 60rpx;
	height: 60rpx;
	margin-right: 20rpx;
}

.import-info {
	flex: 1;
}

.import-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.import-desc {
	font-size: 24rpx;
	color: #666;
}
</style>

