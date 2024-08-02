const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const responseDiv = document.getElementById('response');

let mediaRecorder;
let audioChunks = [];
let threadId = null;

recordBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      recordBtn.disabled = true;
      stopBtn.disabled = false;
      status.textContent = '녹음 중...';

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
    })
    .catch(error => {
      console.error('녹음 시작 중 오류 발생:', error);
      status.textContent = '오류 발생. 다시 시도해주세요.';
    });
}

function stopRecording() {
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  status.textContent = '녹음 중지, 처리 중...';

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    audioChunks = [];
    sendAudioToOpenAI(audioBlob);
  };
}

async function sendAudioToOpenAI(audioBlob) {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    if (threadId) {
      formData.append('threadId', threadId);
    }

    const response = await fetch('https://port-0-e-back-lxlts66g89582f3b.sel5.cloudtype.app/transcribe-and-respond', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error('오디오 처리 중 오류 발생: ' + response.statusText + ' - ' + errorDetails.details);
    }

    const data = await response.json();
    threadId = data.threadId;
    responseDiv.textContent = data.response;
    status.textContent = '대기 중...';
  } catch (error) {
    console.error('오류 발생:', error);
    status.textContent = '오류 발생. 다시 시도해주세요.';
  }
}