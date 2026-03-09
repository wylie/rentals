const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

const checks = [
  {
    name: 'Health endpoint',
    path: '/api/health',
    allowedStatuses: [200, 503],
    validate: async (response) => {
      const json = await response.json()
      if (!json || !json.status) {
        throw new Error('Missing health payload')
      }
      if (json.status !== 'ok' && json.status !== 'degraded') {
        throw new Error(`Unexpected health status: ${json.status}`)
      }
    },
  },
  {
    name: 'Home page',
    path: '/',
    validate: async (response) => {
      const html = await response.text()
      if (!html.includes('Rental Management')) {
        throw new Error('Expected app title not found on home page')
      }
    },
  },
  {
    name: 'Front desk page',
    path: '/front-desk/',
    validate: async (response) => {
      const html = await response.text()
      if (!html.includes('Rental Management') && !html.includes('Setup Required')) {
        throw new Error('Expected front desk markers not found')
      }
    },
  },
]

const run = async () => {
  const failures = []

  console.log(`Running smoke checks against ${baseUrl}`)

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`
    try {
      const response = await fetch(url, { redirect: 'follow' })
      const allowedStatuses = check.allowedStatuses || [200]
      if (!allowedStatuses.includes(response.status)) {
        throw new Error(`HTTP ${response.status}`)
      }
      await check.validate(response)
      console.log(`PASS: ${check.name}`)
    } catch (error) {
      failures.push({ check: check.name, message: error instanceof Error ? error.message : String(error) })
      console.error(`FAIL: ${check.name} - ${failures[failures.length - 1].message}`)
    }
  }

  if (failures.length > 0) {
    console.error('\nSmoke test failed:')
    for (const failure of failures) {
      console.error(`- ${failure.check}: ${failure.message}`)
    }
    process.exit(1)
  }

  console.log('\nSmoke test passed.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
