import React from 'react';
import AsideForm from '../../../components/Aside/AsideForm';
import EmotionAnalysisGraph from '../../../components/EmotionAnalysis/EmotionAnalysisGraph';
import EmotionAnalysisBoard from '../../../components/EmotionAnalysis/EmotionAnalysisBoard';
import CalendarForm from '../../../components/Calendar/CalendarForm';

const ViewEmotionAnalysisPage = () => {
    return (
        <div className='flex flex-col h-screen w-screen pl-[240px] pr-10'>
            <AsideForm/>
            <div className='pt-28 pl-5 relative h-full'>
                <div className='flex justify-between text-2xl'>
                    <CalendarForm/>
                </div>
                <EmotionAnalysisGraph/>
                <EmotionAnalysisBoard/>
            </div>
        </div>
    );
};

export default ViewEmotionAnalysisPage;