import React from 'react';
import '../../../style/spinner-legacy.css';

const rectClasses = "block h-full w-full mb-[0.6em] animate-[stretchdelay_0.78s_ease-in-out_infinite]";

function Spinner() {

    return <div className="flex h-full w-full items-center justify-center">
        <div className="m-auto flex h-[30px] w-[38px] min-w-[20px] flex-row flex-nowrap overflow-hidden text-[9px]">
            <div className={rectClasses}></div>
            <div className={`${rectClasses} [animation-delay:-0.65s]`}></div>
            <div className={`${rectClasses} [animation-delay:-0.52s]`}></div>
        </div>
    </div>
}

export default Spinner;
