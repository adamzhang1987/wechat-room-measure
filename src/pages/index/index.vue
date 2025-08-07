<template>
	<view class="container">
		<view class="header">
			<view class="user-info">
				<image class="avatar" src="/static/avatar.png" mode="aspectFill"></image>
				<view class="user-details">
					<text class="username">158****0227</text>
					<text class="membership">会员用户</text>
				</view>
				<view class="file-count">
					<text>文件容量: 7/30</text>
				</view>
			</view>
		</view>

		<view class="tutorial-section">
			<view class="tutorial-card">
				<image src="/static/tutorial-icon.png" class="tutorial-icon"></image>
				<text class="tutorial-text">新手操作教程</text>
				<text class="tutorial-action">立即查看</text>
			</view>
		</view>

		<view class="quick-actions">
			<view class="action-grid">
				<view class="action-item" @click="createDrawing">
					<image src="/static/icon-drawing.png" class="action-icon"></image>
					<text class="action-text">创建图纸</text>
				</view>
				<view class="action-item" @click="createFolder">
					<image src="/static/icon-folder.png" class="action-icon"></image>
					<text class="action-text">创建文件夹</text>
				</view>
				<view class="action-item" @click="importFromWechat">
					<image src="/static/icon-wechat.png" class="action-icon"></image>
					<text class="action-text">微信中导入</text>
				</view>
				<view class="action-item" @click="contactService">
					<image src="/static/icon-service.png" class="action-icon"></image>
					<text class="action-text">AI客服</text>
				</view>
			</view>
		</view>

		<view class="tabs-section">
			<view class="tabs">
				<view class="tab active">全部</view>
				<view class="tab">协作</view>
				<view class="search-actions">
					<image src="/static/icon-copy.png" class="search-icon"></image>
					<image src="/static/icon-search.png" class="search-icon"></image>
				</view>
			</view>
		</view>

		<view class="file-list">
			<view class="file-item" v-for="(file, index) in fileList" :key="index" @click="openFile(file)">
				<image src="/static/icon-folder-blue.png" class="file-icon"></image>
				<view class="file-info">
					<text class="file-name">{{ file.name }}</text>
					<text class="file-date">{{ file.date }}</text>
					<text class="file-count">{{ file.count }}个文件</text>
				</view>
				<image src="/static/icon-edit.png" class="edit-icon"></image>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			fileList: [
				{
					name: '莱茵·矩阵国际',
					date: '2025-06-24 14:28:10',
					count: 0
				},
				{
					name: '科技广场',
					date: '2025-06-24 13:48:26',
					count: 1
				},
				{
					name: '示例项目门窗',
					date: '2025-06-24 13:33:07',
					count: 2
				},
				{
					name: '平面施工图',
					date: '2025-06-24 13:33:07',
					count: 1
				}
			]
		}
	},
	methods: {
		createDrawing() {
			uni.navigateTo({
				url: '/pages/drawing/drawing'
			})
		},
		createFolder() {
			uni.showModal({
				title: '创建文件夹',
				editable: true,
				placeholderText: '请输入文件夹名称',
				success: (res) => {
					if (res.confirm && res.content) {
						// 创建文件夹逻辑
						console.log('创建文件夹:', res.content)
					}
				}
			})
		},
		importFromWechat() {
			uni.showToast({
				title: '功能开发中',
				icon: 'none'
			})
		},
		contactService() {
			uni.showToast({
				title: '功能开发中',
				icon: 'none'
			})
		},
		openFile(file) {
			console.log('打开文件:', file.name)
		}
	}
}
</script>

<style scoped>
.container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

.header {
	background-color: #ffffff;
	padding: 20rpx;
}

.user-info {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
}

.avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.user-details {
	flex: 1;
}

.username {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.membership {
	display: block;
	font-size: 24rpx;
	color: #ffa500;
	margin-top: 8rpx;
}

.file-count {
	font-size: 24rpx;
	color: #666;
}

.tutorial-section {
	margin: 20rpx;
	background-color: #fff3e0;
	border-radius: 16rpx;
	padding: 20rpx;
}

.tutorial-card {
	display: flex;
	align-items: center;
}

.tutorial-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 20rpx;
}

.tutorial-text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.tutorial-action {
	font-size: 28rpx;
	color: #ffa500;
}

.quick-actions {
	margin: 20rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx;
}

.action-grid {
	display: flex;
	justify-content: space-between;
}

.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 120rpx;
}

.action-icon {
	width: 60rpx;
	height: 60rpx;
	margin-bottom: 16rpx;
}

.action-text {
	font-size: 24rpx;
	color: #333;
}

.tabs-section {
	margin: 20rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
}

.tabs {
	display: flex;
	align-items: center;
	padding: 20rpx;
}

.tab {
	font-size: 28rpx;
	color: #666;
	margin-right: 40rpx;
}

.tab.active {
	color: #333;
	font-weight: bold;
	border-bottom: 4rpx solid #007aff;
	padding-bottom: 8rpx;
}

.search-actions {
	margin-left: auto;
	display: flex;
}

.search-icon {
	width: 40rpx;
	height: 40rpx;
	margin-left: 20rpx;
}

.file-list {
	margin: 20rpx;
}

.file-item {
	display: flex;
	align-items: center;
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx 20rpx;
	margin-bottom: 20rpx;
}

.file-icon {
	width: 60rpx;
	height: 60rpx;
	margin-right: 20rpx;
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

.file-date {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-bottom: 4rpx;
}

.file-count {
	display: block;
	font-size: 24rpx;
	color: #999;
}

.edit-icon {
	width: 40rpx;
	height: 40rpx;
}
</style>
