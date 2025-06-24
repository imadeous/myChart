<?php
/**
 * ChartDataHelper
 *
 * Helper class to prepare database data for MyChart.js (or Chart.js) chart config JSON.
 *
 * Usage:
 *   $helper = new ChartDataHelper($dbData);
 *   $json = $helper->prepareChartData([
 *     'x' => 'month', // or null for auto
 *     'y' => ['sales', 'profit'], // or null for auto
 *     'type' => 'bar', // chart type
 *     'label' => 'Product', // group by this field for multi-series
 *     'options' => [ ... ] // chart options
 *   ]);
 *
 *   echo $json; // chart-compatible JSON
 */
class ChartDataHelper {
    protected $data;

    /**
     * @param array $data - Array of associative arrays (DB rows)
     */
    public function __construct(array $data) {
        $this->data = $data;
    }

    /**
     * Prepare chart data for MyChart.js
     * @param array $config - ['x'=>..., 'y'=>..., 'type'=>..., 'label'=>..., 'options'=>...]
     * @return string JSON
     */
    public function prepareChartData(array $config = []) {
        if (empty($this->data)) return json_encode([]);
        // Auto-detect x and y if not provided
        $first = $this->data[0];
        $xKey = $config['x'] ?? array_keys($first)[0];
        $yKeys = $config['y'] ?? array_slice(array_keys($first), 1);
        $type = $config['type'] ?? 'bar';
        $labelKey = $config['label'] ?? null;
        $options = $config['options'] ?? [];

        // Group by labelKey if provided (multi-series)
        $labels = [];
        $datasets = [];
        if ($labelKey && isset($first[$labelKey])) {
            $grouped = [];
            foreach ($this->data as $row) {
                $label = $row[$labelKey];
                $x = $row[$xKey];
                foreach ($yKeys as $yKey) {
                    $grouped[$label][$yKey][$x] = $row[$yKey];
                }
                if (!in_array($x, $labels)) $labels[] = $x;
            }
            foreach ($grouped as $seriesLabel => $seriesData) {
                foreach ($yKeys as $yKey) {
                    $datasets[] = [
                        'label' => $seriesLabel . (count($yKeys) > 1 ? (" ($yKey)") : ''),
                        'data' => array_values(array_replace(array_fill_keys($labels, 0), $seriesData[$yKey] ?? [])),
                        'type' => $type
                    ];
                }
            }
        } else {
            // Single series
            foreach ($this->data as $row) {
                $labels[] = $row[$xKey];
            }
            foreach ($yKeys as $yKey) {
                $datasets[] = [
                    'label' => $yKey,
                    'data' => array_column($this->data, $yKey),
                    'type' => $type
                ];
            }
        }
        $chart = [
            'labels' => $labels,
            'datasets' => $datasets,
            'options' => $options
        ];
        return json_encode($chart);
    }
}
