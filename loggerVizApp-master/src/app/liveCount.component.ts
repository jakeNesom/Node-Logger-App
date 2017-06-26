import { Component, OnInit, Input, OnChanges, SimpleChange, 
        Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild
      } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
// For window animations
import {  trigger, state, animate, transition, style} from '@angular/animations';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DataManip } from './services/dataManip.service';
import { LoggerService } from './services/loggerdata.service';
import { Dataset } from './definitions/dataset';
import { DisplayComponent } from './display.component';
import { ChartModule } from 'angular2-highcharts';

import 'rxjs/add/operator/mergeMap';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

@Component({
    selector: 'liveCount',
    styleUrls: ['/css/livecount.css'],
    templateUrl: 'views/liveCount.html',
})

export class LiveCount {

    @Input() currentData: any;

    @Input() activelyLookForDataC: boolean;

    //ngOnChanges(changes: any[]) {
    //    for (let key in changes) {
    //        if (key == "activelyLookForData") { console.log("activelyLookForData Key match  " + key); }

    //        if (key == "dataset") { this.processData(changes[key]); }
    //    }


    //}

    public range: string = "last30";
    public dataType = 'Node';
    public timeRange = {
        'selected': 'Last 30 Min',
        'arr': [
            "Last 5 min", "Last 30 min", "Last Hour",
            "Last 24 Hours", 'Last Week', "Last Month", "ALL"
        ]
    }
       
   
    options: any;
    chart: any;

    private dataset: any = {
        'distinct': [],
        'series': [],
        'keyArr':[],
        'selectedKey': ''
    }
    private oldOptions: any;


    public myInterval: any;
    public myInterval2: any;

    public activeClass = "btn-success";
    public settingToggled = false;

    constructor(public loggerService: LoggerService,
        public dataManip: DataManip, private _applicationRef: ApplicationRef,
        ) {

       

        this.options = {
            chart: {
                type: 'line',
                animation: true, // don't animate in old IE
                marginRight: 10,

                style: {
                    "min-width": "300px"
                },


            },
            title: {
                text: 'All Nodes Over Time'
            },
            xAxis: {
                type: 'datetime',
                //tickPixelInterval: 30

            },
            yAxis: {
                title: {
                    text: 'Value'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                // formatter: function () {
                //     return '<b>' + this.series.name + '</b><br/>' +
                //        this.series.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                //        this.series.numberFormat(this.y, 2);

                // }
            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event:any) {
                            loggerService.addFilter(this.name);
                            dataManip.sendMessage(this.name, this.color);
                           
                        }
                    }
                }
            },
            series: [
                {
                    name: 'Node 1',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -9; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                },
                {
                    name: 'Node 2',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -9; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                },
                {
                    name: 'Node 3',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -9; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                },
                {
                    name: 'Node 4',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -9; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                },
                {
                    name: 'Node 5',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -9; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                },
                {
                    name: 'Node 6',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -9; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: Math.random()
                            });
                        }
                        return data;
                    }())
                },

            ]


        };

       // this.chart["series"] = this.options.series;

    } /* End of constructor */

    /*********************************************
     Process Begins Here
    ***********************************************/
   
    ngOnInit(): void {
       
        this.getGeneralCount( this.range, "genCount", this.createInterval("last30"), this.dataType);
        
    }

   
    

    
    

    saveInstance(chartInstance: any) {
        this.chart = chartInstance;
        console.log("LiveCount saveInstance Fired");
    }

    sendMessage(message: string): void {
        this.dataManip.sendMessage(message);
    }

    clearMessage(): void {
        this.dataManip.clearMessage();
    }

    

    public setDataset(data: any) {
        this.dataset = data;
       
    }

    public getDataset(range: string): void {
        this.loggerService.getRangeFilter(this.loggerService.filterObj, "obj")
            .subscribe(data => { this.processData(data); });
    }

    public getGeneralCount(range: string, returnType: string, timeArr:any[], dataType:string): void {
        if (!returnType) returnType = 'genCount';
        let filter = this.loggerService.filterObj;

        this.loggerService.getMultiple(filter, returnType, timeArr)
            .subscribe(
                (data) => {

                let allDat = { dist: data[0], series: [] };

                for (let i = 0; i < data.length; i++) {
                    if (i === 0) { continue }
                    allDat.series[i - 1] = data[i];
              }
            allDat['timeArr'] = timeArr;
               return this.processData2(allDat);
          }
          ); 

      
    }

    processData(newData: any) {
       
        this.setDataset(newData);
        this.tallyData(newData, this.rangeToKey(this.range), this.dataType  );
      

    }

    processData2(data: any) {
        // this function handles the data returned from the count rest API
        
        let keyArr = this.dataManip.getUniqueKeys(data.dist, '_id');
        this.dataset.selectedKey = '';
        this.dataset['keyArr'] = keyArr;
        let timeArr = data.timeArr;   
        let stubChartObj = { 'series': [] };

        keyArr.map(function (key) {

            let seriesItem = { 'type': 'spline', "name": key, 'data': [] };
            for (let i = 0; i < data.series.length; i++) {
                let match = false;
                for (let j = 0; j < data.series[i].length; j++) {

                    if (data.series[i][j]._id === key) {
                        match = true;
                        let dat = { 'x': timeArr[i], 'y': data.series[i][j].total };
                        seriesItem.data.push(dat);
                        break;
                    }
                }

                if (match === false) {
                    let dat = { 'x': timeArr[i], 'y': 0 };
                    seriesItem.data.push(dat);
                }


            }
            stubChartObj.series.push(seriesItem);
        });
        this.updateChartData(stubChartObj);    
    }

    createInterval(timeInterval: string) {
        // this function creates 6 equal sections of time which act as points on the X-axis
        // use the sections to sort your objects by their time into one of the 6 sections for display
        let currentTime = new Date().getTime();

        let startTime: number = 0;
        let timeMarker: number = 0;
        let intervalArr = [];
        let dataByType: Object = {};  // client or node

        currentTime = new Date().getTime();

        // get timespan in miliseconds from array in service
        for (let key in this.loggerService.timeIntObj) {
            if (key === timeInterval) {
                startTime = currentTime - this.loggerService.timeIntObj[key];
                timeMarker = Math.round(parseInt(this.loggerService.timeIntObj[key]) / 5);
                break;
            }
        }

        //populate intervArray
        for (let i = 0; i < 6; i++) {
            if (i == 0) { intervalArr[i] = startTime }
            else {

                intervalArr[i] = startTime + (i * timeMarker);

            }
        }

        return intervalArr;
    }

    tallyData(data?: any, timeInterval?: string, type?: string) {
    // DEPRICATED FUNCTION 
        //data = this.testData;
        //timeInterval = "last30";
      
        this.chart.title.update({ "text": "All Nodes Over " + this.range });
        let dataTypeArr = [];
        let dataByType: Object = {};
        let intervalArr = this.createInterval(timeInterval);
        // create node array  dataByType.(node || client).[timeMarker: ticker, timeMarker:ticker]
        for (let entry in data) {
            let dataType = data[entry][type];
            let time = data[entry].Time;
            if (!dataByType.hasOwnProperty(dataType)) {
                dataByType[dataType] = [];
                //nodeArr.push(node)
                dataTypeArr.push(dataType);
                //After this for loop - dataByNode.someNode[timeInMilliseconds : number of nodes (x val : y val)]
                for (let index in intervalArr) 
                {   
                    dataByType[dataType][intervalArr[index]] = 0;
                }
            }
            // if the timestamp of the log falls between one of the timestamps in the intervalArr[], incriment the counter
            if (dataByType[dataType] && time)
            {
                for (let i = 0; i < intervalArr.length; i++)
                {
                    let timeMarker = intervalArr[i];
                    let nextInterval = intervalArr[i + 1]

                    if (i < intervalArr.length - 1) {
                        if (time >= timeMarker && time <= nextInterval)
                        {
                            dataByType[dataType][timeMarker]++; 
                            break;
                        }
                        
                    } else if (i == intervalArr.length - 1)
                    {
                        if (time >= timeMarker)
                        {
                            dataByType[dataType][timeMarker]++;
                        }
                        
                    }
                    
                }

            } else { console.log("no dataByNode[Node] or no 'time' set .") }
            //works!  
        }

       // console.log("Data By Type: " + dataByType);
       
        //remove old serise from chart
        while (this.chart.series.length > 0)
        {
            this.chart.series[this.chart.series.length - 1].remove();
        }
        for (let j = 0; j < dataTypeArr.length; j++) {
            let dataType = dataTypeArr[j];
           
            let series = { "type": "spline", "name": dataType, "data": [{"x":0, "y": 0}], };
            for (let k = 0; k < intervalArr.length; k++)
            {
                let xMarker = intervalArr[k];
                series.data[k] = {
                    "x": xMarker, "y": dataByType[dataType][xMarker]
                }

                
            }       
            this.chart.addSeries(series);
        }
    }

    updateChartData(stubChartObj: any )
    {
        // StubChartOBj is a copy of the chart Obj provdied by HighCharts
        if (!stubChartObj.series) {
            console.error("Error updateChartData() stubChartObj.series not set")
            return;
        }
        while (this.chart.series.length > 0) {
            this.chart.series[0].remove();
        }

        for (let l = 0; l < stubChartObj.series.length; l++) {
            this.chart.addSeries(stubChartObj.series[l]);
        }

        this.chart.title.update({ "text": this.dataManip.genChartTitle(this.loggerService.filterObj, this.dataType) });
        return;
    }
   

    optionChange(selection: any) {
        console.log(selection);

        this.dataset.selectedKey = selection;
    }
    rangeChange(selection: any) {
        this.timeRange.selected = selection;
        let key = this.rangeToKey(selection);

        this.range = key;

        this.loggerService.filterObj.range = key;
        this.loggerService.setStartStopTime(key);

        this.getGeneralCount(key, "genCount", this.createInterval(key), this.dataType);
        this.sendMessage(key);
    }

   rangeToKey(input:string) {
        
        switch (input) {
            case "Last 5 min":
                return "lastFive";
                
            case "Last 30 min":
                return "last30";
               
            case "Last Hour":
                return "lastHour";
               
            case "Last 24 Hours":
                return "last24";
               
            case "Last Week":
                return "last7Days";
               
            case "Last Month":
                return "last30Days";

            case "ALL":
                return "ALL"

            default:
                return input;
                
        };
    }
  
   settingToggle(event) {
       let range = this.rangeToKey(this.range);
       console.log(event);
       this.dataType = event.toString();
       
       this.loggerService.filterObj.groupType = this.dataType;
       this.getGeneralCount(range, "genCount", this.createInterval(this.range), this.dataType);
       this.sendMessage('refresh'); 
   }
startInterval() {
        
        var _this = this; // setInterval acts on document so it messes up "this" reference
        this.myInterval = setInterval(function () {
            for (var i = 0; i < _this.chart.series.length; i++) {
                var x = (new Date()).getTime(), // current time
                    y = Math.random();

                console.log("Interval Iteration");

                _this.chart.series[i].addPoint([x, y], true, true);
            }
        }, 10000);
        
    }

startInterval2(type: "Node" | "Client" ) {
    var _this = this;

    // initially set time interval
    var prevTime = (new Date()).getTime();

    // whatever current time is of interval iteration
    var currentTime = (new Date()).getTime();

    this.myInterval2 = setInterval(function () {
        let dataCounts = this.countData(prevTime, currentTime, this.dataset, type);
        for (var i = 0; i < _this.chart.series.length; i++) {
            var x = []
        }

        prevTime = currentTime;
    }, 5000)  // interval set to 5 seconds
    }

stopInterval() {
    clearInterval(this.myInterval);
    console.log("interval cleared");
}


    countData(time1: number, time2: number, incomingData: any, type: "Node" | "Client" ) {
        let dataCount: any = []
        for (let i = 0; i < incomingData.length; i++)
        {
            if (incomingData[i].time > time1 && incomingData[i].time < time2)
            {
                if (incomingData[i][type] in dataCount)
                {
                    dataCount[type]++;
                } else {
                    dataCount[type] = 1;
                }
            }
        }
    }
} // end of component

