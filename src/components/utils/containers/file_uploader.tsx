import * as model from '../../../model';
import * as Controller from '../../../controller';
import React from 'react';
import { connect } from 'react-redux';
import Dropzone, { DropzoneState, FileRejection } from 'react-dropzone'
import Spinner from '../spinner/spinner';
import { IAppContext, withAppContext } from '../../../app_context';

interface Props {
    appContext: IAppContext;
    file: undefined | File;
    heliosFileParsingFinished: boolean;
    fileLoading: boolean;
    currentProfile: model.ProfileType;
}

class FileUploader extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        this.receiveFileOnDrop = this.receiveFileOnDrop.bind(this);
        this.defineDropzoneStyle = this.defineDropzoneStyle.bind(this);
    }

    public receiveFileOnDrop(acceptedFiles: Array<File>): void {
        if (acceptedFiles && acceptedFiles.length != 0 && acceptedFiles[0] != null) {
            const file = acceptedFiles[0];
            Controller.handleNewFile(file);
        }
    }

    defineDropzoneStyle(isDragActive: boolean, acceptedFiles: File[], fileRejections: FileRejection[]): string {
        // Shared dropzone styling (former .dropzoneBase, without state-dependent colors)
        const dropzoneBase = "mx-[60px] my-5 flex h-[70%] flex-1 items-center overflow-y-auto rounded-[2px] border-[5px] border-dashed text-center text-muted-foreground outline-none transition-[background-color] duration-[240ms] ease-in-out";

        let stateClasses = "border-border bg-muted";
        if (isDragActive) { stateClasses = "border-[#2196f3] bg-muted" };
        if (acceptedFiles.length !== 0 || this.props.fileLoading) { stateClasses = "border-[#00e676] bg-[#d5ebdf]" };
        if (fileRejections.length !== 0) { stateClasses = "border-[#ff1744] bg-[#ebc5cc]" };

        return `${dropzoneBase} ${stateClasses}`;
    }

    listAcceptedFile() {
        const file = this.props.file!;
        return <span className="list-none">
            <br/>
            {file.name} - {Math.round((file.size / 1000000 + Number.EPSILON) * 100) / 100} MB
        </span>
    }

    componentDidMount(): void {
        Controller.resetState();
        Controller.setCurrentView(model.ViewType.UPLOAD);
    }

    componentDidUpdate(prevProps: Props): void {
        if (prevProps.heliosFileParsingFinished != this.props.heliosFileParsingFinished) {
            if (this.props.heliosFileParsingFinished) {
                //apply the profile chosen on this screen: sets events/view and redirects
                Controller.changeProfile(this.props.currentProfile);
            }
        }
    }

    createDropzoneInnerContent(acceptedFiles: any, fileRejections: any) {

        const upperLine = () => {
            let innerText;
            if (!this.props.heliosFileParsingFinished && !this.props.fileLoading) {
                innerText = <p className="text-lg"> Drag your HeliosTrace file here!
                    <br></br>
                    (or click to select files)
                </p>
            } else if (!this.props.heliosFileParsingFinished && this.props.fileLoading) {
                innerText = <Spinner />
            }

            return innerText;
        }

        const lowerLine = () => {
            let innerText;
            if (fileRejections.length != 0) {
                innerText = <p className="text-lg">File not valid!</p>;
                return innerText;
            } else if (this.props.file) {
                innerText = <p className="text-lg">Loading File: {this.listAcceptedFile()}</p>;
                return innerText;
            } else {
                innerText = <p className="text-lg">No files selected.</p>;
                return innerText;
            }
        }


        const innerDiv =
            <div className="relative top-[45%] m-0 -translate-y-1/2">
                {upperLine()}
                {lowerLine()}
            </div>

        return innerDiv;

    }

    public render() {
        return <div className="flex h-full items-center bg-background">
            <Dropzone
                accept={['.heliostrace']}
                multiple={false}
                onDrop={(acceptedFiles) => this.receiveFileOnDrop(acceptedFiles)}>
                {({ getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, acceptedFiles, fileRejections }: DropzoneState): any => {

                    const dropzoneStyle: string = this.defineDropzoneStyle(isDragActive, acceptedFiles, fileRejections);

                    return (
                        <section className={dropzoneStyle}>
                            <div {...getRootProps()} style={{ width: "100%", height: "100%" }}>
                                <input {...getInputProps()} />
                                {this.createDropzoneInnerContent(acceptedFiles, fileRejections)}
                            </div>
                        </section>)
                }}
            </Dropzone>
        </div >;
    }

}

const mapStateToProps = (state: model.AppState) => ({
    file: state.file,
    heliosFileParsingFinished: state.heliosFileParsingFinished,
    fileLoading: state.fileLoading,
    currentProfile: state.currentProfile,
});


export default connect(mapStateToProps)(withAppContext(FileUploader));
