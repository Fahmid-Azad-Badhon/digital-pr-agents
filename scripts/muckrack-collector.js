import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const WORKFLOW_ROOT = 'D:\\Codex Folder\\digital-pr-agents'
const MUCKRACK_EMAIL = process.env.MUCKRACK_EMAIL || ''
const MUCKRACK_PASSWORD = process.env.MUCKRACK_PASSWORD || ''

interface Journalist {
  name: string
  outlet: string
  beat: string
  email: string
  muckrackUrl: string
  bio: string
  twitter: string
  linkedin: string
}

async function loginToMuckRack(browser, page) {
  console.log('Navigating to Muck Rack...')
  await page.goto('https://muckrack.com', { waitUntil: 'networkidle' })
  
  // Check if already logged in
  const userAvatar = await page.$('[data-testid="user-avatar"]')
  if (userAvatar) {
    console.log('Already logged in to Muck Rack')
    return true
  }
  
  // Click login button
  const loginBtn = await page.$('a[href*="login"], a[href*="signin"]')
  if (loginBtn) {
    await loginBtn.click()
    await page.waitForLoadState('networkidle')
  }
  
  // Enter credentials
  if (MUCKRACK_EMAIL && MUCKRACK_PASSWORD) {
    console.log('Entering credentials...')
    await page.fill('input[name="email"], input[type="email"]', MUCKRACK_EMAIL)
    await page.fill('input[name="password"], input[type="password"]', MUCKRACK_PASSWORD)
    await page.click('button[type="submit"], button:has-text("Sign In")')
    await page.waitForLoadState('networkidle')
    console.log('Login successful')
    return true
  } else {
    console.log('MUCKRACK_EMAIL and MUCKRACK_PASSWORD environment variables not set')
    return false
  }
}

async function searchJournalists(page, beat, targetCount = 800) {
  console.log(`Searching for ${targetCount} journalists for beat: ${beat}`)
  
  const journalists: Journalist[] = []
  const seenUrls = new Set()
  
  // Build search queries for the beat
  const queries = [
    `${beat} journalist`,
    `${beat} reporter`,
    `${beat} editor`,
    `${beat} news writer`,
    `breaking ${beat} news`
  ]
  
  for (const query of queries) {
    if (journalists.length >= targetCount) break
    
    console.log(`Searching: "${query}"`)
    
    // Go to search page
    await page.goto(`https://muckrack.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle' })
    
    // Wait for results
    await page.waitForSelector('.search-results, .user-list, [data-testid="search-results"]', { timeout: 10000 }).catch(() => {})
    
    // Extract journalist cards
    const cards = await page.$$('.user-card, .search-result, [data-testid="user-item"], .profile-card')
    
    for (const card of cards) {
      if (journalists.length >= targetCount) break
      
      try {
        const url = await card.$eval('a[href*="/"]', el => el.href).catch(() => '')
        
        if (!url || seenUrls.has(url)) continue
        seenUrls.add(url)
        
        const name = await card.$eval('.name, .user-name, h3, h4', el => el.innerText.trim()).catch(() => '')
        const outlet = await card.$eval('.outlet, .organization, .company', el => el.innerText.trim()).catch(() => '')
        const bio = await card.$eval('.bio, .description, .bio-text', el => el.innerText.trim()).catch(() => '')
        
        // Click to get more details
        await card.click()
        await page.waitForLoadState('networkidle')
        
        // Get contact info
        const email = await page.$eval('[data-testid="email"], .email, a[href^="mailto:"]', el => el.innerText).catch(() => 'data unavailable')
        const twitter = await page.$eval('a[href*="twitter.com"], a[href*="x.com"]', el => el.href).catch(() => '')
        const linkedin = await page.$eval('a[href*="linkedin.com"]', el => el.href).catch(() => '')
        
        journalists.push({
          name,
          outlet: outlet || 'Unknown',
          beat,
          email: typeof email === 'string' ? email : 'data unavailable',
          muckrackUrl: url,
          bio,
          twitter,
          linkedin
        })
        
        // Go back to search results
        await page.goBack()
        await page.waitForLoadState('networkidle')
        
        console.log(`Collected: ${name} (${journalists.length}/${targetCount})`)
        
      } catch (err) {
        console.log(`Error extracting card: ${err.message}`)
      }
    }
  }
  
  return journalists
}

async function saveJournalists(jobSlug, beat, journalists) {
  const jobDir = path.join(WORKFLOW_ROOT, 'pitch-jobs', jobSlug)
  const journalistDir = path.join(jobDir, 'source-files', 'journalist-intel', 'selected-angle')
  
  if (!fs.existsSync(journalistDir)) {
    fs.mkdirSync(journalistDir, { recursive: true })
  }
  
  // Save as JSON
  const jsonPath = path.join(journalistDir, `muckrack-${beat.toLowerCase().replace(/\s+/g, '-')}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(journalists, null, 2), 'utf-8')
  
  // Save as CSV
  const csvPath = path.join(journalistDir, `muckrack-${beat.toLowerCase().replace(/\s+/g, '-')}.csv`)
  const headers = ['Name', 'Outlet', 'Beat', 'Email', 'MuckRack URL', 'Bio', 'Twitter', 'LinkedIn']
  const rows = journalists.map(j => [
    j.name, j.outlet, j.beat, j.email, j.muckrackUrl, j.bio, j.twitter, j.linkedin
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  fs.writeFileSync(csvPath, [headers.join(','), ...rows].join('\n'), 'utf-8')
  
  console.log(`Saved ${journalists.length} journalists to ${journalistDir}`)
  
  return { jsonPath, csvPath }
}

async function collectMuckRackJournalists(jobSlug, beat, targetCount = 800) {
  console.log(`\n=== Starting Muck Rack Collection for ${jobSlug} - Beat: ${beat} ===\n`)
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  })
  
  try {
    const page = await browser.newPage()
    
    // Login
    const loggedIn = await loginToMuckRack(browser, page)
    if (!loggedIn) {
      console.log('Please login manually to continue...')
      await page.waitForTimeout(30000) // Wait 30 seconds for manual login
    }
    
    // Search and collect
    const journalists = await searchJournalists(page, beat, targetCount)
    
    // Save results
    const { jsonPath, csvPath } = await saveJournalists(jobSlug, beat, journalists)
    
    console.log(`\n=== Collection Complete: ${journalists.length} journalists collected ===\n`)
    console.log(`Files saved:`)
    console.log(`  - ${jsonPath}`)
    console.log(`  - ${csvPath}`)
    
    return journalists
    
  } catch (error) {
    console.error('Error during Muck Rack collection:', error)
    throw error
  } finally {
    await browser.close()
  }
}

// CLI interface
const args = process.argv.slice(2)
if (args.length >= 2) {
  const jobSlug = args[0]
  const beat = args[1]
  const targetCount = parseInt(args[2]) || 800
  
  collectMuckRackJournalists(jobSlug, beat, targetCount)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
} else {
  console.log('Usage: node muckrack-collector.js <job-slug> <beat> [target-count]')
  console.log('Example: node muckrack-collector.js my-campaign "Data Journalism" 800')
  console.log('\nEnvironment variables:')
  console.log('  MUCKRACK_EMAIL - Your Muck Rack email')
  console.log('  MUCKRACK_PASSWORD - Your Muck Rack password')
}

export { collectMuckRackJournalists }