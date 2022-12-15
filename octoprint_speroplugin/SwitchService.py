import RPi.GPIO as GPIO 
from gpiozero import Button
from octoprint_speroplugin.PluginEnums import BedPosition
  

class SwitchService():


   onFrontSwitchPressed = None
   onBackwardSwitchPressed = None
   onFrontSwitchReleased = None
   onBackwardSwitchReleased = None
 

   def __onPressedFrontSwitch(self):
      self.state = BedPosition.FRONT.value
      if self.onFrontSwitchPressed:
         self.onFrontSwitchPressed()

   def __onPressedBackSwitch(self):
      self.state = BedPosition.BACK.value
      if self.onBackwardSwitchPressed:
       self.onBackwardSwitchPressed()
       
   def __onReleasedFrontSwitch(self):
      self.state = BedPosition.MIDDLE.value
      if self.onFrontSwitchReleased:
       self.onFrontSwitchReleased()
       
          
   def __onReleasedBackwardSwitch(self):
      self.state = BedPosition.MIDDLE.value
      if self.onBackwardSwitchReleased:
       self.onBackwardSwitchReleased()




   def __init__(self,_pin1,_pin2):
      self.state = BedPosition.MIDDLE.value
      if _pin1:
         GPIO.setup(_pin1,GPIO.OUT)
         self.__switch1 = Button(_pin1,bounce_time=0.005)
         self.__switch1.when_pressed = self.__onPressedFrontSwitch
         self.__switch1.when_released = self.__onReleasedFrontSwitch
         # if(self__se == basılı)
         #    _state = BedPosition.FRONT
      if _pin2:
         GPIO.setup(_pin2,GPIO.OUT)
         self.__switch2 = Button(_pin2,bounce_time=0.005)
         self.__switch2.when_pressed = self.__onPressedBackSwitch
         self.__switch2.when_released = self.__onReleasedBackwardSwitch
      #    if(self__se == basılı)
      #       _state = BedPosition.BACK
      # self.state = _state