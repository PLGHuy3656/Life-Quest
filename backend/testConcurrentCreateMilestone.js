
const goalId = 'de1355ab-98fb-465a-b722-3f054d935c23'
const userId = 'a92c1641-aeb6-456b-823b-e87cbedcb420'

const createMilestoneRequest = async (number) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/goals/${goalId}/milestones?userId=${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Concurrent Milestone ${number}`,
        description: `Testing concurrent request ${number}`
      })
    }
  )

  const data = await response.json()

  return {
    status: response.status,
    data
  }
}

const testConcurrentCreateMilestone = async () => {
  try {
    console.log('Sending two requests simultaneously...')

    const results = await Promise.all([
      createMilestoneRequest(1),
      createMilestoneRequest(2)
    ])

    console.log('\nRequest results:')

    results.forEach((result, index) => {
      console.log(`Request ${index + 1}:`, result)
    })

    const allCreated = results.every(
      result => result.status === 200
    )

    if (!allCreated) {
      throw new Error('At least one request failed')
    }

    const positions = results.map(
      result => result.data.data.position
    )

    const sortedPositions = [...positions].sort(
      (a, b) => a - b
    )

    const noDuplicate = new Set(positions).size === 2

    const consecutive =
      sortedPositions[1] === sortedPositions[0] + 1

    if (noDuplicate && consecutive) {
      console.log('\nPASS: Concurrent requests created consecutive positions')
    } else {
      throw new Error('Duplicate or non-consecutive positions detected')
    }
  } catch (error) {
    console.error('\nFAIL:', error.message)
  }
}

testConcurrentCreateMilestone()
