export interface ChartSeries {
    series: Array<Series>;
}

export interface Series {
    name: string;
    color: string;
    data: Array<LegendData>;
}

export interface LegendData {
    x: number;
    y: number;
}