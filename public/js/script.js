
const socket = io();
const videoChatForm = document.getElementById('video-chat-form');
const roomInput = document.getElementById('roomName');
const joinBtn = document.getElementById('joinBtn');
const userVideo = document.getElementById('userVideo');
const peerVideo = document.getElementById('peerVideo');

const muteBtn = document.getElementById('muteBtn');
const hideBtn = document.getElementById('hideBtn');
const leaveBtn = document.getElementById('leaveBtn');

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var creator = false;
var roomName = '';
var rtcPeerConnection = null;
var iceServers = {
    iceServers:[
        {urls:"stun:stun.services.mozilla.com"},
        {urls:"stun:stun.l.google.com:19302"},
    ]
};
var userStream = null;
var muteFlag = true;

joinBtn.addEventListener('click', function(){
    if(roomInput.value == ''){
        alert('Enter your Room Name.')
    }else{
        roomName = roomInput.value;
        socket.emit('join', roomInput.value);        
    }
});

muteBtn.addEventListener('click', function(){
    if(muteFlag){
        muteBtn.textContent = 'Unmute';
        muteFlag = !muteFlag;
        userStream.getTracks()[0].enabled = muteFlag;
    }else{
        muteBtn.textContent = 'Mute';
        muteFlag = !muteFlag;
        userStream.getTracks()[0].enabled = muteFlag;
    }
});
var hideFlag = true;
hideBtn.addEventListener('click', function(){
    if(hideFlag){
        hideBtn.textContent = 'Show';
        hideFlag = !hideFlag;
        userStream.getTracks()[1].enabled = hideFlag;
    }else{
        hideBtn.textContent = 'Hide';
        hideFlag = !hideFlag;
        userStream.getTracks()[1].enabled = hideFlag;
    }
});







socket.on('created', function(){
    creator = true;
    navigator.getUserMedia({
        audio:true,
        video:true,
    }, function(stream){
        userStream = stream;
        videoChatForm.style = 'display:none';
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e){
            userVideo.play()
        }
    }, function(error){
        alert('You can\'t access Media')
    });
});
socket.on('joined', function(){
    creator = false;
    navigator.getUserMedia({
        audio:true,
        video:true,
    }, function(stream){
        userStream = stream;
        videoChatForm.style = 'display:none';
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e){
            userVideo.play()
        }
        socket.emit('ready', roomName);
    }, function(error){
        alert('You can\'t access Media')
    });
});
socket.on('full', function(){
    alert('Room is full, you can\'t join room!');
});
socket.on('ready', function(){
    if(creator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = onTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer(
            function(offer){
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit('offer', offer, roomName);
            },
            function(error){
                console.log('Offer Error', error);
            }
        )
    }
});



socket.on('candidate', function(candidate){
    var iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
});
socket.on('offer', function(offer){

    if(!creator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = onTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
            function(answer){
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit('answer', answer, roomName);
            },
            function(error){
                console.log('Answer Error', error);
            }
        )
    }



});
socket.on('answer', function(answer){
    rtcPeerConnection.setRemoteDescription(answer);
});



function OnIceCandidateFunction(event){
    if(event.candidate){
        socket.emit('candidate', event.candidate, roomName);
    }
}

function onTrackFunction(event){
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e){
        peerVideo.play();
    }
}