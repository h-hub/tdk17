const OPEN_REMOTE_SLOT = "-1";

function ShowRenderer(vidyoConnector, divId) {
    var rndr = document.getElementById(divId);
    vidyoConnector.ShowViewAt(divId, rndr.offsetLeft, rndr.offsetTop, rndr.offsetWidth, rndr.offsetHeight);
}

// Run StartVidyoConnector when the VidyoClient is successfully loaded
function StartVidyoConnector(VC) {
    var vidyoConnector;
    var cameras = {};
    var microphones = {};
    var speakers = {};
    var selectedLocalCamera = {id: 0, camera: null};
    var cameraPrivacy = false;
    var microphonePrivacy = false;
    var remoteCameras = {};
    var configParams = {};

    // rendererSlots[0] is used to render the local camera;
    // rendererSlots[1] through rendererSlots[5] are used to render up to 5 cameras from remote participants.
    var rendererSlots = ["1", OPEN_REMOTE_SLOT, OPEN_REMOTE_SLOT, OPEN_REMOTE_SLOT, OPEN_REMOTE_SLOT, OPEN_REMOTE_SLOT];

    window.onresize = function() {
        showRenderers();
    };

    VC.CreateVidyoConnector({
        viewId: null, // Set to null in order to create a custom layout
        viewStyle: "VIDYO_CONNECTORVIEWSTYLE_Default", // Visual style of the composited renderer
        remoteParticipants: 15,     // Maximum number of participants to render
        logFileFilter: "warning info@VidyoClient info@VidyoConnector",
        logFileName: "VidyoConnector.log",
        userData: 0
    }).then(function(vc) {
        vidyoConnector = vc;
        parseUrlParameters(configParams);
        registerDeviceListeners(vidyoConnector, cameras, microphones, speakers, rendererSlots, selectedLocalCamera, remoteCameras);
        handleDeviceChange(vidyoConnector, cameras, microphones, speakers);
        handleParticipantChange(vidyoConnector, rendererSlots, remoteCameras);

        // Populate the connectionStatus with the client version
        vidyoConnector.GetVersion().then(function(version) {
            $("#clientVersion").html("v " + version);
        }).catch(function() {
            console.error("GetVersion failed");
        });

        // If enableDebug is configured then enable debugging
        if (configParams.enableDebug === "1") {
            vidyoConnector.EnableDebug({port:7776, logFilter: "warning info@VidyoClient info@VidyoConnector"}).then(function() {
                console.log("EnableDebug success");
            }).catch(function() {
                console.error("EnableDebug failed");
            });
        }

        // Join the conference if the autoJoin URL parameter was enabled
        if (configParams.autoJoin === "1") {
          joinLeave();
        } else {
          // Handle the join in the toolbar button being clicked by the end user.
          $("#joinLeaveButton").one("click", joinLeave);
        }
    }).catch(function(err) {
        console.error("CreateVidyoConnector Failed " + err);
    });

    // Handle the camera privacy button, toggle between show and hide.
    $("#cameraButton").click(function() {
        // CameraPrivacy button clicked
        cameraPrivacy = !cameraPrivacy;
        vidyoConnector.SetCameraPrivacy({
            privacy: cameraPrivacy
        }).then(function() {
            if (cameraPrivacy) {
                // Hide the local camera preview, which is in slot 0
                $("#cameraButton").addClass("cameraOff").removeClass("cameraOn");
                vidyoConnector.HideView({ viewId: "renderer0" }).then(function() {
                    console.log("HideView Success");
                }).catch(function(e) {
                    console.log("HideView Failed");
                });
            } else {
                // Show the local camera preview, which is in slot 0
                $("#cameraButton").addClass("cameraOn").removeClass("cameraOff");
                vidyoConnector.AssignViewToLocalCamera({
                    viewId: "renderer0",
                    localCamera: selectedLocalCamera.camera,
                    displayCropped: true,
                    allowZoom: false
                }).then(function() {
                    console.log("AssignViewToLocalCamera Success");
                    ShowRenderer(vidyoConnector, "renderer0");
                }).catch(function(e) {
                    console.log("AssignViewToLocalCamera Failed");
                });
            }
            console.log("SetCameraPrivacy Success");
        }).catch(function() {
            console.error("SetCameraPrivacy Failed");
        });
    });

    // Handle the microphone mute button, toggle between mute and unmute audio.
    $("#microphoneButton").click(function() {
        // MicrophonePrivacy button clicked
        microphonePrivacy = !microphonePrivacy;
        vidyoConnector.SetMicrophonePrivacy({
            privacy: microphonePrivacy
        }).then(function() {
            if (microphonePrivacy) {
                $("#microphoneButton").addClass("microphoneOff").removeClass("microphoneOn");
            } else {
                $("#microphoneButton").addClass("microphoneOn").removeClass("microphoneOff");
            }
            console.log("SetMicrophonePrivacy Success");
        }).catch(function() {
            console.error("SetMicrophonePrivacy Failed");
        });
    });

    function joinLeave() {
        // join or leave dependent on the joinLeaveButton, whether it
        // contains the class callStart or callEnd.
        if ($("#joinLeaveButton").hasClass("callStart")) {
            $("#connectionStatus").html("Connecting...");
            $("#joinLeaveButton").removeClass("callStart").addClass("callEnd");
            $('#joinLeaveButton').prop('title', 'Leave Conference');
            connectToConference(vidyoConnector, rendererSlots, remoteCameras, configParams);
        } else {
            $("#connectionStatus").html("Disconnecting...");
            vidyoConnector.Disconnect().then(function() {
                console.log("Disconnect Success");
            }).catch(function() {
                console.error("Disconnect Failure");
            });
        }
        $("#joinLeaveButton").one("click", joinLeave);
    }

    $("#options").removeClass("optionsHide");
}

function registerDeviceListeners(vidyoConnector, cameras, microphones, speakers, rendererSlots, selectedLocalCamera, remoteCameras) {
    // Map the "None" option (whose value is 0) in the camera, microphone, and speaker drop-down menus to null since
    // a null argument to SelectLocalCamera, SelectLocalMicrophone, and SelectLocalSpeaker releases the resource.
    cameras[0]     = null;
    microphones[0] = null;
    speakers[0]    = null;

    // Handle appearance and disappearance of camera devices in the system
    vidyoConnector.RegisterLocalCameraEventListener({
        onAdded: function(localCamera) {
            // New camera is available
            $("#cameras").append("<option value='" + window.btoa(localCamera.id) + "'>" + localCamera.name + "</option>");
            cameras[window.btoa(localCamera.id)] = localCamera;
        },
        onRemoved: function(localCamera) {
            // Existing camera became unavailable
            $("#cameras option[value='" + window.btoa(localCamera.id) + "']").remove();
            delete cameras[window.btoa(localCamera.id)];

            // If the removed camera was the selected camera, then hide it
            if(selectedLocalCamera.id === localCamera.id) {
                vidyoConnector.HideView({ viewId: "renderer0" }).then(function() {
                    console.log("HideView Success");
                }).catch(function(e) {
                    console.log("HideView Failed");
                });
            }
        },
        onSelected: function(localCamera) {
            // Camera was selected/unselected by you or automatically
            if(localCamera) {
                $("#cameras option[value='" + window.btoa(localCamera.id) + "']").prop('selected', true);
                selectedLocalCamera.id = localCamera.id;
                selectedLocalCamera.camera = localCamera;

                // Assign view to selected camera
                vidyoConnector.AssignViewToLocalCamera({
                    viewId: "renderer0",
                    localCamera: localCamera,
                    displayCropped: true,
                    allowZoom: false
                }).then(function() {
                    console.log("AssignViewToLocalCamera Success");
                    ShowRenderer(vidyoConnector, "renderer0");
                }).catch(function(e) {
                    console.log("AssignViewToLocalCamera Failed");
                });
            } else {
                selectedLocalCamera.id = 0;
                selectedLocalCamera.camera = null;
            }
        },
        onStateUpdated: function(localCamera, state) {
            // Camera state was updated
        }
    }).then(function() {
        console.log("RegisterLocalCameraEventListener Success");
    }).catch(function() {
        console.error("RegisterLocalCameraEventListener Failed");
    });

    // Handle appearance and disappearance of microphone devices in the system
    vidyoConnector.RegisterLocalMicrophoneEventListener({
        onAdded: function(localMicrophone) {
            // New microphone is available
            $("#microphones").append("<option value='" + window.btoa(localMicrophone.id) + "'>" + localMicrophone.name + "</option>");
            microphones[window.btoa(localMicrophone.id)] = localMicrophone;
        },
        onRemoved: function(localMicrophone) {
            // Existing microphone became unavailable
            $("#microphones option[value='" + window.btoa(localMicrophone.id) + "']").remove();
            delete microphones[window.btoa(localMicrophone.id)];
        },
        onSelected: function(localMicrophone) {
            // Microphone was selected/unselected by you or automatically
            if(localMicrophone)
                $("#microphones option[value='" + window.btoa(localMicrophone.id) + "']").prop('selected', true);
        },
        onStateUpdated: function(localMicrophone, state) {
            // Microphone state was updated
        }
    }).then(function() {
        console.log("RegisterLocalMicrophoneEventListener Success");
    }).catch(function() {
        console.error("RegisterLocalMicrophoneEventListener Failed");
    });

    // Handle appearance and disappearance of speaker devices in the system
    vidyoConnector.RegisterLocalSpeakerEventListener({
        onAdded: function(localSpeaker) {
            // New speaker is available
            $("#speakers").append("<option value='" + window.btoa(localSpeaker.id) + "'>" + localSpeaker.name + "</option>");
            speakers[window.btoa(localSpeaker.id)] = localSpeaker;
        },
        onRemoved: function(localSpeaker) {
            // Existing speaker became unavailable
            $("#speakers option[value='" + window.btoa(localSpeaker.id) + "']").remove();
            delete speakers[window.btoa(localSpeaker.id)];
        },
        onSelected: function(localSpeaker) {
            // Speaker was selected/unselected by you or automatically
            if(localSpeaker)
                $("#speakers option[value='" + window.btoa(localSpeaker.id) + "']").prop('selected', true);
        },
        onStateUpdated: function(localSpeaker, state) {
            // Speaker state was updated
        }
    }).then(function() {
        console.log("RegisterLocalSpeakerEventListener Success");
    }).catch(function() {
        console.error("RegisterLocalSpeakerEventListener Failed");
    });

    vidyoConnector.RegisterRemoteCameraEventListener({
        onAdded: function(camera, participant) {
            // Store the remote camera for this participant
            remoteCameras[participant.id] = {camera: camera, isRendered: false};

            // Scan through the renderer slots and look for an open slot.
            // If an open slot is found then assign it to the remote camera.
            for (var i = 1; i < rendererSlots.length; i++) {
                if (rendererSlots[i] === OPEN_REMOTE_SLOT) {
                    rendererSlots[i] = participant.id;
                    remoteCameras[participant.id].isRendered = true;
                    vidyoConnector.AssignViewToRemoteCamera({
                        viewId: "renderer" + (i),
                        remoteCamera: camera,
                        displayCropped: true,
                        allowZoom: false
                    }).then(function(retValue) {
                        console.log("AssignViewToRemoteCamera " + participant.id + " to slot " + i + " = " + retValue);
                        ShowRenderer(vidyoConnector, "renderer" + (i));
                    }).catch(function() {
                        console.log("AssignViewToRemoteCamera Failed");
                        rendererSlots[i] = OPEN_REMOTE_SLOT;
                        remoteCameras[participant.id].isRendered = false;
                    });
                    break;
                }
            }
        },
        onRemoved: function(camera, participant) {
            console.log("RegisterRemoteCameraEventListener onRemoved participant.id : " + participant.id);
            delete remoteCameras[participant.id];

            // Scan through the renderer slots and if this participant's camera
            // is being rendered in a slot, then clear the slot and hide the camera.
            for (var i = 1; i < rendererSlots.length; i++) {
                if (rendererSlots[i] === participant.id) {
                    rendererSlots[i] = OPEN_REMOTE_SLOT;
                    console.log("Slot found, calling HideView on renderer" + i);
                    vidyoConnector.HideView({ viewId: "renderer" + (i) }).then(function() {
                        console.log("HideView Success");

                        // If a remote camera is not rendered in a slot, replace it in the slot that was just cleaered
                        for (var id in remoteCameras) {
                            if (!remoteCameras[id].isRendered) {
                                rendererSlots[i] = id;
                                remoteCameras[id].isRendered = true;
                                vidyoConnector.AssignViewToRemoteCamera({
                                    viewId: "renderer" + (i),
                                    remoteCamera: remoteCameras[id].camera,
                                    displayCropped: true,
                                    allowZoom: false
                                }).then(function(retValue) {
                                    console.log("AssignViewToRemoteCamera " + id + " to slot " + i + " = " + retValue);
                                    ShowRenderer(vidyoConnector, "renderer" + (i));
                                }).catch(function() {
                                    console.log("AssignViewToRemoteCamera Failed");
                                    rendererSlots[i] = OPEN_REMOTE_SLOT;
                                    remoteCameras[id].isRendered = false;
                                });
                                break;
                            }
                        }
                    }).catch(function(e) {
                        console.log("HideView Failed");
                    });
                    break;
                }
            }
        },
        onStateUpdated: function(camera, participant, state) {
            // Camera state was updated
        }
    }).then(function() {
        console.log("RegisterRemoteCameraEventListener Success");
    }).catch(function() {
        console.error("RegisterRemoteCameraEventListener Failed");
    });
}

function handleDeviceChange(vidyoConnector, cameras, microphones, speakers) {
    // Hook up camera selector functions for each of the available cameras
    $("#cameras").change(function() {
        // Camera selected from the drop-down menu
        $("#cameras option:selected").each(function() {
            // Hide the view of the previously selected local camera
            vidyoConnector.HideView({ viewId: "renderer0" });

            // Select the newly selected local camera
            camera = cameras[$(this).val()];
            vidyoConnector.SelectLocalCamera({
                localCamera: camera
            }).then(function() {
                console.log("SelectCamera Success");
            }).catch(function() {
                console.error("SelectCamera Failed");
            });
        });
    });

    // Hook up microphone selector functions for each of the available microphones
    $("#microphones").change(function() {
        // Microphone selected from the drop-down menu
        $("#microphones option:selected").each(function() {
            microphone = microphones[$(this).val()];
            vidyoConnector.SelectLocalMicrophone({
                localMicrophone: microphone
            }).then(function() {
                console.log("SelectMicrophone Success");
            }).catch(function() {
                console.error("SelectMicrophone Failed");
            });
        });
    });

    // Hook up speaker selector functions for each of the available speakers
    $("#speakers").change(function() {
        // Speaker selected from the drop-down menu
        $("#speakers option:selected").each(function() {
            speaker = speakers[$(this).val()];
            vidyoConnector.SelectLocalSpeaker({
                localSpeaker: speaker
            }).then(function() {
                console.log("SelectSpeaker Success");
            }).catch(function() {
                console.error("SelectSpeaker Failed");
            });
        });
    });
}

function getParticipantName(participant, cb) {
    if (!participant) {
        cb("Undefined");
        return;
    }

    if (participant.name) {
        cb(participant.name);
        return;
    }

    participant.GetName().then(function(name) {
        cb(name);
    }).catch(function() {
        cb("GetNameFailed");
    });
}

function handleParticipantChange(vidyoConnector, rendererSlots, remoteCameras) {
    vidyoConnector.RegisterParticipantEventListener({
        onJoined: function(participant) {
            getParticipantName(participant, function(name) {
                $("#participantStatus").html("" + name + " Joined");
                console.log("Participant onJoined: " + name);
            });
        },
        onLeft: function(participant) {
            getParticipantName(participant, function(name) {
                $("#participantStatus").html("" + name + " Left");
                console.log("Participant onLeft: " + name);
            });
        },
        onDynamicChanged: function(participants, cameras) {
            // Order of participants changed
        },
        onLoudestChanged: function(participant, audioOnly) {
            getParticipantName(participant, function(name) {
                $("#participantStatus").html("" + name + " Speaking");
            });

            // Check if the loudest speaker is being rendered in one of the slots
            var found = false;
            for (var i = 1; i < rendererSlots.length; i++) {
                if (rendererSlots[i] === participant.id) {
                    found = true;
                    break;
                }
            }
            console.log("onLoudestChanged: loudest speaker in rendererSlots? " + found);

            // First check if the participant's camera has been added to the remoteCameras dictionary
            if (!(participant.id in remoteCameras)) {
                console.log("Warning: loudest speaker participant does not have a camera in remoteCameras");
            }
            // If the loudest speaker is not being rendered in one of the slots then
            // hide the slot 1 remote camera and assign loudest speaker to slot 1.
            else if (!found) {
                // Set the isRendered flag to false of the remote camera which is being hidden
                remoteCameras[rendererSlots[1]].isRendered = false;

                // Assign slot 1 to the the loudest speaker's participant id
                rendererSlots[1] = participant.id;

                // Set the isRendered flag to true of the remote camera which has now been rendered
                remoteCameras[participant.id].isRendered = true;

                //Hiding the view first, before the AssignViewToRemoteCamera
                vidyoConnector.HideView({ viewId: "renderer1"}).then(function() {
                    console.log("HideView Success");
                    vidyoConnector.AssignViewToRemoteCamera({
                        viewId: "renderer1",
                        remoteCamera: remoteCameras[participant.id].camera,
                        displayCropped: true,
                        allowZoom: false
                    }).then(function(retValue) {
                        console.log("AssignViewToRemoteCamera " + participant.id + " to slot 1" + " = " + retValue);
                        ShowRenderer(vidyoConnector, "renderer1");
                    }).catch(function() {
                        console.log("AssignViewToRemoteCamera Failed");
                        rendererSlots[1] = OPEN_REMOTE_SLOT;
                        remoteCameras[participant.id].isRendered = false;
                    });
                }).catch(function(e) {
                    console.log("HideView Failed, loudest speaker not assigned");
                });
            }
        }
    }).then(function() {
        console.log("RegisterParticipantEventListener Success");
    }).catch(function() {
        console.err("RegisterParticipantEventListener Failed");
    });
}

function parseUrlParameters(configParams) {
    // Fill in the form parameters from the URI
    var host = getUrlParameterByName("host");
    if (host)
        $("#host").val(host);
    var token = getUrlParameterByName("token");
    if (token)
        $("#token").val(token);
    var displayName = getUrlParameterByName("displayName");
    if (displayName)
        $("#displayName").val(displayName);
    var resourceId = getUrlParameterByName("resourceId");
    if (resourceId)
        $("#resourceId").val(resourceId);
    configParams.autoJoin    = getUrlParameterByName("autoJoin");
    configParams.enableDebug = getUrlParameterByName("enableDebug");
    configParams.hideConfig  = getUrlParameterByName("hideConfig");

    // If the parameters are passed in the URI, do not display options dialog,
    // and automatically connect.
    if (host && token && displayName && resourceId) {
        $("#optionsParameters").addClass("optionsHidePermanent");
    }

    if (configParams.hideConfig=="1") {
        updateRenderers(true);
    }

    return;
}

function showRenderers() {
    ShowRenderer(vidyoConnector, "renderer0");
    ShowRenderer(vidyoConnector, "renderer1");
    ShowRenderer(vidyoConnector, "renderer2");
    ShowRenderer(vidyoConnector, "renderer3");
    ShowRenderer(vidyoConnector, "renderer4");
    ShowRenderer(vidyoConnector, "renderer5");
}

function updateRenderers(fullscreen) {
    if (fullscreen) {
        $("#options").addClass("optionsHide");
        $("#renderer0").css({'position': 'absolute', 'left':  '0%', 'right': '66%', 'top': '0px', 'bottom': '54%',  'width': '34%'});
        $("#renderer1").css({'position': 'absolute', 'left': '34%', 'right': '33%', 'top': '0px', 'bottom': '54%',  'width': '33%'});
        $("#renderer2").css({'position': 'absolute', 'left': '67%', 'right':  '0%', 'top': '0px', 'bottom': '54%',  'width': '33%'});
        $("#renderer3").css({'position': 'absolute', 'left':  '0%', 'right': '66%', 'top': '46%', 'bottom': '60px', 'width': '34%'});
        $("#renderer4").css({'position': 'absolute', 'left': '34%', 'right': '33%', 'top': '46%', 'bottom': '60px', 'width': '33%'});
        $("#renderer5").css({'position': 'absolute', 'left': '67%', 'right':  '0%', 'top': '46%', 'bottom': '60px', 'width': '33%'});
    } else {
        $("#options").removeClass("optionsHide");
        $("#renderer0").css({'position': 'absolute', 'left': '25%', 'right': '0%', 'top': '0px', 'bottom': '60px',  'width': '75%'});
        $("#renderer1").css({'position': 'absolute', 'width': '0px'});
        $("#renderer2").css({'position': 'absolute', 'width': '0px'});
        $("#renderer3").css({'position': 'absolute', 'width': '0px'});
        $("#renderer4").css({'position': 'absolute', 'width': '0px'});
        $("#renderer5").css({'position': 'absolute', 'width': '0px'});
    }

    showRenderers();
}

// Attempt to connect to the conference
// We will also handle connection failures
// and network or server-initiated disconnects.
function connectToConference(vidyoConnector, rendererSlots, remoteCameras, configParams) {
    // Abort the Connect call if resourceId is invalid. It cannot contain empty spaces or "@".
    if ( $("#resourceId").val().indexOf(" ") != -1 || $("#resourceId").val().indexOf("@") != -1) {
        console.error("Connect call aborted due to invalid Resource ID");
        connectorDisconnected(rendererSlots, remoteCameras, "Disconnected", "");
        $("#error").html("<h3>Failed due to invalid Resource ID" + "</h3>");
        return;
    }

    // Clear messages
    $("#error").html("");
    $("#message").html("<h3 class='blink'>CONNECTING...</h3>");

    vidyoConnector.Connect({
        // Take input from options form
        host: $("#host").val(),
        token: $("#token").val(),
        displayName: $("#displayName").val(),
        resourceId: $("#resourceId").val(),

        // Define handlers for connection events.
        onSuccess: function() {
            // Connected
            console.log("vidyoConnector.Connect : onSuccess callback received");
            $("#connectionStatus").html("Connected");

            if (configParams.hideConfig != "1") {
                updateRenderers(true);
            }
            $("#message").html("");
        },
        onFailure: function(reason) {
            // Failed
            console.error("vidyoConnector.Connect : onFailure callback received");
            connectorDisconnected(rendererSlots, remoteCameras, "Failed", "");
            $("#error").html("<h3>Call Failed: " + reason + "</h3>");
        },
        onDisconnected: function(reason) {
            // Disconnected
            console.log("vidyoConnector.Connect : onDisconnected callback received");
            connectorDisconnected(rendererSlots, remoteCameras, "Disconnected", "Call Disconnected: " + reason);

            if (configParams.hideConfig != "1") {
               updateRenderers(false);
            }
        }
    }).then(function(status) {
        if (status) {
            console.log("Connect Success");
        } else {
            console.error("Connect Failed");
            connectorDisconnected(rendererSlots, remoteCameras, "Failed", "");
            $("#error").html("<h3>Call Failed" + "</h3>");
        }
    }).catch(function() {
        console.error("Connect Failed");
        connectorDisconnected(rendererSlots, remoteCameras, "Failed", "");
        $("#error").html("<h3>Call Failed" + "</h3>");
    });
}

// Connector either fails to connect or a disconnect completed, update UI
// elements and clear rendererSlots and remoteCameras.
function connectorDisconnected(rendererSlots, remoteCameras, connectionStatus, message) {
    $("#connectionStatus").html(connectionStatus);
    $("#message").html(message);
    $("#participantStatus").html("");
    $("#joinLeaveButton").removeClass("callEnd").addClass("callStart");
    $('#joinLeaveButton').prop('title', 'Join Conference');

    // Clear rendererSlots and remoteCameras when not connected in case not cleared
    // in RegisterRemoteCameraEventListener onRemoved.
    for (var i = 1; i < rendererSlots.length; i++) {
        if (rendererSlots[i] != OPEN_REMOTE_SLOT) {
            rendererSlots[i] = OPEN_REMOTE_SLOT;
            console.log("Calling HideView on renderer" + i);
            vidyoConnector.HideView({ viewId: "renderer" + (i) }).then(function() {
                console.log("HideView Success");
            }).catch(function(e) {
                console.log("HideView Failed");
            });
        }
    }
    remoteCameras = {};
}

// Extract the desired parameter from the browser's location bar
function getUrlParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}
