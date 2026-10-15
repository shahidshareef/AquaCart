import { useMemo, useState } from "react";

const CHART = {
    left: 76,
    right: 780,
    top: 35,
    bottom: 275,
    width: 704,
    height: 240
};

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;
}

function formatAxisValue(value, metric) {
    if (metric === "orders") return Math.round(value).toLocaleString("en-IN");
    if (value >= 100000) return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    return formatCurrency(value);
}

function getNiceMaximum(value, metric) {
    if (!Number.isFinite(value) || value <= 0) return metric === "orders" ? 5 : 100;
    const target = value * 1.15;
    const magnitude = 10 ** Math.floor(Math.log10(target));
    const normalized = target / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
}

function SalesChart({ salesData = [], selectedMetric }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const chartValues = useMemo(() => {
        const values = salesData.flatMap((item) => selectedMetric === "revenue"
            ? [Number(item.revenue || 0), Number(item.previous || 0)]
            : [Number(item.orders || 0), Number(item.previousOrders || 0)]
        );
        const maxValue = getNiceMaximum(Math.max(0, ...values), selectedMetric);
        const yFor = (value) => CHART.bottom - (Number(value || 0) / maxValue) * CHART.height;
        const xFor = (index) => salesData.length <= 1
            ? (CHART.left + CHART.right) / 2
            : CHART.left + (index / (salesData.length - 1)) * CHART.width;
        const currentKey = selectedMetric === "revenue" ? "revenue" : "orders";
        const previousKey = selectedMetric === "revenue" ? "previous" : "previousOrders";

        return {
            maxValue,
            yFor,
            xFor,
            currentPoints: salesData.map((item, index) => `${xFor(index)},${yFor(item[currentKey])}`).join(" "),
            previousPoints: salesData.map((item, index) => `${xFor(index)},${yFor(item[previousKey])}`).join(" "),
            areaPoints: salesData.length
                ? `${xFor(0)},${CHART.bottom} ${salesData.map((item, index) => `${xFor(index)},${yFor(item[currentKey])}`).join(" ")} ${xFor(salesData.length - 1)},${CHART.bottom}`
                : ""
        };
    }, [salesData, selectedMetric]);

    const gridValues = [1, 0.75, 0.5, 0.25, 0];

    if (!salesData.length) {
        return <div className="sales-chart-container sales-chart-empty">No sales data is available for this period yet.</div>;
    }

    return (
        <div className="sales-chart-container">
            <svg viewBox="0 0 800 320" className="sales-chart-svg" role="img" aria-label={selectedMetric === "revenue" ? "Revenue chart compared with previous period" : "Orders chart compared with previous period"}>
                <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {gridValues.map((fraction) => {
                    const y = CHART.bottom - fraction * CHART.height;
                    return (
                        <g key={fraction}>
                            <text x="66" y={y + 4} textAnchor="end">
                                {formatAxisValue(chartValues.maxValue * fraction, selectedMetric)}
                            </text>
                            <line x1={CHART.left} y1={y} x2={CHART.right} y2={y} />
                        </g>
                    );
                })}

                <polygon points={chartValues.areaPoints} fill="url(#salesGradient)" />
                <polyline points={chartValues.previousPoints} fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="6 6" />
                <polyline points={chartValues.currentPoints} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

                {salesData.map((item, index) => {
                    const x = chartValues.xFor(index);
                    const currentValue = selectedMetric === "revenue" ? item.revenue : item.orders;
                    const previousValue = selectedMetric === "revenue" ? item.previous : item.previousOrders;
                    const isHovered = hoveredPoint?.day === item.day;
                    return (
                        <g key={`${item.day}-${index}`}>
                            <circle
                                cx={x}
                                cy={chartValues.yFor(currentValue)}
                                r={isHovered ? 6 : 4}
                                fill="#0f172a"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                className="chart-point"
                                tabIndex="0"
                                role="button"
                                aria-label={`${item.day}: ${selectedMetric === "revenue" ? formatCurrency(currentValue) : `${currentValue} orders`}; previous period ${selectedMetric === "revenue" ? formatCurrency(previousValue) : `${previousValue} orders`}`}
                                onMouseEnter={() => setHoveredPoint(item)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                onFocus={() => setHoveredPoint(item)}
                                onBlur={() => setHoveredPoint(null)}
                            />
                            <text x={x} y="305" textAnchor="middle">{item.day}</text>
                        </g>
                    );
                })}

                {hoveredPoint && (() => {
                    const index = salesData.findIndex((item) => item.day === hoveredPoint.day);
                    const x = Math.max(82, Math.min(625, chartValues.xFor(index) - 70));
                    const currentValue = selectedMetric === "revenue" ? hoveredPoint.revenue : hoveredPoint.orders;
                    const previousValue = selectedMetric === "revenue" ? hoveredPoint.previous : hoveredPoint.previousOrders;
                    return (
                        <g transform={`translate(${x}, 42)`} pointerEvents="none">
                            <rect x="0" y="0" width="155" height="76" rx="6" fill="#0f172a" />
                            <text x="12" y="22" fill="#ffffff" fontSize="13" fontWeight="700">
                                {selectedMetric === "revenue" ? formatCurrency(currentValue) : `${currentValue} Orders`}
                            </text>
                            <text x="12" y="42" fill="#cbd5e1" fontSize="10">{hoveredPoint.day} · current period</text>
                            <text x="12" y="60" fill="#cbd5e1" fontSize="10">
                            </text>
                        </g>
                    );
                })()}
            </svg>
        </div>
    );
}

export default SalesChart;