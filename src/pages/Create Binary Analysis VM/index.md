---
title: Create Binary Analysis VM
date: "2019-10-12"
---

# Create Binary Analysis VM
I created VM for reverse engineering.
This is the note at that time.

## Install Virtual Box
To run VMs needs hypervisor.
I choose the Virtual Box.
Because, Virtual Box is easy to use and free.
To install Virtual Box navigate to the this page.
https://www.virtualbox.org/wiki/Downloads
You choose the package for your system, and download it.
Run the installer.
If you are using the mac OS, you can install with this command too.

```bash=
brew cask install virtualbox
```

## Installing Free Windows 7
Microsoft provide free windows VMs.
Those VMs have a limited license that will expire after 90 days.
To install VMs navigate to the this page.
https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/
You select the VM:
 * Windows 7(x86)
 * Virtual Box

Downloaded the .zip file, and extract it.
This file contain the .ova file.

Next, open Virtual Box and select File > Import Appliance.
Select the .ova file that you just extracted and click continue.
The settings should be ok, you click Import.

## Installing FLARE-VM
FLARE-VM is Windows-based security distribution for reverse engineer.
https://github.com/fireeye/flare-vm
It's installed many reverse engineering tools. 

To install on Windows VM, you visit the following URL with Internet Explorer.
http://boxstarter.org/package/url?https://raw.githubusercontent.com/fireeye/flare-vm/master/flarevm_malware.ps1

After you navigate to the above URL, you will be asked with a dialog.
Select Run to continue the installation.
You input password and press Enter with a console window.
The installation process takes time, please drink coffee and wait.
After installation, you got the binary analysis VM.
Yeah, you did it!! Enjoy!!