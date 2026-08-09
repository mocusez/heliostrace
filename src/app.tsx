import * as React from 'react';
import { AppContextProvider } from './app_context';
import { Provider as ReduxProvider } from 'react-redux';
import { Route, Router, Switch, useLocation, Redirect, Link } from 'react-router-dom';
import history from "./history";
import { TooltipProvider } from '@/components/ui/tooltip';


import './globals.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import * as Config from './app_config';

import TabPanel from './components/utils/navigation/tab_panel';
import HeaderAppbar from './components/utils/navigation/header_appbar';


function NoMatch() {
    const location = useLocation();

    return (
        <div>
            <h2>
                404: No subpage found for <code>{location.pathname}</code>.
                <br></br>
                You can upload a file to start profiling: <Link to={Config.appContext.topLevelComponents[0].path} className="nav-link"> File Uploader </Link>
            </h2>
        </div>
    );
}


export default function App() {
    return (
        <AppContextProvider value={Config.appContext}>
            <ReduxProvider store={Config.store}>
                <TooltipProvider>
                    <Router history={history}>
                            <div className="app w-full overflow-x-visible bg-muted">

                                <div className="fixed top-0 w-full max-[400px]:absolute max-[400px]:w-[400px] max-[400px]:bg-muted">
                                    <HeaderAppbar />
                                </div>

                                <div className="appNavigation fixed top-[38px] w-full max-[400px]:absolute max-[400px]:w-[400px] max-[400px]:bg-muted">
                                    <TabPanel />
                                </div>

                                <div className="fixed top-[76px] bottom-0 w-full max-[400px]:absolute max-[400px]:w-[400px]">
                                    <Switch>

                                        <Route exact path="/" key="/">
                                            <Redirect to={Config.appContext.topLevelComponents[0].path} />
                                        </Route>

                                        {Config.appContext.topLevelComponents.map((topLevelComponent) => {
                                            return <Route exact path={topLevelComponent.path} key={topLevelComponent.path}>
                                                {topLevelComponent.component}
                                            </Route>
                                        })}

                                        <Route path="*">
                                            <NoMatch />
                                        </Route>

                                    </Switch>
                                </div>

                            </div>

                    </Router>
                </TooltipProvider>
            </ReduxProvider>
        </AppContextProvider>
    );
}
