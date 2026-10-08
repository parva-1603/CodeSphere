import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Monitor, MonitorOff, User } from 'lucide-react';
import { useToast } from '../ui/Toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const RemoteVideoTile = ({ peerData }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peerData.stream) {
      videoRef.current.srcObject = peerData.stream;
    }
  }, [peerData.stream]);

  return (
    <div style={{
      position: 'relative',
      background: '#0d0d0d',
      border: '1px solid #222222',
      borderRadius: 6,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 140,
      aspectRatio: '16/9'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: peerData.isVideoOff ? 'none' : 'block'
        }}
      />

      {peerData.isVideoOff && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div className="collab-avatar" style={{ width: 44, height: 44, fontSize: '1.2rem', margin: 0 }}>
            {peerData.user?.photoURL ? (
              <img src={peerData.user.photoURL} alt="" />
            ) : (
              (peerData.user?.displayName || '?')[0].toUpperCase()
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>Camera Off</span>
        </div>
      )}

      {/* Participant name tag overlay */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.75rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem'
      }}>
        <span>{peerData.user?.displayName || 'Participant'}</span>
        {peerData.isMuted && <MicOff size={11} color="#ff6060" />}
      </div>
    </div>
  );
};

const CallPanel = ({ roomId }) => {
  const socket = useSocket();
  const { dbUser } = useAuth();
  const { addToast } = useToast();

  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remotePeers, setRemotePeers] = useState({}); // { socketId: { stream, user, isMuted, isVideoOff } }

  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);

  // Set local video stream when stream is active
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, inCall]);

  const createPeerConnection = (targetSocketId, userObj) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', {
          to: targetSocketId,
          from: socket.id,
          signal: { candidate: event.candidate },
          user: dbUser
        });
      }
    };

    // Handle incoming remote stream tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemotePeers(prev => ({
        ...prev,
        [targetSocketId]: {
          ...(prev[targetSocketId] || {}),
          stream: remoteStream,
          user: userObj || prev[targetSocketId]?.user
        }
      }));
    };

    peerConnectionsRef.current[targetSocketId] = pc;
    return pc;
  };

  const joinCall = async () => {
    if (!socket) {
      addToast({ title: 'Error', description: 'Socket connection unavailable', type: 'error' });
      return;
    }

    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        // Fallback to audio only if video device is unavailable
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setIsVideoMuted(true);
        addToast({ title: 'Audio Only', description: 'Camera unavailable or permission denied.', type: 'info' });
      }

      setLocalStream(mediaStream);
      localStreamRef.current = mediaStream;
      setInCall(true);

      // Join WebRTC room via socket
      socket.emit('join-room', { roomId: `call_${roomId}`, user: dbUser });

      addToast({ title: 'Joined Call', type: 'success' });
    } catch (err) {
      console.error('Failed to get media devices:', err);
      addToast({ title: 'Call Error', description: 'Could not access microphone or camera', type: 'error' });
    }
  };

  const leaveCall = () => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.keys(peerConnectionsRef.current).forEach(id => {
      peerConnectionsRef.current[id].close();
    });

    peerConnectionsRef.current = {};
    localStreamRef.current = null;
    setLocalStream(null);
    setRemotePeers({});
    setInCall(false);
    setIsScreenSharing(false);

    if (socket) {
      socket.emit('leave-room', { roomId: `call_${roomId}`, user: dbUser });
    }

    addToast({ title: 'Left Call', type: 'info' });
  };

  // Socket signaling listener
  useEffect(() => {
    if (!socket || !inCall) return;

    const handleRoomUsers = async (usersInRoom) => {
      for (const targetSocketId of usersInRoom) {
        const pc = createPeerConnection(targetSocketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', {
            to: targetSocketId,
            from: socket.id,
            signal: { sdp: offer },
            user: dbUser
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    };

    const handleUserJoined = ({ socketId, user }) => {
      createPeerConnection(socketId, user);
    };

    const handleUserLeft = ({ socketId }) => {
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      setRemotePeers(prev => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    };

    const handleSignal = async ({ signal, from, user }) => {
      let pc = peerConnectionsRef.current[from];
      if (!pc) {
        pc = createPeerConnection(from, user);
      }

      if (user && (!remotePeers[from] || !remotePeers[from].user)) {
        setRemotePeers(prev => ({
          ...prev,
          [from]: { ...(prev[from] || {}), user }
        }));
      }

      try {
        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', {
              to: from,
              from: socket.id,
              signal: { sdp: answer },
              user: dbUser
            });
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error('Signal error:', err);
      }
    };

    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('signal', handleSignal);
    };
  }, [socket, inCall, dbUser]);

  // Toggle Audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!inCall) return;

    if (isScreenSharing) {
      // Revert back to camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isAudioMuted });
        const newVideoTrack = camStream.getVideoTracks()[0];

        // Replace track in peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(newVideoTrack);
        });

        localStreamRef.current.getVideoTracks()[0].stop();
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsScreenSharing(false);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // When user stops screen share via browser bar
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (currentVideoTrack) {
          currentVideoTrack.stop();
          localStreamRef.current.removeTrack(currentVideoTrack);
        }
        localStreamRef.current.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    }
  };

  const remotePeerIds = Object.keys(remotePeers);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', background: '#0a0a0a', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, fontFamily: "'Space Mono', monospace" }}>
          // Room Call {inCall && `(${remotePeerIds.length + 1})`}
        </h3>
        {inCall && (
          <span style={{ fontSize: '0.7rem', color: '#44ff88', background: 'rgba(68,255,136,0.1)', padding: '2px 8px', borderRadius: 10 }}>
            ● Live
          </span>
        )}
      </div>

      {/* Main Video View Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {!inCall ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', border: '1px dashed #222', borderRadius: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#141414', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Video size={20} color="#888888" />
            </div>
            <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.35rem' }}>Collaborative Video & Audio</h4>
            <p style={{ fontSize: '0.78rem', color: '#666666', maxWidth: 240, marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Start or join a real-time peer-to-peer video call with room members.
            </p>
            <button
              onClick={joinCall}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: 4,
                padding: '0.6rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Phone size={15} /> Join Call
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: remotePeerIds.length === 0 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            
            {/* Local Video Tile */}
            <div style={{
              position: 'relative',
              background: '#0d0d0d',
              border: '1px solid #222222',
              borderRadius: 6,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 140,
              aspectRatio: '16/9'
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror local camera view
                  display: isVideoMuted ? 'none' : 'block'
                }}
              />

              {isVideoMuted && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="collab-avatar" style={{ width: 44, height: 44, fontSize: '1.2rem', margin: 0 }}>
                    {dbUser?.photoURL ? (
                      <img src={dbUser.photoURL} alt="" />
                    ) : (
                      (dbUser?.displayName || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Camera Off</span>
                </div>
              )}

              {/* You Badge Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.75rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span>You ({dbUser?.displayName || 'User'})</span>
                {isAudioMuted && <MicOff size={11} color="#ff6060" />}
              </div>
            </div>

            {/* Remote Peer Video Tiles */}
            {remotePeerIds.map(id => (
              <RemoteVideoTile key={id} peerData={remotePeers[id]} />
            ))}
          </div>
        )}
      </div>

      {/* Control Bar when in Call */}
      {inCall && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          background: '#141414',
          border: '1px solid #222222',
          borderRadius: 6
        }}>
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isAudioMuted ? '#ff4444' : '#222222',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isAudioMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            title={isVideoMuted ? 'Turn On Camera' : 'Turn Off Camera'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isVideoMuted ? '#ff4444' : '#222222',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isVideoMuted ? <VideoOff size={16} /> : <Video size={16} />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isScreenSharing ? '#3178c6' : '#222222',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
          </button>

          {/* Leave Call */}
          <button
            onClick={leaveCall}
            title="Leave Call"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ff3333',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PhoneOff size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CallPanel;
