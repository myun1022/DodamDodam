import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../Wave.css';

const AsideForm = () => {
    const features = [
        { 
            title: "대화내용 보기", 
            url: "/ViewConversationPage",
            image: "./image/speechbubble.png"
        },
        { 
            title: "감정 분석 보기", 
            url: "/ViewEmotionAnalysisPage",
            image: "./image/love.png"
        },
        { 
            title: "스케줄 지정", 
            url: "/SchedulePage",
            image: "./image/clock.png" 
        },
        { 
            title: "도담이 설정", 
            url: "/DodamSettingsPage",
            image: "./image/dodam_basic.png"
        },
        { 
            title: "피보호자 설정", 
            url: "/WardSettingsPage",
            image: "./image/setting.png" 
        }
    ];

    const location = useLocation();

    const imageLocation = (features) => {
        if (location.pathname === features.url) {
            return "./image/orange_star.png";
        } else {
            return "./image/star.png";
        }
    };

    useEffect(()=> {
        console.log(location.pathname)
    }, [location.pathname])

    return (
        <aside className='fixed left-0 top-4 h-full border-r-2 border-black z-0 bg-primary overflow-y-auto'>
            <nav className='flex flex-col items-start mt-[97px]'>
                {features.map((features, index) => (
                    <Link key={index} to={features.url}> 
                        <div className='wave inline-flex items-center relative m-7 text-middle-size'>
                            <img className='flex w-[60px] h-[60px]' src={imageLocation(features)}/>
                            <img className='relative -left-[43px] top-1 w-[25px] h-[25px] mr-[-20px]' src={features.image}/>
                            <h2 className='wave'>{features.title}</h2>
                        </div>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default AsideForm;
