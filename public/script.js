const localVideo = document.querySelector("#localVideo")
const remoteVideo = document.querySelector("#remoteVideo")

const startBtn = document.querySelector("#startBtn")
const callBtn = document.querySelector("#callBtn")
const hangupBtn = document.querySelector("#hangupBtn")
const acceptBtn = document.querySelector("#acceptBtn")
const rejectBtn = document.querySelector("#rejectBtn")
const incomingCall = document.querySelector("#incomingCall")

const socket = io()

let localStream = null
let pc = null
let currentOffer = null
let pendingCandidates = []

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
]

startBtn.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    localVideo.srcObject = localStream
    startBtn.disabled = true
    callBtn.disabled = false
  } catch (err) {
    alert("Please allow camera and microphone")
    console.error(err)
  }
}

function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers })
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream)
  })
  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0]
  }
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate)
    }
  }
  pendingCandidates.forEach(candidate => {
    pc.addIceCandidate(candidate)
  })
  pendingCandidates = []
}

callBtn.onclick = async () => {
  if (!localStream) return alert("Start camera first")
  createPeerConnection()
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  socket.emit("offer", offer)
  hangupBtn.disabled = false
}

socket.on("offer", (offer) => {
  currentOffer = offer
  incomingCall.classList.remove("hidden")
})

acceptBtn.onclick = async () => {
  incomingCall.classList.add("hidden")
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    localVideo.srcObject = localStream
  }
  createPeerConnection()
  await pc.setRemoteDescription(currentOffer)
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  socket.emit("answer", answer)
  currentOffer = null
  hangupBtn.disabled = false
}

rejectBtn.onclick = () => {
  incomingCall.classList.add("hidden")
  currentOffer = null
}

socket.on("answer", async (answer) => {
  if (!pc) return
  await pc.setRemoteDescription(answer)
})

socket.on("candidate", async (candidate) => {
  if (pc) {
    await pc.addIceCandidate(candidate)
  } else {
    pendingCandidates.push(candidate)
  }
})

hangupBtn.onclick = () => {
  if (pc) {
    pc.close()
    pc = null
  }
  remoteVideo.srcObject = null
  hangupBtn.disabled = true
}
