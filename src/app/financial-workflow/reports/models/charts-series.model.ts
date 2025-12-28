export interface ChartSeries {
    series: Array<Series>;
    categories: Array<string>;
    timelineEvents: Array<TimelineEvent>;
}   

export interface Series {
    name: string;
    color: string;
    data: Array<number>;
    id:string;
    order:number
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