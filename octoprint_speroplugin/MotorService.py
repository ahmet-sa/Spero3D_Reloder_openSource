
from time import time
import RPi.GPIO as GPIO 
from signal import pause
from datetime import datetime, timedelta
from timeit import default_timer
import time

import RPi.GPIO as GPIO 
from octoprint_speroplugin.PluginEnums import MotorState

class MotorService():
   
   
   def __initMotor(self):
      self.state=MotorState.IDLE.value
      if self._pin1 and self._pin2:
         GPIO.setup(self._pin1,GPIO.OUT)
         GPIO.setup(self._pin2,GPIO.OUT)


   def __init__(self,pin1,pin2):
      GPIO.setmode(GPIO.BCM)
      self._pin1 = pin1
      self._pin2 = pin2
      self.__initMotor()
   
   
   
   def stop(self):
      if self._pin1 and self._pin2:
         GPIO.output(self._pin1,False)
         GPIO.output(self._pin2,False)
         self.state=MotorState.STOP.value

   def goForward(self):
      if self._pin1 and self._pin2:
         GPIO.output(self._pin1,True)
         GPIO.output(self._pin2,False)
         self.state=MotorState.FORWARD.value
    


   def goBackward(self):
      if self._pin1 and self._pin2:
         GPIO.output(self._pin1,False)
         GPIO.output(self._pin2,True)
         self.state=MotorState.BACKWARD.value
   


 


         
