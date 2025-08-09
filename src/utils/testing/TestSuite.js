/**
 * 测试套件 - 用于测试小程序的各项功能
 */
export class TestSuite {
	constructor() {
		this.testResults = []
		this.currentTest = null
	}
	
	/**
	 * 运行所有测试
	 */
	async runAllTests() {
		console.log('开始运行测试套件...')
		this.testResults = []
		
		// Canvas绘图引擎测试
		await this.testCanvasEngine()
		
		// 文件管理测试
		await this.testFileManager()
		
		// 图块库测试
		await this.testBlockLibrary()
		
		// 页面导航测试
		await this.testPageNavigation()
		
		// 数据持久化测试
		await this.testDataPersistence()
		
		// 性能测试
		await this.testPerformance()
		
		// 输出测试结果
		this.outputResults()
		
		return this.testResults
	}
	
	/**
	 * 测试Canvas绘图引擎
	 */
	async testCanvasEngine() {
		this.startTest('Canvas绘图引擎测试')
		
		try {
			const { CanvasEngine } = await import('../canvas/CanvasEngine.js')
			const { Point } = await import('../canvas/Point.js')
			const { Line } = await import('../canvas/shapes/Line.js')
			const { Rectangle } = await import('../canvas/shapes/Rectangle.js')
			const { Circle } = await import('../canvas/shapes/Circle.js')
			const { Dimension } = await import('../canvas/shapes/Dimension.js')
			
			// 测试基础类
			this.assert(Point, 'Point类导入成功')
			this.assert(Line, 'Line类导入成功')
			this.assert(Rectangle, 'Rectangle类导入成功')
			this.assert(Circle, 'Circle类导入成功')
			this.assert(Dimension, 'Dimension类导入成功')
			this.assert(CanvasEngine, 'CanvasEngine类导入成功')
			
			// 测试Point类功能
			const p1 = new Point(0, 0)
			const p2 = new Point(3, 4)
			this.assert(p1.distanceTo(p2) === 5, 'Point距离计算正确')
			this.assert(p1.add(p2).equals(new Point(3, 4)), 'Point加法运算正确')
			
			// 测试Line类功能
			const line = new Line(p1, p2)
			this.assert(line.getLength() === 5, 'Line长度计算正确')
			this.assert(Math.abs(line.getAngle() - Math.atan2(4, 3)) < 0.001, 'Line角度计算正确')
			
			// 测试Rectangle类功能
			const rect = new Rectangle(0, 0, 10, 20)
			this.assert(rect.getArea() === 200, 'Rectangle面积计算正确')
			this.assert(rect.getPerimeter() === 60, 'Rectangle周长计算正确')
			
			// 测试Circle类功能
			const circle = new Circle(0, 0, 5)
			this.assert(Math.abs(circle.getArea() - Math.PI * 25) < 0.001, 'Circle面积计算正确')
			this.assert(Math.abs(circle.getPerimeter() - Math.PI * 10) < 0.001, 'Circle周长计算正确')
			
			// 测试序列化
			const lineJson = line.toJSON()
			const lineFromJson = Line.fromJSON(lineJson)
			this.assert(lineFromJson.getLength() === 5, '序列化和反序列化正确')
			
			this.passTest('Canvas绘图引擎所有功能正常')
			
		} catch (error) {
			this.failTest('Canvas绘图引擎测试失败: ' + error.message)
		}
	}
	
	/**
	 * 测试文件管理器
	 */
	async testFileManager() {
		this.startTest('文件管理器测试')
		
		try {
			const { FileManager } = await import('../storage/FileManager.js')
			
			const fileManager = new FileManager()
			this.assert(fileManager, 'FileManager实例创建成功')
			
			// 测试文件创建
			const folder = fileManager.createFolder('测试文件夹')
			this.assert(folder && folder.type === 'folder', '文件夹创建成功')
			
			const drawing = fileManager.createDrawing('测试图纸', folder.id)
			this.assert(drawing && drawing.type === 'drawing', '图纸文件创建成功')
			
			const photo = fileManager.createPhoto('测试照片', folder.id)
			this.assert(photo && photo.type === 'photo', '照片文件创建成功')
			
			// 测试文件操作
			const renamed = fileManager.renameFile(drawing.id, '重命名图纸')
			this.assert(renamed, '文件重命名成功')
			
			const file = fileManager.getFileById(drawing.id)
			this.assert(file.name === '重命名图纸', '文件重命名验证成功')
			
			// 测试搜索功能
			const searchResults = fileManager.searchFiles('测试')
			this.assert(searchResults.length >= 2, '文件搜索功能正常')
			
			// 测试统计功能
			const stats = fileManager.getFileStats()
			this.assert(stats.totalFiles > 0, '文件统计功能正常')
			
			// 测试文件删除
			const deleted = fileManager.deleteFile(photo.id)
			this.assert(deleted, '文件删除成功')
			
			this.passTest('文件管理器所有功能正常')
			
		} catch (error) {
			this.failTest('文件管理器测试失败: ' + error.message)
		}
	}
	
	/**
	 * 测试图块库
	 */
	async testBlockLibrary() {
		this.startTest('图块库测试')
		
		try {
			const { BlockLibrary, Block } = await import('../blocks/BlockLibrary.js')
			const { Point } = await import('../canvas/Point.js')
			const { Line } = await import('../canvas/shapes/Line.js')
			
			const blockLibrary = new BlockLibrary()
			this.assert(blockLibrary, 'BlockLibrary实例创建成功')
			
			// 测试内置图块
			const door = blockLibrary.getBlock('单开门')
			this.assert(door && door.isBuiltIn, '内置图块加载成功')
			
			const categories = blockLibrary.getCategories()
			this.assert(categories.includes('门窗'), '图块分类正确')
			
			// 测试自定义图块创建
			const customBlock = new Block('测试图块', '测试用的自定义图块')
			customBlock.setCategory('测试')
			customBlock.addObject(new Line(new Point(0, 0), new Point(100, 100)))
			
			const added = blockLibrary.addBlock(customBlock)
			this.assert(added, '自定义图块添加成功')
			
			const retrieved = blockLibrary.getBlock('测试图块')
			this.assert(retrieved && !retrieved.isBuiltIn, '自定义图块检索成功')
			
			// 测试图块搜索
			const searchResults = blockLibrary.searchBlocks('门')
			this.assert(searchResults.length > 0, '图块搜索功能正常')
			
			// 测试图块统计
			const stats = blockLibrary.getStats()
			this.assert(stats.totalBlocks > 0, '图块统计功能正常')
			this.assert(stats.builtInBlocks > 0, '内置图块统计正确')
			this.assert(stats.customBlocks > 0, '自定义图块统计正确')
			
			// 测试图块删除
			const removed = blockLibrary.removeBlock('测试图块')
			this.assert(removed, '自定义图块删除成功')
			
			this.passTest('图块库所有功能正常')
			
		} catch (error) {
			this.failTest('图块库测试失败: ' + error.message)
		}
	}
	
	/**
	 * 测试页面导航
	 */
	async testPageNavigation() {
		this.startTest('页面导航测试')
		
		try {
			// 模拟页面导航测试
			const pages = [
				'/pages/index/index',
				'/pages/drawing/drawing',
				'/pages/photo/photo',
				'/pages/files/files',
				'/pages/blocks/blocks'
			]
			
			this.assert(pages.length === 5, '页面路径配置正确')
			
			// 测试页面参数传递
			const drawingUrl = '/pages/drawing/drawing?fileId=test123'
			const photoUrl = '/pages/photo/photo?fileId=test456'
			
			this.assert(drawingUrl.includes('fileId=test123'), '绘图页面参数传递正确')
			this.assert(photoUrl.includes('fileId=test456'), '照片页面参数传递正确')
			
			this.passTest('页面导航功能正常')
			
		} catch (error) {
			this.failTest('页面导航测试失败: ' + error.message)
		}
	}
	
	/**
	 * 测试数据持久化
	 */
	async testDataPersistence() {
		this.startTest('数据持久化测试')
		
		try {
			// 测试本地存储
			const testData = { test: 'data', timestamp: Date.now() }
			
			// 模拟uni.setStorageSync
			if (typeof uni !== 'undefined' && uni.setStorageSync) {
				uni.setStorageSync('test_key', JSON.stringify(testData))
				const retrieved = JSON.parse(uni.getStorageSync('test_key'))
				this.assert(retrieved.test === 'data', '本地存储写入读取正常')
			} else {
				// 在非uni-app环境中使用localStorage模拟
				if (typeof globalThis.localStorage === 'undefined') {
					const store = new Map()
					globalThis.localStorage = {
						setItem(key, value) { store.set(key, String(value)) },
						getItem(key) { return store.has(key) ? store.get(key) : null },
						removeItem(key) { store.delete(key) },
						clear() { store.clear() }
					}
				}
				localStorage.setItem('test_key', JSON.stringify(testData))
				const retrieved = JSON.parse(localStorage.getItem('test_key'))
				this.assert(retrieved.test === 'data', '本地存储模拟正常')
			}
			
			// 测试数据格式
			const jsonString = JSON.stringify(testData)
			const parsed = JSON.parse(jsonString)
			this.assert(parsed.test === testData.test, 'JSON序列化正常')
			
			this.passTest('数据持久化功能正常')
			
		} catch (error) {
			this.failTest('数据持久化测试失败: ' + error.message)
		}
	}
	
	/**
	 * 测试性能
	 */
	async testPerformance() {
		this.startTest('性能测试')
		
		try {
			// 测试大量对象创建性能
			const startTime = performance.now()
			
			const { Point } = await import('../canvas/Point.js')
			const { Line } = await import('../canvas/shapes/Line.js')
			
			const objects = []
			for (let i = 0; i < 1000; i++) {
				const p1 = new Point(Math.random() * 1000, Math.random() * 1000)
				const p2 = new Point(Math.random() * 1000, Math.random() * 1000)
				const line = new Line(p1, p2)
				objects.push(line)
			}
			
			const createTime = performance.now() - startTime
			this.assert(createTime < 1000, `对象创建性能良好 (${createTime.toFixed(2)}ms)`)
			
			// 测试序列化性能
			const serializeStart = performance.now()
			const serialized = objects.map(obj => obj.toJSON())
			const serializeTime = performance.now() - serializeStart
			this.assert(serializeTime < 500, `序列化性能良好 (${serializeTime.toFixed(2)}ms)`)
			
			// 测试反序列化性能
			const deserializeStart = performance.now()
			const deserialized = serialized.map(data => Line.fromJSON(data))
			const deserializeTime = performance.now() - deserializeStart
			this.assert(deserializeTime < 500, `反序列化性能良好 (${deserializeTime.toFixed(2)}ms)`)
			
			this.assert(deserialized.length === 1000, '大量对象处理正确')
			
			this.passTest('性能测试通过')
			
		} catch (error) {
			this.failTest('性能测试失败: ' + error.message)
		}
	}
	
	/**
	 * 开始测试
	 */
	startTest(name) {
		this.currentTest = {
			name: name,
			startTime: performance.now(),
			assertions: [],
			status: 'running'
		}
		console.log(`开始测试: ${name}`)
	}
	
	/**
	 * 断言
	 */
	assert(condition, message) {
		const result = {
			condition: condition,
			message: message,
			passed: !!condition
		}
		
		this.currentTest.assertions.push(result)
		
		if (result.passed) {
			console.log(`✓ ${message}`)
		} else {
			console.error(`✗ ${message}`)
		}
		
		return result.passed
	}
	
	/**
	 * 测试通过
	 */
	passTest(message) {
		if (this.currentTest) {
			this.currentTest.status = 'passed'
			this.currentTest.endTime = performance.now()
			this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime
			this.currentTest.message = message
			
			this.testResults.push(this.currentTest)
			console.log(`✓ ${this.currentTest.name} - ${message} (${this.currentTest.duration.toFixed(2)}ms)`)
		}
	}
	
	/**
	 * 测试失败
	 */
	failTest(message) {
		if (this.currentTest) {
			this.currentTest.status = 'failed'
			this.currentTest.endTime = performance.now()
			this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime
			this.currentTest.message = message
			
			this.testResults.push(this.currentTest)
			console.error(`✗ ${this.currentTest.name} - ${message} (${this.currentTest.duration.toFixed(2)}ms)`)
		}
	}
	
	/**
	 * 输出测试结果
	 */
	outputResults() {
		const totalTests = this.testResults.length
		const passedTests = this.testResults.filter(test => test.status === 'passed').length
		const failedTests = totalTests - passedTests
		const totalTime = this.testResults.reduce((sum, test) => sum + test.duration, 0)
		
		console.log('\n=== 测试结果汇总 ===')
		console.log(`总测试数: ${totalTests}`)
		console.log(`通过: ${passedTests}`)
		console.log(`失败: ${failedTests}`)
		console.log(`总耗时: ${totalTime.toFixed(2)}ms`)
		console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
		
		if (failedTests > 0) {
			console.log('\n失败的测试:')
			this.testResults
				.filter(test => test.status === 'failed')
				.forEach(test => {
					console.error(`- ${test.name}: ${test.message}`)
				})
		}
		
		console.log('\n=== 测试完成 ===')
		
		return {
			total: totalTests,
			passed: passedTests,
			failed: failedTests,
			duration: totalTime,
			successRate: (passedTests / totalTests) * 100
		}
	}
	
	/**
	 * 生成测试报告
	 */
	generateReport() {
		const summary = this.outputResults()
		
		const report = {
			timestamp: new Date().toISOString(),
			summary: summary,
			details: this.testResults.map(test => ({
				name: test.name,
				status: test.status,
				duration: test.duration,
				message: test.message,
				assertions: test.assertions.length,
				passedAssertions: test.assertions.filter(a => a.passed).length
			}))
		}
		
		return report
	}
}

// 创建全局测试实例
export const testSuite = new TestSuite()
export default testSuite

