import { Component, OnInit, PipeTransform, Pipe, Input, OnChanges, SimpleChange,
        Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChild,
       } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
// For window animations
import {  trigger, state, animate, transition, style} from '@angular/animations';

import { Subscription } from 'rxjs/Subscription';

import { DataManip } from './services/dataManip.service';
import { LoggerService } from './services/loggerdata.service';
import { Dataset } from './definitions/dataset';

import { DisplayComponent } from './display.component';

//ng on changes
//http://stackoverflow.com/questions/35823698/how-to-make-ngonchanges-work-in-angular2

@Component({
  selector: 'setChart',
  animations: [
    trigger('visibilityChanged', [
      state('1' , style({ opacity: 1, /*transform: 'scale(1.0)'*/ })),
      state('0', style({ display:'none', height: 10, opacity: 0, /*transform: 'scale(0.0)'*/  })),
      transition('1 => 0', [
      //style({height: 10, opacity: 0}),
      animate('500ms'),
      ]), 
      transition('0 => 1', animate('800ms'))
    ])
  ],
  styles: [`
      chart {
        display:block;
      }
  `],
  templateUrl: 'views/setchart.html',  
})

export class SetChart {
 
 

  // the @Inputs take variables passed from the parent component via the parent view where the current component view
  // tags are written
  @Input() currentClientC: string;

  @Input() currentNodeC: string;
 
  @Input() timeFilterC: string;

  @Input() activelyLookForDataC: boolean;

  @Input() currentColor: string;

  ngOnChanges(changes: any []) {
    console.log("onChange fired");
    console.log("changing", changes);

    for (let key in changes)
    {
      if(key == "currentClientC") { this.filters.client = this.currentClientC; }
      if(key == "currentNodeC") { this.filters.node = this.currentNodeC; }
      if(key == "timeFilterC") { this.filters.time = this.timeFilterC; }
    }


 
    
  }
  // Menu animation
  public isVisible: boolean = false;  // controls menu animation for drop down list of this.dataset array
  
 
  public dataset: Dataset[] = []; // incoming data from loggerService http get request
  public listData: any = {
      'data': [],
      'Client': '',
      'pageIndex': 0,
      'prevPageIndex':0,
      'pageData': [],
      'firstPage': true,
      'lastPage': false
  };  // for manipListData();


  public clientTotals:any = {}; // for storing client total logs for each node   client.node.total: number

  public filterSet: any = {};

  public filters:any = {client:"ANY", node:"ANY", time:"ANY"};  // almost depricated
  public clientLabels: any = [];  // list of unique clients
  public nodeLabels: any = []    // list of unique nodes
  


  
  public show: boolean;  // controls show/ of bar chart in setChart.html
  private initFlag: boolean = false; // almost depricated - consider removal
  private newDataListening: boolean = false; // almost depricated - consider removal
  
 
  subscription: Subscription;  // rxjs subscription object for use with messageSubscription
  chart: any; // HighCharts object
  options: Object; // Highcharts object
  oldOptions: Object; // copy of highcharts 'options' object
  public range = "last30"; // cooresponds to loggerdata.filterObj / loggerdata.timeIntObj 
  private changeFlag = false; // possibly depricated, consider removal

  // creating instance of LoggerService, initializing the high-charts options
  constructor (private loggerService: LoggerService, 
    private sanitizer: DomSanitizer, 
    private _applicationRef: ApplicationRef,
    public dataManip: DataManip) {
      
      this.show = true;
      this.options = {
        xAxis: {
          categories: ["Node A", "Node B", "Node C", "Node D"]
        },
        chart: { type: 'column' },
        title: { text: '' },
        legend: {
            enabled: false,
        },
        exporting: {
            enabled: false
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                events: {
                    click: function (event: any) {
                      dataManip.sendMessage('setChartSeriesClicked', { 'Client': this.name, 'color': this.color });
                      console.log(this.name + " " + this.color);
                  }
                }
            }
        },
        series: [
          { type: 'column',
            name: 'Client A',
            data: [1, 2, 3, 2] },
          { type: 'column',
            name: 'Client B',
            data: [0, 2, 4, 1] },
          { type: 'column',
            name: 'Client C',
            data: [4, 1, 1, 3] },
        ]
        
      };

      this.oldOptions = this.options;
        //setInterval( () => this.chart.series[0].addPoint(Math.random()*10), 1000);
      
      this.subscription = this.dataManip.getMessage()
          .subscribe(message => { this.messageReceived(message); });
    }

    
    saveInstance(chartInstance:any) {
        this.chart = chartInstance;
        console.log("SetChart saveInstance() fired");
    }
 
    // some example graph options that will appear if your methods aren't working correctly
    incomingOptions: any = {
        xAxis: {
          categories: ["Node A", "Node B", "Node C"]
        },
        chart: { type: 'column' },
        title: { text : ''},
        series: [
          { type: 'column',
            name: 'Client A',
            data: [1, 2, 3] },
          { type: 'column',
            name: 'Client B',
            data: [0, 2, 4] },
          { type: 'column',
            name: 'Client C',
            data: [4, 1, 1] },
          { type: 'column',
            name: 'Client D',
            data: [1,2,4]}
        ]
      };
 // on init - run get service and initially set the data
  ngOnInit(): void {

      this.loggerService.getRangeFilter(this.loggerService.filterObj, "obj")
          .subscribe(data => { this.setData(data); });
   

      //this.loggerService.getRange2("last30")
      //  .subscribe(data => { this.setData(data); });
  }


  public messageReceived(message: any) {
      
      let value = message.text.toLowerCase();
      let value2;
      if (message.text2 && typeof message.text2 === "string" ) {
          value2 = message.text2.toLowerCase();
      }
      else if (message.text2 && typeof message.text2 === "object") { value2 = message.text2; }
      // checks if message pertains to time sort 
      if (value === "refresh") {
          this.removeMostFilters('Node');
          this.removeMostFilters('Client');
          this.getNewData(this.range);
          this.currentColor = '';
      }
      else if (value === "setchartseriesclicked")
      {
          this.show = false;
          // save prev. client
          let oldClient = this.loggerService.filterObj.Client;
          // update filter w/ new client for new API http request
          this.loggerService.filterObj.Client = value2.Client;
          this.getSpecificData();
          // return filter to previous client information
          this.loggerService.filterObj.Client = oldClient;
      }
      else if (value.indexOf("node") === -1 && value.indexOf('client') === -1) {
          for (let key in this.loggerService.timeIntObj) {
              if (message.text === key) {

                  // reset client & node filters 
                  this.removeMostFilters('Node');
                  this.removeMostFilters('Client');

                  this.currentColor = '';
                  this.range = message.text;
                  this.getNewData(key);
              }
          }
      }
        
      else if (value.indexOf("node") !== -1 || value.indexOf("client") !== -1)
      {
          if (message.text2.indexOf('#') !== -1) {
              this.currentColor = message.text2;
          }
          
          if (value.indexOf("client") !== -1)
          {
              this.currentClientC = value;
              this.loggerService.filterObj.Client = value;
          }

          if (value.indexOf("node") !== -1)
          {
              this.currentNodeC = value;
              this.loggerService.filterObj.Node = value;
          }
          //console.log("sent val: " + value);
          this.getNewData(this.range);
          

      } else { console.log('setChart.messageReceived() fired but message.text1 value !== to any cases, check logic')}

      
  }
  
  public removeMostFilters(filter) {
    // resets the node / client filters in this controller as well as the 
    // node/client filters in the loggerdata.filterObj
      if (filter === "Node")
      {
          this.loggerService.removeFilterVal('Node');
          this.currentNodeC = 'ALL';
      }
      if (filter === "Client") {
          this.loggerService.removeFilterVal('Client');
          this.currentClientC = 'ALL';
      }  
  }
  public getNewData(timeRange: string): void {
      if (!timeRange)
      {
          timeRange = this.loggerService.filterObj.range;
      };
      this.loggerService.getRangeFilter(this.loggerService.filterObj, "obj")
          .subscribe(data => { this.setData(data); });
  }

  public getSpecificData(): void {
      // may be depricated ?  
      console.dir(this.loggerService.filterObj);
      this.loggerService.getRangeFilter(this.loggerService.filterObj, "obj")
          .subscribe(data => this.manipListData(data));
  }

  public manipListData(data: any) {
      console.log('manipListData() fired');
      console.dir(this.loggerService.filterObj);
      console.dir(data);
      this.listData.data = data;
      this.listData.Client = data[0].Client;
      this.paginate(10);
  }

  public paginate(items: any) {
      // logic to paginate client-list-view of setChart.html

      // for resetting pagination when hiding view
      if (typeof items === 'string' && items === "back")
      {
          this.listData.pageIndex = 0;
          this.listData.firstPage = true;
          this.listData.lastPage = false;
          this.listData.pageData = [];
          return;
      }

      let data = this.listData.data;
      let page = [];
      let i = this.listData.pageIndex;
      let prevI = this.listData.prevPageIndex;
      if (!items) items = 10;

      // if there's less items remaining than a full page
      if (i + items > data.length - 1) {
          page = data.slice(i, data.length);
          i = i + items;
          this.listData.lastPage = true;
      }
      // if there's more items remaining than a full page'
      else if (i + items <= data.length - 1 && i + items >= 0) {
          page = data.slice(i, i + items);
          if (i + items === data.length) { this.listData.lastPage = true; }
          i = i + items;
          if (i >= 0 && i <= 10) { this.listData.firstPage = true; }
          else { this.listData.firstPage = false; }
          this.listData.pageIndex = i;
         
          
           
      }
      // for backward pagination incase we get below 0 or base array index
      else if (i + items < 0)
      {
          page = data.slice(i, 10);
          this.listData.firstPage = true;
          if (i + 10 >= data.length) { this.listData.lastPage = true; }
      }
      this.listData.pageIndex = i;
      this.listData.pageData = page;
  }
  //public lookForNewData() {  //  *********  depircated function ***********
  //        let newData:any;
  //        this.loggerService.getRange2(this.range)
  //            .subscribe(data => { newData = data; });
  //        if(newData !== this.dataset) { this.setData(newData); }
  //  }

  private setData(incomingData?: any, filter?: any): void {
      filter = this.loggerService.filterObj;

      let data = incomingData;
     
     // this if statement should only be true on init
      if (data) {
          this.dataManip.data = data;

          this.dataset = incomingData;
          this.dataset = this.dataset.slice()

      }
     
     
     // if there's a client filter, then filter the dataset, remove non-client objects
     if (this.currentNodeC !== "ALL" || filter.Node && !this.currentColor)
     {
         data = this.dataManip.filterDataset(data, filter.Node, "Node");
     }

     // if there's a node filter, filter dataset removing all non-node objects
     else if (this.currentClientC !== "ALL" || filter.Client && this.currentColor)
     {
         data = this.dataManip.filterDataset(data, filter.Client, "Client");
     }

      this.dataset = data;

     // set labels
     this.clientLabels = this.dataManip.setListArr(data, "Client");
     this.nodeLabels = this.dataManip.setListArr(data, "Node");

     // Clear previous incomingOptions data and re-initialize the objects properties
     this.incomingOptions.series = [];
     for (let i = 0; i < this.clientLabels.length; i++) {
         this.incomingOptions.series[i] = { 'name': '', 'data': [], 'type': 'column' };

         // prints to console when the client field from the log data is empty
         // could be exapnded to check each property to see if it contains data
         if (!this.clientLabels[i]) {
             console.log('client label missing for clientLables[' + i +
                 '] . Default name "Series {x}" will appear as client name. Probably resuls of missing client string in dataset');
         }
         this.incomingOptions.series[i].name = this.clientLabels[i];
     }

     // This is how you designate how many 'nodes' the clients are split into on the bar chart
     // basically groups of bar charts
     this.incomingOptions.xAxis.categories = this.nodeLabels;

     // removes 'series' from the highcharts object and adds new series based on the clientLabels array length
     this.reInitializeChartSeries();

      // count the # of logs in each node per client
     this.countAllClientsNodes(data);

     // transfers data from incomingOptions{} to highcharts chart object using highcharts methods
     this.setChartData();
    
     
    
}

private reInitializeChartSeries( type?: string) {
    //remove old series from chart
    while (this.chart.series.length > 0) {
        this.chart.series[this.chart.series.length - 1].remove();
    }
    for( let i = 0; i < this.clientLabels.length; i++ )
    {
      this.chart.addSeries({
        name: 'placeholder',
        data : [0]
      });
    }
}



  
  private countAllClientsNodes(incomingData:any, filter?: any):void {
    //clear out old data from ClientTotals
    this.clientTotals = {};
    
    let clabels:any =  [];
    let nlabels:any = [];
    clabels = this.clientLabels;
    nlabels = this.nodeLabels;

    // initialize clientTotals object properties
    for(let h = 0; h < clabels.length; h++ )
    {
      this.clientTotals[clabels[h]] = {};
    
      for(let i = 0; i < nlabels.length; i++)
      {
        this.clientTotals[clabels[h]][nlabels[i]] = {};
        this.clientTotals[clabels[h]][nlabels[i]]["total"] = 0;
      }
    }


   

    // Fill clientTotals Object with count data
    // for each present Client
    let size = 0;
    for(let Client in this.clientTotals)
    {
      
      //cycle through every array property
      for(let i = 0; i < incomingData.length; i++ )
      {
        // if one of the array properties matches this client
        if ( Client == incomingData[i].Client)
        {
          //cycle through each node for that client
          for(let Node in this.clientTotals[Client])
          {
            // if if one of the nodes matches the incoming data array nodes
            if( Node == incomingData[i].Node) 
            {
              // incrememnt the 'total' property of clienttotals.thisclient.thisnode.total
              this.clientTotals[Client][Node]["total"]++;
            }
          } 
        }
      }
      size++;

     }
   
  }

  
  private setChartData (): void {
      // Initialize barChartData object array
      // -- if you don't initialize the array with the number of objects it will contain,
      // the data won't show up correctly
     //this.barChartData = new Array(this.clientLabels.length-1);
    let clabels:any =  this.clientLabels;
    let nlabels:any = this.nodeLabels;


    // add the 'color hex code to the incoming options object if it's available'
     for(let i = 0; i < clabels.length; i++ )
     {
       for(let j = 0; j < nlabels.length; j++ )
       {
           this.incomingOptions.series[i].data[j] = this.clientTotals[clabels[i]][nlabels[j]].total;
           if (this.currentColor) {
               this.incomingOptions.series[i].color = this.currentColor;
           } 
       }
     }

    // add the categories to bar chart - in this case groups of bar charts by 'node'
    this.chart.xAxis[0].setCategories(this.incomingOptions.xAxis.categories);

    // update highcharts chart object with the replica object in incomingOptions{}
    for ( let k = 0 ; k < this.incomingOptions.series.length; k++)
    {
        this.chart.series[k].update(this.incomingOptions.series[k]);
                
    }  
  }
 
  public changeVisible()
  {
    if( this.isVisible == true) 
    { 
      this.isVisible = false;
     // console.log("is visible: " + this.isVisible ) 
    }
    else 
    {
      this.isVisible = true; 
       //console.log("is visible: " + this.isVisible )
    }
  }

  public toggleBarChart(event: any) {
      
      if (this.show) {
          this.show = false;

      }
      else
      {
          this.paginate("back");
          this.show = true;
      }
  }
  
  
}