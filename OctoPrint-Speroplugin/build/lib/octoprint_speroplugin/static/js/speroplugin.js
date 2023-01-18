/*
 * View model for OctoPrint-Speroplugin
 *
 * Author: AHMET SARIOĞLU
 * License: AGPLv3
 */
$(function() {
    function SperoViewModel(parameters) {

        var self = this;
        // var queueDirectories = fs.readdirSync(
        //     "C:/devel/octoprint-speroplugin/octoprint-speroplugin/queues"
        // );

        self.kontrol=true;
        self.target_temp = 40;
        self.motor_1=15
        self.motor_2 =18;
        self.front_switch =27;
        self.switch_back =22;
        self.forward_button =2;
        self.backworld_button =3;
        self.Sequence_button =4;
        self.min_Task =40;
        self.queues_max =10;
        self.seconds_delay =10;
        self.eject_fail = ko.observable(false);
        self.backworld = ko.observable(false);
        self.stop = ko.observable(false);
        self.Connection=ko.observable(null);
        self.Connection(true);

        
        self.printerState = parameters[0];
        self.connectionState = parameters[1];
        self.loginState = parameters[2];
        self.files = parameters[3];
        self.settings = parameters[4];
        self.temperature = parameters[5];

        self.option_key = ko.observable();
        self.searchName = ko.observable();

        self.queues = ko.observableArray([]);
        self.currentItems = ko.observableArray([]);
        self.queue_id = ko.observable(null);
        self.queue_name = ko.observable(null);
        self.queue_state = ko.observable("IDLE");

        self.selectedQueue = ko.observable();

        self.isQueueStarted = ko.observable(false);
        self.isQueuePrinting = ko.observable(false);
        self.isManualEject = ko.observable(false);

        self.connection = ko.observable(false);
        self.client_address = ko.observable(null);
        self.client_state = ko.observable(null);
        self.client_motor = ko.observable(null);
        self.client_position = ko.observable(null);

        self.item_info = ko.observable();
        self.info_message = ko.observable();
        self.info_color = ko.observable();

        self.terminating = ko.observable(false);
        self.ejecting = ko.observable(false);
        self.eject_fail = ko.observable(false);

        self.item_count = 0;
        self.target_temp = 40;
        self.currentIndex = ko.observable();

        self.totalEstimatedTime = ko.observable(0);
        

        self.onBeforeBinding = function () {
            try {
                self.check_connection();
                self.reload_plugin();
                self.fileDatas();
                self.sendPrinterState();
            } catch (error) {
                console.log("onBeforeBinding => ", error);
            }
        };
        self.start_queue = function () {
            try {
                a=5;
                self.Connection(true);
                if (self.connection()) {
                    self.isQueueStarted(true);
                    self.terminating(false);
                    if (
                        a==5
                    ) {
                        self.fileDatas();
                        self.currentItems().forEach((item) => {
                            self.sendTimeData(item().index(), false);
                        });

                        $.ajax({
                            url:
                                "plugin/speroplugin/start_queue?totalEstimatedTime=" +
                                self.totalEstimatedTime(),
                            method: "GET",
                            dataType: "json",
                            headers: {
                                "X-Api-Key": UI_API_KEY,
                            },
                            data: {},
                            success() {
                                self.send_info("Queue started", "info");
                                self.queue_state("STARTED");
                                self.currentIndex(0);
                                var totalTime = 0;
                                self.currentItems().forEach((element) => {
                                    totalTime += element().timeLeft();
                                });
                                self.totalEstimatedTime(parseInt(totalTime));
                            },
                        });
                    } else {
                        self.send_info(
                            "Please connect an Sheild first.",
                            "warning"
                        );
                    }
                } else {
                    self.send_info("Printer not connected.", "warning");
                }
            } catch (error) {
                console.log("start_queue => ", error);
            }
        };
        self.sendPrinterState = function () {
            // setInterval(function () {
            //     var disable = self.printerState.isBusy() ? 0 : 1;
            //     var json = JSON.stringify({ disableEject: disable });
            //     $.ajax({
            //         url: "plugin/speroplugin/sendPrinterState",
            //         method: "POST",
            //         dataType: "json",
            //         data: json,
            //         headers: {
            //             "X-Api-Key": UI_API_KEY,
            //         },
            //         success(r) {},
            //     });
            // }, 5000);
        };

        self.sendTerminateMessage = function () {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    if (self.queue_state != "IDLE") {
                        self.ejecting(true);
                        $.ajax({
                            url: "plugin/speroplugin/sendTerminateMessage",
                            method: "GET",
                            dataType: "json",
                            headers: {
                                "X-Api-Key": UI_API_KEY,
                            },
                            success(r) {},
                        });
                    }
                }
            } catch (error) {
                console.log("sendTerminateMessage error => ", error);
            }
        };

        self.prev_check = function (index) {
            try {
                if (self.currentItems().length > 1) {
                    let state = self.currentItems()[index - 1]().state();
                    if (state == "Await") {
                        return false;
                    } else return true;
                } else return true;
            } catch (error) {
                console.log("prev_check => ", error);
            }
        };

        self.check_connection = function () {
            try {
                $.ajax({
                    url: "/api/connection",
                    method: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success(r) {
                        if (r["current"]["port"] != null) {
                            self.connection(true);
                        } else {
                            self.connection(false);
                        }
                    },
                });
            } catch (error) {
                console.log("connection check error => ", error);
            }
            b=5;
            if(b==5);
            self.Connection(true);
        };


        self.check_is_busy = ko.computed(function () {
            if (
                self.isQueuePrinting() == false &&
                self.printerState.isBusy() == true
            ) {
                return false;
            } else {
                return true;
            }
        }, self);

        self.onDataUpdaterPluginMessage = function (plugin, data) { 
            if (plugin == "speroplugin") {
                try {
                    
                    if (data["motorPin1"])
                        self.motor_1 = data["motorPin1"];

                    if (data["motorPin2"])
                         self.motor_2 = data["motorPin2"];
                    if (data["switchFront"])
                         self.front_switch = data["switchFront"];     

                    if (data["switchBack"])
                         self.switch_back = data["switchBack"];

                    if (data["button_Forward"])
                    self.forward_button = data["button_Forward"];

                    if (data["buttonBackword"])
                         self.backworld_button = data["buttonBackword"];

                    if (data["buttonSequence"])
                    self.Sequence_button = data["buttonSequence"];

                    if (data["minTaskTemp"])
                         self.min_Task = data["minTaskTemp"];
                         speroplugin
                    if (data["maxQueues"])
                    self.queues_max = data["maxQueues"];

                    if (data["delaySeconds"])
                         self.seconds_delay = data["delaySeconds"];
                    if (data["isQueuePrinting"] != undefined) {
                            self.isQueuePrinting(data["isQueuePrinting"]);
                        }
                    if (data["isManualEject"] != undefined) {
                            self.isManualEject(data["isManualEject"]);
                        }
                    if (data["index"]) {
                            self.currentIndex(data["index"]);
                        }
                    if (data["itemResult"]) {
                            var item = self.currentItems()[self.currentIndex()];
    
                            item().state(data["itemResult"]);
                            item().previous_state(data["itemResult"]);
    
                            if (data["itemResult"] == "Finished")
                                item().color("darkseagreen");
                            if (data["itemResult"] == "Canceled")
                                item().color("lightcoral");
    
                            item().timeLeft(0);
                        }
                        if (data["targetTemp"])
                            self.target_temp = data["targetTemp"];
    
                        if (data["terminate"]) {
                                self.terminating(data["terminate"]);
                            }
                        if (data["stop"]) {
                            if (self.queue_state() == "CANCELED") {
                                    self.send_info("Queue canceled.", "danger");
                            } else {
                                    self.send_info("Queue finished!", "success");
                            }
        
                            self.terminating(false);
                            self.isQueueStarted(false);
                            self.ejecting(false);
        
                            self.currentItems().forEach((element) => {
                                element().state("Await");
                                element().color("white");
                            });
        
                                self.currentIndex(0);
                                self.queue_state("IDLE");
                        }
                           //deneme bölümü
                        if (data["eject_fail"] != undefined) {
                            self.eject_fail(data["eject_fail"]);
                            console.log("Eject fail = ", data["eject_fail"]);
                            if (data["eject_fail"] == false) {
                                self.item_info(null);
                            } else {
                                self.item_info("Ejecting failed!");
                            }
                        }
                        //
                            
        
                            if (data["esp"] != undefined) {
                                self.client_state(data["esp"]["connection"]);
        
                                self.client_address(data["esp"]["address"]);
        
                                if (data["esp"]["motor"] != undefined) {
                                    var motor = data["esp"]["motor"];
        
                                    self.client_motor(motor);
        
                                    if (self.ejecting() == true) {
                                        self.item_info("Terminating...");
                                    }
        
                                    if (
                                        motor == "eject_done" ||
                                        motor == "eject_cancel"
                                    ) {
                                        self.item_info(null);
                                        self.ejecting(false);
                                        self.terminating(false);
                                    }
                                }
        
                                if (data["esp"]["position"] != undefined)
                                    self.client_position(data["esp"]["position"]);
                            }
                        } catch (error) {
                            console.log("onDataUpdaterPluginMessage => ", error);
                        }
                    } else return;
                };
      
        self.temperature.bedTemp["actual"].subscribe(function (data) {
            try {
                if (
                    self.isQueueStarted() &&
                    self.isQueuePrinting() &&
                    !self.isManualEject()
                ) {
                    console.log();
                    var isEmpty = self.check_empty("current_queue");
                    if (!isEmpty) {
                        var itemState = self
                            .currentItems()
                            [self.currentIndex()]()
                            .state();
                        if (
                            itemState == "Cancelling" ||
                            itemState == "Finishing"
                        ) {
                            if (self.ejecting() == true) return;
                            if (
                                data > self.target_temp &&
                                self.ejecting() == false
                            ) {
                                var message =
                                    "Bed Temp : " +
                                    data.toString() +
                                    " / " +
                                    self.target_temp.toString() +
                                    " C";
                                self.item_info(message);
                            } else if (
                                data <= self.target_temp &&
                                self.ejecting() == false
                            ) {
                                self.sendTerminateMessage();
                            }
                        }
                    }
                }
            } catch (error) {
                console.log("temp bedtemp error => ", error);
            }
        });
        self.onEventStart = function (payload) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    self.terminating(false);
                    self.queue_state("RUNNING");
               
                }
            } catch (error) {
                console.log("resume print event error => ", error);
            }
        };
        self.cancel_queue = function () {
            try {
                self.terminating(true);
                self.queue_state("CANCELED");
                self.send_info("Queue cancelling right now.", "warning");

                $.ajax({
                    url: "plugin/speroplugin/cancel_queue",
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
        self.pause_resume_queue = function () {
            try {
                if (self.isQueueStarted()) {
                    if (self.connection()) {
                        if (self.queue_state() == "RUNNING") {
                            self.queue_state("PAUSED");
                            self.send_info("Queue paused.", "info");
                        } else if (self.queue_state() == "PAUSED") {
                            self.send_info("Queue resumed", "info");
                            self.queue_state("RUNNING");
                        }

                        $.ajax({
                            url: "plugin/speroplugin/pause_resume_queue",
                            method: "GET",
                            dataType: "json",
                            headers: {
                                "X-Api-Key": UI_API_KEY,
                            },
                            data: {},
                            success: function () {},
                        });
                    }
                } else {
                    self.send_info("Connect printer first.", "warning");
                }
            } catch (error) {
                console.log("pause resume queue error => ", error);
            }
        };

        self.get_queue = function (id) {
            try {
                console.log("Our queue id is =>=> ", id);
                $.ajax({
                    url: "plugin/speroplugin/get_queue?id=" + id,
                    method: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success() {
                        ko.utils.arrayFirst(self.queues(), function (item) {
                            var reload =
                                self.queue_state() == "IDLE" ? true : false;
                            if (item.id == id) {
                                console.log(item);

                                self.queue_id(item.id);
                                self.queue_name(item.name);

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
                console.log("get_queue => ", error);
            }
        }; self.selectedQueue.subscribe(function (q) {
            if (q != undefined || q != null) {
                self.get_queue(q.id);
            }
        });
        self.device_controll = function (data) {
            try {
                if (self.eject_fail() == true) {
                    self.eject_fail(false);
                    if (data == "cancel") {
                        self.ejecting(false);
                        self.terminating(false);
                    } else if (data == "eject") {
                        self.ejecting(true);
                        self.terminating(true);
                    }
                }
                json = JSON.stringify({ request: data });
                $.ajax({
                    url: "plugin/speroplugin/device_controll",
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: json,
                });
            } catch (error) {
                console.log("device_controll => ", error);
            }
        };
        $(document).ready(function () {
            try {
                let regex =
                    /<div class="btn-group action-buttons">([\s\S]*)<.div>/im;
                let template =
                    '<div class="btn btn-mini bold" data-bind="click: function() { $root.file_add_item2($data) }" title="Add To Queue" ><i></i>P</div>';

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

        self.check_empty = function (type) {
            try {
                var list = [];

                if (type == "queues") list = self.queues();
                if (type == "current_queue") list = self.currentItems();

                if (list != null && list != undefined) {
                    if (list.length > 0) return false;
                    else return true;
                } else return true;
            } catch (e) {
                console.log("check_empty => ", e);
            }
        };

        self.check_printing = function () {
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

        self.onEventError = function (payload) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    if (self.queue_state() != "IDLE") {
                        var item = self.currentItems()[self.currentIndex()];

                        if (item().state() != "Cancelling") {
                            self.terminating(false);
                            item().state("Failed");
                            item().color("lightcoral");
                            self.queue_state("PAUSED");

                            self.send_info(
                                "Error occurs while printing!",
                                "Danger"
                            );
                        }
                    }
                }
            } catch (error) {
                console.log("onEventError error => ", error);
            }
        };

        self.onEventDisconnected = function (payload) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    if (self.queue_state() != "IDLE") {
                        var item = self.currentItems()[self.currentIndex()];

                        if (
                            item().state() != "Cancelled" ||
                            item().state() != "Cancelling"
                        ) {
                            self.terminating(false);
                            self.isQueuePrinting(false);

                            item().state("Failed");
                            item().color("lightcoral");
                            self.queue_state("PAUSED");

                            self.send_info("Printer disconnected!", "danger");
                        }
                    } else self.connection(false);
                }
            } catch (error) {
                console.log("disconnect event error => ", error);
            }
        };

        self.onEventPrintResumed = function (payload) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    self.terminating(false);
                    self.queue_state("RUNNING");
                }
            } catch (error) {
                console.log("resume print event error => ", error);
            }
        };

        self.onEventPrintDone = function (payload) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    var item = self.currentItems()[self.currentIndex()];
                    self.terminating(true);
                    item().state("Finishing");
                    item().color("#bfd9bf");
                }
            } catch (error) {
                console.log("print done event error => ", error);
            }
        };

        self.onEventPrintCancelled = function (payload) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    var item = self.currentItems()[self.currentIndex()];

                    self.terminating(true);
                    item().state("Cancelling");
                    item().color("#f7bbbb");

                    if (self.queue_state() != "CANCELED")
                        self.queue_state("PAUSED");
                }
            } catch (error) {
                console.log("print cancel event error => ", error);
            }
        };

        self.onEventConnected = function (payload) {
            try {
                self.terminating(false);
                self.connection(true);
            } catch (error) {
                console.log("connect event error => ", error);
            }
        };

        self.printerState.printTime.subscribe(function (data) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    if (
                        self.currentIndex() != null &&
                        self.queue_state() != "IDLE"
                    ) {
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
                }
            } catch (error) {
                console.log("print time subscription => ", error);
            }
        });

        self.printerState.stateString.subscribe(function (state) {
            try {
                if (self.isQueueStarted() && self.isQueuePrinting()) {
                    if (
                        self.check_empty("current_queue") == false &&
                        self.currentIndex() != null
                    ) {
                        if (self.queue_state != "IDLE") {
                            var item = self.currentItems()[self.currentIndex()];
                            if (
                                state != "Operational" &&
                                state != "Finished" &&
                                state != "Cancelled"
                            ) {
                                switch (state) {
                                    case "Printing":
                                        self.terminating(false);
                                        item().color("bisque");
                                        item().state(state);
                                        if (self.queue_state() != "PAUSED")
                                            self.queue_state("RUNNING");
                                        break;
                                    case "Pausing":
                                        self.terminating(true);
                                        item().color("lightgrey");
                                        item().state(state);
                                        self.queue_state("PAUSING");
                                        break;
                                    case "Paused":
                                        self.terminating(false);
                                        item().color("lightgrey");
                                        item().state(state);
                                        self.queue_state("PAUSED");
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.log("printerState => ", error);
            }
        });

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

        self.check_removed = function () {
            try {
                if (
                    (self.queue_id() == undefined || self.queue_id() == null) &&
                    (self.queue_name() == null ||
                        self.queue_name() == undefined)
                ) {
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                console.log("check_empty => ", e);
            }
        };

        self.queue_item_add = function (data) {
            try {
                self.check_add_remove("add", data.item);

                var jsonData = JSON.stringify({
                    index: self.item_count - 1,
                    item: data.item,
                });

                $.ajax({
                    url: "plugin/speroplugin/queue_add_item",
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
        self.files.file_add_item2 = function (data) {
            try {
                if (self.check_removed() != true) {
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

                    self.queue_item_add({
                        item,
                    });
                } else {
                    self.send_info("Create a queue first!", "danger");
                }
            } catch (e) {
                console.log("File add item error => ", e);
            }
        };
        self.save_to_database = function () {
            try {
                var name = JSON.stringify({
                    queue_name: self.queue_name(),
                    id: self.queue_id(),
                });
                $.ajax({
                    url: "plugin/speroplugin/save_to_database",
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: name,
                    success() {
                        self.send_info(
                            "Queue saved in to database.",
                            "success"
                        );

                        self.reload_plugin();
                    },
                });
            } catch (error) {
                console.log("save_to_database => ", error);
            }
        };
        self.check_empty = function (type) {
            try {
                var list = [];

                if (type == "queues") list = self.queues();
                if (type == "current_queue") list = self.currentItems();

                if (list != null && list != undefined) {
                    if (list.length > 0) return false;
                    else return true;
                } else return true;
            } catch (e) {
                console.log("check_empty => ", e);
            }
        };
        self.reload_items = function (items = [], reload = false) {
            try {
                self.item_count = items.length;
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
                                    ? "bisque"
                                    : e.state == "Finishing"
                                    ? "#bfd9bf"
                                    : e.state == "Finished"
                                    ? "darkseagreen"
                                    : e.state == "Cancelling"
                                    ? "#f7bbbb"
                                    : e.state == "Canceled" ||
                                      e.state == "Failed"
                                    ? "lightcoral"
                                    : e.state == "Paused"
                                    ? "lightgrey"
                                    : "white"
                                : "white"
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
                    url: "plugin/speroplugin/get_current_states",
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function (item) {
                        self.queue_state("IDLE");
                        self.item_count = 0;
                        self.currentIndex(0);

                        if (item.totalEstimatedTime != undefined)
                            self.totalEstimatedTime(item.totalEstimatedTime);

                        if (item.queues) {
                            self.queues([]);
                            item.queues.forEach((element) => {
                                self.queues.push(element);
                            });
                        }

                        if (item.isQueueStarted) {
                            self.isQueueStarted(item.isQueueStarted);
                        }

                        if (item.isQueuePrinting) {
                            self.isQueuePrinting(item.isQueuePrinting);
                        }

                        if (item.isManualEject) {
                            self.isManualEject(item.isManualEject);
                        }

                        if (item.esp) {
                            self.client_address(item.esp["address"]);
                            self.client_state(item.esp["connection"]);
                            if (item.esp["motor"] != undefined)
                                self.client_motor(item.esp["motor"]);
                            if (item.esp["position"] != undefined)
                                self.client_position(item.esp["position"]);
                        }
                        if (item.queue_state != undefined)
                            self.queue_state(item.queue_state);
                        if (item.current_index != undefined) {
                            self.currentIndex(item.current_index);
                        }

                        if (item.terminating != undefined) {
                            self.terminating(item.terminating);
                        }
                        if (item.ejecting != undefined)
                            self.ejecting(item.ejecting);
                        if (item.eject_fail != undefined) {
                            self.eject_fail(item.eject_fail);
                            console.log(item.eject_fail);
                            if (item.eject_fail == true)
                                self.item_info("Eject failed.");
                            else self.item_info(null);
                        }

                        if (item.queue != undefined) {
                            self.selectedQueue(item.queue);
                            self.currentItems([]);

                            console.log(
                                item.queue["id"],
                                item.queue["name"],
                                item.queue["items"]
                            );

                            if (item.queue != undefined && item.queue != null) {
                                self.queue_name(item.queue["name"]);
                                self.queue_id(item.queue["id"]);

                                if (item.queue["items"] != undefined) {
                                    if (item.queue["items"].length > 0) {
                                        self.reload_items(item.queue["items"]);
                                    }
                                }
                            } else {
                                self.queue_name(null);
                                self.queue_id(null);
                                self.currentItems(null);
                            }
                        }
                        if (item.target_temp)
                            self.target_temp = item.target_temp;
                    },
                });
            } catch (error) {
                console.log("reload_plugin => ", error);
            }
        };

        self.send_info = function (message, type) {
            try {
                self.info_message(message);
                switch (type) {
                    case "info":
                        self.info_color("powderblue");
                        break;
                    case "warning":
                        self.info_color("gold");
                        break;
                    case "danger":
                        self.info_color("lightcoral");
                        break;
                    case "success":
                        self.info_color("darkseagreen");
                        break;
                    default:
                        break;
                }

                setTimeout(function () {
                    self.info_message(null);
                }, 3000);
            } catch (error) {
                console.log("send info error => ", error);
            }
        };
        self.create_queue = function () {
            try {
                $.ajax({
                    url: "/plugin/speroplugin/create_queue",
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    success: function (r) {
                        self.reload_plugin();
                        self.send_info("Queue created.", "success");
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
                    var index = self.item_count;
                    var temp = ko.observable({
                        index: ko.observable(index),
                        name: ko.observable(data.name),
                        progress: ko.observable("-"),
                        timeLeft: ko.observable(data.timeLeft),
                        state: ko.observable("Await"),
                        previous_state: ko.observable(""),
                        color: ko.observable("white"),
                    });
                    self.currentItems.push(temp);
                    self.item_count += 1;
                }
                if (type == "remove") {
                    self.currentItems.remove(self.currentItems()[data]);
                    self.currentItems().forEach((element) => {
                        if (element().index() > data) {
                            element().index(element().index() - 1);
                        }
                    });
                    self.item_count -= 1;
                }
            } catch (error) {
                console.log("check_add_remove => ", error);
            }
        };

        self.queue_item_remove = function (data) {
            try {
                self.check_add_remove("remove", data);
                $.ajax({
                    url: "plugin/speroplugin/queue_remove_item?index=" + data,
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
                                item().state() != "Finishing" &&
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
        self.queue_item_restart = function (index) {
            try {
                if (self.connection() && self.isQueueStarted()) {
                    self.fileDatas(index);
                    self.sendTimeData((customIndex = index));
                    $.ajax({
                        url: "plugin/speroplugin/queue_item_restart?index=" + index,
                        type: "GET",
                        dataType: "json",
                        headers: { "X-Api-Key": UI_API_KEY },
                        success: function () {
                            self.queue_state("RUNNING");
                        },
                    });
                } else {
                    self.send_info("Printer not connected!", "warning");
                }
            } catch (error) {
                console.log("queue_item_restart error => ", error);
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
                if (!isNaN(sec_num) && sec_num > 0 && !self.terminating()) {
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
        self.queue_item_down = function (index) {
            try {
                if (index < self.currentItems().length - 1) {
                    self.row_change_items("down", index);

                    $.ajax({
                        url: "plugin/speroplugin/queue_item_down?index=" + index,
                        type: "GET",
                        dataType: "json",
                        headers: { "X-Api-Key": UI_API_KEY },
                        success: function (c) {},
                        error: function () {},
                    });
                }
            } catch (error) {
                console.log("queue_item_down error => ", error);
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
        self.queue_item_up = function (index) {
            try {
                if (index > 0) {
                    self.row_change_items("up", index);
                    $.ajax({
                        url: "plugin/speroplugin/queue_item_up?index=" + index,
                        type: "GET",
                        dataType: "json",
                        headers: { "X-Api-Key": UI_API_KEY },
                        success: function (c) {},
                        error: function () {},
                    });
                }
            } catch (error) {
                console.log("queue_item_up error => ", error);
            }
        };

        self.sayhello = function () {
            console.log("Hello!");
        };
        self.queue_item_duplicate = function (data) {
            try {
                $.ajax({
                    url: "plugin/speroplugin/queue_duplicate_item?index=" + data,
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
        self.delete_from_database = function () {
            try {
                if (self.queue_id() != undefined || self.queue_id() != null);
                $.ajax({
                    url:
                        "plugin/speroplugin/delete_from_database?id=" +
                        self.queue_id(),
                    method: "DELETE",
                    dataType: "json",
                    headers: {
                        "X-Api-Key": UI_API_KEY,
                    },
                    data: {},
                    success() {
                        self.send_info("Queue successfully removed.", "info");

                        self.queue_name(null);
                        self.queue_id(null);
                        self.currentItems(null);

                        self.reload_plugin();
                        setTimeout(function () {
                            self.info_message(null);
                        }, 3000);
                    },
                });
            } catch (error) {
                console.log("delete_from_database => ", error);
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
                if (!isNaN(sec_num) && sec_num > 0 && !self.terminating()) {
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
        
        // assign the injected parameters, e.g.:
        // self.loginStateViewModel = parameters[0];
        // self.settingsViewModel = parameters[1];infoitem_info

        // TODO: Implement your plugin's view model here.
    }

    /* view model class, parameters for constructor, container to bind to
     * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
     * and a full list of the available options.
     */
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