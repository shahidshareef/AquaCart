import { useState } from "react";

function SalesChart({ salesData, selectedMetric }) {

    const [hoveredPoint, setHoveredPoint] = useState(null);

    const chartKey =
        selectedMetric === "revenue" ? "revenue" : "orders";

    const maxValue =
        selectedMetric === "revenue" ? 40000 : 20;

    return (
        <div className="sales-chart-container">

            <svg
                viewBox="0 0 800 320"
                className="sales-chart-svg"
            >
                <defs>
                    <linearGradient
                        id="salesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="#0ea5e9"
                            stopOpacity="0.25"
                        />

                        <stop
                            offset="100%"
                            stopColor="#0ea5e9"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {/* Y-axis labels */}

                <text x="10" y="40">
                    {selectedMetric === "revenue" ? "₹40k" : "20"}
                </text>

                <text x="10" y="100">
                    {selectedMetric === "revenue" ? "₹30k" : "15"}
                </text>

                <text x="10" y="160">
                    {selectedMetric === "revenue" ? "₹20k" : "10"}
                </text>

                <text x="10" y="220">
                    {selectedMetric === "revenue" ? "₹10k" : "5"}
                </text>

                <text x="25" y="280">
                    0
                </text>

                {/* Horizontal grid lines */}

                <line x1="70" y1="35" x2="770" y2="35" />
                <line x1="70" y1="95" x2="770" y2="95" />
                <line x1="70" y1="155" x2="770" y2="155" />
                <line x1="70" y1="215" x2="770" y2="215" />
                <line x1="70" y1="275" x2="770" y2="275" />

                {/* Current week area fill */}

                <polygon
                    points={[
                        ...salesData.map((item, index) => {
                            const x = 70 + index * 116;
                            const y =
                                275 -
                                (item[chartKey] / maxValue) * 240;

                            return `${x},${y}`;
                        }),
                        "766,275",
                        "70,275"
                    ].join(" ")}
                    fill="url(#salesGradient)"
                />

                {/* Current week line */}

                <polyline
                    points={salesData
                        .map((item, index) => {
                            const x = 70 + index * 116;
                            const y =
                                275 -
                                (item[chartKey] / maxValue) * 240;

                            return `${x},${y}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="3"
                />

                {/* Previous period line */}

                <polyline
                    points={salesData
                        .map((item, index) => {
                            const x = 70 + index * 116;

                            const previousValue =
                                selectedMetric === "revenue"
                                    ? item.previous
                                    : item.previousOrders;

                            const previousMaxValue =
                                selectedMetric === "revenue"
                                    ? 40000
                                    : 20;

                            const y =
                                275 -
                                (previousValue / previousMaxValue) * 240;

                            return `${x},${y}`;
                        })
                        .join(" ")}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                />

                {/* Friday highlight line */}

                <line
                    x1="534"
                    y1="35"
                    x2="534"
                    y2="275"
                    stroke="#0ea5e9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />

                {/* Tooltip */}

                {/* Tooltip */}

                {hoveredPoint && (
                    <g
                        transform={`translate(${Math.max(
                            80,
                            Math.min(
                                620,
                                70 +
                                salesData.findIndex(
                                    (item) => item.day === hoveredPoint.day
                                ) * 116 -
                                75
                            )
                        )
                            }, 45)`}
                    >

                        <rect
                            x="0"
                            y="0"
                            width="150"
                            height="65"
                            rx="6"
                            fill="#0f172a"
                        />

                        <text
                            x="13"
                            y="22"
                            fill="#ffffff"
                            fontSize="14"
                            fontWeight="700"
                        >
                            {selectedMetric === "revenue"
                                ? `₹${hoveredPoint.revenue.toLocaleString()}`
                                : `${hoveredPoint.orders} Orders`}
                        </text>

                        <text
                            x="13"
                            y="45"
                            fill="#cbd5e1"
                            fontSize="11"
                        >
                            {hoveredPoint.day} - {hoveredPoint.orders} orders placed
                        </text>

                    </g>
                )}
                {/* Current week data points */}
                {salesData.map((item, index) => {

                    const x = 70 + index * 116;
                    const y =
                        275 -
                        (item[chartKey] / maxValue) * 240;

                    return (
                        <circle
                            key={item.day}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#0f172a"
                            className="chart-point"
                            onMouseEnter={() => setHoveredPoint(item)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    );
                })}

                {/* X-axis labels */}

                {salesData.map((item, index) => (
                    <text
                        key={item.day}
                        x={70 + index * 116}
                        y="305"
                    >
                        {item.day}
                    </text>
                ))}

            </svg>

        </div>
    );
}

export default SalesChart;