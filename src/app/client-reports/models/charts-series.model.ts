export interface ChartSeries {
    series: Array<Series>;
    categories: Array<string>;
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