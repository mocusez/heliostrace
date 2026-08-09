import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Info } from 'lucide-react';
import { connect } from 'react-redux';


interface Props {
    appContext: Context.IAppContext;
    currentProfile: model.ProfileType;
    profiles: Array<model.ProfileVariant>;
    events: Array<string> | undefined;
    currentView: model.ViewType;
}

function ProfilesMenu(props: Props) {

    const menuProfiles = props.profiles.map((elem, index) => (
        <React.Fragment key={index}>
            {React.createElement(elem.icon as React.ElementType, { className: "text-white" })}
            <span className="pl-[10px] text-[11px] text-white">
                {elem.readableName}
            </span>
            <Tooltip>
                <TooltipTrigger
                    render={<span />}
                >
                    <Info className="ml-[15px] size-[15px] text-white" />
                </TooltipTrigger>
                <TooltipContent>
                    <span className="text-[13px]">
                        {elem.description}
                    </span>
                </TooltipContent>
            </Tooltip>
        </React.Fragment>
    ));

    const handleOnItemClick = (index: number) => {
        Controller.changeProfile(props.profiles[index].type);
        handleClose();
    };

    const [isOpen, setIsOpen] = React.useState<boolean>(false);

    const handleClose = () => {
        setIsOpen(false);
    };

    const getProfileIndex = (profileType: model.ProfileType) => {
        return props.profiles.findIndex((elem) => (elem.type === profileType));
    }

    const getReadableProfileName = () => {
        const profileIndex = getProfileIndex(props.currentProfile);
        return props.profiles[profileIndex].readableName;
    }

    const isProfileIndexSelected = (index: number) => {
        const currentSelectedProfileIndex = getProfileIndex(props.currentProfile);
        return index === currentSelectedProfileIndex;
    }

    const isMenuDisabled = undefined === props.events || model.ViewType.UPLOAD === props.currentView;

    return (

        <div className="flex basis-0 items-center justify-center pr-[20px] max-[650px]:flex-1 max-[650px]:justify-end max-[650px]:pr-[10px]">
            <DropdownMenu open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
                <DropdownMenuTrigger
                    render={
                        <Button
                            className={`flex w-[150px] items-center justify-center text-[10px] hover:bg-brand-secondary! aria-expanded:bg-brand-secondary! ${isMenuDisabled ? "text-brand-tertiary!" : "text-white!"}`}
                            variant="ghost"
                            size="sm"
                            aria-controls="profileMenu"
                            aria-haspopup="true"
                            disabled={isMenuDisabled}
                        >
                            {getReadableProfileName()}
                            <ChevronDown />
                        </Button>
                    }
                />

                <DropdownMenuContent
                    id="profileMenu"
                    className="w-[250px] rounded-b-[15px] border-hidden bg-brand-black"
                    align="center"
                >
                    {menuProfiles.map((elem, index) =>
                    (<DropdownMenuItem
                        className="hover:bg-brand-secondary! focus:hover:bg-brand-secondary!"
                        onClick={() => handleOnItemClick(index)}
                        data-selected={isProfileIndexSelected(index) ? "" : undefined}
                        key={index}
                    >
                        {elem}
                    </DropdownMenuItem>)
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

    );
}

const mapStateToProps = (state: model.AppState) => ({
    currentProfile: state.currentProfile,
    profiles: state.profiles,
    events: state.events,
    currentView: state.currentView,
});


export default connect(mapStateToProps)(Context.withAppContext(ProfilesMenu));
