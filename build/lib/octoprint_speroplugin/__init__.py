# coding=utf-8
from __future__ import absolute_import
from array import array
import asyncio
from pickle import TRUE
from flask.globals import request
from tinydb.database import TinyDB
from tinydb.queries import Query
import copy

from octoprint.filemanager.storage import StorageInterface as storage


import os
import flask
import json
import uuid
import datetime
import threading
from flask import jsonify
import json
import time
from .MOTOR import MOTOR
from octoprint.server.util.flask import (
    restricted_access,
)

import octoprint.plugin

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FILE_DIR = None

class SperoPlugin(octoprint.plugin.StartupPlugin,
                       octoprint.plugin.TemplatePlugin,
                       octoprint.plugin.SettingsPlugin,
                       octoprint.plugin.BlueprintPlugin,
                       octoprint.plugin.AssetPlugin,               
                       octoprint.plugin.EventHandlerPlugin,
                       octoprint.plugin.ProgressPlugin,  
                        ):


    KOntrol=True
    def __init__(self):
        self.esp = dict()
        
        self.queues = []
        self.queue_state = "IDLE"

        self.current_queue = None
        self.current_item = None
        self.currentFiles = []
        self.pins=[]
        
        self.totalEstimatedTime = 0

        self.isQueueStarted = False
        self.isQueuePrinting = False
        self.isManualEject = False

        self.connection = False
        self.ejecting = False
        self.eject_fail = False
        self.kontrol=False






    def on_after_startup(self):
        self._logger.info("Hello World! (more: %s)" % self._settings.get(["url"]))

    def get_settings_defaults(self):
        return dict(url="https://en.wikipedia.org/wiki/Hello_world")
    def client_opened(self,):
        self.connection = True
        self._logger.info("Client connected : "+self.Socket.USERS.__len__().__str__())

        self.esp["connection"] = self.Socket.USERS.__len__()>0
        self.esp["motor"] = None
        self.esp["position"] = None

        self.message_to_js()
    def client_closed(self, ):
        self.connection = False
        self._logger.info("Client disconnected : "+self.Socket.USERS.__len__().__str__())

        self.esp["connection"] = self.Socket.USERS.__len__()>0
        self.esp["motor"] = None
        self.esp["position"] = None

        self.message_to_js()
    
        




























__plugin_name__ = "Spero Plugin"
__plugin_pythoncompat__ = ">=3.7,<4"
__plugin_implementation__ = SperoPlugin()