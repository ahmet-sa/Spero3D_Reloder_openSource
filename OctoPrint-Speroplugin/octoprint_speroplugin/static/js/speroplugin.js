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
        self.device=ko.observable(0)
        self.queueState=ko.observable("IDLE");
        self.queueName = ko.observable(0);
        self.queuesIndex=ko.observable(0);
        self.currentQueue=ko.observable(0);
        self.ejectFail=ko.observable(0);
        self.createQueueEnable=ko.observable(0);

        self.itemState=ko.observable();
        self.targetBedTemp=ko.observable(0);
        self.firstQueue=true;


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





        self.onBeforeBinding = function () {
            try {

                self.reloadPlugin();
                self.fileDatas();
            } catch (error) {
                console.log("onBeforeBinding => ", error);

            }
        };

        self.startQueue = function () {
            try {
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
          

                    var message =
                        self.temp().toString() +
                        " / " +
                        self.targetBedTemp().toString() +
                        " C";
                    self.itemInfo(message);


     


                    if(self.firstQueue==true && self.currentQueue()!="0"){
                    self.firstQueue=false
                    self.selectedQueue(self.currentQueue())
                    }





                    if(self.queueState()=="IDLE"){
                        self.itemState("Await");
                        for(let i=0;i<self.currentItems().length;i++){

                            var item = self.currentItems()[i];
                            item().state(self.itemState());



                         }
                    }




                    var item = self.currentItems()[self.currentIndex()];
                    item().state(self.itemState());
                    self.currentQueueItems(self.currentItems()["items"])


                    if (self.queueState()=='IDLE'){
                        for (let i = 0; i < self.currentQueue().length; i++){
                            self.currentQueue()["items"][i]["state"] = "Await"


                        }
                    }


              }catch (error) {
            }
            }

        };






        self.pauseStopQueue = function (index) {
            try {

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
                                    self.reloadItems(item.items)
                                    var queue = self.reloadItems(
                                        item.items,
                                        (reload = reload)
                                    );

                                    return queue;
                                }
                            });
                        },
                    });
                } catch (error) {
                }
        }};

      
        self.selectedQueue.subscribe(function (q) {
            if (q != undefined || q != null) {
                
  
                self.queueName(q.name)
                self.queuesIndex(q.index)
                


                if (q.items==[] || q.items==undefined) {
                  self.queueName(q.name)

                }
                else{
                    self.currentQueue(q)
                    self.getQueue(q.id)
                    self.queueName(q.name)
                    self.queuesIndex(q.index)

                }


            }
        });

        self.selectedPort.subscribe(function (r) {
            if (r != undefined || r != null) {
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

  

        self.sendPort = function (data) {
            try {
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
                self.checkAddRemove("add", data.item);
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

            self.currentId="sa"
            if (self.queuesIndex()==undefined){
                self.queuesIndex(self.queues().length)


            }else(

                self.queuesIndex(((self.queues().length)-1))


            )
            
            if (self.selectedQueue()==undefined){

                self.currentId=self.currentQueue().id


            }
            else{

                self.currentId =self.selectedQueue().id
            }
         
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
                        id:  self.currentId,
                        index:self.queuesIndex()

                    }),
                    success() {

                        self.queueName(newName)


                        self.reloadPlugin();
                    },
                });
            } catch (error) {
                console.log("save_to_database => ", error);
            }
        };


        self.reloadItems = function (items = [], reload = false) {

            try {
                if (items!=undefined){

                    
                    self.itemCount = items.length;
    
                }
              
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
                console.log("reloadItems => ", error);
            }
        };

        self.reloadPlugin = function () {


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
                console.log("reloadPlugin => ", error);
            }
        };
        self.createQueue = function () {
            try {
             
                $.ajax({
                    url: "/plugin/speroplugin/createQueue",
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function (r) {  
                    self.selectedQueue((self.currentItems()))
                    self.currentItems(self.currentQueue().items)
                    self.itemCount=0
                    self.reloadPlugin();
                    },
                    error: function (e) {
                        console.log(e);
                    },
                });
            } catch (error) {
                console.log("create queue error => ", error);
            }
        };
        self.checkAddRemove = function (type, data) {
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
                console.log("checkAddRemove => ", error);
            }
        };

        self.queueRemoveItem = function (data) {
            try {
                self.checkAddRemove("remove", data);
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
                    self.rowChangeItems("down", index);

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
        self.rowChangeItems = function (type, index) {
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
                    self.rowChangeItems("up", index);
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

        self.checkCreateQueueEnable = function () {
            console.log("hello")
            if(self.selectedQueue()==undefined){
                self.createQueueEnable("idle")
                }
            else{
                self.createQueueEnable("false")

            }    


        };


        self.queueItemDuplicate = function (data) {
            try {
                $.ajax({
                    url: "plugin/speroplugin/queueItemDuplicate?index=" + data,
                    type: "GET",
                    dataType: "text",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function () {
                        self.reloadPlugin();
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

                        self.reloadPlugin();

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