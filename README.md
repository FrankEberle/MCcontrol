# MCcontrol
Control Yamaha MultiCast devices via web browser

## Motivation
The motivation of this project is to provide a web based application to control
Yamaha MusicCast devices with a standard browser. This allows to use
any smartphone, tablet or other device running a web browser to
control Yamaha MusicCast devices without the need to install the official
Yamaha App.

## Supported MusicCast Devices
This app was tested with the MusicCast WX-010 and WX-030 WiFi speakers,
but it should work with any other MusicCast enabled device like Yamaha
AV receivers.

## Requirements
The application was designed to run on a LEDE or OpenWRT based router
without the need of too much additional packages.

The back end uses a single CGI script which requires Haserl (http://haserl.sourceforge.net). Haserl packages are available for
LEDE / OpenWRT and also other distributions like Ubuntu.

Beside Haserl *wget* is required to send HTTP requests to the MusicCast
devices. All other requirements should already be available on LEDE / OpenWRT
and other distros.

## Installation

