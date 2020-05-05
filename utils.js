const Table = require('cli-table3')
const colors = require('colors')
const Box = require('cli-box')

var imageListTable = new Table({
  head: [
    colors.cyan('Source'),
    colors.cyan('Real Height'),
    colors.cyan('Real Width'),
    colors.cyan('Display Height'),
    colors.cyan('Display Width'),
    colors.cyan('Status')
  ]
})

var summaryTable = new Table({
  head: [
    colors.cyan('Total Image'),
    colors.cyan('Total Oversize Images'),
    colors.cyan('≥ 50%'),
    colors.cyan('≥ 10%'),
    colors.cyan('< 10%'),
    colors.cyan('Total'),
    colors.cyan('Average (Only Oversize)')
  ]
})

module.exports.printTable = async () => {
  console.log(summaryTable.toString())
  console.log(Box('160x3', 'Oversize images List').toString())
  console.log(imageListTable.toString())
}

module.exports.pushTotable = (ImagesRows, SummaryRows) => {
  summaryTable.push(SummaryRows)

  ImagesRows.map(r => {
    delete r.sizeDiff
    return imageListTable.push(Object.values(r))
  })
}

module.exports.percentDiff = (newNumber, orignalNumber) => {
  return (
    100 *
      Math.abs((newNumber - orignalNumber) / ((newNumber + orignalNumber) / 2))
  )
}

module.exports.processImage = (item) => {
  const sizeDiff = this.percentDiff(item.realHeight, item.displayHeight)
  item.src = this.truncateString(item.src, 100)
  item.sizeDiff = parseFloat(sizeDiff.toFixed(2))

  if (sizeDiff === 0) {
    item.sizeDiffText = 'Good size'
  } else if (sizeDiff > 0 && sizeDiff <= 10) {
    item.sizeDiffText = colors.green(`Oversize (${item.sizeDiff}%)`)
  } else if (sizeDiff > 10 && sizeDiff <= 50) {
    item.sizeDiffText = colors.yellow(`Oversize (${item.sizeDiff}%)`)
  } else if (sizeDiff > 50) {
    item.sizeDiffText = colors.red(`Oversize (${item.sizeDiff}%)`)
  }

  return item
}

module.exports.autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0
      var distance = 100
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight

        if (scrollHeight === 0) {
          reject(new Error('Page size 0 pixel'))
        }

        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 300)
    })
  })
}

module.exports.truncateString = (str, num) => {
  if (str.length <= num) {
    return str
  }
  return str.slice(0, num) + '...'
}
