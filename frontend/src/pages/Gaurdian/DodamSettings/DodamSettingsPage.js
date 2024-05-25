import React, { useState, useEffect }  from 'react';
import AsideForm from '../../../components/Aside/AsideForm';
import api from '../../../services/Api';

const DodamSettingsPage = () => {
    const [voice, setVoice] = useState();
    const [speech, setSpeech] = useState('안녕 나는 도담이야. 앞으로 잘 부탁해.');
    const voices = [
        { name: "혜리", },
        { name: "아라", },
        { name: "다인", },
        { name: "유인나", },
        { name: "오상진", },
    ];

    const voiceNames = {
        'voice1': '혜리',
        'voice2': '아라',
        'voice3': '다인',
        'voice4': '유인나',
        'voice5': '오상진'
    };

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await fetchVoiceSetting();
            if (settings) {
                setVoice(settings.voice);
                setSpeech(settings.speech);
            }
        };
        loadSettings();
    }, []);

    // 목소리 설정을 서버에 저장하는 함수
    const saveVoiceSetting = async (voice, speech) => {
        try {
            const response = await api.post('/v1/setting', { voice, speech });
            alert(response.data);  // 서버로부터의 응답 메시지를 alert로 표시
        } catch (error) {
            console.error('Error saving voice setting:', error);
            alert('설정 저장 실패');
        }
    };

    // 서버에서 현재 목소리 설정을 가져오는 함수
    const fetchVoiceSetting = async () => {
        try {
            const response = await api.get('/v1/setting');
            return response.data;  // { voice: '...', speech: '...' } 형태로 반환
        } catch (error) {
            console.error('Error fetching voice setting:', error);
        }
    };

    const voiceChange = (e) => {
        console.log(e.target.value)
        setVoice(e.target.value)
    }

    const voiceSetting = () => {
        if (!voice || !speech) {
            alert("모든 필드를 채워주세요.");
            return;
        }
        saveVoiceSetting(voice, speech);
    };

    return (
        <div className='flex flex-col h-screen w-screen pl-[240px]'>
            <AsideForm/>
            <div className='pt-28 pl-5'>
                <h2 className='text-3xl text-left'>도담이 목소리</h2>
                <div className='flex justify-center relative -top-3'>
                    <img className='relative h-64 w-60 m-10' src='./image/dodam_circle.png'/>
                </div>
                <div className="text-3xl relative -top-3">
                    <React.Fragment>
                        {voices.map((voices) => (
                            <label>
                                <input className='ml-8 mr-3 radio-box'
                                    type='radio' 
                                    value={voices.name} 
                                    checked={voice===voices.name}
                                    onChange={voiceChange}/>{voices.name}
                            </label>
                        ))}<p className='relative top-5 bg-red-30'>
                            <button className='relative -top-2 -left-3 w-0 h-0 border-t-[20px] border-t-transparent 
                            border-b-[20px] border-b-transparent border-l-[30px] border-l-borderColor drop-shadow-[1px_4px_1px_#c0c0c0]'></button>
                            <input className='input-box2 w-[600px] p-3'
                                type='text' value={speech} onChange={(e) => setSpeech(e.target.value)}/>
                            <p><button className='input-box2 relative p-2 w-40 top-5' onClick={voiceSetting}>확인</button></p>
                        </p>
                    </React.Fragment>
                </div>
            </div>
        </div>
    );
};

export default DodamSettingsPage;