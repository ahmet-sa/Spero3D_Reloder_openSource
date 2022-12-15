/*ted
 * View model for OctoPrint-speroplugin
 *
 * Author: AHMET SARIOĞLU
 * License: AGPLv3
 */
$(function() {
    function SperoViewModel(parameters) {
        

        var self = this;
        self.selectedQueue = ko.observable();
        self.selectedPort = ko.observable(); 
        self.portName = ko.observable(0);                         
        self.temp=ko.observable(0)                                    
        self.currentIndex=ko.observable(0)                             
        self.bedPosition=ko.observable(0)
        self.motorState=ko.observable(0)
        self.isShieldConnected=ko.observable(0)
        self.queueState=ko.observable("IDLE");
        self.queueName = ko.observable(0);
        self.queuesIndex=ko.observable(0);
        self.currentQueue=ko.observable(0);
        self.ejectFail=ko.observable(0);  
        // self.currentQueueItems=ko.observableArray([]);
        
        self.itemState=ko.observable();
        self.targetBedTemp=ko.observable(0);

        


        self.printerState = parameters[0];
        self.connectionState = parameters[1];
        self.loginState = parameters[2];
        self.files = parameters[3];
        self.settings = parameters[4];
        self.temperature = parameters[5];
   
        self.settings2 = ko.observable({});             //settings parametresi var diye setting2 diye adlandırdım gelen ayarları
        self.queues = ko.observableArray([]);
        self.ports= ko.observableArray([]);
        self.currentItems = ko.observableArray([]);
        self.queueId = ko.observable(null);
        self.itemInfo = ko.observable();               //sıcaklık verisini jinjaya gönderme
        self.itemCount = 0;                            //item sayısı                                   
        self.totalEstimatedTime = ko.observable(0);
       


        
        self.settings.saveData = function (data, successCallback, setAsSending) {
            var options;
            var validated=true;
            if (_.isPlainObject(successCallback)) {
                options = successCallback;
            } else {
                options = {
                    success: successCallback,
                    sending: setAsSending === true
                };
            }
            self.settings.settingsDialog.trigger("beforeSave");

            self.settings.sawUpdateEventWhileSending = false;
            self.settings.sending(data === undefined || options.sending || false);

            if (data === undefined) {
                // we also only send data that actually changed when no data is specified
                var localData = self.settings.getLocalData();
                data = getOnlyChangedData(localData, self.settings.lastReceivedSettings);
                if(_.has(data,'plugins.speroplugin')){

                    if(data.plugins.speroplugin["targetBedTemp"] != undefined){               //degişim olan verileri değistirme
                     self.settings2()["targetBedTemp"]=data.plugins.speroplugin["targetBedTemp"]
                    }
                    if(data.plugins.speroplugin["motorPin1"] != undefined){
                        self.settings2()["motorPin1"]=data.plugins.speroplugin["motorPin1"] 
                    }
                    if(data.plugins.speroplugin["motorPin2"] != undefined){
                            self.settings2()["motorPin2"]=data.plugins.speroplugin["motorPin2"]
                    }
                    if(data.plugins.speroplugin["switchFront"] != undefined){
                        self.settings2()["switchFront"]=data.plugins.speroplugin["switchFront"]
                    }
                    if(data.plugins.speroplugin["switchBack"] != undefined){
                           self.settings2()["switchBack"]=data.plugins.speroplugin["switchBack"] 
                    }
                    if(data.plugins.speroplugin["buttonForward"] != undefined){
                               self.settings2()["buttonForward"]=data.plugins.speroplugin["buttonForward"]
                    }
                    if(data.plugins.speroplugin["buttonBackword"] != undefined){
                        self.settings2()["buttonBackword"]=data.plugins.speroplugin["buttonBackword"]
                    }
                    if(data.plugins.speroplugin["buttonSequence"] != undefined){
                           self.settings2()["buttonSequence"]=data.plugins.speroplugin["buttonSequence"] 
                    }
                    if(data.plugins.speroplugin["delaySeconds"] != undefined){
                               self.settings2()["delaySeconds"]=data.plugins.speroplugin["delaySeconds"]
                    }
                          
                      
                  

                    var settings2Array=Object.values(self.settings2())    // dict to list
                               


                    let toMap = {};
                    let resultToReturn = false;
                    for (let i = 0; i < 7; i++) {
                        console.log(settings2Array[i]);
                
                        if (toMap[settings2Array[i]]) {
                            console.log(settings2Array[i])
                            resultToReturn = true;
                            break;
                        }                                                        //aynı elemanlar var mı                                                                
                
                        toMap[settings2Array[i]] = true;
                    }
                
                    if (resultToReturn) {
                        
                        console.log('Duplicate elements exist');      
                        validated=false
                        }
                    else {
                        validated=true
                        console.log('Duplicates dont exist ');
                    }
                   data.plugins.speroplugin.error =!validated;
                    


                            
                  
             





         

                    //TODO: check there is any validation issue
                    // sorun varsa -> validated=false
                    // sorun yoksa -> validated=true
                 
                    

                }

            }

            // final validation
            if (self.settings.testFoldersDuplicate()) {
                // duplicate folders configured, we refuse to send any folder config
                // to the server
                delete data.folder;
            }

            self.settings.active = true;
            return OctoPrint.settings
                .save(data)
                .done(function (data, status, xhr) {
                    self.settings.ignoreNextUpdateEvent = !self.settings.sawUpdateEventWhileSending;
                    self.settings.active = false;
                    self.settings.receiving(true);
                    self.settings.sending(false);

                    try {
                        self.settings.fromResponse(data);
                        if(validated){
                            if (options.success) options.success(data, status, xhr);

                        }else{
                            if (options.error) options.error(xhr, status, "Validation Error");
                        }

                    } finally {
                        self.settings.receiving(false);
                    }
                })
                .fail(function (xhr, status, error) {
                    self.settings.sending(false);
                    self.settings.active = false;
                    if (options.error) options.error(xhr, status, error);
                })
                .always(function (xhr, status) {
                    if (options.complete) options.complete(xhr, status);
                });
        };
       
 
        self.onBeforeBinding = function () {
            try {
                
           
                self.reload_plugin();
                self.fileDatas();
            } catch (error) {
                console.log("onBeforeBinding => ", error);

            }
        };
        self.startQueue = function () {
            try {
                console.log("start_queue")                           
                self.fileDatas();
          
                $.ajax({
                    url:
                        "plugin/speroplugin/startQueue?totalEstimatedTime=" +
                        self.totalEstimatedTime(),
                    method: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: {},
                    success() {
                      console.log("printStarted")
                    },
                });
                  
           
               
               
            } catch (error) {
                console.log("start_queue => ", error);
            }
        };

        


        self.pointer = function (index) {             // tıkladıgım pointerın indexsini döndürür
            try {
              
                if (index > 0) {
                    $.ajax({
                        url: "plugin/speroplugin/pointer?index=" + index,
                        type: "GET",
                        dataType: "json",
                        headers: { "X-Api-Key": UI_API_KEY },
                        success: function (c) {},
                        error: function () {},
                    });
                }
            } catch (error) {
                console.log("pointer error => ", error);
            }
        };

        self.onDataUpdaterPluginMessage = function (plugin, data) { 

            if (plugin == "speroplugin" && !_.isEmpty(data)) {
                
                try {
                   Object.entries(data).forEach((v)=>{
                        self[v[0]](v[1])
                    })
                    // console.log('temp',self.temp());

                    var message =
                        self.temp().toString() +
                        " / " +
                        self.targetBedTemp().toString() +
                        " C";
                    self.itemInfo(message);
                    console.log("ports",self.ports())
                    // console.log(this.itemInfo())
                    // console.log('targetBedTemp',self.targetBedTemp());
                    // console.log('currentIndex',self.currentIndex());
                    // console.log('bedPosition',self.bedPosition());
                    // console.log('motorState',self.motorState());
                    // console.log('isShieldConnected',self.isShieldConnected());
                    // console.log('queueState',self.queueState()); 
              
                    console.log('queues',self.queues())
                    // console.log('currentQueue',self.currentQueue());
                    // console.log('settings',self.settings2())

                    
                   
                    if(self.queueState()=="IDLE"){
                        self.itemState("Await");
                        for(let i=0;i<self.currentItems().length;i++){
                      
                            var item = self.currentItems()[i];
                            item().state(self.itemState());
                      

                    
                         }
                    }


                    if (self.selectedQueue()==undefined){
                        self.selectedQueue(self.currentQueue());

                    }

                    var item = self.currentItems()[self.currentIndex()];
                    item().state(self.itemState());
                    // self.currentQueueItems(self.currentItems()["items"])

                    // console.log('currentQueueItems',self.currentQueueItems());

                    if (self.queueState()=='IDLE'){
                        for (let i = 0; i < self.currentQueue().length; i++){
                            self.currentQueue()["items"][i]["state"] = "Await"


                        }
                    }

                        
              }catch (error) {
                console.log("onDataUpdaterPluginMessage => ", error);
            }
            }
        
        };


        self.front = function () {
            try {
         
                console.log("eject");
        

          
                    $.ajax({
                        url: "plugin/speroplugin/front",
                        method: "GET",
                        dataType: "json",
                        headers: {
                            "X-Api-Key": UI_API_KEY,
                        },
                        data: {},
                        success: function () {},
                    });
                    
                
            } catch (error) {
                console.log("pause resume queue error => ", error);
            }
        };


        self.pauseStopQueue = function (index) {
            try {
                console.log("pause ye basıldı");

                    $.ajax({
                        url: "plugin/speroplugin/pauseStopQueue",
                        method: "GET",
                        dataType: "json",
                        headers: {
                            "X-Api-Key": UI_API_KEY,
                        },
                        data: {},
                        success: function () {},
                    });
                    
                
            } catch (error) {
                console.log("pause resume queue error => ", error);
            }
        };

        self.cancelQueue = function () {
            try {

                console.log("Cansel la basıldı")
                

                $.ajax({
                    url: "plugin/speroplugin/cancelQueue",
                    method: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: {},
                });
            } catch (error) {
                console.log("cancel queue error => ", error);
            }
        };
        self.pauseResumeQueue = function () {
            try {
                console.log("play press");
                $.ajax({
                    url: "plugin/speroplugin/pauseResumeQueue",
                    method: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: {},
                    success: function () {},
                });
            }catch (error) {
            console.log("pause resume queue error => ", error);
        }
    };

        self.getQueue = function (id) {              // queue itemleri atıyor
            if(self.queueState()=='IDLE'){
                 try {
       
                    console.log("Our queue id is =>=> ", id);
                    $.ajax({
                        url: "plugin/speroplugin/getQueue?id=" + id,
                        method: "GET",
                        dataType: "json",
                        headers: {
                            "X-Api-Key": UI_API_KEY,
                        },
                        success() {
                            ko.utils.arrayFirst(self.queues(), function (item) {
                                var reload =
                                    self.queueState() == "IDLE"
                                if (item.id == id) {
                                    self.queueId(item.id);
                                    self.queueName(item.name);

                                    var queue = self.reload_items(
                                        item.items,
                                        (reload = reload)
                                    );
                                    console.log("Array get successfull!");
                                    return queue;
                                }
                            });
                        },
                    });
                } catch (error) {
                    console.log("getQueue => ", error);
                }
        }};
        self.selectedQueue.subscribe(function (q) {
            if (q != undefined || q != null) {
            
                self.getQueue(q.id);
                self.queueName(q.name)
                self.queuesIndex(q.index)
 
                
            }
        });

        self.selectedPort.subscribe(function (r) {
            if (r != undefined || r != null) {
                console.log(r)
                self.portName(r)
                self.sendPort(r)
                data=self.selectedPort()

                $.ajax({
                    url: "plugin/speroplugin/selectedPort",
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: json,
                });

                
                
    
            }
        });

        // self.selectedPort = function (data) {
        //     try {
        //         console.log(data)
        //         json = JSON.stringify({ request: data });
        //         
        //     } catch (error) {
        //         console.log("deviceControl => ", error);
        //     }
        // };


 


        self.sendPort = function (data) {
            try {
                console.log(data)
                json = JSON.stringify({ request: data });
                $.ajax({
                    url: "plugin/speroplugin/sendPort",
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: json,
                });
            } catch (error) {
                console.log("deviceControl => ", error);
            }
        };

        self.deviceControl = function (data) {
            try {
                console.log(data)
                json = JSON.stringify({ request: data });
                $.ajax({
                    url: "plugin/speroplugin/deviceControl",
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: json,
                });
            } catch (error) {
                console.log("deviceControl => ", error);
            }
        };


        $(document).ready(function () {
            try {
                let regex =
                    /<div class="btn-group action-buttons">([\s\S]*)<.div>/im;
                let template =
                    '<div class="btn btn-mini bold" data-bind="click: function() { $root.fileAdItem($data) }," title="Add To Queue" ><i></i>P</div>';

                $("#files_template_machinecode").text(function () {
                    var return_value = $(this).text();
                    return_value = return_value.replace(
                        regex,
                        '<div class="btn-group action-buttons">$1	' +
                            template +
                            "></div>"
                    );
                    return return_value;
                });
            } catch (error) {
                console.log("document ready error => ", error);
            }
        });


        self.checkPrinting = function () {
            try {
                var have_print = false;

                self.currentItems().forEach((element) => {
                    if (
                        element().state() == "Printing" ||
                        element().state() == "Paused"
                    ) {
                        have_print = true;
                        return have_print;
                    }
                });
                return have_print;
            } catch (error) {
                console.log("check_printing => ", error);
            }
        };


        self.printerState.printTime.subscribe(function (data) {
            try {
              
                   {
                        if (data != null || data != undefined) {
                            self.currentItems()
                                [self.currentIndex()]()
                                .timeLeft(self.printerState.printTimeLeft());
                            self.currentItems()
                                [self.currentIndex()]()
                                .progress(
                                    self.printerState.progressString() ?? 0
                                );

                            self.totalPrintTime();
                            self.sendTimeData();
                        }
                    }
                
            } catch (error) {
                console.log("print time subscription => ", error);
            }
        });

      
        self.printerState.stateString.subscribe(function (state) {
            try {   
            
            
                if (self.queueState != "IDLE") {
                    var item = self.currentItems()[self.currentIndex()];
                    if (
                        state != "Operational" &&
                        state != "Finished" &&
                        state != "Cancelled"
                    ) {
                        switch (state) {
                            case "Printing":
                                
                                item().color("#F9F9F9");
                                item().state(state);
                                if (self.queueState() != "PAUSED")
                                    self.queueState("RUNNING");
                                break;
                            case "Pausing":
                                item().color("#F9F9F9");
                                item().state(state);
                                self.queueState("PAUSING");
                                break;
                            case "Paused":
                                item().color("#F9F9F9");
                                item().state(state);
                                self.queueState("PAUSED");
                                break;
                                
                            case "Eject Faild":
                                item().color("red");
                                item().state(state);
                                self.queueState("EJECT FAILD");
                                break;

                            case "Resummed":
                                    item().color("red");
                                    item().state(state);
                                    self.queueState("RUNNING");
                                    break;


                            case "Cancelled":
                                item().color("red");
                                item().state(state);
                                self.queueState("CANCELLED");
                                break;
                            default:
                                break;
                        }
                    }
                }
                
                
            } catch (error) {
                console.log("printerState => ", error);
            }
        });

        self.queueAddItem = function (data) {
            try {
                self.check_add_remove("add", data.item);

                var jsonData = JSON.stringify({
                    index: self.itemCount - 1,
                    item: data.item,
                });

                $.ajax({
                    url: "plugin/speroplugin/queueAddItem",
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: jsonData,
                    success: function (data) {},
                    error: function (err) {
                        return console.log("Error occured", err);
                    },
                });
            } catch (error) {
                console.log("item add error ==> ", error);
            }
        };
        self.files.fileAdItem = function (data) {
            try {
                var sd = "true";
                if (data.origin == "local") {
                    sd = "false";
                } 
                
                var item = {
                    name: data.name,
                    path: data.path,
                    timeLeft: data.gcodeAnalysis.estimatedPrintTime,
                    sd: sd,
                };

                self.queueAddItem({
                    item,
                });
                
            } catch (e) {
                console.log("File add item error => ", e);
            }
        };
        self.saveToDataBase = function (val,e) {

           
            const newName = e.target.value??'';
            console.log(newName)
            console.log(self.selectedQueue())
            console.log(self.queues())
            console.log(self.queuesIndex())
         
            try {
                $.ajax({
                    url: "plugin/speroplugin/saveToDataBase",
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: JSON.stringify({
                        queueName: newName,
                        id: self.selectedQueue().id,
                        index:self.queuesIndex()

                    }),
                    success() {
                        
                        self.queueName(newName)
                   

                        console.log("----------reload----------")
                        self.reload_plugin();
                    },
                });
            } catch (error) {
                console.log("save_to_database => ", error);
            }
        };

    
        self.reload_items = function (items = [], reload = false) {
            try {
                self.itemCount = items.length;
                var templist = [];

                items.forEach((e) => {
                    var temp = ko.observable({
                        index: ko.observable(e.index),
                        name: ko.observable(e.name),
                        progress: ko.observable(0),
                        timeLeft: ko.observable(e.timeLeft),
                        state: ko.observable(!reload ? e.state : "Await"),
                        previous_state: ko.observable(""),
                        color: ko.observable(
                            !reload
                                ? e.state == "Printing"
                                    ? "#F9F9F9"
                                    : e.state == "Ejecting"
                                    ? "#F9F9F9"
                                    : e.state == "Finished"
                                    ? "#F9F9F9"
                                    : e.state == "Cancelling"
                                    ? "#F9F9F9"
                                    : e.state == "Canceled" ||
                                      e.state == "Failed"
                                    ? "#F9F9F9"
                                    : e.state == "Paused"
                                    ? "#F9F9F9"
                                    : "#F9F9F9"
                                : "#F9F9F9"
                        ),
                    });
                    templist.push(temp);
                });
                self.currentItems(templist);
                return templist;
            } catch (error) {
                console.log("reload_items => ", error);
            }
        };

        self.reload_plugin = function () {

    
            try {
                $.ajax({
                    url: "plugin/speroplugin/sendStartDatas",
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function (item) {
                       
                    },
                });
            } catch (error) {
                console.log("reload_plugin => ", error);
            }
        };    
        self.createQueue = function () {
            try {
                // self.queueState('IDLE');
                // self.queueState=='IDLE';
                $.ajax({
                    url: "/plugin/speroplugin/createQueue",
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function (r) {
                    
                        self.reload_plugin();
                    },
                    error: function (e) {
                        console.log(e);
                    },
                });
            } catch (error) {
                console.log("create queue error => ", error);
            }
        };
        self.check_add_remove = function (type, data) {
            try {
                if (type == "add") {
                    var index = self.itemCount;
                    var temp = ko.observable({
                        index: ko.observable(index),
                        name: ko.observable(data.name),
                        progress: ko.observable("-"),
                        timeLeft: ko.observable(data.timeLeft),
                        state: ko.observable("Await"),
                        previous_state: ko.observable(""),
                        color: ko.observable("#F9F9F9"),
                    });
                    self.currentItems.push(temp);
                    self.itemCount += 1;
                }
                if (type == "remove") {
                    self.currentItems.remove(self.currentItems()[data]);
                    self.currentItems().forEach((element) => {
                        if (element().index() > data) {
                            element().index(element().index() - 1);
                        }
                    });
                    self.itemCount -= 1;
                }
            } catch (error) {
                console.log("check_add_remove => ", error);
            }
        };

        self.queueRemoveItem = function (data) {
            try {
                self.check_add_remove("remove", data);
                $.ajax({
                    url: "plugin/speroplugin/queueRemoveItem?index=" + data,
                    type: "DELETE",
                    dataType: "text",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                });
            } catch (error) {
                console.log("item remove error => ", error);
            }
        };
        self.fileDatas = function (index = null) {
            try {
             
                $.ajax({
                    url: "/api/files?recursive=true",
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: {},
                    success(data) {
                        self.currentItems().forEach((item) => {
                            var isNotCancel =
                                item().state() != "Canceled" &&
                                item().state() != "Cancelling";
                            var isNotFinish =
                                item().state() != "Ejecting" &&
                                item().state() != "Finished";

                            data.files.forEach((file) => {
                                if (index == null || item().index() == index) {
                                    if (file.children) {
                                        file.children.forEach((child) => {
                                            if (item().name() == child.name) {
                                                if (
                                                    isNotCancel &&
                                                    isNotFinish
                                                ) {
                                                    item().timeLeft(
                                                        child.gcodeAnalysis
                                                            .estimatedPrintTime
                                                    );
                                                } else {
                                                    item().timeLeft(0);
                                                }
                                                return;
                                            }
                                        });
                                    } else {
                                        if (item().name() == file.name) {
                                            if (isNotCancel && isNotFinish) {
                                                item().timeLeft(
                                                    file.gcodeAnalysis
                                                        .estimatedPrintTime
                                                );
                                            } else {
                                                item().timeLeft(0);
                                            }
                                            return;
                                        }
                                    }
                                }
                            });
                            if (index != null && index == item().index()) {
                                return;
                            }
                        });
                    },
                });
            } catch (error) {
                console.log("fileDatas => ", error);
            }
        };
        self.sendTimeData = function (
            customIndex = null,
            sendTotalTime = true
        ) {
            try {
                customIndex =
                    customIndex != null ? customIndex : self.currentIndex();

                var time = JSON.stringify({
                    index: customIndex,
                    timeLeft:
                        self.currentItems()[customIndex]().timeLeft() ?? 0,
                    totalEstimatedTime: sendTotalTime
                        ? self.totalEstimatedTime()
                        : null,
                });

                $.ajax({
                    url: "plugin/speroplugin/sendTimeData",
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: time,
                    success() {},
                });
            } catch (error) {
                console.log("sendTimeData => ", error);
            }
        };
    
        self.totalPrintTime = function () {
            try {
                var totalTime = 0;
                self.currentItems().forEach((element) => {
                    totalTime += parseInt(element().timeLeft());
                });
                self.totalEstimatedTime(totalTime);
            } catch (error) {
                console.log("totalPrintTime error => ", error);
            }
        };

        self.toHHMMSS = function (sec_num) {
            try {
                if (!isNaN(sec_num) && sec_num > 0 ) {
                    var secs = parseInt(sec_num, 10);
                    var hours = Math.floor(secs / 3600);
                    var minutes = Math.floor((secs - hours * 3600) / 60);
                    var seconds = secs - hours * 3600 - minutes * 60;

                    if (hours < 10) {
                        hours = "0" + hours;
                    }
                    if (minutes < 10) {
                        minutes = "0" + minutes;
                    }
                    if (seconds < 10) {
                        seconds = "0" + seconds;
                    }

                    return hours + ":" + minutes + ":" + seconds;
                } else return "-";
            } catch (error) {
                console.log("toHHMMSS error ==> ", error);
            }
        };
        self.queueItemDown = function (index) {
            try {
                if (index < self.currentItems().length - 1) {
                    self.row_change_items("down", index);

                    $.ajax({
                        url: "plugin/speroplugin/queueItemDown?index=" + index,
                        type: "GET",
                        dataType: "json",
                        headers: { "X-Api-Key": UI_API_KEY },
                        success: function (c) {},
                        error: function () {},
                    });
                }
            } catch (error) {
                console.log("queueItemDown error => ", error);
            }
        };
        self.row_change_items = function (type, index) {
            try {
                var newIndex;

                if (type == "up") newIndex = index - 1;
                if (type == "down") newIndex = index + 1;

                var itemCurrent = new self.currentItems()[index]();
                var itemNext = new self.currentItems()[newIndex]();

                itemCurrent.index(newIndex);
                itemNext.index(index);

                self.currentItems()[index](itemNext);
                self.currentItems()[newIndex](itemCurrent);
            } catch (error) {
                console.log("row change items error => ", error);
            }
        };
        self.queueItemUp = function (index) {
            try {
                if (index > 0) {
                    self.row_change_items("up", index);
                    $.ajax({
                        url: "plugin/speroplugin/queueItemUp?index=" + index,
                        type: "GET",
                        dataType: "json",
                        headers: { "X-Api-Key": UI_API_KEY },
                        success: function (c) {},
                        error: function () {},
                    });
                }
            } catch (error) {
                console.log("queueItemUp error => ", error);
            }
        };

        self.sayhello = function () {
         
            console.log("Hello!");
            

        };
      
        
        self.queueItemDuplicate = function (data) {
            try {
                console.log("asjhkdlbsad")
                $.ajax({
                    url: "plugin/speroplugin/queueItemDuplicate?index=" + data,
                    type: "GET",
                    dataType: "text",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function () {
                        self.reload_plugin();
                    },
                });
            } catch (error) {
                console.log("duplicate item error => ", error);
            }
        };
        self.deleteFromDatabase = function () {
            try {
                if (self.queueId() != undefined || self.queueId() != null);
                $.ajax({
                    url:
                        "plugin/speroplugin/deleteFromDatabase?id=" +
                        self.queueId(),
                    method: "DELETE",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: {},
                    success() {

                        self.queueName(null);
                        self.queueId(null);
                        self.currentItems(null);

                        self.reload_plugin();
                        
                    },
                });
            } catch (error) {
                console.log("deleteFromDatabase => ", error);
            }


        self.recursiveGetFiles = function (files) {
                try {
                    var filelist = [];
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        if (
                            file.name.toLowerCase().indexOf(".gco") > -1 ||
                            file.name.toLowerCase().indexOf(".gcode") > -1
                        ) {
                            filelist.push(file);
                        } else if (file.children != undefined) {
                            filelist = filelist.concat(
                                self.recursiveGetFiles(file.children)
                            );
                        }
                    }
                    return filelist;
                } catch (error) {
                    console.log("recursiveGetFiles error => ", error);
                }
            };
    
        self.toHHMMSS = function (sec_num) {
            try {
                if (!isNaN(sec_num) && sec_num > 0 ) {
                    var secs = parseInt(sec_num, 10);
                    var hours = Math.floor(secs / 3600);
                    var minutes = Math.floor((secs - hours * 3600) / 60);
                    var seconds = secs - hours * 3600 - minutes * 60;

                    if (hours < 10) {
                        hours = "0" + hours;
                    }
                    if (minutes < 10) {
                        minutes = "0" + minutes;
                    }
                    if (seconds < 10) {
                        seconds = "0" + seconds;
                    }

                    return hours + ":" + minutes + ":" + seconds;
                } else return "-";
            } catch (error) {
                console.log("toHHMMSS error ==> ", error);
            }
        };
        };
    }


    OCTOPRINT_VIEWMODELS.push({
        construct: SperoViewModel,
        // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
        dependencies: ["printerStateViewModel",
            "connectionViewModel",
            "loginStateViewModel",
            "filesViewModel",
            "settingsViewModel",
            "temperatureViewModel", ],
        // Elements to bind to, e.g. #settings_plugin_speroplugin, #tab_plugin_speroplugin, ...
        elements: ["#tab_plugin_speroplugin"],
    });
});