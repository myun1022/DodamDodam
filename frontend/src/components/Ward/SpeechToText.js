import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import api from '../../services/Api';

const SpeechToText = () => {
    const [content, setContent] = useState(''); // 음성 인식 결과 텍스트 저장
    const [isDetected, setIsDetected] = useState(false); // "도담아"라는 말이 감지되었는지 여부
    const [isRecording, setIsRecording] = useState(false); // 녹음 중인지 여부
    const { transcript, resetTranscript } = useSpeechRecognition();

    const [mediaRecorder, setMediaRecorder] = useState(null); // MediaRecorder 객체 저장
    const [stream, setStream] = useState(null); // MediaStream 객체 저장
    const [audioBlob, setAudioBlob] = useState(null); // 녹음된 오디오 Blob 저장
    const timerRef = useRef(null); // 타이머 ref

    // 음성 인식 시작 및 중지 & 마이크 접근 권한 요청 및 스트림 설정
    useEffect(() => {
        SpeechRecognition.startListening({ language: 'ko-KR', continuous: true });
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Microphone stream obtained:', stream); // 스트림 설정 성공
                setStream(stream);
            })
            .catch(error => {
                console.error('Error accessing microphone:', error); // 스트림 설정 실패
                alert('마이크 접근에 실패했습니다.');
            });
        return () => {
            SpeechRecognition.stopListening();
        };
    }, []);

    // 음성 인식 설정
    useEffect(() => {
        if (transcript.includes("도담아") && !isDetected) {
            console.log('음성을 인식 하였습니다.');
            setIsDetected(true);
            resetTranscript(); // "도담아" 감지 후 초기화
        } else if (isDetected && !isRecording) {
            startRecording();
            setIsRecording(true); 
            setContent(transcript);
        } else if (isDetected && isRecording) {
            setContent(transcript);
            // 타이머 재설정 로직 추가
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                setIsDetected(false);
                setIsRecording(false);
                stopRecording();
                console.log('녹음이 끝났습니다.');
            }, 5000); // 사용자가 말이 끝난 뒤 5초 후에 녹음을 중단
        }
        
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [transcript, isDetected, isRecording]);
    

    // 녹음 기능
    const startRecording = () => {
        if (stream) {
            const audioChunks = []; // 상태 대신 로컬 변수로 사용!
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

            recorder.onstart = () => {
                console.log('녹음 시작됨'); // 녹음 시작 로그 추가
            };
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('데이터 사용 가능:', event.data); // 데이터 사용 가능 로그 추가
                    audioChunks.push(event.data);
                } else {
                    console.log('빈 데이터 사용 가능 이벤트 발생');
                }
            };
            recorder.onstop = () => {
                console.log('녹음 중지됨');
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // WebM 형식으로 저장
                    setAudioBlob(audioBlob); // 상태에 저장
                    console.log('audioChunks:', audioChunks); // audioChunks 로그 추가
                    console.log('audioBlob:', audioBlob); // audioBlob 로그 추가
                    console.log('audioBlob type:', audioBlob.type); // audioBlob 타입 로그 추가
                    saveRecording(audioBlob); // 서버로 전송
                } else {
                    console.log('audioChunks가 비어 있음');
                }
            };
            recorder.onerror = (event) => {
                console.error('녹음 중 오류 발생:', event.error);
            };
            recorder.start();
            setMediaRecorder(recorder);
        } else {
            console.error('No stream available for recording');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            console.log('녹음 중지 호출됨');
            mediaRecorder.stop();
            setIsRecording(false);
            console.log('사용자가 말한 전체 내용:', content);
        }
    };

     // 녹음된 오디오 및 텍스트 서버에 전송
     const saveRecording = async (audioBlob) => {
        const formData = new FormData();
        formData.append('content', JSON.stringify({ content: content }));
        formData.append('voice', new File([audioBlob], 'recording.webm', { type: 'audio/webm' }));
    
        // 디버그 로그 추가
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }
    
        try {
            const response = await api.post('/v1/message', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('녹음이 저장되었습니다.');
            console.log('Recording saved:', response.data);
            chatDodam();
        } catch (error) {
            console.error('Error saving recording:', error);
            alert('녹음 저장을 실패하였습니다.');
        }
    };
    
    const chatDodam = async () => {
        try {
            const response = await api.post('/v1/chat/dodam', {message: content});
            alert('gpt에 전달되었습니다.');
            console.log('Recording delivered:', response.data);
        }
        catch (error) {
            console.error('Error delivering recording:', error);
            alert('녹음 전달을 실패하였습니다.');
        }
    }

    return (
        <div className='flex justify-center'>
            <textarea readOnly
                className='w-9/12 resize-none overflow-hidden absolute bottom-8 px-4 pt-3 pb-1 bg-secondary border-2 rounded-[20px] border-black text-middle-size shadow-[3px_4px_1px_#a5996e]'
                value={content} 
                placeholder="'도담아' 라고 말하면 시작합니다." 
            />
            {audioBlob && (
    <a 
        href={URL.createObjectURL(new Blob([audioBlob], { type: 'audio/webm' }))} 
        download="recording.webm"
        className="absolute bottom-20 text-white bg-blue-500 hover:bg-blue-700 text-sm px-4 py-2 rounded"
    >
        Download Recording
    </a>
)}

        </div>
    );
};

export default SpeechToText;
