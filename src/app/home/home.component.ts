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
  dataSource = new MatTableDataSource<CityData>();
  displayedColumns = ['city', 'aqi', 'lastUpdated'];
  public cityData!: CityData[];
  private subject = new WebSocketSubject('ws://city-ws.herokuapp.com/')
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
      title : {
        text: "Citywise AQI Data",
        align: "left"
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
      yaxis : {
        title: {
          text: "AQI"
        },
        min: 5,
        max: 400
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
        this.cityData.forEach((cd) => {
          let seriesObj!: chartData;
          seriesObj = {
            'name' : cd.city,
            'data' : [0]
          }
          if (cd.history.length > 1000) cd.history = cd.history.slice(-1000);
          cd.history.map(x => x.aqi).forEach(aqi => seriesObj.data.push(Math.round(Number(aqi)*100)/100));
          cd.history.map(x => x.time).forEach(t => this.chartOptions.xaxis?.categories.push(t.getHours()+':'+t.getMinutes()+':'+t.getSeconds()));
          seriesObj.data = seriesObj.data.slice(1);
          this.chartOptions.series?.push(seriesObj);
          this.chartOptions.colors?.push('#' + (Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6));
        });
      },
      err => console.log('err', err),
      () => console.log('complete')
    );
  }


}
