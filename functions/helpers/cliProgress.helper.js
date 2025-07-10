import cliProgress from 'cli-progress';

export function createProgressBar(table, totalLines) {
  const bar = new cliProgress.SingleBar({
    format: `➡️ {table} [{bar}] {percentage}% | {value}/{total} rows`,
    barCompleteChar: '█',
    barIncompleteChar: '.',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  bar.start(totalLines, 0, { table });
  return bar;
}
