import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import Spinner from '../spinner/spinner';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Button } from '@/components/ui/button';


interface Props {
    appContext: Context.IAppContext;
    events: Array<string> | undefined;
    currentEvent: string | "Default";
    currentMultipleEvent: [string, string] | "Default";
    currentView: model.ViewType;
}

function EventsButtons(props: Props) {

    const events = props.events;
    const [multipleEvents, setMultipleEvents] = useState(false);

    //allow for multiple events selection if multiple events dashboard
    useEffect(() => {
        if (events && props.currentView === model.ViewType.DASHBOARD_MULTIPLE_EVENTS) {
            setMultipleEvents(true);
        } else {
            setMultipleEvents(false);
        }

    }, [props.currentView, events]);

    const handleEventButtonClick = (event: string) => {
        Controller.setEvent(event);
    }

    const createEventShortString = (event: string) => {
        const eventNoPPP = event.includes(':') ? event.slice(0, event.indexOf(':')) : event;
        return eventNoPPP.length > 20 ? (eventNoPPP.substr(0, 15) + "...") : eventNoPPP;
    }

    const isComponentLoading = () => {
        if (props.events) {
            return true;
        } else {
            return false;
        }
    }

    const buttonVariant = (event: string): "default" | "secondary" | "outline" => {
        if (multipleEvents) {
            if (props.currentMultipleEvent[0] === event) {
                return "default";
            } else if (props.currentMultipleEvent[1] === event) {
                return "secondary";
            } else {
                return "outline";
            }
        } else {
            return (props.currentEvent === event) ? "default" : "outline";
        }
    }

    const isButtonDisabled = (event: string) => {
        if (props.currentView === model.ViewType.DASHBOARD_MEMORY_BEHAVIOR && event === "cycles:ppp") {
            return true;
        }
        // if (props.currentView === model.ViewType.DASHBOARD_UIR) {
        //     return true;
        // }
        return false;
    }


    return (
        <div className="flex h-full flex-col items-center justify-center">
            {isComponentLoading() ?
                <div>
                    <div className="flex flex-row flex-wrap justify-center max-[650px]:w-[300px]">
                        {events && events!.map((event: string, index: number) => (
                            <Button
                                className="animate-in fade-in duration-1000 mx-[6px] my-[2px] min-w-[125px] max-w-[135px] flex-[1_1_125px] rounded-[70px] text-[10px]"
                                disabled={isButtonDisabled(event)}
                                variant={buttonVariant(event)}
                                onClick={() => handleEventButtonClick(event)}
                                key={index}
                            >
                                {createEventShortString(event)}
                            </Button>
                        ))}
                    </div>
                </div>
                : <Spinner />
            }
        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    events: state.events,
    currentEvent: state.currentEvent,
    currentMultipleEvent: state.currentMultipleEvent,
    currentView: state.currentView,
});


export default connect(mapStateToProps)(Context.withAppContext(EventsButtons));