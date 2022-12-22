# coding=utf-8
from __future__ import absolute_import
import asyncio
from threading import Timer
# from .SheildControl import SheildControl
from flask.globals import request
from octoprint.plugin.types import SettingsPlugin
from octoprint.settings import settings
from octoprint_speroplugin.PluginEnums import BedPosition, EjectState, ItemState, MotorState, QueueState
from tinydb.database import TinyDB
from tinydb.queries import Query
import copy
from octoprint.filemanager.storage import StorageInterface as storage

from .SerialPorts import SerialPorts
import os
import flask
import uuid
import datetime

from flask import jsonify
import json



from octoprint.server.util.flask import (
    restricted_access,
)

import octoprint.plugin
import asyncio









class Speroplugin(octoprint.plugin.StartupPlugin,
                    octoprint.plugin.TemplatePlugin,
                    octoprint.plugin.SettingsPlugin,
                    octoprint.plugin.BlueprintPlugin,
                    octoprint.plugin.AssetPlugin,
                    octoprint.plugin.EventHandlerPlugin,
                    octoprint.plugin.ProgressPlugin,
                        ):
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
    FILE_DIR = None


    settingsParams = ["motorPin1","motorPin2","switchFront","switchBack","buttonForward","buttonBackword","buttonSequence","targetBedTemp","delaySeconds"]
    # sheildControl=None

    requiredDatas = ["settings2","currentIndex","bedPosition",'motorState','isShieldConnected','queueState','currentQueue',
                    'itemState',    ]



    def __init__(self):
        self.q = asyncio.Queue()
        self.queues = []
        self.ports=[]
        self.portsIsChanged=[]
        self.queueState = QueueState.IDLE.value  # queueState
        self.bedPosition=BedPosition.MIDDLE.value   # bedPosition -> middle front back
        self.motorState=MotorState.IDLE.value            # motorState -> idle forward backward
        self.ejectState=EjectState.IDLE.value               #eject durumları
        self.itemState=ItemState.AWAIT.value                #item durumları
        self.currentIndex=0                           #queuenin o anki indexsi
        self.isShieldConnected = "aa"           #isShieldConnected
        self.currentQueue=None                          #su anki queue
        self.currentQueueItem = None                    #secilen veya en son kalan queue nin item dizisi
        self.totalEstimatedTime = 0                     #priniting olan itemin basım zamanı

        self.queuesIndex=0   #queueların index numarası queuelara index numarası verdim başlangıcta
                            #en son kalanı ekrana vermek için
       
        self.change=None    #cancelling yaparken state değişikliğini tetikletmek için
        self.settings2=[]
        self.selectedPortName=None
        self.db=None
        self.savedPort=None
        self.firstPorts=None
        self.serialConnection=None
        self.results=None




    def on_startup(self, host, port):


        fileDir = os.path.join(self.ROOT_DIR,"queues.json")
        fileExist = os.path.exists(fileDir)
        if not fileExist:
            open(fileDir, 'w+')
        self.db = TinyDB(fileDir)
        self.serial = SerialPorts()
        self.ports = self.serial.serialPorts()
        self.serial.onStateChange = self.getStates   

      
      
     

        
        return super().on_startup(host, port)






    def on_after_startup(self):
        self.queues=self.db.all()
        
        search=Query()
        self.currentQueue=self.db.get(search.last=="last_queue")                         
        print(self.currentQueue)
        print("***********************************")
        self.setSettings() 
        
        
     
         
        self.messageToJs({'settings':self.settings2,'currentIndex':self.currentIndex,'bedPosition':self.bedPosition,
                            'motorState':self.motorState,
                            'queueState':self.queueState,'currentQueue':self.currentQueue,'itemState':self.itemState,})


        
        self.selectedListId()

        

    def selectedListId(self):
        searchPort=Query()
 
        self.results=self.db.get(searchPort.items=="find")     
                            
        if self.results!=None:
            print(self.results["id"])
            self.serial.selectedPortId(self.results["id"])




    def setSettings(self):                         #settings jinjadan verileri çeken fonks
        self.settings2 = {}
        for val in self.settingsParams:
            self.settings2[val] = self._settings.get([val])



    def on_event(self, event, payload):     

 

        self.messageToJs({'ports':self.ports})

        state = self._printer.get_state_id()


        if state == "CANCELLING":
            self.itemState=ItemState.CANCELLING.value
            self.messageToJs({'itemState':self.itemState})


        if event == "Disconnected" or event == "Error":
            self.queueState = QueueState.PAUSED.value
            self.itemState=ItemState.FAILLED.value

        if event == "PrintStarted" or event == "PrintResumed":
            self.queueState = QueueState.RUNNING.value
            self.itemState=ItemState.PRINTING.value

        if event == "PrintPaused":
            self.queueState = QueueState.PAUSED.value

        if event == "DisplayLayerProgress_progressChanged":
            if self.itemState != "Ejecting" and self.itemState != "Cancelled":
                self.itemState=ItemState.PRINTING.value


        if event == "PrintFailed" or event == "PrintCanceled":
            self.change="yes" #anlık kontrol ettiği için kullanıcı state değişmeden tetikleyebilir bu yüzden kontrol
            #amaçlı yazdım.



        if event == "PrinterStateChanged" and self.queueState != "PAUSED":
            if self.change=="yes":
                self.queueState = QueueState.CANCELLED.value
                self.itemState=ItemState.FAILLED.value
                self.messageToJs({'queueState':self.queueState,'itemState':self.itemState})
                self.change="no"

            state = self._printer.get_state_id()

        if event == "PrintDone":
            self.ejectState=EjectState.WAIT_FOR_TEMP.value
            self.itemState=ItemState.EJECTING.value
            self.tryEject()

        self.messageToJs({'itemState': self.itemState,'queueState':self.queueState})



    def getStates(self,connetion,bed,motor):           #raspi baglı durumlar için bu yüzden şuan yorum satırında
        if connetion==True:
            self.isShieldConnected="Connected"
        if connetion==False:
            self.isShieldConnected="Disconnected"
       
        self.bedPosition=bed
        self.motorState=motor
        self.messageToJs({"isShieldConnected":self.isShieldConnected,'bedPosition':self.bedPosition,'motorState':self.motorState})
    


    def tryEject(self):                                 #eject için uygun sıcaklıgı saplamak için
        self.ejectState = EjectState.WAIT_FOR_TEMP.value

    def startEject(self):
        print("start")
        self.serial.sendActions("eject")
        self.ejectState=EjectState.EJECTING.value
        self.waitingEject()



    def waitingEject(self):
        print(self.ejectState)
        if self.ejectState =="EJECTING_FINISHED":
            # self.controlEject=self.sheildControl.sequenceFinish

            self.itemState=ItemState.FINISHED.value
            if self.queueState=='RUNNING':
                self.currentIndex=self.currentIndex+1

            self.messageToJs({'itemState':self.itemState,'currentIndex':self.currentIndex})


            if(self.queueState=="CANCELLED"):
                self.currentIndex=0
                self.messageToJs({'currentIndex':self.currentIndex} )
                self.doItemsStateAwait()

            if self.currentIndex==self.currentQueue["items"].__len__():
                self.queueState="FINISHED"
                self.currentIndex=0
                self.messageToJs({'itemState':self.itemState,'currentIndex':self.currentIndex})
                self.doItemsStateAwait()


            self.nextItem()
        else:

            if self.serial.state=="IDLE":
                self.itemState=ItemState.FINISHED.value
                self.ejectState=EjectState.EJECTING_FINISHED.value
                self.messageToJs({'itemState':self.itemState})

            waitTimer2 = Timer(1,self.waitingEject,args=None,kwargs=None)
            waitTimer2.start()

    def nextItem(self):            #eject biitikten sonra queuenin statine göre bir sonraki işlem
        if self.queueState == "RUNNING":

            if(self.queueState == "RUNNING" and self.ejectState!="EJECT_FAIL"):
                self.messageToJs({'currentIndex':self.currentIndex})
                self.startPrint()
            else:
                print("print andd queue finish")
        else:
            print("queue and print finisheeed")


    def doItemsStateAwait(self) :   #queuenin bittigi ya da cancel olduğu durumlarda queuenin butun itemlerini Awaitte cekmek için

            self.queueState=QueueState.IDLE.value
            self.messageToJs({'queueState':self.queueState})


    def startPrint(self, canceledIndex=None):
        if self.queueState == "RUNNING"or self.queueState=="STARTED":
            queue = self.currentQueue["items"]
            self.print_file = None

            if (self.queueState == "RUNNING" or self.queueState == "STARTED" or canceledIndex != None):
                self.print_file = None

                if canceledIndex != None:

                    self.currentQueue["items"][canceledIndex]["state"] = "Await"
                    self.print_file = self.currentQueue["items"][canceledIndex]
                else:
                    for item in queue:
                            self.print_file = item
                            break

            if self.print_file != None:
                is_from_sd = None
                if self.print_file["sd"] == "true":
                    is_from_sd = True
                else:
                    is_from_sd = False

            self.print_file=queue[self.currentIndex]
            self._printer.select_file(self.print_file["path"], is_from_sd)
            self._printer.start_print()


    def get_settings_defaults(self):
        return dict(
            motorPin3=23,
            motorPin1=23,
            motorPin2=18,
            switchFront=27,
            switchBack=22,
            buttonForward=2,
            buttonBackword=6,
            buttonSequence=3,
            delaySeconds=10,
            targetBedTemp=40,
            error=False,
        )


    def on_settings_save(self, data):
        data.pop('error')
        # Data içinden error'u sildir öyle gönder süpere
        return super().on_settings_save(data)


    def messageToJs(self,message):
        self._plugin_manager.send_plugin_message(self._identifier, message)



    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=False),
            dict(type="tab", custom_bindings=False)
        ]

        # ~~ Softwareupdate hook

    @ octoprint.plugin.BlueprintPlugin.route("/saveToDataBase", methods=["POST"])
    @ restricted_access
    def saveToDataBase(self):
        data = flask.request.get_json()
        Exist = Query()

        queueId = data["id"]
        name = data["queueName"]  if data["queueName"]  != "" or data["queueName"]  != None else "New Queue"
        items = self.currentQueue["items"] if self.currentQueue["items"] !=None else []
        index=data["index"]
        self.queues[data["index"]]["name"]=name
                                                        #queueyi yaratırken bir index numarasu atadım burdada last queue kelimesini atıyorum sadece
                                                        #birine digerlerinde none on startup tada last_queue yazısının indexsini bulup selected queue yapıyp

        inDb = self.db.search(Exist.id == queueId)
        item = Query()
        last_db=self.db.search(item.last == "last_queue")


        if(len(last_db) > 1 and last_db != None):
            self.db.update({
                'last':"none"
            },item.last == "last_queue")


        if(len(inDb) > 0 and inDb != None):
            self.db.update({
                'items': items,
                'name':name,
                'updateTime':str(datetime.datetime.now()),
                'last':"last_queue"
            },Exist.id==queueId)
        else:
            self.db.insert({
                    'items': items,
                    'id': queueId,
                    'updateTime':str(datetime.datetime.now()),
                    'createTime':str(datetime.datetime.now()),
                    'name': name,
                    'index':index,
                    'last':"last_queue",
                })

        # self._settings.set(["speroplugin_currentQueue"], json.dumps(self.currentQueue))
        # self._settings.save()


        res = jsonify(success=True)
        res.status_code = 200
        return res



    def get_template_vars(self):
        return dict(url=self._settings.get(["url"]))

    @ octoprint.plugin.BlueprintPlugin.route("/send_time_data", methods=["POST"])
    @ restricted_access
    def send_time_data(self):
        data = flask.request.get_json()

        if data["timeLeft"]!=None and data["index"]!=None:
            self.currentQueue["items"][data["index"]]["timeLeft"] = data["timeLeft"]

        if self.totalEstimatedTime != None:
            self.totalEstimatedTime = data["totalEstimatedTime"]
        else:
            self.totalEstimatedTime = 0

        res = jsonify(success=True, data="time done")
        res.status_code = 200
        return res




    @ octoprint.plugin.BlueprintPlugin.route("/selectedPort", methods=["POST"])
    @ restricted_access
    def selectedPort(self):

        data = flask.request.get_json()
        searchPort=Query()
        last_db=self.db.search(searchPort.items == "find")


        if(len(last_db) > 1 and last_db != None):
            self.db.update({
                'find':"none"
            },searchPort.items == "last_queue")
        

        data2=data["request"]["serial"]
        self.db.insert({
            'id': data2,
            'items': "find",
        })
        
        self.selectedListId()




        res = jsonify(success=True)
        res.status_code = 200
        return res






    @ octoprint.plugin.BlueprintPlugin.route("/deviceControl", methods=["POST"])
    @ restricted_access
    def deviceControl(self):
        
        
       
        data = flask.request.get_json()

        if (data["request"]):
            self.serial.sendActions(data["request"])
       
        res = jsonify(success=True)
        res.status_code = 200
        return res


    # @ octoprint.plugin.BlueprintPlugin.route("/sendPort", methods=["POST"])
    # @ restricted_access
    # def sendPort(self):

    #     data = flask.request.get_json()


    #     res = jsonify(success=True)
    #     res.status_code = 200
    #     return res




    @ octoprint.plugin.BlueprintPlugin.route("/deleteFromDatabase", methods=["DELETE"])
    @ restricted_access

    def deleteFromDatabase(self):

        queueId = flask.request.args.get("id")
        self.currentQueue = None

        Exist = Query()
        result = self.db.get(Exist.id==queueId)
        self.queues.pop(result['index'])
        self.db.remove(Exist.id == queueId)

        res = jsonify(success=True)
        res.status_code = 200
        return res


    @ octoprint.plugin.BlueprintPlugin.route("/sayhello",)
    @ restricted_access

    def sayhello(self):

        res = jsonify(success=True)
        res.status_code = 200
        return res

    octoprint.plugin.BlueprintPlugin.route("/queueItemUp", methods=["GET"])
    @ restricted_access
    def queueItemUp(self):
        index = int(flask.request.args.get("index", 0))

        if len(self.currentQueue["items"]) > 1:

            itemCurr = self.currentQueue["items"][index]
            itemCurr["index"] = index - 1
            itemNext = self.currentQueue["items"][index - 1]
            itemNext["index"] = index

            self.currentQueue["items"][index] = itemNext
            self.currentQueue["items"][index - 1] = itemCurr


        res = jsonify(success=True)
        res.status_code = 200
        return res


    @ octoprint.plugin.BlueprintPlugin.route("/pauseResumeQueue", methods=["GET"])
    @ restricted_access
    def pauseResumeQueue(self):
        self.setSettings()
        self.ejectFail=False


        if self.queueState=="FINISHED":
            self.currentIndex=-1

        if self.queueState=="CANCELLED" and self.itemState!="Failed":

            self.currentIndex=-1
            self.messageToJs({'currentIndex':self.currentIndex})
            self.nextItem()

        if self.itemState=="eject fail":
            self.controlEject=True
            self.ejectFail=False
            self.queueState=QueueState.RUNNING.value
            self.itemState=ItemState.PRINTING.value
            self.messageToJs({'ejectState':self.ejectState,'queueState':self.queueState})
            self.nextItem()

        else:
            if self.itemState!='Failed':
                self.currentIndex=self.currentIndex+1
            self.ejectState=EjectState.IDLE.value
            self.queueState=QueueState.RUNNING.value

            self.messageToJs({'ejectState':self.ejectState,'queueState':self.queueState,'currentIndex':self.currentIndex})

            self.nextItem()


        res = jsonify(success=True)
        res.status_code = 200
        return res
    @ octoprint.plugin.BlueprintPlugin.route("/cancelQueue", methods=["GET"])
    @ restricted_access
    def cancelQueue(self):

        self.queueState=QueueState.CANCELLED.value

        self.messageToJs({'queueState':self.queueState})
        self.nextItem()

        res = jsonify(success=True)
        res.status_code = 200
        return res



    @ octoprint.plugin.BlueprintPlugin.route("/front", methods=["GET"])   #raspi yok diye eject yerine
    @ restricted_access
    def front(self):

        self.ejectState=EjectState.EJECTING_FINISHED.value
        self.itemState=ItemState.FINISHED.value

        self.messageToJs({'itemState':self.itemState})

        res = jsonify(success=True)
        res.status_code = 200
        return res


    @ octoprint.plugin.BlueprintPlugin.route("/pauseStopQueue", methods=["GET"])
    @ restricted_access
    def pauseStopQueue(self):
        self.queueState=QueueState.PAUSED.value
        self.messageToJs({'queueState':self.queueState})
        self.nextItem()
        res = jsonify(success=True)
        res.status_code = 200
        return res



    @ octoprint.plugin.BlueprintPlugin.route("/startQueue", methods=["GET"])
    @ restricted_access
    def startQueue(self):
        # if self.sheildControl.switch2Pres==True:
            self.setSettings()
            self.queueState = "STARTED"
            totalTime = flask.request.args.get("totalEstimatedTime", 0)
            self.totalEstimatedTime = totalTime
            if len(self.currentQueue["items"]) > 0:
                self.startPrint()

            res = jsonify(success=True)
            res.status_code = 200
            return res
        # else:
        #     self.sheildControl.backward
        #     waitTimer3 = Timer(0.1,self.startQueue,args=None,kwargs=None)
        #     waitTimer3.start()



    # get data for js
    @ octoprint.plugin.BlueprintPlugin.route("/sendStartDatas", methods=["GET"])
    @ restricted_access
    def sendStartDatas(self):
  
        message ={}
        for val in self.requiredDatas:
            message[val]=getattr(self,val)

        self.messageToJs(message)
        self.messageToJs({'queues':self.queues})
        self.messageToJs({'ports':self.ports})



        return message

    # @ octoprint.plugin.BlueprintPlugin.route("/get_datas", methods=["GET"])
    # @ restricted_access
    # def get_datas(self):

    #     self.queues.append(self.currentQueue)

    #     self.currentQueueItem = None
    #     self.currentTime = 0
    #     self.totalEstimatedTime = 0

    #     res = jsonify(success=True)
    #     res.status_code = 200
    #     return res
    @ octoprint.plugin.BlueprintPlugin.route("/createQueue", methods=["GET"])
    @ restricted_access
    def createQueue(self):
        self.currentQueue = dict(
            id=str(uuid.uuid4()),
            name="New Queue",
            items= [],
            index=self.queuesIndex
        )
        self.queuesIndex=self.queuesIndex+1
        self.queues.append(self.currentQueue)
        self.currentQueueItem = None
        self.currentTime = 0
        self.totalEstimatedTime = 0
        self.messageToJs({'currentQueue':self.currentQueue})

        res = jsonify(success=True)
        res.status_code = 200
        return res

    @ octoprint.plugin.BlueprintPlugin.route("/queueItemDown", methods=["GET"])
    @ restricted_access
    def queueItemDown(self):
        index = int(flask.request.args.get("index", 0))

        if len(self.currentQueue["items"]) > 1:
            itemCurr = self.currentQueue["items"][index]
            itemCurr["index"] = index + 1

            itemNext = self.currentQueue["items"][index+1]
            itemNext["index"] = index

            self.currentQueue["items"][index] = itemNext
            self.currentQueue["items"][index + 1] = itemCurr

        res = jsonify(success=True)
        res.status_code = 200
        return res

    # QUEUE UP-DOWN END

    @ octoprint.plugin.BlueprintPlugin.route("/queueAddItem", methods=["POST"])
    @ restricted_access
    def queueAddItem(self):
        queue = self.currentQueue["items"]
        data = flask.request.get_json()
        queue.append(
            dict(
                index=data["index"],
                name=data["item"]["name"],
                path=data["item"]["path"],
                sd=data["item"]["sd"],
                state="Await",
                timeLeft=data["item"]["timeLeft"]
            )
        )
        res = jsonify(success=True, data="")
        res.status_code = 200
        return res

    @octoprint.plugin.BlueprintPlugin.route("/pointer", methods=["GET"])
    @ restricted_access
    def pointer(self):
        self.currentIndex = (int(flask.request.args.get("index", 0))-1)
        self.itemState=ItemState.PRINTING.value                #resumede ejcet fail tetiklenmesin diye
        res = jsonify(success=True)
        res.status_code = 200
        return res

    @ octoprint.plugin.BlueprintPlugin.route("/queueRemoveItem", methods=["DELETE"])
    @ restricted_access
    def queueRemoveItem(self):
        index = int(flask.request.args.get("index", 0))
        queue = self.currentQueue["items"]
        queue.pop(index)

        for i in queue:
            if i["index"] > index:
                i["index"] -= 1

        res = jsonify(success=True)
        res.status_code = 200
        return res

    @ octoprint.plugin.BlueprintPlugin.route("/queueItemDuplicate", methods=["GET"])
    @ restricted_access
    def queueItemDuplicate(self):
        index = int(flask.request.args.get("index", 0))
        queue = copy.deepcopy(self.currentQueue["items"])

        item = queue[index]
        item["index"] += 1

        for i in self.currentQueue["items"]:
            if i["index"] > index:
                i["index"] += 1

        self.currentQueue["items"].insert(item["index"], item)

        res = jsonify(success=True)
        res.status_code = 200
        return res

    @ octoprint.plugin.BlueprintPlugin.route("/getQueue", methods=["GET"])
    @ restricted_access
    def getQueue(self):
        queueId = flask.request.args.get("id")
        for queue in self.queues:
            if queue["id"] == queueId:
                self.currentQueue = queue
                break

        res = jsonify(success=True)
        res.status_code = 200
        return res


    def get_assets(self):
        return {
            "js": ["js/speroplugin.js"],
            "css": ["css/speroplugin.css"],
            "less": ["less/speroplugin.less"]
        }

    def get_update_information(self):

        return {
            "speroplugin": {
                "displayName": "speroplugin Plugin",
                "displayVersion": self._plugin_version,
                "type": "github_release",
                "user": "you",
                "repo": "OctoPrint-speroplugin",
                "current": self._plugin_version,


                "pip": "https://github.com/you/OctoPrint-speroplugin/archive/{target_version}.zip",
            }
        }

    def sanitize_temperatures(self,comm_instance, parsed_temperatures, *args, **kwargs):
        x = parsed_temperatures.get('B')
        if x:
            currentBedTemp = x[0]
            if self.ejectState == "WAIT_FOR_TEMP":
                self.checkBedTemp(currentBedTemp)

        return parsed_temperatures

    def checkBedTemp(self,currentBedTemp):

        self.messageToJs({'temp':currentBedTemp,'targetBedTemp':self.settings2["targetBedTemp"]})

        if(currentBedTemp<=float(self.settings2["targetBedTemp"])):
            self.startEject() # state -> Ejecting,


# from octoprint.events import Events
# from octoprint.server import eventManager, app


# def send_message(event, payload):
#     app.logger.info("Sending message to terminal: 'Hello world!'")
#     eventManager.fire(Events.PLUGIN_MONITOR_MESSAGE, {"message": "Hello world!"})

# def register_custom_hooks():
#     eventManager.subscribe(Events.PRINT_STARTED, send_message)





__plugin_name__ = "speroplugin Plugin"
__plugin_pythoncompat__ = ">=3,<4"  # Only Python 3

def __plugin_load__():

    global __plugin_implementation__
    __plugin_implementation__ = Speroplugin()
    # register_custom_hooks()
    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information,
        "octoprint.comm.protocol.temperatures.received": (__plugin_implementation__.sanitize_temperatures,1),


    }