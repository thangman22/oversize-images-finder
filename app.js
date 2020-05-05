#!/usr/bin/env node

const puppeteer = require('puppeteer')
const validUrl = require('valid-url')
const ora = require('ora')
const scrolling = ora('Wait for page scrolling....\n')
const consola = require('consola')
const Box = require('cli-box')
const { autoScroll, processImage, percentDiff, pushTotable, printTable } = require('./utils')
const argv = require('yargs').argv
const url = argv.url;
const headless = argv.headless || true;

(async () => {
  if (!url) {
    consola.error('Please define URL')
    process.exit(-1)
  }

  if (!validUrl.isUri(url)) {
    consola.error('URL is invalid')
    process.exit(-1)
  }

  const browser = await puppeteer.launch({ headless: headless })
  const page = await browser.newPage()

  const openingSpinner = ora(`Opening ${url}\n`)
  openingSpinner.start()

  try {
    await page.goto(url)
  } catch (e) {
    console.log(e.message)
  }

  await page.setViewport({
    width: 1200,
    height: 800
  })
  openingSpinner.stop()
  scrolling.start()

  await autoScroll(page)

  scrolling.stop()

  let imageProperties = await page.$$eval('img', imgs =>
    imgs.map(m => {
      return {
        src: m.src,
        realHeight: m.naturalHeight,
        realWidth: m.naturalWidth,
        displayHeight: m.offsetHeight,
        displayWidth: m.offsetWidth
      }
    })
  )

  const allImages = imageProperties

  imageProperties = imageProperties
    .map(i => processImage(i))
    .filter(i => i.realHeight !== 0)
    .filter(i => i.displayHeight !== 0)
    .filter(i => i.sizeDiff !== 0)
    .sort(function (a, b) {
      var keyA = a.sizeDiff
      var keyB = b.sizeDiff
      // Compare the 2 dates
      if (keyA < keyB) return 1
      if (keyA > keyB) return -1
      return 0
    })

  const summaryRealWidth = imageProperties.reduce((a, c) => (a = a + c.realWidth), 0)
  const summaryDisplayWidth = imageProperties.reduce(
    (a, c) => (a = a + c.displayWidth),
    0
  )

  const summarySizeDiff = imageProperties.reduce(
    (a, c) => (a = a + c.sizeDiff),
    0
  )

  const summaryDetail = [
    allImages.length,
    imageProperties.length,
    imageProperties.filter(i => i.sizeDiff > 50).length,
    imageProperties.filter(i => (i.sizeDiff > 10 && i.sizeDiff <= 50)).length,
    imageProperties.filter(i => i.sizeDiff <= 10).length,
    `${percentDiff(summaryRealWidth, summaryDisplayWidth).toFixed(2)}%`,
    `${(summarySizeDiff / imageProperties.length).toFixed(2)}%`
  ]

  console.log(Box('160x3', `Summary oversize images for ${url}`).toString())
  pushTotable(imageProperties, summaryDetail)
  printTable()

  await browser.close()
})()
