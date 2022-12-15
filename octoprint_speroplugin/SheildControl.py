
# coding=utf-8
from .ButtonService import ButtonService
from .MotorService import MotorService,MotorState
from .SwitchService import SwitchService
from threading import Timer
from signal import pause
from octoprint_speroplugin.PluginEnums import ShieldState,BedPosition

class SheildControl:  
   
    onStateChange = None 


    def __init__(self,pin1,pin2,pin3,pin4,pin5,pin6,pin7,failTime):
      self.timerOut=None
      self.connectionSheild="Idle"
      self.state = ShieldState.IDLE.value
      self.bedPosition=BedPosition.MIDDLE.value
      self.sequenceIndex=0
      self.isInSequence=False
      self.sequenceFinish=True
      self.ejectFail=False
      self.control=False
      self.sequence = ['W','F','W','B','W','C','S']
      self.actions ={"W":self.wait,"F":self.forward,"B":self.backward,"C":self.correct}
      self.buttonService=ButtonService(pin1,pin2,pin3)
      self.motorService=MotorService(pin4,pin5)
      self.switchService=SwitchService(pin6,pin7)

      self.ejectFailTime=failTime  
      

    #   self.connection()
   
   
    def forward(self):
        self.motorService.goForward()
        self.callOnStateChange()

    def backward(self):
        self.motorService.goBackward()
        self.callOnStateChange()
        
    def stop(self):
        self.motorService.stop()    
        self.callOnStateChange()
        
  
    def endSequence(self):
        self.motorState='Stop'
        self.callOnStateChange()
        
        if self.control==False:
            self.stop()
            self.sequenceIndex=0
            self.isInSequence=False
        else:
            self.control=False
            
    def sendActions(self,a):
        if a=="backward":
            self.backward()
        if a=="stop":
            self.stop()
        if a=="forward":
            self.forward()
        if a=="eject":
            self.startSequence()        
            
    def startSequence(self):
        self.ejectFail=False
        if self.state=="IDLE"and self.sequenceIndex==0:
            self.triggerNextJob()
        else :
            self.sequenceIndex=0
            self.state=ShieldState.IDLE.value
            self.stop()
            
    def triggerNextJob(self):
        if self.timerOut!=None:
            self.timerOut.cancel()
            self.timerOut=None
        if  self.state=="ISINSEQUENACE":
            self.sequenceIndex=self.sequenceIndex+1
           
            if self.sequenceIndex %2 == 1:
                self.startTimer()
            self.runJob()
        else:
            self.state=ShieldState.ISINSEQUENACE.value
            self.runJob()        
    
    
    def startTimer(self):
        if self.timerOut==None:
            self.timerOut = Timer(self.ejectFailTime,self.killTimeOut)
            self.timerOut.start()        
         


    def killTimeOut(self):
        self.timerOut=None
        self.ejectFail=True
        self.endSequence()

        

    def runJob(self):
        self.currentSeq = self.sequence[self.sequenceIndex]
       
        self.action = self.actions.get(self.currentSeq,self.jobFinish)
        if self.action :
            print("action")
            print(self.currentSeq)
            self.action()

        
    def jobFinish(self):
        print(self.sequenceIndex)
        if self.sequenceIndex==5:
            self.timerOut.cancel()
            self.endSequence()
            self.control=False
            self.sequenceIndex=0
            self.state=ShieldState.IDLE.value
        else :
            self.triggerNextJob()
    
    

        
    def wait(self):
        self.stop()
        waitTimer = Timer(1,self.jobFinish,args=None,kwargs=None)
        waitTimer.start()
 
    
    def correct(self):
        self.stop()
        waitTimer = Timer(2,self.jobFinish,args=None,kwargs=None)
        waitTimer.start()
        self.motorService.goForward()
        self.callOnStateChange()
        waitTimer = Timer(0.2,self.stop,args=None,kwargs=None)
        waitTimer.start()
        self.tablaState="Idle"
        self.state=ShieldState.IDLE.value
        
        
        
        
 

        
        
    def callOnStateChange(self):
        self.bedPosition=self.switchService.state
        self.motorState=self.motorService.state
        if self.onStateChange:
            self.onStateChange(self.bedPosition,self.motorState,self.ejectFail)
 
 
    def frontSwitchPressed(self):
        print("switch front")
     
        self.motorService.stop()  
        if self.sequence[self.sequenceIndex]=='F':
            self.jobFinish()
        self.callOnStateChange()

        
    def backwordPress(self):
  
  
        self.printBedState="Backward" 
        self.motorService.stop()
        self.callOnStateChange()
        if self.sequence[self.sequenceIndex]=='B':
            self.jobFinish()

            
    def frontSwitchReleased(self):
        self.callOnStateChange()
    
    def backwardReleased(self):
        self.callOnStateChange()


    def buttonInit(self):
        self.buttonService.onShortPressed = self.startSequence
        self.buttonService.onForwardPressed=self.forward
        self.buttonService.onBackwardPressed=self.backward
        self.buttonService.onButtonsReleased=self.stop
        
        
        
        self.switchService.onFrontSwitchPressed=self.frontSwitchPressed
        self.switchService.onBackwardSwitchPressed=self.backwordPress
        self.switchService.onFrontSwitchReleased=self.frontSwitchReleased
        self.switchService.onBackwardSwitchRealesed=self.backwardReleased
        
        pause()


            
        
         

  

  
