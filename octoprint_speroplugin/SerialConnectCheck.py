
from signal import pause
import time
import serial
from signal import pause
import sys
import glob
import serial




class SerialConnectCheck() :
    onStateChange=None
    def checkConnection(self,s):
        if s:
            self.state="idle"
            try:
                # Read data from the serial port
                data = s.read()
                newPorts=SerialConnectCheck.sendConnectLost(self)
                SerialConnectCheck.callOnStateChange(self,newPorts)

                # Check if data was received
                if data:
                    print(data)



            except serial.SerialException as e:
                global connect
                # Handle a lost connection
                print(e)
                if e.args[0] == "device reports readiness to read but returned no data (device disconnected or multiple access on port?)":
                    print("Lost connection to serial port")
                   
                    SerialConnectCheck.sendConnectLost(self)
                    self.state="lost"
          
                     
    
               
                    
    def sendConnectLost(self):
        print("sendConnectLost")
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

        result = [10]
        index=0
        ports = serial.tools.list_ports.comports()
        for port in ports:
            try:
                print(port.serial_number)
                print(port.name)
                print(port.manufacturer)
                if (port.manufacturer=="Spero3D"):
                    result[index]=port.name
                    index+=1
            except (OSError, serial.SerialException):
                pass
        return result   
                        
                        

    def callOnStateChange(self,ports):
        if SerialConnectCheck.onStateChange:
                SerialConnectCheck.onStateChange(ports)
    
 