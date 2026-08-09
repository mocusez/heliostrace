import * as React from 'react';
import createDevStore from './model/store_dev';
import { IAppContext } from './app_context';
import { brandColors, chartInk } from './style/theme';
import * as model from './model';

import FileUploader from './components/utils/containers/file_uploader';
import DashboardWrapper from './components/dashboards/dashboard_wrapper';

import {
    CloudUpload as BackupIcon,
    LayoutDashboard as DashboardIcon,
    Rows3 as ViewStreamIcon,
    Save as SaveIcon,
    Code as CodeIcon,
} from 'lucide-react';
import { RequestController } from './controller/request_controller';

export const backendRequestController = new RequestController();

//Create Redux stroe
//TODO change to prod store
//export const store = createProdStore();
export const store = createDevStore();

export const appColor = {
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    tertiary: brandColors.tertiary,
    accentBlack: brandColors.accentBlack,
    accentDarkGreen: brandColors.accentDarkGreen,
    accentDarkBlue: brandColors.accentDarkBlue,
}

export interface ITopLevelComponent {
    viewType: model.ViewType;
    path: string;
    name: string;
    component: JSX.Element;
    icon: () => JSX.Element;
}

const topLevelComponents: Array<ITopLevelComponent> = [
    {
        viewType: model.ViewType.UPLOAD,
        path: '/file-upload',
        name: 'Upload File',
        component: <FileUploader />,
        icon: () => { return (<BackupIcon />) },
    },
    {
        viewType: model.ViewType.DASHBOARD_SINGLE_EVENT,
        path: '/single-event-dashboard',
        name: 'Single Event Dashboard',
        component: <DashboardWrapper dashboardView={model.ViewType.DASHBOARD_SINGLE_EVENT} />,
        icon: () => { return (<DashboardIcon />) },
    },
    {
        viewType: model.ViewType.DASHBOARD_MULTIPLE_EVENTS,
        path: '/multiple-events-dashboard',
        name: 'Multiple Events Dashboard',
        component: <DashboardWrapper dashboardView={model.ViewType.DASHBOARD_MULTIPLE_EVENTS} />,
        icon: () => { return (<ViewStreamIcon />) },
    },
    {
        viewType: model.ViewType.DASHBOARD_MEMORY_BEHAVIOR,
        path: '/memory-behavior-dashboard',
        name: 'Memory Behavior Dashboard',
        component: <DashboardWrapper dashboardView={model.ViewType.DASHBOARD_MEMORY_BEHAVIOR} />,
        icon: () => { return (<SaveIcon />) },
    },
    {
        viewType: model.ViewType.DASHBOARD_UIR_PROFILING,
        path: '/uir-profiling-dashboard',
        name: 'UIR Profiling Dashboard',
        component: <DashboardWrapper dashboardView={model.ViewType.DASHBOARD_UIR_PROFILING} />,
        icon: () => { return (<CodeIcon />) },
    },

];

export const appContext: IAppContext = {
    controller: backendRequestController,
    primaryColor: appColor.primary,
    secondaryColor: appColor.secondary,
    tertiaryColor: appColor.tertiary,
    // theme-dependent ink: charts and canvases remount on theme change and
    // re-read this getter (near-black in light mode, near-white in dark)
    get accentBlack() { return chartInk().text; },
    accentDarkGreen: appColor.accentDarkGreen,
    accentDarkBlue: appColor.accentDarkBlue,
    topLevelComponents: topLevelComponents,
};