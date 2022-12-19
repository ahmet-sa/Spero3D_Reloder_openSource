import sys
import glob
import serial

import serial.tools
import serial.tools.list_ports
import asyncio
import chardet


class SerialPorts(object):
    onStateChange = None 
    connectedSerial=None
    ports=[]
    
    def __init__(self):
        self.serialPorts()
        self.bedState="Idle"
        self.motorState="Idle"
        pass
        # self.sc = SerialConnectCheck()
        
  
        
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


  
    async def checkSerialPorts(self):
            res = self.serialPorts()
            print(res)
            await asyncio.sleep(1)
            return res



    def connect(self,p): 
        
        self.s = serial.Serial(p)
        self.s.write("[CMD] Summary|123\n".encode())    
        return self.s
        
    def read(self):
            data_raw=b"sa"
            # self.s.write("[CMD] Summary|123\n".encode())    
            if self.s.is_open==True:
                    if self.s.readable(): 
                            data_raw = self.s.read_all()
                            print(data_raw)
                            print("222")
                            if data_raw!=None:
                                string = data_raw.decode()
                                data=string.split(",")
                            if len(data)>2:
                                print(data[0])
                                self.motorState=data[1]
                                self.bedState=data[2]
                                self.callOnStateChange()
                        # print(self.s.read(bytesToRead))
                        # print(self.s.readline(1000))
            #         print(self.s.read())
            # print(self.s.readline())   
       
    def callOnStateChange(self):
        self.bedPosition=self.bedState
        self.motorState=self.motorState
        if self.onStateChange:
            self.onStateChange(self.bedPosition,self.motorState)


    def sendActions(self,a):
        print(a)
        if a=="backward":
           self.s.write("[CMD] MotorBackward|123\n".encode())
           self.read()
        if a=="stop":
            self.s.write("[CMD] MotorStop|123\n".encode())
            self.read()
        if a=="forward":
           self.s.write("[CMD] MotorForward|123\n".encode())
        if a=="eject":
            print("start")
            self.s.write("[CMD] SequenceStart|123\n".encode())      
      

    


    # def controlInit(self):
    #     self.sc.checkConnection(self.s)
      
        

SerialPorts()   