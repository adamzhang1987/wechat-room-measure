/**
 * 性能优化器 - 提供各种性能优化功能
 */
export class PerformanceOptimizer {
	constructor() {
		this.metrics = new Map()
		this.observers = []
		this.isMonitoring = false
	}
	
	/**
	 * 开始性能监控
	 */
	startMonitoring() {
		if (this.isMonitoring) return
		
		this.isMonitoring = true
		console.log('性能监控已启动')
		
		// 监控页面加载性能
		this.monitorPageLoad()
		
		// 监控Canvas渲染性能
		this.monitorCanvasPerformance()
		
		// 监控内存使用
		this.monitorMemoryUsage()
		
		// 监控用户交互性能
		this.monitorUserInteraction()
	}
	
	/**
	 * 停止性能监控
	 */
	stopMonitoring() {
		this.isMonitoring = false
		this.observers.forEach(observer => {
			if (observer.disconnect) {
				observer.disconnect()
			}
		})
		this.observers = []
		console.log('性能监控已停止')
	}
	
	/**
	 * 监控页面加载性能
	 */
	monitorPageLoad() {
		// 记录页面加载时间
		const startTime = performance.now()
		
		// 监听页面加载完成
		if (typeof document !== 'undefined') {
			document.addEventListener('DOMContentLoaded', () => {
				const loadTime = performance.now() - startTime
				this.recordMetric('pageLoad', loadTime)
				console.log(`页面加载时间: ${loadTime.toFixed(2)}ms`)
			})
		}
	}
	
	/**
	 * 监控Canvas渲染性能
	 */
	monitorCanvasPerformance() {
		// 创建Canvas性能监控器
		const originalDraw = CanvasRenderingContext2D.prototype.draw || function() {}
		
		CanvasRenderingContext2D.prototype.draw = function(...args) {
			const startTime = performance.now()
			const result = originalDraw.apply(this, args)
			const drawTime = performance.now() - startTime
			
			this.optimizer?.recordMetric('canvasDraw', drawTime)
			
			return result
		}
	}
	
	/**
	 * 监控内存使用
	 */
	monitorMemoryUsage() {
		if (typeof performance !== 'undefined' && performance.memory) {
			setInterval(() => {
				const memory = performance.memory
				this.recordMetric('memoryUsed', memory.usedJSHeapSize)
				this.recordMetric('memoryTotal', memory.totalJSHeapSize)
				this.recordMetric('memoryLimit', memory.jsHeapSizeLimit)
				
				// 检查内存使用率
				const usageRate = memory.usedJSHeapSize / memory.jsHeapSizeLimit
				if (usageRate > 0.8) {
					console.warn(`内存使用率过高: ${(usageRate * 100).toFixed(1)}%`)
					this.triggerGarbageCollection()
				}
			}, 5000) // 每5秒检查一次
		}
	}
	
	/**
	 * 监控用户交互性能
	 */
	monitorUserInteraction() {
		// 监控触摸事件响应时间
		const touchStartTimes = new Map()
		
		if (typeof document !== 'undefined') {
			document.addEventListener('touchstart', (e) => {
				touchStartTimes.set(e.identifier || 0, performance.now())
			})
			
			document.addEventListener('touchend', (e) => {
				const startTime = touchStartTimes.get(e.identifier || 0)
				if (startTime) {
					const responseTime = performance.now() - startTime
					this.recordMetric('touchResponse', responseTime)
					touchStartTimes.delete(e.identifier || 0)
				}
			})
		}
	}
	
	/**
	 * 记录性能指标
	 */
	recordMetric(name, value) {
		if (!this.metrics.has(name)) {
			this.metrics.set(name, [])
		}
		
		const metrics = this.metrics.get(name)
		metrics.push({
			value: value,
			timestamp: performance.now()
		})
		
		// 保持最近100个记录
		if (metrics.length > 100) {
			metrics.shift()
		}
	}
	
	/**
	 * 获取性能指标
	 */
	getMetrics(name) {
		return this.metrics.get(name) || []
	}
	
	/**
	 * 获取性能统计
	 */
	getStats(name) {
		const metrics = this.getMetrics(name)
		if (metrics.length === 0) {
			return null
		}
		
		const values = metrics.map(m => m.value)
		const sum = values.reduce((a, b) => a + b, 0)
		const avg = sum / values.length
		const min = Math.min(...values)
		const max = Math.max(...values)
		
		return {
			count: values.length,
			average: avg,
			min: min,
			max: max,
			latest: values[values.length - 1]
		}
	}
	
	/**
	 * 优化Canvas渲染
	 */
	optimizeCanvasRendering(canvas, context) {
		// 启用硬件加速
		if (context.imageSmoothingEnabled !== undefined) {
			context.imageSmoothingEnabled = false
		}
		
		// 设置合适的像素比
		const devicePixelRatio = window.devicePixelRatio || 1
		const rect = canvas.getBoundingClientRect()
		
		canvas.width = rect.width * devicePixelRatio
		canvas.height = rect.height * devicePixelRatio
		
		context.scale(devicePixelRatio, devicePixelRatio)
		
		// 添加性能监控
		context.optimizer = this
		
		return {
			width: rect.width,
			height: rect.height,
			pixelRatio: devicePixelRatio
		}
	}
	
	/**
	 * 防抖函数
	 */
	debounce(func, wait) {
		let timeout
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout)
				func(...args)
			}
			clearTimeout(timeout)
			timeout = setTimeout(later, wait)
		}
	}
	
	/**
	 * 节流函数
	 */
	throttle(func, limit) {
		let inThrottle
		return function(...args) {
			if (!inThrottle) {
				func.apply(this, args)
				inThrottle = true
				setTimeout(() => inThrottle = false, limit)
			}
		}
	}
	
	/**
	 * 批量处理
	 */
	batchProcess(items, processor, batchSize = 100) {
		return new Promise((resolve) => {
			let index = 0
			const results = []
			
			const processBatch = () => {
				const endIndex = Math.min(index + batchSize, items.length)
				
				for (let i = index; i < endIndex; i++) {
					results.push(processor(items[i], i))
				}
				
				index = endIndex
				
				if (index < items.length) {
					// 使用requestAnimationFrame确保不阻塞UI
					requestAnimationFrame(processBatch)
				} else {
					resolve(results)
				}
			}
			
			processBatch()
		})
	}
	
	/**
	 * 对象池管理
	 */
	createObjectPool(createFn, resetFn, initialSize = 10) {
		const pool = []
		
		// 预创建对象
		for (let i = 0; i < initialSize; i++) {
			pool.push(createFn())
		}
		
		return {
			get() {
				if (pool.length > 0) {
					return pool.pop()
				} else {
					return createFn()
				}
			},
			
			release(obj) {
				if (resetFn) {
					resetFn(obj)
				}
				pool.push(obj)
			},
			
			size() {
				return pool.length
			}
		}
	}
	
	/**
	 * 内存清理
	 */
	triggerGarbageCollection() {
		// 清理过期的性能指标
		const now = performance.now()
		const maxAge = 60000 // 1分钟
		
		for (const [name, metrics] of this.metrics) {
			const filtered = metrics.filter(m => now - m.timestamp < maxAge)
			this.metrics.set(name, filtered)
		}
		
		// 建议进行垃圾回收（仅在支持的环境中）
		if (typeof gc === 'function') {
			gc()
		}
		
		console.log('内存清理完成')
	}
	
	/**
	 * 优化图片加载
	 */
	optimizeImageLoading(imageSrc, maxWidth = 800, maxHeight = 600) {
		return new Promise((resolve, reject) => {
			const img = new Image()
			
			img.onload = () => {
				// 如果图片尺寸过大，进行压缩
				if (img.width > maxWidth || img.height > maxHeight) {
					const canvas = document.createElement('canvas')
					const ctx = canvas.getContext('2d')
					
					// 计算缩放比例
					const scale = Math.min(maxWidth / img.width, maxHeight / img.height)
					
					canvas.width = img.width * scale
					canvas.height = img.height * scale
					
					// 绘制压缩后的图片
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
					
					// 转换为blob
					canvas.toBlob((blob) => {
						resolve({
							blob: blob,
							width: canvas.width,
							height: canvas.height,
							originalWidth: img.width,
							originalHeight: img.height,
							compressed: true
						})
					}, 'image/jpeg', 0.8)
				} else {
					resolve({
						image: img,
						width: img.width,
						height: img.height,
						compressed: false
					})
				}
			}
			
			img.onerror = reject
			img.src = imageSrc
		})
	}
	
	/**
	 * 优化数据存储
	 */
	optimizeDataStorage(data, compress = true) {
		try {
			let processedData = data
			
			if (compress && typeof data === 'object') {
				// 移除空值和undefined
				processedData = this.removeEmptyValues(data)
				
				// 压缩数字精度
				processedData = this.compressNumbers(processedData)
			}
			
			const jsonString = JSON.stringify(processedData)
			
			// 检查数据大小
			const sizeInBytes = new Blob([jsonString]).size
			const sizeInKB = sizeInBytes / 1024
			
			if (sizeInKB > 100) {
				console.warn(`数据大小较大: ${sizeInKB.toFixed(2)}KB`)
			}
			
			return {
				data: processedData,
				json: jsonString,
				size: sizeInBytes,
				compressed: compress
			}
			
		} catch (error) {
			console.error('数据存储优化失败:', error)
			return {
				data: data,
				json: JSON.stringify(data),
				size: 0,
				compressed: false
			}
		}
	}
	
	/**
	 * 移除空值
	 */
	removeEmptyValues(obj) {
		if (Array.isArray(obj)) {
			return obj.map(item => this.removeEmptyValues(item)).filter(item => item !== null && item !== undefined)
		} else if (typeof obj === 'object' && obj !== null) {
			const cleaned = {}
			for (const [key, value] of Object.entries(obj)) {
				if (value !== null && value !== undefined && value !== '') {
					cleaned[key] = this.removeEmptyValues(value)
				}
			}
			return cleaned
		}
		return obj
	}
	
	/**
	 * 压缩数字精度
	 */
	compressNumbers(obj, precision = 2) {
		if (Array.isArray(obj)) {
			return obj.map(item => this.compressNumbers(item, precision))
		} else if (typeof obj === 'object' && obj !== null) {
			const compressed = {}
			for (const [key, value] of Object.entries(obj)) {
				compressed[key] = this.compressNumbers(value, precision)
			}
			return compressed
		} else if (typeof obj === 'number' && !Number.isInteger(obj)) {
			return Math.round(obj * Math.pow(10, precision)) / Math.pow(10, precision)
		}
		return obj
	}
	
	/**
	 * 生成性能报告
	 */
	generatePerformanceReport() {
		const report = {
			timestamp: new Date().toISOString(),
			monitoring: this.isMonitoring,
			metrics: {}
		}
		
		// 收集所有性能指标
		for (const [name, metrics] of this.metrics) {
			report.metrics[name] = this.getStats(name)
		}
		
		// 添加系统信息
		if (typeof navigator !== 'undefined') {
			report.system = {
				userAgent: navigator.userAgent,
				platform: navigator.platform,
				language: navigator.language,
				hardwareConcurrency: navigator.hardwareConcurrency,
				deviceMemory: navigator.deviceMemory
			}
		}
		
		// 添加性能建议
		report.recommendations = this.generateRecommendations()
		
		return report
	}
	
	/**
	 * 生成性能建议
	 */
	generateRecommendations() {
		const recommendations = []
		
		// 检查页面加载时间
		const pageLoadStats = this.getStats('pageLoad')
		if (pageLoadStats && pageLoadStats.average > 3000) {
			recommendations.push({
				type: 'warning',
				category: 'pageLoad',
				message: '页面加载时间过长，建议优化资源加载',
				value: pageLoadStats.average
			})
		}
		
		// 检查Canvas渲染性能
		const canvasStats = this.getStats('canvasDraw')
		if (canvasStats && canvasStats.average > 16.67) { // 60fps = 16.67ms per frame
			recommendations.push({
				type: 'warning',
				category: 'canvas',
				message: 'Canvas渲染性能不佳，建议优化绘制逻辑',
				value: canvasStats.average
			})
		}
		
		// 检查触摸响应时间
		const touchStats = this.getStats('touchResponse')
		if (touchStats && touchStats.average > 100) {
			recommendations.push({
				type: 'warning',
				category: 'interaction',
				message: '触摸响应时间过长，建议优化事件处理',
				value: touchStats.average
			})
		}
		
		// 检查内存使用
		const memoryStats = this.getStats('memoryUsed')
		if (memoryStats && memoryStats.latest > 50 * 1024 * 1024) { // 50MB
			recommendations.push({
				type: 'info',
				category: 'memory',
				message: '内存使用较高，建议定期清理',
				value: memoryStats.latest
			})
		}
		
		return recommendations
	}
}

// 创建全局性能优化器实例
export const performanceOptimizer = new PerformanceOptimizer()
export default performanceOptimizer

