const d3 = window.d3

function drawGrowth(type) {
  document.querySelectorAll("#growth-rate-controls button").forEach((btn) => btn.classList.remove("active"))
  const btnId = "btn-" + type
  const btn = document.getElementById(btnId)
  if (btn) btn.classList.add("active")

  const svgId = "growth-rate-svg"
  d3.select("#growth-rate-graph").selectAll("*").remove()
  const width = 1400,
    height = 600,
    margin = 40
  const svg = d3
    .select("#growth-rate-graph")
    .append("svg")
    .attr("id", svgId)
    .attr("width", width)
    .attr("height", height)
  const nMax = type === "factorial" || type === "exp" ? 12 : 100
  const x = d3
    .scaleLinear()
    .domain([1, nMax])
    .range([margin, width - margin])
  let yMax = 1
  const data = []
  for (let n = 1; n <= nMax; n++) {
    let val = 1
    if (type === "constant") val = 0.5
    else if (type === "log") val = Math.log(n)
    else if (type === "nested_log") val = n <= 1 ? 0 : Math.log(Math.log(n))
    else if (type === "linear") val = n
    else if (type === "linearithmic") val = n * Math.log(n)
    else if (type === "poly") val = n * n
    else if (type === "exp") val = Math.pow(2, n)
    else if (type === "factorial") val = factorial(n)
    else if (type === "sin") val = Math.sin(n)
    else if (type === "cos") val = Math.cos(n)
    data.push({ n, val })
    if (Math.abs(val) > yMax) yMax = Math.abs(val)
  }
  const y = d3
    .scaleLinear()
    .domain([type === "sin" || type === "cos" ? -0.9 : yMax * -0.1, type === "sin" || type === "cos" ? 1 : yMax * 1.1])
    .range([height - margin, margin])
  const line = d3
    .line()
    .x((d) => x(d.n))
    .y((d) => y(d.val))
  svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#0074D9").attr("stroke-width", 3).attr("d", line)
  function factorial(n) {
    let f = 1
    for (let i = 2; i <= n; i++) f *= i
    return f
  }
}
drawGrowth("constant")

let stack1 = []
let stack2 = []
let isAnimating = false
let history = []
let queueCounter = 0

function saveState() {
  history.push({
    stack1: [...stack1],
    stack2: [...stack2]
  })
}

function updateStackDisplay() {
  const stack1El = document.getElementById("stack1")
  stack1El.innerHTML = ""

  if (stack1.length === 0) {
    stack1El.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    stack1.forEach((value) => {
      const item = document.createElement("div")
      item.className = "twostack-stack-item"
      item.textContent = value
      stack1El.appendChild(item)
    })
  }

  const stack2El = document.getElementById("stack2")
  stack2El.innerHTML = ""

  if (stack2.length === 0) {
    stack2El.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    stack2.forEach((value) => {
      const item = document.createElement("div")
      item.className = "twostack-stack-item"
      item.textContent = value
      stack2El.appendChild(item)
    })
  }

  updateQueueDisplay()
}

function updateQueueDisplay() {
  const queueEl = document.getElementById("queue")
  queueEl.innerHTML = ""

  const logicalQueue = [...stack2].reverse().concat(stack1)

  if (logicalQueue.length === 0) {
    queueEl.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    logicalQueue.forEach((value, index) => {
      const item = document.createElement("div")
      item.className = "twostack-queue-item"
      item.textContent = value

      if (index === 0) {
        item.classList.add("front")
      }
      if (index === logicalQueue.length - 1) {
        item.classList.add("rear")
      }

      queueEl.appendChild(item)
    })
  }
}

function highlightCode(codeId, lineNumbers) {
  const code = document.getElementById(codeId)
  if (!code) return

  const lines = code.querySelectorAll('span[data-line]')
  lines.forEach(line => line.classList.remove('highlight'))

  lineNumbers.forEach(num => {
    const line = code.querySelector(`span[data-line="${num}"]`)
    if (line) line.classList.add('highlight')
  })
}

function clearHighlight() {
  document.querySelectorAll('.twostack-algorithm-section code span').forEach(line => {
    line.classList.remove('highlight')
  })
}

async function enqueueValue() {
  if (isAnimating) return

  queueCounter++
  const value = queueCounter

  saveState()
  isAnimating = true

  highlightCode('enqueue-code', [1])

  await new Promise(resolve => setTimeout(resolve, 300))

  stack1.push(value)

  updateStackDisplay()

  await new Promise(resolve => setTimeout(resolve, 500))
  clearHighlight()

  isAnimating = false
}

async function animateItemTransfer(value, fromStack, toStack) {
  const fromEl = document.getElementById(fromStack)
  const toEl = document.getElementById(toStack)

  const fromRect = fromEl.getBoundingClientRect()
  const toRect = toEl.getBoundingClientRect()

  const movingItem = document.createElement('div')
  movingItem.className = 'moving-item'
  movingItem.textContent = value
  movingItem.style.left = fromRect.left + fromRect.width / 2 - 40 + 'px'
  movingItem.style.top = fromRect.top + 20 + 'px'
  movingItem.style.width = '80px'

  document.body.appendChild(movingItem)

  await new Promise(resolve => setTimeout(resolve, 50))

  movingItem.style.transition = 'all 0.6s ease-in-out'
  movingItem.style.left = toRect.left + toRect.width / 2 - 40 + 'px'
  movingItem.style.top = toRect.top + 20 + 'px'

  await new Promise(resolve => setTimeout(resolve, 650))

  document.body.removeChild(movingItem)
}

async function dequeueValue() {
  if (isAnimating) return

  if (stack1.length === 0 && stack2.length === 0) {
    return
  }

  saveState()
  isAnimating = true

  if (stack2.length === 0) {
    highlightCode('dequeue-code', [1])
    await new Promise(resolve => setTimeout(resolve, 500))

    highlightCode('dequeue-code', [2, 3])

    while (stack1.length > 0) {
      const value = stack1[stack1.length - 1]
      await animateItemTransfer(value, 'stack1', 'stack2')
      stack2.push(stack1.pop())
      updateStackDisplay()
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  highlightCode('dequeue-code', [4])
  await new Promise(resolve => setTimeout(resolve, 500))

  const dequeuedValue = stack2.pop()
  updateStackDisplay()

  await new Promise(resolve => setTimeout(resolve, 500))
  clearHighlight()

  isAnimating = false
}

function resetQueue() {
  if (isAnimating) return

  stack1 = []
  stack2 = []
  history = []
  queueCounter = 0
  updateStackDisplay()
}

function undoOperation() {
  if (isAnimating) return

  if (history.length === 0) {
    return
  }

  const previousState = history.pop()
  stack1 = previousState.stack1
  stack2 = previousState.stack2
  updateStackDisplay()
}



let itemCounter = 0

function addNewItem() {
  itemCounter++
  const pool = document.getElementById("item-pool")

  const item = document.createElement("div")
  item.className = "interactive-item"
  item.draggable = true
  item.id = `item-${itemCounter}`
  item.textContent = itemCounter

  item.addEventListener("dragstart", dragStart)
  item.addEventListener("dragend", dragEnd)

  pool.appendChild(item)
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/html", e.target.id)

  // Create a custom drag image with full opacity
  const dragImage = e.target.cloneNode(true)
  dragImage.style.position = "absolute"
  dragImage.style.top = "-9999px"
  dragImage.style.opacity = "1"
  dragImage.style.background = "#0074d9"
  document.body.appendChild(dragImage)
  e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2)

  // Clean up the clone after a moment
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)

  e.target.classList.add("dragging")
}

function dragEnd(e) {
  e.target.classList.remove('hidden');
  e.target.classList.remove("dragging")
  document.querySelectorAll(".drag-over").forEach(el => {
    el.classList.remove("drag-over")
  })
  document.querySelectorAll(".drag-preview").forEach(el => {
    el.remove()
  })
}

function allowDrop(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = "move"

  const target = e.target.closest(".stack-visual, .item-pool, .trash-can")
  if (target) {
    target.classList.add("drag-over")

    // Only show preview for stacks, not the pool or trash
    if (target.classList.contains("twostack-stack-visual")) {
      // Remove existing previews
      document.querySelectorAll(".interactive-drag-preview").forEach(el => {
        if (el.parentElement === target) {
          el.remove()
        }
      })

      // Add preview at the top (first child in column-reverse is top)
      const existingPreview = target.querySelector(".interactive-drag-preview")
      if (!existingPreview && !target.querySelector(".dragging")) {
        const preview = document.createElement("div")
        preview.className = "interactive-drag-preview"
        preview.textContent = "Drop here"
        target.insertBefore(preview, target.firstChild)
      }
    }
  }
}

function drop(e, targetStack) {
  e.preventDefault()
  e.stopPropagation()

  document.querySelectorAll(".drag-over").forEach(el => {
    el.classList.remove("drag-over")
  })

  // Remove all drag previews
  document.querySelectorAll(".interactive-drag-preview").forEach(el => {
    el.remove()
  })

  const itemId = e.dataTransfer.getData("text/html")
  const draggedItem = document.getElementById(itemId)

  if (!draggedItem) return

  // Handle trash can - delete the item
  if (targetStack === "trash") {
    draggedItem.remove()
    updateInteractiveQueue()
    return
  }

  let targetContainer
  if (targetStack === "s1") {
    targetContainer = document.getElementById("interactive-s1")
  } else if (targetStack === "s2") {
    targetContainer = document.getElementById("interactive-s2")
  } else if (targetStack === "pool") {
    targetContainer = document.getElementById("item-pool")
  }

  if (targetContainer) {
    if (targetStack === "s1" || targetStack === "s2") {
      // Always insert at the top (first child in column-reverse layout)
      targetContainer.insertBefore(draggedItem, targetContainer.firstChild)
    } else {
      targetContainer.appendChild(draggedItem)
    }
    updateInteractiveQueue()
  }
}

function updateInteractiveQueue() {
  const s1 = document.getElementById("interactive-s1")
  const s2 = document.getElementById("interactive-s2")
  const queueDisplay = document.getElementById("interactive-queue")

  if (!queueDisplay) return

  const s1Items = Array.from(s1.children).filter(el => el.classList.contains("interactive-item"))
  const s2Items = Array.from(s2.children).filter(el => el.classList.contains("interactive-item"))

  const queueItems = [...s2Items, ...s1Items.reverse()]

  // Clear queue display
  queueDisplay.innerHTML = ""

  if (queueItems.length === 0) {
    queueDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    queueItems.forEach((item) => {
      const queueItem = document.createElement("div")
      queueItem.className = "twostack-queue-item"
      queueItem.textContent = item.textContent
      queueDisplay.appendChild(queueItem)
    })
  }
}

// Min Stack Visualizer
let minStack = [0, -1, 76, -3, -8, 12]
let isMinAnimating = false

function initializeMinStack() {
  const stackDisplay = document.getElementById('min-stack')
  if (!stackDisplay) return

  stackDisplay.innerHTML = ''

  minStack.forEach((value, index) => {
    const item = document.createElement('div')
    item.className = 'minstack-item'
    item.id = `min-item-${index}`

    const indexLabel = document.createElement('span')
    indexLabel.className = 'minstack-item-index'
    indexLabel.textContent = `[${index + 1}]`

    item.appendChild(indexLabel)
    item.appendChild(document.createTextNode(value))
    stackDisplay.appendChild(item)
  })

  document.getElementById('min-value').textContent = '?'
}

function highlightMinCode(lineNumbers) {
  const code = document.getElementById('min-code')
  if (!code) return

  const lines = code.querySelectorAll('span[data-line]')
  lines.forEach(line => line.classList.remove('highlight'))

  lineNumbers.forEach(num => {
    const line = code.querySelector(`span[data-line="${num}"]`)
    if (line) line.classList.add('highlight')
  })
}

function clearMinHighlight() {
  document.querySelectorAll('#min-code span').forEach(line => {
    line.classList.remove('highlight')
  })

  document.querySelectorAll('.minstack-item').forEach(item => {
    item.classList.remove('current', 'checked', 'min-found')
  })
}

async function runMinAlgorithm() {
  if (isMinAnimating) return

  const minValueEl = document.getElementById('min-value')
  if (!minValueEl) {
    console.error('Min stack elements not found')
    return
  }

  isMinAnimating = true
  const playButton = document.querySelector('.minstack-btn')
  if (playButton) playButton.disabled = true

  clearMinHighlight()

  highlightMinCode([1])
  await sleep(800)

  let min = minStack[0]
  minValueEl.textContent = min
  const firstItem = document.getElementById('min-item-0')
  if (firstItem) firstItem.classList.add('min-found')

  await sleep(1000)

  highlightMinCode([2])
  await sleep(800)

  for (let i = 1; i < minStack.length; i++) {
    highlightMinCode([2])
    await sleep(500)

    const currentItem = document.getElementById(`min-item-${i}`)
    if (currentItem) currentItem.classList.add('current')

    highlightMinCode([3])
    await sleep(800)

    if (minStack[i] < min) {
      highlightMinCode([4])
      await sleep(800)

      document.querySelectorAll('.minstack-item').forEach(item => {
        item.classList.remove('min-found')
      })

      min = minStack[i]
      minValueEl.textContent = min
      if (currentItem) currentItem.classList.add('min-found')

      await sleep(1000)

      highlightMinCode([5])
      await sleep(500)
    } else {
      highlightMinCode([5])
      await sleep(500)
    }

    if (currentItem) {
      currentItem.classList.remove('current')
      currentItem.classList.add('checked')
    }

    highlightMinCode([6])
    await sleep(500)
  }

  highlightMinCode([7])
  await sleep(1500)

  clearMinHighlight()
  minStack.forEach((value, index) => {
    if (value === min) {
      const item = document.getElementById(`min-item-${index}`)
      if (item) item.classList.add('min-found')
    }
  })

  if (playButton) playButton.disabled = false
  isMinAnimating = false
}

function resetMinStack() {
  if (isMinAnimating) return

  clearMinHighlight()
  initializeMinStack()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Initialize min stack when page loads
if (document.getElementById('min-stack')) {
  initializeMinStack()

  resetMinStack()
}

// Global Min Visualizer
let globalMinStack = []
let globalMinValue = Infinity
let globalMinCurrentStep = 0
const globalMinSteps = [
  // Step 0: Initial state
  { action: 'init', description: 'Initial state' },
  // Step 1-3: Push 5
  { action: 'highlight', lines: [1, 2], description: 'push(5): Add to stack' },
  { action: 'push', value: 5, description: 'push(5): Stack updated' },
  { action: 'highlight', lines: [3, 4], description: 'push(5): Update globalMin', updateMin: 5 },
  // Step 4-6: Push 3
  { action: 'highlight', lines: [1, 2], description: 'push(3): Add to stack' },
  { action: 'push', value: 3, description: 'push(3): Stack updated' },
  { action: 'highlight', lines: [3, 4], description: 'push(3): Update globalMin', updateMin: 3 },
  // Step 7-9: Push 1
  { action: 'highlight', lines: [1, 2], description: 'push(1): Add to stack' },
  { action: 'push', value: 1, description: 'push(1): Stack updated' },
  { action: 'highlight', lines: [3, 4], description: 'push(1): Update globalMin', updateMin: 1 },
  // Step 10: Call min() - works correctly
  { action: 'highlight', lines: [6, 7], description: 'min() returns 1 ✓' },
  // Step 11-12: Pop - the problem!
  { action: 'highlight', lines: [9, 10], description: 'pop(): Remove top element', markTop: true },
  { action: 'pop', description: 'pop(): Removed 1, but globalMin still 1!' },
  // Step 13: Call min() - wrong answer!
  { action: 'highlight', lines: [6, 7], description: 'min() returns 1 ❌ (actual min is 3!)', error: true }
]

function initializeGlobalMinStack() {
  const stackDisplay = document.getElementById('global-min-stack')
  if (!stackDisplay) return

  globalMinStack = []
  globalMinValue = Infinity
  globalMinCurrentStep = 0
  stackDisplay.innerHTML = ''
  
  const minValueEl = document.getElementById('global-min-value')
  if (minValueEl) minValueEl.textContent = '∞'
  
  updateGlobalMinButtons()
}

function updateGlobalMinDisplay() {
  const stackDisplay = document.getElementById('global-min-stack')
  if (!stackDisplay) return

  stackDisplay.innerHTML = ''

  if (globalMinStack.length === 0) {
    stackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    globalMinStack.forEach((value, index) => {
      const item = document.createElement('div')
      item.className = 'minstack-item'
      item.id = `global-item-${index}`
      
      const indexLabel = document.createElement('span')
      indexLabel.className = 'minstack-item-index'
      indexLabel.textContent = `[${index + 1}]`
      
      item.appendChild(indexLabel)
      item.appendChild(document.createTextNode(value))
      
      // Highlight current minimum
      if (value === globalMinValue && globalMinValue !== Infinity) {
        item.classList.add('min-found')
      }
      
      stackDisplay.appendChild(item)
    })
  }
}

function highlightGlobalMinCode(lineNumbers) {
  const code = document.getElementById('global-min-code')
  if (!code) return

  const lines = code.querySelectorAll('span[data-line]')
  lines.forEach(line => line.classList.remove('highlight'))

  lineNumbers.forEach(num => {
    const line = code.querySelector(`span[data-line="${num}"]`)
    if (line) line.classList.add('highlight')
  })
}

function clearGlobalMinHighlight() {
  document.querySelectorAll('#global-min-code span').forEach(line => {
    line.classList.remove('highlight')
  })

  document.querySelectorAll('#global-min-stack .minstack-item').forEach(item => {
    item.classList.remove('current', 'checked', 'min-found')
  })
}

function updateGlobalMinButtons() {
  const prevBtn = document.getElementById('global-min-prev')
  const nextBtn = document.getElementById('global-min-next')
  
  if (prevBtn) prevBtn.disabled = globalMinCurrentStep === 0
  if (nextBtn) nextBtn.disabled = globalMinCurrentStep >= globalMinSteps.length - 1
}

function executeGlobalMinStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= globalMinSteps.length) return
  
  const step = globalMinSteps[stepIndex]
  const minValueEl = document.getElementById('global-min-value')
  
  clearGlobalMinHighlight()
  
  if (step.action === 'init') {
    // Reset to initial state
  } else if (step.action === 'highlight') {
    highlightGlobalMinCode(step.lines)
    if (step.updateMin !== undefined) {
      globalMinValue = step.updateMin
      if (minValueEl) minValueEl.textContent = step.updateMin
      updateGlobalMinDisplay()
    }
  } else if (step.action === 'push') {
    globalMinStack.push(step.value)
    updateGlobalMinDisplay()
  } else if (step.action === 'pop') {
    globalMinStack.pop()
    updateGlobalMinDisplay()
  }
  
  if (step.markTop) {
    const topItem = document.getElementById(`global-item-${globalMinStack.length - 1}`)
    if (topItem) {
      topItem.style.background = '#dc3545'
      topItem.style.transform = 'scale(1.1)'
    }
  }
  
  if (step.error) {
    // Mark the error visually - globalMin shows 1 but actual min in stack is 3
    const items = document.querySelectorAll('#global-min-stack .minstack-item')
    items.forEach(item => {
      const text = item.textContent.replace(/\[\d+\]/, '').trim()
      if (text === '3') {
        item.style.border = '3px solid #ffc107'
        item.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.6)'
      }
    })
  }
}

function globalMinNextStep() {
  if (globalMinCurrentStep < globalMinSteps.length - 1) {
    globalMinCurrentStep++
    executeGlobalMinStep(globalMinCurrentStep)
    updateGlobalMinButtons()
  }
}

function globalMinPrevStep() {
  if (globalMinCurrentStep > 0) {
    globalMinCurrentStep--
    
    // Rebuild state from beginning up to current step
    // Manually reset without using initializeGlobalMinStack to preserve step count
    globalMinStack = []
    globalMinValue = Infinity
    
    const stackDisplay = document.getElementById('global-min-stack')
    if (stackDisplay) stackDisplay.innerHTML = ''
    
    const minValueEl = document.getElementById('global-min-value')
    if (minValueEl) minValueEl.textContent = '∞'
    
    clearGlobalMinHighlight()
    
    // Replay steps from 0 to current
    for (let i = 0; i <= globalMinCurrentStep; i++) {
      executeGlobalMinStep(i)
    }
    
    updateGlobalMinButtons()
  }
}

function resetGlobalMin() {
  initializeGlobalMinStack()
  clearGlobalMinHighlight()
}

// Initialize global min visualizer when page loads
if (document.getElementById('global-min-stack')) {
  initializeGlobalMinStack()
}

// Two-Stack Min Visualizer
let dataStack = []
let minStackTwo = []
let twoStackCurrentStep = 0
const twoStackSteps = [
  // Step 0: Initial state
  { action: 'init', description: 'Initial state - both stacks empty' },
  // Step 1-4: Push 5
  { action: 'highlight', lines: [1, 2], description: 'push(5): Add to data stack' },
  { action: 'push-data', value: 5, description: 'push(5): Data stack updated' },
  { action: 'highlight', lines: [3, 4], description: 'push(5): Calculate min(5, ∞) = 5, push to min stack' },
  { action: 'push-min', value: 5, description: 'push(5): Min stack updated' },
  // Step 5-8: Push 3
  { action: 'highlight', lines: [1, 2], description: 'push(3): Add to data stack' },
  { action: 'push-data', value: 3, description: 'push(3): Data stack updated' },
  { action: 'highlight', lines: [3, 4], description: 'push(3): Calculate min(3, 5) = 3, push to min stack' },
  { action: 'push-min', value: 3, description: 'push(3): Min stack updated' },
  // Step 9-12: Push 1
  { action: 'highlight', lines: [1, 2], description: 'push(1): Add to data stack' },
  { action: 'push-data', value: 1, description: 'push(1): Data stack updated' },
  { action: 'highlight', lines: [3, 4], description: 'push(1): Calculate min(1, 3) = 1, push to min stack' },
  { action: 'push-min', value: 1, description: 'push(1): Min stack updated' },
  // Step 13: Call min()
  { action: 'highlight', lines: [10, 11], description: 'min() returns minStack.top() = 1 ✓', showMessage: 'min() = 1 ✓' },
  // Step 14-16: Pop
  { action: 'highlight', lines: [6, 7], description: 'pop(): Remove from data stack', markTopData: true },
  { action: 'pop-data', description: 'pop(): Data stack updated' },
  { action: 'highlight', lines: [8], description: 'pop(): Remove from min stack', markTopMin: true },
  { action: 'pop-min', description: 'pop(): Min stack updated' },
  // Step 18: Call min() again - now it works!
  { action: 'highlight', lines: [10, 11], description: 'min() returns minStack.top() = 3 ✓', showMessage: 'min() = 3 ✓ (Correct!)' }
]

function initializeTwoStack() {
  const dataStackDisplay = document.getElementById('data-stack')
  const minStackDisplay = document.getElementById('min-stack-two')
  if (!dataStackDisplay || !minStackDisplay) return

  dataStack = []
  minStackTwo = []
  twoStackCurrentStep = 0
  
  dataStackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  minStackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  
  const messageEl = document.getElementById('two-stack-message')
  if (messageEl) {
    messageEl.style.display = 'none'
    messageEl.textContent = ''
  }
  
  updateTwoStackButtons()
}

function updateTwoStackDisplay() {
  const dataStackDisplay = document.getElementById('data-stack')
  const minStackDisplay = document.getElementById('min-stack-two')
  if (!dataStackDisplay || !minStackDisplay) return

  // Update data stack
  dataStackDisplay.innerHTML = ''
  if (dataStack.length === 0) {
    dataStackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    dataStack.forEach((value, index) => {
      const item = document.createElement('div')
      item.className = 'minstack-item'
      item.id = `data-item-${index}`
      item.textContent = value
      dataStackDisplay.appendChild(item)
    })
  }

  // Update min stack
  minStackDisplay.innerHTML = ''
  if (minStackTwo.length === 0) {
    minStackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
  } else {
    minStackTwo.forEach((value, index) => {
      const item = document.createElement('div')
      item.className = 'minstack-item'
      item.id = `min-item-two-${index}`
      item.style.background = '#28a745'
      item.textContent = value
      minStackDisplay.appendChild(item)
    })
  }
}

function highlightTwoStackCode(lineNumbers) {
  const code = document.getElementById('two-stack-code')
  if (!code) return

  const lines = code.querySelectorAll('span[data-line]')
  lines.forEach(line => line.classList.remove('highlight'))

  lineNumbers.forEach(num => {
    const line = code.querySelector(`span[data-line="${num}"]`)
    if (line) line.classList.add('highlight')
  })
}

function clearTwoStackHighlight() {
  document.querySelectorAll('#two-stack-code span').forEach(line => {
    line.classList.remove('highlight')
  })

  document.querySelectorAll('#data-stack .minstack-item, #min-stack-two .minstack-item').forEach(item => {
    item.classList.remove('current')
    item.style.background = ''
    item.style.transform = ''
    item.style.border = ''
  })
}

function updateTwoStackButtons() {
  const prevBtn = document.getElementById('two-stack-prev')
  const nextBtn = document.getElementById('two-stack-next')
  
  if (prevBtn) prevBtn.disabled = twoStackCurrentStep === 0
  if (nextBtn) nextBtn.disabled = twoStackCurrentStep >= twoStackSteps.length - 1
}

function executeTwoStackStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= twoStackSteps.length) return
  
  const step = twoStackSteps[stepIndex]
  const messageEl = document.getElementById('two-stack-message')
  
  clearTwoStackHighlight()
  
  if (messageEl) {
    messageEl.style.display = 'none'
    messageEl.textContent = ''
  }
  
  if (step.action === 'init') {
    // Reset to initial state
  } else if (step.action === 'highlight') {
    highlightTwoStackCode(step.lines)
  } else if (step.action === 'push-data') {
    dataStack.push(step.value)
    updateTwoStackDisplay()
  } else if (step.action === 'push-min') {
    minStackTwo.push(step.value)
    updateTwoStackDisplay()
  } else if (step.action === 'pop-data') {
    dataStack.pop()
    updateTwoStackDisplay()
  } else if (step.action === 'pop-min') {
    minStackTwo.pop()
    updateTwoStackDisplay()
  }
  
  if (step.markTopData) {
    const topItem = document.getElementById(`data-item-${dataStack.length - 1}`)
    if (topItem) {
      topItem.style.background = '#dc3545'
      topItem.style.transform = 'scale(1.1)'
    }
  }
  
  if (step.markTopMin) {
    const topItem = document.getElementById(`min-item-two-${minStackTwo.length - 1}`)
    if (topItem) {
      topItem.style.background = '#dc3545'
      topItem.style.transform = 'scale(1.1)'
    }
  }
  
  if (step.showMessage && messageEl) {
    messageEl.style.display = 'block'
    messageEl.textContent = step.showMessage
  }
}

function twoStackNextStep() {
  if (twoStackCurrentStep < twoStackSteps.length - 1) {
    twoStackCurrentStep++
    executeTwoStackStep(twoStackCurrentStep)
    updateTwoStackButtons()
  }
}

function twoStackPrevStep() {
  if (twoStackCurrentStep > 0) {
    twoStackCurrentStep--
    
    // Rebuild state from beginning up to current step
    dataStack = []
    minStackTwo = []
    
    const dataStackDisplay = document.getElementById('data-stack')
    const minStackDisplay = document.getElementById('min-stack-two')
    if (dataStackDisplay) dataStackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
    if (minStackDisplay) minStackDisplay.innerHTML = '<div class="twostack-empty-label">Empty</div>'
    
    clearTwoStackHighlight()
    
    // Replay steps from 0 to current
    for (let i = 0; i <= twoStackCurrentStep; i++) {
      executeTwoStackStep(i)
    }
    
    updateTwoStackButtons()
  }
}

function resetTwoStack() {
  initializeTwoStack()
  clearTwoStackHighlight()
}

// Initialize two-stack visualizer when page loads
if (document.getElementById('data-stack')) {
  initializeTwoStack()
}
