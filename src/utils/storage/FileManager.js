/**
 * 文件管理器 - 处理图纸文件的本地存储和管理
 */
export class FileManager {
	constructor() {
		this.storageKey = 'room_measure_files'
		this.currentPath = []
		this.files = this.loadFiles()
	}
	
	/**
	 * 从本地存储加载文件列表
	 */
	loadFiles() {
		try {
			const data = uni.getStorageSync(this.storageKey)
			return data ? JSON.parse(data) : this.getDefaultFiles()
		} catch (error) {
			console.error('加载文件列表失败:', error)
			return this.getDefaultFiles()
		}
	}
	
	/**
	 * 保存文件列表到本地存储
	 */
	saveFiles() {
		try {
			uni.setStorageSync(this.storageKey, JSON.stringify(this.files))
			return true
		} catch (error) {
			console.error('保存文件列表失败:', error)
			return false
		}
	}
	
	/**
	 * 获取默认文件结构
	 */
	getDefaultFiles() {
		return [
			{
				id: 'folder_1',
				name: '莱茵·矩阵国际',
				type: 'folder',
				parentId: null,
				createTime: new Date().toISOString(),
				modifyTime: new Date().toISOString(),
				size: 0,
				children: []
			},
			{
				id: 'folder_2',
				name: '科技广场',
				type: 'folder',
				parentId: null,
				createTime: new Date().toISOString(),
				modifyTime: new Date().toISOString(),
				size: 0,
				children: [
					{
						id: 'drawing_1',
						name: '一层平面图',
						type: 'drawing',
						parentId: 'folder_2',
						createTime: new Date().toISOString(),
						modifyTime: new Date().toISOString(),
						size: 1024,
						data: null,
						thumbnail: null
					}
				]
			},
			{
				id: 'folder_3',
				name: '示例项目门窗',
				type: 'folder',
				parentId: null,
				createTime: new Date().toISOString(),
				modifyTime: new Date().toISOString(),
				size: 0,
				children: [
					{
						id: 'drawing_2',
						name: '门窗详图',
						type: 'drawing',
						parentId: 'folder_3',
						createTime: new Date().toISOString(),
						modifyTime: new Date().toISOString(),
						size: 2048,
						data: null,
						thumbnail: null
					},
					{
						id: 'photo_1',
						name: '门窗实景照片',
						type: 'photo',
						parentId: 'folder_3',
						createTime: new Date().toISOString(),
						modifyTime: new Date().toISOString(),
						size: 3072,
						data: null,
						thumbnail: null
					}
				]
			},
			{
				id: 'drawing_3',
				name: '平面施工图',
				type: 'drawing',
				parentId: null,
				createTime: new Date().toISOString(),
				modifyTime: new Date().toISOString(),
				size: 1536,
				data: null,
				thumbnail: null
			}
		]
	}
	
	/**
	 * 获取当前目录的文件列表
	 */
	getCurrentFiles(parentId = null) {
		return this.files.filter(file => file.parentId === parentId)
	}
	
	/**
	 * 根据ID获取文件
	 */
	getFileById(id) {
		const findFile = (files) => {
			for (const file of files) {
				if (file.id === id) {
					return file
				}
				if (file.children && file.children.length > 0) {
					const found = findFile(file.children)
					if (found) return found
				}
			}
			return null
		}
		return findFile(this.files)
	}
	
	/**
	 * 创建新文件夹
	 */
	createFolder(name, parentId = null) {
		const folder = {
			id: this.generateId(),
			name: name,
			type: 'folder',
			parentId: parentId,
			createTime: new Date().toISOString(),
			modifyTime: new Date().toISOString(),
			size: 0,
			children: []
		}
		
		if (parentId) {
			const parent = this.getFileById(parentId)
			if (parent && parent.type === 'folder') {
				parent.children.push(folder)
			}
		} else {
			this.files.push(folder)
		}
		
		this.saveFiles()
		return folder
	}
	
	/**
	 * 创建新图纸文件
	 */
	createDrawing(name, parentId = null, data = null) {
		const drawing = {
			id: this.generateId(),
			name: name,
			type: 'drawing',
			parentId: parentId,
			createTime: new Date().toISOString(),
			modifyTime: new Date().toISOString(),
			size: data ? JSON.stringify(data).length : 0,
			data: data,
			thumbnail: null
		}
		
		if (parentId) {
			const parent = this.getFileById(parentId)
			if (parent && parent.type === 'folder') {
				parent.children.push(drawing)
			}
		} else {
			this.files.push(drawing)
		}
		
		this.saveFiles()
		return drawing
	}
	
	/**
	 * 创建新照片文件
	 */
	createPhoto(name, parentId = null, imagePath = null, annotations = null) {
		const photo = {
			id: this.generateId(),
			name: name,
			type: 'photo',
			parentId: parentId,
			createTime: new Date().toISOString(),
			modifyTime: new Date().toISOString(),
			size: 0,
			imagePath: imagePath,
			annotations: annotations,
			thumbnail: null
		}
		
		if (parentId) {
			const parent = this.getFileById(parentId)
			if (parent && parent.type === 'folder') {
				parent.children.push(photo)
			}
		} else {
			this.files.push(photo)
		}
		
		this.saveFiles()
		return photo
	}
	
	/**
	 * 保存图纸数据
	 */
	saveDrawingData(fileId, data) {
		const file = this.getFileById(fileId)
		if (file && file.type === 'drawing') {
			file.data = data
			file.modifyTime = new Date().toISOString()
			file.size = JSON.stringify(data).length
			this.saveFiles()
			return true
		}
		return false
	}
	
	/**
	 * 保存照片标注数据
	 */
	savePhotoAnnotations(fileId, annotations) {
		const file = this.getFileById(fileId)
		if (file && file.type === 'photo') {
			file.annotations = annotations
			file.modifyTime = new Date().toISOString()
			this.saveFiles()
			return true
		}
		return false
	}
	
	/**
	 * 重命名文件
	 */
	renameFile(fileId, newName) {
		const file = this.getFileById(fileId)
		if (file) {
			file.name = newName
			file.modifyTime = new Date().toISOString()
			this.saveFiles()
			return true
		}
		return false
	}
	
	/**
	 * 移动文件
	 */
	moveFile(fileId, newParentId) {
		const file = this.getFileById(fileId)
		if (file) {
			// 从原位置移除
			this.removeFileFromParent(file)
			
			// 添加到新位置
			file.parentId = newParentId
			if (newParentId) {
				const newParent = this.getFileById(newParentId)
				if (newParent && newParent.type === 'folder') {
					newParent.children.push(file)
				}
			} else {
				this.files.push(file)
			}
			
			file.modifyTime = new Date().toISOString()
			this.saveFiles()
			return true
		}
		return false
	}
	
	/**
	 * 复制文件
	 */
	copyFile(fileId, newParentId = null) {
		const file = this.getFileById(fileId)
		if (file) {
			const copy = {
				...file,
				id: this.generateId(),
				name: file.name + '_副本',
				parentId: newParentId,
				createTime: new Date().toISOString(),
				modifyTime: new Date().toISOString()
			}
			
			if (file.type === 'folder') {
				copy.children = file.children.map(child => ({
					...child,
					id: this.generateId(),
					parentId: copy.id
				}))
			}
			
			if (newParentId) {
				const parent = this.getFileById(newParentId)
				if (parent && parent.type === 'folder') {
					parent.children.push(copy)
				}
			} else {
				this.files.push(copy)
			}
			
			this.saveFiles()
			return copy
		}
		return null
	}
	
	/**
	 * 删除文件
	 */
	deleteFile(fileId) {
		const file = this.getFileById(fileId)
		if (file) {
			this.removeFileFromParent(file)
			this.saveFiles()
			return true
		}
		return false
	}
	
	/**
	 * 从父级移除文件
	 */
	removeFileFromParent(file) {
		if (file.parentId) {
			const parent = this.getFileById(file.parentId)
			if (parent && parent.children) {
				const index = parent.children.findIndex(child => child.id === file.id)
				if (index !== -1) {
					parent.children.splice(index, 1)
				}
			}
		} else {
			const index = this.files.findIndex(f => f.id === file.id)
			if (index !== -1) {
				this.files.splice(index, 1)
			}
		}
	}
	
	/**
	 * 搜索文件
	 */
	searchFiles(keyword, type = null) {
		const results = []
		
		const search = (files) => {
			for (const file of files) {
				if (file.name.toLowerCase().includes(keyword.toLowerCase())) {
					if (!type || file.type === type) {
						results.push(file)
					}
				}
				if (file.children && file.children.length > 0) {
					search(file.children)
				}
			}
		}
		
		search(this.files)
		return results
	}
	
	/**
	 * 获取文件路径
	 */
	getFilePath(fileId) {
		const path = []
		let file = this.getFileById(fileId)
		
		while (file) {
			path.unshift(file.name)
			if (file.parentId) {
				file = this.getFileById(file.parentId)
			} else {
				break
			}
		}
		
		return path
	}
	
	/**
	 * 获取文件统计信息
	 */
	getFileStats() {
		let folderCount = 0
		let drawingCount = 0
		let photoCount = 0
		let totalSize = 0
		
		const count = (files) => {
			for (const file of files) {
				switch (file.type) {
					case 'folder':
						folderCount++
						if (file.children) {
							count(file.children)
						}
						break
					case 'drawing':
						drawingCount++
						totalSize += file.size || 0
						break
					case 'photo':
						photoCount++
						totalSize += file.size || 0
						break
				}
			}
		}
		
		count(this.files)
		
		return {
			folderCount,
			drawingCount,
			photoCount,
			totalSize,
			totalFiles: folderCount + drawingCount + photoCount
		}
	}
	
	/**
	 * 导出文件数据
	 */
	exportFile(fileId) {
		const file = this.getFileById(fileId)
		if (file) {
			return {
				...file,
				exportTime: new Date().toISOString()
			}
		}
		return null
	}
	
	/**
	 * 导入文件数据
	 */
	importFile(fileData, parentId = null) {
		const file = {
			...fileData,
			id: this.generateId(),
			parentId: parentId,
			importTime: new Date().toISOString()
		}
		
		if (parentId) {
			const parent = this.getFileById(parentId)
			if (parent && parent.type === 'folder') {
				parent.children.push(file)
			}
		} else {
			this.files.push(file)
		}
		
		this.saveFiles()
		return file
	}
	
	/**
	 * 生成唯一ID
	 */
	generateId() {
		return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
	}
	
	/**
	 * 格式化文件大小
	 */
	formatFileSize(bytes) {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}
	
	/**
	 * 格式化时间
	 */
	formatTime(isoString) {
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

// 创建全局实例
export const fileManager = new FileManager()
export default fileManager

