import React from 'react';

const SignupCheck = ({ errorMessage }) => {
    return (
        <div>
            <div className='text-small-size text-red-500 mt-2 mb-7'>{errorMessage}</div>
        </div>
    );
};

export default SignupCheck;