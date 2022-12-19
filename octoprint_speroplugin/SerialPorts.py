import sys
import glob
import serial

import serial.tools
import serial.tools.list_ports
import asyncio


class SerialPorts(object):
    onStateChange = None 
    connectedSerial=None
    ports=[]
    
    def __init__(self):
        self.serialPorts()
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
            # self.s.write("[CMD] Summary|123\n".encode())    
            if self.s.is_open==True:
                    if self.s.readable(): 
                            print("sa")
                            data_raw = self.s.read_all()
                            print(data_raw)
                        # print(self.s.read(bytesToRead))
                        # print(self.s.readline(1000))
            #         print(self.s.read())
            # print(self.s.readline())   
          
            



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