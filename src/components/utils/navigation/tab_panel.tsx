import * as model from '../../../model';
import * as Context from '../../../app_context';
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { withRouter, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';


interface Props {
    location: any;
    appContext: Context.IAppContext;
}

function ScrollableTabsButtonForce(props: Props) {

    const heliosFileParsingFinished = useSelector((state: model.AppState) => state.heliosFileParsingFinished);

    const getActiveTopLevelComponent = () => {
        const currentTopLevelComponent = props.appContext.topLevelComponents.find(topLevelComponent => topLevelComponent.path === props.location.pathname);
        return currentTopLevelComponent ? currentTopLevelComponent.path : null;
    }

    return (
        <div className="w-full grow bg-muted">
            <Tabs
                value={getActiveTopLevelComponent()}
                className={`w-full ${heliosFileParsingFinished ? '' : 'pointer-events-none opacity-40 text-white'}`}
                aria-label="scrollable force tabs example"
            >
                <TabsList className="w-full h-[38px] min-h-[38px] rounded-none">
                    {props.appContext.topLevelComponents.map((topLevelComponent, key) => {
                        return (
                            <TabsTrigger
                                className="h-[38px] min-h-[38px]"
                                value={topLevelComponent.path}
                                nativeButton={false}
                                render={<Link to={topLevelComponent.path} />}
                                key={key}
                            >
                                {topLevelComponent.icon()}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>
        </div>
    );
}

export default withRouter(Context.withAppContext(ScrollableTabsButtonForce));
