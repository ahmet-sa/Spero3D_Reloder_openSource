import sys
import glob
import serial
from enum import Enum
import serial.tools
import serial.tools.list_ports
import asyncio
import time
import threading


class SerialPorts(object):
    onStateChange = None 
    connectedSerial=None
    usb=None
    serialId=None
    ports=[]
    
    def __init__(self):
        self.readthread=None
        # self.startUsbThred()
        self.bedState="Idle"
        self.motorState="Idle"
        self.connection=False
        self.databasePorts=None
        self.listThread =None
       
        pass


  
    def getSummary(self):
        
        self.serialConnection.write("[CMD] Summary|123\n".encode())   
        
    def serialPorts(self):
    
        """ Lists serial port names
            :raises EnvironmentError:
                On unsupported or unknown platforms
            :returns:
                A list of the serial ports available on the system
        """
        if sys.platform.startswith('win'):
            ports = ['COM%s' % (i + 1) for i in range(256)]
        elif sys.platform.startswith('linux') or sys.platform.startswith('cygwin'):
            # this excludes your current terminal "/dev/tty"
            ports = glob.glob('/dev/tty[A-Za-z]*')
        elif sys.platform.startswith('darwin'):
            ports = glob.glob('/dev/tty.*')
        else:
            raise EnvironmentError('Unsupported platform')

        ports = serial.tools.list_ports.comports()
        # print("***************************************************************")
        self.ports = []
        for port in ports:
            try:
                # print("port:{}, serial: {}\n".format(port.device,port.serial_number))
                if (port.manufacturer=="Spero3D"):
                    self.ports.append({"device":port.device,"serial":port.serial_number})
            except (OSError, serial.SerialException):
                pass
        return self.ports


    def serialConnect(self,p):
        self.serialConnection=serial.Serial(port=p)
        print("connected")
        self.connection=True
        self.callOnStateChange()
        self.readFromPort()
       
        
  



    def selectedPortId(self,p): 
        print(p)
        self.serialId = p
        self.portList()
        

    def portList(self):
            self.connection=False
            self.callOnStateChange()
        
            while self.connection==False:
                data=self.serialPorts()
                try:
                    if len(data)>0:
                        if data[0]["serial"] == self.serialId:
                            self.serialConnect(data[0]["device"])
                            self.connection=True
                            break
                        else:
                            self.connection=False
                            self.time.sleep(0.5)
                            print("please select port")
                            self.portList()
                            break
                    
            
                except  serial.serialutil.SerialException:
                    print("connect lose")
                    
            self.listThread = threading.Thread(target=self.portList)
            self.listThread.start()
  
    
                

        
    
    
    
    
    
    
    
    
    
    
    # def readFromUsb(self,start=True):
    #     if start:
            
    #         self.readthread = threading.Thread(target=self.readFromPort, args=(self.s))
    #         self.readthread.start()
    #     else:
    #         self.readthread.close()
    #         self.portList(True)
    
    def handle_data(self,data):
        data=data.split(":")
        if len(data)>1:   
            if data[1]=="Forward\n" or data[1]=="Idle\n" or data[1]=="Backward\n":
                self.motorState=data[1]
                self.callOnStateChange()
        
    def readFromPort(self):

        while self.serialConnection.isOpen():
            try:
                reading = self.serialConnection.readline().decode()
                self.handle_data(reading)
            except  serial.serialutil.SerialException:
                print("connection lost")
                self.serialConnection.close()
                self.portList()
                
                break

        self.readthread = threading.Thread(target=self.readFromPort)
        self.readthread.start()
            

        

        

    def callOnStateChange(self):
        self.connectt=self.connection
        self.bedPosition=self.bedState
        self.motorPosition=self.motorState
        if self.onStateChange:
            self.onStateChange(self.connectt,self.bedPosition,self.motorPosition)


    def sendActions(self,a):
        if a=="backward":
           self.serialConnection.write("[CMD] MotorBackward|123\n".encode())
        if a=="stop":
            self.serialConnection.write("[CMD] MotorStop|123\n".encode())
        if a=="forward":
           self.serialConnection.write("[CMD] MotorForward|123\n".encode())
        if a=="eject":
            print("start")
            self.serialConnection.write("[CMD] SequenceStart|123\n".encode())      
      

    


    # def controlInit(self):
    #     self.sc.checkConnection(self.s)
      
        

SerialPorts()   