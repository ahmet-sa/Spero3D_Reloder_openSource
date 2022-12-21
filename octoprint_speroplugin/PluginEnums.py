

from enum import Enum



class UsbState(str,Enum):
    Searching='Searching'
    Connected='Connected'


class ItemState(Enum):
    
    AWAIT="Await"
    PRINTING="Printing"
    EJECTING="Ejecting"
    EJECT_FAIL="eject fail"
    CANCELLED="Cancelled"
    CANCELLING="Cancelling"
    FAILLED="Failed"
    PAUSED="Paused"
    PAUSING="Pausing"
    FINISHED="Finished"
    def __str__(self):
     return str(self.value)

class QueueState(Enum):
    
    IDLE="IDLE"
    STARTED="STARTED"
    RUNNING="RUNNING"
    CANCELLED="CANCELLED"
    PAUSED="PAUSED"

    def __str__(self):
     return str(self.value)



class BedPosition(Enum):
    MIDDLE="Middle"
    FRONT="Front"
    BACK="Back"
    
    def __str__(self):
     return str(self.value)



class MotorState(Enum):
    IDLE="Idle"
    FORWARD="Forward"
    BACKWARD="Backward"
    STOP="Stop"

    
    
class EjectState(Enum):
    IDLE="IDLE"
    WAIT_FOR_TEMP="WAIT_FOR_TEMP"
    EJECTING="EJECTING"
    EJECTING_FINISHED="EJECTING_FINISHED"
    EJECT_FAİL="EJECT_FAIL"
    
    
class ShieldState(Enum):
    IDLE="IDLE"
    ISINSEQUENACE="ISINSEQUENACE"
    
    def __str__(self):
     return str(self.value)
     
     


