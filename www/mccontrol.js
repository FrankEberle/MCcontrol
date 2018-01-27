// Copyright (c) 2018 Frank Eberle // www.frank-eberle.de

var currentDevice = "";
var playerUpdateInt = null;
var oldPlayInfo = null;
var volumeInfo = {
    min: 0,
    max: 0,
    step: 0
}


function presetsViewEnabled()
{
    loadPresets();
}


function playerViewEnabled()
{
    oldPlayInfo = null;
    playerUpdateInt = window.setInterval(updatePlayer, 3000);
}


function devicesViewEnabled()
{
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "getDeviceList"
        },
        dataType: "json"

    })
    .done(function(json) {
        if (json.status < 0) {
            console.log("Status %d %s", json.status, json.data);
            return;
        }
        $("#deviceButtons").html("");
        for (var i = 0; i < json.data.length; i++) {
            var device = json.data[i];
            var elem="<button class=\"btn btn-secondary btn-block w-100 preset-btn\"";
            elem += " data-device=\"" + device.id + "\"";
            elem += ">";
            elem += device.name;
            elem += "</button>";
            $("#deviceButtons").append(elem);
        }
        $("#deviceButtons button").click(function(ev) {
            if ($(this).hasClass("disabled")) {
                return;
            }
            var data = ev.target.dataset;
            $("#waitMsg").show();
            $("#deviceButtons button").addClass("disabled");
            $(".nav-item a:gt(0)").addClass("disabled");
            selectDevice(data.device, $(ev.target).html());        
        });
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    }); 
}


function enableView(name)
{
    if (playerUpdateInt != null) {
        window.clearInterval(playerUpdateInt);
        playerUpdateInt = null;
    }
    $(".nav-item").removeClass("active");
    $(".nav-link[data-view='" + name + "']").parent().addClass("active");
    $("main > div.view").hide();
    $("#" + name + "View").show();
    eval(name + "ViewEnabled();");
}


function setInfo(elem, info)
{
    if (info == "") {
        elem.html("&nbsp;");
    } else {
        elem.html(info);
    }
}


function updatePlayer()
{
    console.log("updatePlayer");
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "getPlayInfo",
            device: currentDevice
        },
        dataType: "json"
    })
    .done(function(json){
        if (json.status < 0) {
            console.log("Status %d %s", json.status, json.data);
            return;            
        }
        if (oldPlayInfo == null ||
            oldPlayInfo.playback != json.data.playback ||
            oldPlayInfo.input != json.data.input
        ) {
            $("#controlButtons button").attr("disabled", "disabled");
            if (json.data.input == "net_radio") {
                if (json.data.playback == "play") {
                    $("#controlButtons button[data-func='stop']").removeAttr("disabled");
                } else {
                    $("#controlButtons button[data-func='play']").removeAttr("disabled");
                }
            } else if (json.data.input == "spotify" || json.data.input == "server") {
                if (json.data.playback == "play") {
                    $("#controlButtons button[data-func='pause']").removeAttr("disabled");
                } else {
                    $("#controlButtons button[data-func='play']").removeAttr("disabled");
                }
                $("#controlButtons button[data-func='previous']").removeAttr("disabled");
                $("#controlButtons button[data-func='next']").removeAttr("disabled");
            }
        }
        // Update title info and album art
        setInfo($("#artistInfo"), json.data.artist);
        var albumTrack = json.data.album;
        if (json.data.track != "") {
            if (albumTrack != "") {
                albumTrack = albumTrack + " - ";
            }
            albumTrack = albumTrack + json.data.track;
        }
        setInfo($("#albumTrackInfo"), albumTrack);
        if (oldPlayInfo == null || oldPlayInfo.albumart_url != json.data.albumart_url) {
            if (json.data.albumart_url.indexOf(".jpg") != -1 || json.data.albumart_url.indexOf(".jpeg")) {
                var pos = json.data.albumart_url.lastIndexOf("/");
                var imageName = json.data.albumart_url.substr(pos + 1);
                $("#albumArt").html("<img src=\"/cgi-bin/mccontrol?method=albumArt&image=" + imageName + "&device=" + currentDevice + "\">");
            } else {
                $("#albumArt").html("");
            }    
        }
        // Save current play info to compare against
        oldPlayInfo = json.data;
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    });
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "getStatus",
            device: currentDevice
        },
        dataType: "json"
    })
    .done(function(json){
        if (json.status < 0) {
            console.log("Status %d %s", json.status, json.data);
            return;            
        }
        $("#volume").val(json.data.volume);
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    });
    
}


function loadPresets()
{
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "getPresetInfo",
            device: currentDevice
        },
        dataType: "json"

    })
    .done(function(json) {
        if (json.status < 0) {
            console.log("Status %d %s", json.status, json.data);
            return;
        }
        $("#presetsButtons").html("");
        for (var i = 0; i < json.data.preset_info.length; i++) {
            var preset = json.data.preset_info[i];
            if (preset.input == "unknown") {
                continue;
            }
            var elem="<button class=\"btn btn-secondary btn-block preset-btn\"";
            elem += " data-input=\"" + preset.input + "\"";
            elem += " data-num=\"" + String(i + 1) + "\"";
            elem += ">";
            elem += preset.text;
            elem += "</button>";
            $("#presetsButtons").append(elem);
        }
        $(".preset-btn").click(onPresetBtnClicked);
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    }); 
}


function onPresetBtnClicked(ev)
{
    var data = ev.target.dataset;
    $.ajax({
        url: "/cgi-bin/mccontrol",
        method: "GET",
        data: {
            method: "recallPreset",
            device: currentDevice,
            input: data.input,
            num: data.num
        }
    })
    .done(function() {
        console.log("success");
    })
    .fail(function() {
        console.log("failed");
    });
}


function netUsbSetPlayback(playback, onSuccess)
{
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "netUsbSetPlayback",
            device: currentDevice,
            playback: playback
        },
        dataType: "json"
    })
    .done(function(json) {
        if (json.status < 0) {
            console.log("Status %d %s", json.status, json.data);
            return;
        }
        if (json.data.response_code == 0 && onSuccess != null) {
            onSuccess();
        }
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    }); 
}


function showAlert(msg, alertClass)
{
    var html = "<div class=\"alert alert-" + alertClass + " alert-dismissible fade show\" role=\"alert\">";
    html += msg;
    html +="<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">"
    html +="<span aria-hidden=\"true\">&times;</span></button>";
    html += "</div>";
    $("main").prepend(html);
}


function showWarning(msg)
{
    showAlert(msg, "warning");
}


function showError(msg)
{
    showAlert(msg, "danger");
}


function selectDevice(deviceId, deviceName)
{
    $("#deviceName").html("");
    $(".nav-item a:gt(0)").addClass("disabled");
    oldPlayInfo = null;
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "getFeatures",
            device: deviceId
        },
        dataType: "json",
        complete: function() {
            $("#waitMsg").hide();
            $("#deviceButtons button").removeClass("disabled");;
        }
    })
    .done(function(json) {
        if (json.status < 0 || json.data.response_code != 0) {
            console.log("Status %d %s", json.status, json.data);
            if (json.status == -2) {
                showWarning("Player not responding (maybe switched off)");
            } else {
                showError("Unexpected error; status=" + String(json.status));
            }
            return;
        }
        $("#deviceName").html(deviceName);
        currentDevice = deviceId;
        $(".nav-item a").removeClass("disabled");
        for (var i = 0; i < json.data.zone.length; i++) {
            var zone = json.data.zone[i];
            if (zone.id == "main") {
                for (var j = 0; j < zone.range_step.length; j++) {
                    var range_step = zone.range_step[j]
                    if (range_step.id == "volume") {
                        volumeInfo.min = range_step.min;
                        volumeInfo.max = range_step.max;
                        volumeInfo.step = range_step.step;
                        console.log(volumeInfo);
                        var volElem = $("#volume");
                        volElem.attr("min", volumeInfo.min);
                        volElem.attr("max", volumeInfo.max);
                        break;
                    }
                }
                break;    
            }
            console.log(zone);
        }
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    });
}


function volumeChanged(ev)
{
    $.ajax({
        url: "/cgi-bin/mccontrol",
        type: "GET",
        data: {
            method: "setVolume",
            device: currentDevice,
            volume: ev.target.value
        },
        dataType: "json"
    })
    .done(function(json) {
        if (json.status < 0 || json.data.response_code != 0) {
            console.log("Status %d %s", json.status, json.data);
            return;
        }
    })
    .fail(function(xhr, status, err) {
        console.log(err);
    }); 
}


function onDocReady()
{
    $(".nav-link").click(function(ev) {
        var data = ev.target.dataset;
        if ($(ev.target).hasClass("disabled")) {
            return;
        }
        $(".navbar-collapse").collapse("hide");
        enableView(data.view);
    });

    $("#controlButtons button").click(function(ev) {
        if ($(this).hasClass("disabled")) {
            return;
        }
        var data = ev.target.dataset;
        netUsbSetPlayback(data.func, updatePlayer);
    });

    $("#volume").change(volumeChanged);

    enableView("devices");
}