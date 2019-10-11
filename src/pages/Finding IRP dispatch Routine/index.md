---
title: Finding IRP dispatch routine
date: "2019-10-12"
---

## Environment
- Windows 10
- In VM
- Attached Windbg

### How to finding

First, show deviceobject structures

```
kd> !drvobj DeviceObj 7
Driver object (ffffa3828a49b060) is for:
 \Driver\DeviceObj

Driver Extension List: (id , addr)

Device Object list:
ffffa3828c2869f0

DriverEntry:   fffff80043a55064 DeviceObj
DriverStartIo: 00000000
DriverUnload:  fffff800439d1950 DeviceObj
AddDevice:     00000000

Dispatch routines:
[00] IRP_MJ_CREATE                      fffff800439d4ff0        DeviceObj+0x4ff0
[01] IRP_MJ_CREATE_NAMED_PIPE           fffff800439d4ff0        DeviceObj+0x4ff0
[02] IRP_MJ_CLOSE                       fffff800439d4ff0        DeviceObj+0x4ff0
[03] IRP_MJ_READ                        fffff800439d4ff0        DeviceObj+0x4ff0
[04] IRP_MJ_WRITE                       fffff800439d4ff0        DeviceObj+0x4ff0
[05] IRP_MJ_QUERY_INFORMATION           fffff800439d4ff0        DeviceObj+0x4ff0
[06] IRP_MJ_SET_INFORMATION             fffff800439d4ff0        DeviceObj+0x4ff0
[07] IRP_MJ_QUERY_EA                    fffff800439d4ff0        DeviceObj+0x4ff0
[08] IRP_MJ_SET_EA                      fffff800439d4ff0        DeviceObj+0x4ff0
[09] IRP_MJ_FLUSH_BUFFERS               fffff800439d4ff0        DeviceObj+0x4ff0
[0a] IRP_MJ_QUERY_VOLUME_INFORMATION    fffff800439d4ff0        DeviceObj+0x4ff0
[0b] IRP_MJ_SET_VOLUME_INFORMATION      fffff800439d4ff0        DeviceObj+0x4ff0
[0c] IRP_MJ_DIRECTORY_CONTROL           fffff800439d4ff0        DeviceObj+0x4ff0
[0d] IRP_MJ_FILE_SYSTEM_CONTROL         fffff800439d4ff0        DeviceObj+0x4ff0
[0e] IRP_MJ_DEVICE_CONTROL              fffff800439d5020        DeviceObj+0x5020
[0f] IRP_MJ_INTERNAL_DEVICE_CONTROL     fffff800439d4ff0        DeviceObj+0x4ff0
[10] IRP_MJ_SHUTDOWN                    fffff800439d4ff0        DeviceObj+0x4ff0
[11] IRP_MJ_LOCK_CONTROL                fffff800439d4ff0        DeviceObj+0x4ff0
[12] IRP_MJ_CLEANUP                     fffff800439d4ff0        DeviceObj+0x4ff0
[13] IRP_MJ_CREATE_MAILSLOT             fffff800439d4ff0        DeviceObj+0x4ff0
[14] IRP_MJ_QUERY_SECURITY              fffff800439d4ff0        DeviceObj+0x4ff0
[15] IRP_MJ_SET_SECURITY                fffff800439d4ff0        DeviceObj+0x4ff0
[16] IRP_MJ_POWER                       fffff800439d4ff0        DeviceObj+0x4ff0
[17] IRP_MJ_SYSTEM_CONTROL              fffff800439d4ff0        DeviceObj+0x4ff0
[18] IRP_MJ_DEVICE_CHANGE               fffff800439d4ff0        DeviceObj+0x4ff0
[19] IRP_MJ_QUERY_QUOTA                 fffff800439d4ff0        DeviceObj+0x4ff0
[1a] IRP_MJ_SET_QUOTA                   fffff800439d4ff0        DeviceObj+0x4ff0
[1b] IRP_MJ_PNP                         fffff800463238f0        nt!IopInvalidDeviceRequest


Device Object stacks:

!devstack ffffa3828c2869f0 :
  !DevObj           !DrvObj            !DevExt           ObjectName
> ffffa3828c2869f0  \Driver\DeviceObj   00000000  DeviceObj
```

IRP_MJ_DEVICE_CONTROL is IRP_Dispatch_Routine.
IRP_MJ_DEVICE_CONTROL is _IO_STACK_LOCATION
IOCTL dispatch routine defined in the follow structre.

```
NTSTATES Dispatch DeviceControl {
  __in struct _DEVICE_OBJECT *DeviceObject,
  __in struct _IRP *Irp
}
```


_IRP is structure of IRP(I/O request packet) structures pointer.
```
kd> dt -v -r 3 _IRP
nt!_IRP
struct _IRP, 23 elements, 0xd0 bytes
   +0x000 Type             : ??
   +0x002 Size             : ??
   +0x004 AllocationProcessorNumber : ??
   +0x006 Reserved         : ??
   +0x008 MdlAddress       : ???? 
   +0x010 Flags            : ??
   +0x018 AssociatedIrp    : union <anonymous-tag>, 3 elements, 0x8 bytes
      +0x000 MasterIrp        : ???? 
      +0x000 IrpCount         : ??
      +0x000 SystemBuffer     : ???? 
   +0x020 ThreadListEntry  : struct _LIST_ENTRY, 2 elements, 0x10 bytes
      +0x000 Flink            : ???? 
      +0x008 Blink            : ???? 
   +0x030 IoStatus         : struct _IO_STATUS_BLOCK, 3 elements, 0x10 bytes
      +0x000 Status           : ??
      +0x000 Pointer          : ???? 
      +0x008 Information      : ??
   +0x040 RequestorMode    : ??
   +0x041 PendingReturned  : ??
   +0x042 StackCount       : ??
   +0x043 CurrentLocation  : ??
   +0x044 Cancel           : ??
   +0x045 CancelIrql       : ??
   +0x046 ApcEnvironment   : ??
   +0x047 AllocationFlags  : ??
   +0x048 UserIosb         : ???? 
   +0x050 UserEvent        : ???? 
   +0x058 Overlay          : union <anonymous-tag>, 2 elements, 0x10 bytes
      +0x000 AsynchronousParameters : struct <anonymous-tag>, 3 elements, 0x10 bytes
         +0x000 UserApcRoutine   : ???? 
         +0x000 IssuingProcess   : ???? 
         +0x008 UserApcContext   : ???? 
      +0x000 AllocationSize   : union _LARGE_INTEGER, 4 elements, 0x8 bytes
         +0x000 LowPart          : ??
         +0x004 HighPart         : ??
         +0x000 u                : struct <anonymous-tag>, 2 elements, 0x8 bytes
         +0x000 QuadPart         : ??
   +0x068 CancelRoutine    : ???? 
   +0x070 UserBuffer       : ???? 
   +0x078 Tail             : union <anonymous-tag>, 3 elements, 0x58 bytes
      +0x000 Overlay          : struct <anonymous-tag>, 9 elements, 0x58 bytes
         +0x000 DeviceQueueEntry : struct _KDEVICE_QUEUE_ENTRY, 3 elements, 0x18 bytes
         +0x000 DriverContext    : [4] ???? 
         +0x020 Thread           : ???? 
         +0x028 AuxiliaryBuffer  : ???? 
         +0x030 ListEntry        : struct _LIST_ENTRY, 2 elements, 0x10 bytes
         +0x040 CurrentStackLocation : ???? 
         +0x040 PacketType       : ??
         +0x048 OriginalFileObject : ???? 
         +0x050 IrpExtension     : ???? 
      +0x000 Apc              : struct _KAPC, 17 elements, 0x58 bytes
         +0x000 Type             : ??
         +0x001 SpareByte0       : ??
         +0x002 Size             : ??
         +0x003 SpareByte1       : ??
         +0x004 SpareLong0       : ??
         +0x008 Thread           : ???? 
         +0x010 ApcListEntry     : struct _LIST_ENTRY, 2 elements, 0x10 bytes
         +0x020 KernelRoutine    : ???? 
         +0x028 RundownRoutine   : ???? 
         +0x030 NormalRoutine    : ???? 
         +0x020 Reserved         : [3] ???? 
         +0x038 NormalContext    : ???? 
         +0x040 SystemArgument1  : ???? 
         +0x048 SystemArgument2  : ???? 
         +0x050 ApcStateIndex    : ??
         +0x051 ApcMode          : ??
         +0x052 Inserted         : ??
      +0x000 CompletionKey    : ???? 
Memory read error 000000000000007b
```

offset 0xb8 (=0x078+0x40), this location stored CurrentStackLocation.
CurrentStackLocation's type is _IO_STACK_LOCATION

```
kd> dt -v -r 3 _IO_STACK_LOCATION
nt!_IO_STACK_LOCATION
struct _IO_STACK_LOCATION, 9 elements, 0x48 bytes
   +0x000 MajorFunction    : ??
   +0x001 MinorFunction    : ??
   +0x002 Flags            : ??
   +0x003 Control          : ??
   +0x008 Parameters       : union <anonymous-tag>, 39 elements, 0x20 bytes
      +0x000 Create           : struct <anonymous-tag>, 5 elements, 0x20 bytes
         +0x000 SecurityContext  : ???? 
         +0x008 Options          : ??
         +0x010 FileAttributes   : ??
         +0x012 ShareAccess      : ??
         +0x018 EaLength         : ??
      +0x000 CreatePipe       : struct <anonymous-tag>, 5 elements, 0x20 bytes
         +0x000 SecurityContext  : ???? 
         +0x008 Options          : ??
         +0x010 Reserved         : ??
         +0x012 ShareAccess      : ??
         +0x018 Parameters       : ???? 
      +0x000 CreateMailslot   : struct <anonymous-tag>, 5 elements, 0x20 bytes
         +0x000 SecurityContext  : ???? 
         +0x008 Options          : ??
         +0x010 Reserved         : ??
         +0x012 ShareAccess      : ??
         +0x018 Parameters       : ???? 
      +0x000 Read             : struct <anonymous-tag>, 4 elements, 0x18 bytes
         +0x000 Length           : ??
         +0x008 Key              : ??
         +0x00c Flags            : ??
         +0x010 ByteOffset       : union _LARGE_INTEGER, 4 elements, 0x8 bytes
      +0x000 Write            : struct <anonymous-tag>, 4 elements, 0x18 bytes
         +0x000 Length           : ??
         +0x008 Key              : ??
         +0x00c Flags            : ??
         +0x010 ByteOffset       : union _LARGE_INTEGER, 4 elements, 0x8 bytes
      +0x000 QueryDirectory   : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 Length           : ??
         +0x008 FileName         : ???? 
         +0x010 FileInformationClass : Enum _FILE_INFORMATION_CLASS,  76 total enums
??
         +0x018 FileIndex        : ??
      +0x000 NotifyDirectory  : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 Length           : ??
         +0x008 CompletionFilter : ??
      +0x000 NotifyDirectoryEx : struct <anonymous-tag>, 3 elements, 0x18 bytes
         +0x000 Length           : ??
         +0x008 CompletionFilter : ??
         +0x010 DirectoryNotifyInformationClass : Enum _DIRECTORY_NOTIFY_INFORMATION_CLASS,  2 total enums
??
      +0x000 QueryFile        : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 Length           : ??
         +0x008 FileInformationClass : Enum _FILE_INFORMATION_CLASS,  76 total enums
??
      +0x000 SetFile          : struct <anonymous-tag>, 7 elements, 0x20 bytes
         +0x000 Length           : ??
         +0x008 FileInformationClass : Enum _FILE_INFORMATION_CLASS,  76 total enums
??
         +0x010 FileObject       : ???? 
         +0x018 ReplaceIfExists  : ??
         +0x019 AdvanceOnly      : ??
         +0x018 ClusterCount     : ??
         +0x018 DeleteHandle     : ???? 
      +0x000 QueryEa          : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 Length           : ??
         +0x008 EaList           : ???? 
         +0x010 EaListLength     : ??
         +0x018 EaIndex          : ??
      +0x000 SetEa            : struct <anonymous-tag>, 1 elements, 0x4 bytes
         +0x000 Length           : ??
      +0x000 QueryVolume      : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 Length           : ??
         +0x008 FsInformationClass : Enum _FSINFOCLASS,  15 total enums
??
      +0x000 SetVolume        : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 Length           : ??
         +0x008 FsInformationClass : Enum _FSINFOCLASS,  15 total enums
??
      +0x000 FileSystemControl : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 OutputBufferLength : ??
         +0x008 InputBufferLength : ??
         +0x010 FsControlCode    : ??
         +0x018 Type3InputBuffer : ???? 
      +0x000 LockControl      : struct <anonymous-tag>, 3 elements, 0x18 bytes
         +0x000 Length           : ???? 
         +0x008 Key              : ??
         +0x010 ByteOffset       : union _LARGE_INTEGER, 4 elements, 0x8 bytes
      +0x000 DeviceIoControl  : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 OutputBufferLength : ??
         +0x008 InputBufferLength : ??
         +0x010 IoControlCode    : ??
         +0x018 Type3InputBuffer : ???? 
      +0x000 QuerySecurity    : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 SecurityInformation : ??
         +0x008 Length           : ??
      +0x000 SetSecurity      : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 SecurityInformation : ??
         +0x008 SecurityDescriptor : ???? 
      +0x000 MountVolume      : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 Vpb              : ???? 
         +0x008 DeviceObject     : ???? 
      +0x000 VerifyVolume     : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 Vpb              : ???? 
         +0x008 DeviceObject     : ???? 
      +0x000 Scsi             : struct <anonymous-tag>, 1 elements, 0x8 bytes
         +0x000 Srb              : ???? 
      +0x000 QueryQuota       : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 Length           : ??
         +0x008 StartSid         : ???? 
         +0x010 SidList          : ???? 
         +0x018 SidListLength    : ??
      +0x000 SetQuota         : struct <anonymous-tag>, 1 elements, 0x4 bytes
         +0x000 Length           : ??
      +0x000 QueryDeviceRelations : struct <anonymous-tag>, 1 elements, 0x4 bytes
         +0x000 Type             : Enum _DEVICE_RELATION_TYPE,  7 total enums
??
      +0x000 QueryInterface   : struct <anonymous-tag>, 5 elements, 0x20 bytes
         +0x000 InterfaceType    : ???? 
         +0x008 Size             : ??
         +0x00a Version          : ??
         +0x010 Interface        : ???? 
         +0x018 InterfaceSpecificData : ???? 
      +0x000 DeviceCapabilities : struct <anonymous-tag>, 1 elements, 0x8 bytes
         +0x000 Capabilities     : ???? 
      +0x000 FilterResourceRequirements : struct <anonymous-tag>, 1 elements, 0x8 bytes
         +0x000 IoResourceRequirementList : ???? 
      +0x000 ReadWriteConfig  : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 WhichSpace       : ??
         +0x008 Buffer           : ???? 
         +0x010 Offset           : ??
         +0x018 Length           : ??
      +0x000 SetLock          : struct <anonymous-tag>, 1 elements, 0x1 bytes
         +0x000 Lock             : ??
      +0x000 QueryId          : struct <anonymous-tag>, 1 elements, 0x4 bytes
         +0x000 IdType           : Enum BUS_QUERY_ID_TYPE,  6 total enums
??
      +0x000 QueryDeviceText  : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 DeviceTextType   : Enum DEVICE_TEXT_TYPE,  2 total enums
??
         +0x008 LocaleId         : ??
      +0x000 UsageNotification : struct <anonymous-tag>, 3 elements, 0x10 bytes
         +0x000 InPath           : ??
         +0x001 Reserved         : [3]  "--- memory read error at address 0x00000000`0000000c ---"
         +0x008 Type             : Enum _DEVICE_USAGE_NOTIFICATION_TYPE,  7 total enums
??
      +0x000 WaitWake         : struct <anonymous-tag>, 1 elements, 0x4 bytes
         +0x000 PowerState       : Enum _SYSTEM_POWER_STATE,  8 total enums
??
      +0x000 PowerSequence    : struct <anonymous-tag>, 1 elements, 0x8 bytes
         +0x000 PowerSequence    : ???? 
      +0x000 Power            : struct <anonymous-tag>, 5 elements, 0x20 bytes
         +0x000 SystemContext    : ??
         +0x000 SystemPowerStateContext : struct _SYSTEM_POWER_STATE_CONTEXT, 10 elements, 0x4 bytes
         +0x008 Type             : Enum _POWER_STATE_TYPE,  2 total enums
??
         +0x010 State            : union _POWER_STATE, 2 elements, 0x4 bytes
         +0x018 ShutdownType     : Enum POWER_ACTION,  9 total enums
??
      +0x000 StartDevice      : struct <anonymous-tag>, 2 elements, 0x10 bytes
         +0x000 AllocatedResources : ???? 
         +0x008 AllocatedResourcesTranslated : ???? 
      +0x000 WMI              : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 ProviderId       : ??
         +0x008 DataPath         : ???? 
         +0x010 BufferSize       : ??
         +0x018 Buffer           : ???? 
      +0x000 Others           : struct <anonymous-tag>, 4 elements, 0x20 bytes
         +0x000 Argument1        : ???? 
         +0x008 Argument2        : ???? 
         +0x010 Argument3        : ???? 
         +0x018 Argument4        : ???? 
   +0x028 DeviceObject     : ???? 
   +0x030 FileObject       : ???? 
   +0x038 CompletionRoutine : ???? 
   +0x040 Context          : ???? 
Memory read error 0000000000000043

```

_IO_STACK_LOCATION is stored IoControlCode, inputBuffer, inputBufferSize, outputBuffer and outputBufferSize.

If you are finding IOCTL dispatch routine, please refer to this article :)