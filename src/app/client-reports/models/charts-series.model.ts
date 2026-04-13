export interface ChartSeries {
    series: Array<Series>;
    categories: Array<string>;
    timelineEvents?: Array<TimelineEvent>;
}   

export interface Series {
    name: string;
    color: string;
    data: Array<number>;
    id: string;
    order: number;
    /** SavingPotOwnership when from API (0 Joint, 1 client, 2 partner). */
    ownership?: number | null;
}

export interface LegendData {
    x: number;
    y: number;
}

export interface TimelineEvent {
    name: string;
    startYear: number;
    iconUrl: string;
}
