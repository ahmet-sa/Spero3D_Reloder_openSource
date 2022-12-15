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
        
    def connectTo(self,serial):
        
        # if device serial exist in ports connect
        return
    def sendAction(self,action):
        return
        
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
        print("connectttttttttt")                
        print(p)


        self.s = serial.Serial(p)
        print(self.s)
        # self.sc.checkConnection(self.s)
        
        return self.s
        
        
    def disconnect(sel,s):
        disconnect=""
        try:
                # Read data from the serial port
                data = s.read()
        

                # Check if data was received
                if data:
                    print(data)



        except serial.SerialException as e:
                print(e)
                if e.args[0] == "device reports readiness to read but returned no data (device disconnected or multiple access on port?)":
                    disconnect="Lost connection to serial port"
                    print("Lost connection to serial port")
                    
        return disconnect
            

    # def disconnect(self.p):
    #     print("disconnect")


    

    def sendActions(self,a):
        if a=="backward":
           self.s.write("[CMD] MotorBackward|123\n".encode())
        if a=="stop":
            self.s.write("[CMD] MotorStop|123\n".encode())
        if a=="forward":
           self.s.write("[CMD] MotorForward|123\n".encode())
        if a=="eject":
           self.s.write("[CMD] SequenceStart|123\n".encode())      


    # def controlInit(self):
    #     self.sc.checkConnection(self.s)
      
        

SerialPorts()   
 