import { runQualityBenchmarkSuite } from './qualityBenchmark.js'

const report = await runQualityBenchmarkSuite()
console.log('=== LifeQuest AI Pipeline — Quality Benchmark Report ===')
console.log(`Generated At:  ${report.generatedAt}`)
console.log(`Overall Score: ${report.overallScorePercent}% (${report.passed ? 'PASS' : 'FAIL'})`)
console.log(`Avg Latency:   ${report.metrics.averageLatencyMs} ms`)
console.log('')
for (const row of report.details) {
  console.log(
    ` - ${row.suite}: ${row.passedCases}/${row.totalCases} (${row.scorePercent}%) · ${row.avgLatencyMs} ms`
  )
}
if (!report.passed) {
  process.exit(1)
}
