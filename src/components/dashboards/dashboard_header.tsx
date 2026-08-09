import React from 'react';
import EventsButtons from '../utils/navigation/events_buttons';
import KpiContainer from '../utils/containers/kpi_container';
import DropdownsOptions from '../utils/dropdowns/dropdowns_options';

const optionsItemClasses = "flex w-full flex-col items-center justify-center p-[7px] transition-all duration-500 ease-in-out";
const optionsBoxClasses = "box-border h-[75px] w-full rounded-[10px] bg-card p-[3px] transition-all duration-500 ease-in-out max-[1200px]:flex max-[1200px]:h-auto max-[1200px]:min-h-[75px] max-[1200px]:items-center max-[1200px]:justify-center";

class DashboardHeader extends React.Component {

    public render() {

        return <div className="flex w-full flex-wrap">
            <div className={`${optionsItemClasses} order-1 w-full lg:w-8/12 xl:w-5/12`}>
                <div className={optionsBoxClasses}>
                    <EventsButtons />
                </div>
            </div>
            <div className={`${optionsItemClasses} order-3 xl:order-2 w-full xl:w-4/12`}>
                <div className={optionsBoxClasses}>
                    <KpiContainer />
                </div>
            </div>
            <div className={`${optionsItemClasses} order-2 xl:order-3 w-full lg:w-4/12 xl:w-3/12`}>
                <div className={optionsBoxClasses}>
                    <DropdownsOptions />
                </div>
            </div>
        </div>;
    }

}


export default DashboardHeader;
