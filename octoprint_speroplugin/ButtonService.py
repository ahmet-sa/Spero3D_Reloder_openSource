from time import time
import RPi.GPIO as GPIO 
from gpiozero import Button
from signal import pause
from .MotorService import MotorService


class ButtonService():

    __buttonUtility = None
   
    __timerUtility = 0
    __thresholdUtility = 0

    onLongPressed = None
    onShortPressed = None
    onForwardPressed = None
    onBackwardPressed = None
    onButtonsReleased =None 

   
    
    def __onHeldUtility(self):
        if self.onLongPressed:
            self.onLongPressed()
    def __onPressedUtility(self):
        self.__timerUtility = time()

    def __onReleasedUtility(self):
        now = time()
        if now-self.__timerUtility < self.__thresholdUtility and self.onShortPressed:
            self.onShortPressed()
    
    def __onPressedForword(self):
        print("Pressed Forward")
        if self.onForwardPressed:
            self.onForwardPressed()

    def __onReleasedForword(self):
        print("Realesed Forward")
        if self.onButtonsReleased:
            self.onButtonsReleased()

    def __onPressedBackword(self):
        
        if self.onBackwardPressed:
            self.onBackwardPressed()

    def __onReleasedBackword(self):
        if self.onButtonsReleased:
             self.onButtonsReleased()



    def __init__(self,_pin1,_pin2,_pin3,hold_time =3):
        print("Button Service init")
        self.__thresholdUtility = hold_time
        if _pin1:
            self.pinUtility = _pin1
            self.__buttonUtility = Button(_pin1, hold_time=hold_time)
            self.__buttonUtility.when_held = self.__onHeldUtility
            self.__buttonUtility.when_pressed = self.__onReleasedUtility
            self.__buttonUtility.when_released = self.__onPressedUtility

        if _pin2:
            self.pinForword = _pin2
            self.__buttonForword = Button(_pin2)
            self.__buttonForword.when_pressed = self.__onReleasedForword
            self.__buttonForword.when_released = self.__onPressedForword
        if _pin3:
            self.pinBackword = _pin3
            self.__buttonBackword = Button(_pin3)
            self.__buttonBackword.when_pressed = self.__onReleasedBackword
            self.__buttonBackword.when_released = self.__onPressedBackword