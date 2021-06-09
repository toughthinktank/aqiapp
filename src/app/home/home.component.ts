import { Component, OnInit, ViewChild } from '@angular/core';
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { MomentModule } from 'ngx-moment';
import { MatTableDataSource } from '@angular/material/table';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend
} from "ng-apexcharts";

export interface TimeData {
  aqi: string,
  time: Date
}

export interface CityData {
  city: string,
  aqi: string,
  lastUpdated: Date,
  history: TimeData[]
}

export interface SocketData {
  city: string,
  aqi: string
}

export interface chartData {
  name: string,
  data: number[]
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})


export class HomeComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;
  public selected!: CityData;
  public i = 0;
  dataSource = new MatTableDataSource<CityData>();
  displayedColumns = ['city', 'aqi', 'lastUpdated'];
  public cityData!: CityData[];
  private subject = new WebSocketSubject('wss://city-ws.herokuapp.com/')
  constructor() {
    this.chartOptions = {
      chart : {
        height: 700,
        type: "line",
        dropShadow: {
          enabled: true,
          color: "#000",
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2
        },
        toolbar: {
          show: false
        }
      },
      dataLabels : {
        enabled: true
      },
      stroke : {
        curve: "smooth"
      },
      grid : {
        borderColor: "#e7e7e7",
        row: {
          colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
          opacity: 0.5
        }
      },
      markers : {
        size: 1
      },
      legend : {
        position: "top",
        horizontalAlign: "right",
        floating: true,
        offsetY: -25,
        offsetX: -5
      }
    }
  }

  ngOnInit(): void {
    this.subject.subscribe(
      msg => {
        this.chartOptions.series = [];
        this.chartOptions.colors = [];
        this.chartOptions.xaxis = {
          categories: [],
          title: {
            text: "Time"
          }
        }
        if (!this.cityData) {
          this.cityData = msg as CityData[];
          this.cityData.forEach((cd) => {
            cd['lastUpdated'] = new Date();
            cd['history'] = [{'aqi': cd.aqi, 'time': cd.lastUpdated}];
          });
        }
        else {
          (msg as CityData[]).forEach((cd) => {
            let cityIndex = this.cityData.findIndex((c => c.city == cd.city));
            if (cityIndex == -1) {
              cd['lastUpdated'] = new Date();
              cd['history'] = [{'aqi': cd.aqi, 'time': cd.lastUpdated}];
              this.cityData.push(cd);
            }
            else {
              this.cityData[cityIndex].aqi = cd.aqi;
              this.cityData[cityIndex].lastUpdated = new Date();
              this.cityData[cityIndex].history.push({'aqi': cd.aqi, 'time': new Date()});
            }
          });
        }
        this.cityData.forEach((data) => data.aqi = (Math.round(Number(data.aqi)*100)/100).toString());
        this.dataSource.data = this.cityData;
        this.selected = this.cityData[this.i%this.cityData.length];
        let seriesObj!: chartData;
        seriesObj = {
          'name' : this.selected.city,
          'data' : [0]
        }
        if (this.selected.history.length > 30) this.selected.history = this.selected.history.slice(-30);
        this.selected.history.map(x => x.aqi).forEach(aqi => seriesObj.data.push(Math.round(Number(aqi)*100)/100));
        this.selected.history.map(x => x.time).forEach(t => this.chartOptions.xaxis?.categories.push(t.getHours()+':'+t.getMinutes()+':'+t.getSeconds()));
        seriesObj.data = seriesObj.data.slice(1);
        this.chartOptions.series = [seriesObj];
        this.chartOptions.colors = ['#000'];
        this.chartOptions.title = {
          text: this.selected.city,
          align: "left"
        };
        let that = this;
        this.chartOptions.yaxis =  {
          title: {
            text: "AQI"
          },
          min: Math.floor(Number(that.selected.history[0].aqi)) - 20,
          max: Math.floor(Number(that.selected.history[0].aqi)) + 20,
        }
        this.i += 1;
      },
      err => console.log('err', err),
      () => console.log('complete')
    );
  }

}
