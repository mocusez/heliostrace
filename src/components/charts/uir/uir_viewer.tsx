import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import '../../../style/uir-view-monaco-editor.css';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import Editor, { Monaco } from "@monaco-editor/react";
import Spinner from '../../utils/spinner/spinner';
import * as monaco from 'monaco-editor';
import '../../../monaco_setup';
import UirToggler from '../../utils/togglers/uir_toggler';
import { isDarkTheme, THEME_CHANGE_EVENT } from '../../../style/theme';


interface AppstateProps {
    appContext: Context.IAppContext;
    chartData: model.IUirViewerData,
    currentEvent: string | "Default";
    events: Array<string> | undefined;
    currentOperator: Array<string> | "All";
    currentOperatorActiveTimeframePipeline: Array<string> | "All";
    operators: model.IOperatorsData | undefined;
}

type Props = model.IUirViewerProps & AppstateProps;

interface State {
    linesFolded: boolean;
    operatorsColorHidden: boolean;
    hoverProviderDispose: monaco.IDisposable | undefined,
    editorMounted: boolean,
}


class UirViewer extends React.Component<Props, State> {

    editorContainerRef: React.RefObject<HTMLDivElement>;
    editorRef: React.RefObject<unknown>;
    monacoInstance: Monaco | undefined;
    globalEventOccurrenceDecorations: string[];


    constructor(props: Props) {
        super(props);
        this.state = {
            linesFolded: true,
            operatorsColorHidden: false,
            hoverProviderDispose: undefined,
            editorMounted: false,
        }
        this.handleEditorWillMount = this.handleEditorWillMount.bind(this);
        this.handleEditorDidMount = this.handleEditorDidMount.bind(this);
        this.toggleFoldAllLines = this.toggleFoldAllLines.bind(this);
        this.toggleOperatorsColorHidden = this.toggleOperatorsColorHidden.bind(this);
        this.themeListener = this.themeListener.bind(this);

        this.editorRef = React.createRef();
        this.editorContainerRef = React.createRef();
        this.globalEventOccurrenceDecorations = [];
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        //Update glyphs when event, currentOperators or operatorColord changes, but only if editor is already mounted
        if (this.state.editorMounted &&
            (this.props.currentEvent !== prevProps.currentEvent
                || this.state.operatorsColorHidden !== prevState.operatorsColorHidden
                || !(_.isEqual(this.props.currentOperatorActiveTimeframePipeline, prevProps.currentOperatorActiveTimeframePipeline))
                || !(_.isEqual(this.props.currentOperator, prevProps.currentOperator)))) {
            this.setMonacoGlyphs();
        }
    }

    componentWillUnmount() {
        //Remove hover provider on leaving component:
        this.state.hoverProviderDispose?.dispose();
        removeEventListener(THEME_CHANGE_EVENT, this.themeListener);
    }

    themeListener() {
        //Re-define the custom theme with the new light/dark base and re-apply it
        if (this.monacoInstance) {
            this.createMonacoCustomTheme(this.monacoInstance);
            this.monacoInstance.editor.setTheme('uirTheme');
        }
    }

    public render() {
        return <div className="flex flex-[1_1_fit-content] flex-col">

            <div className="flex flex-row">
                <div className="flex-[0_0_content] pl-[3px] pr-[3px]">
                    {this.createUirViewerLinesFoldedToggler()}
                </div>
                <div className="flex-[0_0_content] pl-[3px] pr-[3px]">
                    {this.createUirViewerOperatorColoredToggler()}
                </div>
                {/* The pane's name lives in the dashboard's tab bar now
                    (dashboard_uir.tsx) — repeating it here would double it. */}
                <div className="flex flex-auto" />
            </div>

            <div
                className="h-full w-full flex-[1_1_fit-content] items-center"
                ref={this.editorContainerRef}>
                {this.createMonacoEditor()}
            </div>
        </div >
    }

    prepareUirLines() {
        return this.props.chartData.uirLines.join('');
    }

    handleEditorWillMount(monaco: Monaco) {
        this.createUirLanguage(monaco);
        this.createMonacoCustomTheme(monaco);
    }

    createMonacoCustomTheme(monaco: Monaco) {

        const lightColor = (color: string) => {
            return color + "80";
        }

        const dark = isDarkTheme();

        // Define new Theme (light/dark base follows the app theme)
        monaco.editor.defineTheme('uirTheme', {
            base: dark ? 'vs-dark' : 'vs',
            inherit: true,
            rules: [
                { token: 'topLevelKeyword', foreground: this.props.appContext.secondaryColor },
                { token: 'seconedLevelKeyword', foreground: this.props.appContext.accentDarkGreen },
                { token: 'thirdLevelKeyword', foreground: this.props.appContext.tertiaryColor },
                { token: 'fourthLevelKeyword', foreground: this.props.appContext.accentDarkBlue },
            ],
            colors: {
                //primary color:
                'editor.findMatchHighlightBackground': this.props.appContext.primaryColor,

                //secondary color:
                'editorCursor.foreground': this.props.appContext.secondaryColor,
                'editorLineNumber.activeForeground': this.props.appContext.secondaryColor,
                'editor.findMatchBackground': lightColor(this.props.appContext.secondaryColor),
                'focusBorder': this.props.appContext.secondaryColor,
                'list.activeSelectionBackground': this.props.appContext.secondaryColor,
                'list.hoverBackground': this.props.appContext.secondaryColor,
                'editor.wordHighlightBackground': lightColor(this.props.appContext.secondaryColor),
                'editor.selectionBackground': lightColor(this.props.appContext.secondaryColor),

                //tertiary color:
                'editorLineNumber.foreground': this.props.appContext.tertiaryColor,
                'editor.lineHighlightBorder': lightColor(this.props.appContext.tertiaryColor),
                // 'foreground': this.props.appContext.tertiaryColor, makes tooltip text grey, moved to css
                'editor.selectionHighlightBackground': lightColor(this.props.appContext.tertiaryColor),
                // 'editorHoverWidget.border': this.props.appContext.tertiaryColor, makes tooltip border grey, moved to css

                //surface color (follows theme):
                'editor.rangeHighlightBackground': dark ? '#262626' : '#fff',
                'list.activeSelectionForeground': dark ? '#171717' : '#fff',
                'list.hoverForeground': dark ? '#171717' : '#fff',
                'editorHoverWidget.background': dark ? '#262626' : '#fff',

            }
        });
    }

    createUirLanguage(monaco: Monaco) {
        //Register new Language
        monaco.languages.register({ id: 'heliosIntermediateRepresentation' });

        //Define Tokens:
        const tokens = {
            topLevelKeyword: {
                uirKeyword: /define|declare/,
                comments: /#.*/,
            },

            seconedLevelKeyword: {
                uirKeyword: /call|const|functionargument|functionvar|globalref|headerptrpair|unreachable|switch|return/,
                uirFunctionName: /@\w+/,
                uirName: /%\w+/,
                uirLabel: /^\w+:/,
            },

            thirdLevelKeyword: {
                operators: / add | sub | mul | sdiv | udiv | srem | urem | pow | shl | ashr | lshr | rotl | rotr | and | or | xor | saddoverflow | uaddoverflow | ssuboverflow | usuboverflow | smuloverflow | umuloverflow | overflowresult | crc32 | not | neg | isnull | isnotnull | bswap | ctlz | cmpeq | cmpne | cmpslt | cmpsuolt | cmpult | cmpsle | cmpsuole | cmpule | zext | SExt | trunc | fptosi | sitofp | ptrtoint | inttoptr | builddata128 | extractdata128 | select | getelementptr | load | atomicload | store | atomicstore | atomicrmwadd | atomicrmwxchg | atomicrmwumax | atomiccmpxchg | phi | br | condbr | checkedsadd | checkedssub | checkedsmul /,
                datatypes: /int8|int16|int32|int64|uint8|uint16|uint32|uint64|i8|i16|i32|i64|ptr|d128|data128|void|object\s(\w|:)+ /,

            },

            fourthLevelKeyword: {
                uirString: /".*"/,
                uirNumber: /0x[a-zA-Z0-9]+/,
                uirNumberHex: /(0x)\d+/,
            }

        }

        // Register a tokens provider for the language
        const tokenizerRoot: Array<[RegExp, string]> = [];
        for (const tokenLevelName in tokens) {
            const tokenLevel = (tokens as any)[tokenLevelName];
            for (const token in tokenLevel) {
                tokenizerRoot.push([(tokenLevel as any)[token], tokenLevelName]);
            }
        }
        monaco.languages.setMonarchTokensProvider('heliosIntermediateRepresentation', {
            tokenizer: {
                root: tokenizerRoot
            }
        });

        //Register a hover provider to heliosIntermediateRepresentation language
        const dispose = monaco.languages.registerHoverProvider('heliosIntermediateRepresentation', {
            provideHover: (model, position) => this.getHoverProviderResult(model, position)
        });
        this.setState((state, props) => ({
            ...state,
            hoverProviderDispose: dispose,
        }));
        // monaco.editor.getModels().forEach(model => model.dispose());

    }

    getHoverProviderResult(model: monaco.editor.ITextModel, position: monaco.Position) {

        const markdownUirLine = `**UIR Line:** ${position.lineNumber}  \n`;
        const markdownOperator = `**Operator:** ${this.props.chartData.operators[position.lineNumber - 1]}  \n`;
        const markdownPipeline = `**Pipeline:** ${this.props.chartData.pipelines[position.lineNumber - 1]}  \n`;
        const markdownEvents = this.createMarkdownEventsList(position.lineNumber - 1);


        const markdownString: monaco.IMarkdownString = {
            value: markdownUirLine + markdownOperator + markdownPipeline + markdownEvents,
        };

        return {
            contents: [markdownString]
        };
    }

    createMarkdownEventsList(currentIndex: number, italicEvent?: number, marginGlyphRepresentation?: boolean) {
        let markdownEventsString = "";
        for (let i = 0; i < this.props.events!.length; i++) {
            let italicCharacter = "";
            let relativeEventString = "";
            if (marginGlyphRepresentation && i + 1 === italicEvent) {
                italicCharacter = "*";
            }
            if (this.props.chartData.isFunction[currentIndex] === 0) {
                relativeEventString = `, Function ${this.props.chartData.eventsRelativeFrequency[i + 1][currentIndex]}%`
            }
            const markdownEvent = `${italicCharacter}**${this.props.events![i]}:** Global ${this.props.chartData.eventsFrequency[i + 1][currentIndex]}%${relativeEventString}${italicCharacter}  \n`;
            markdownEventsString += markdownEvent;
        }
        return markdownEventsString;

    }

    handleEditorDidMount(editor: any, monaco: Monaco) {
        this.editorRef = editor;
        this.monacoInstance = monaco;
        addEventListener(THEME_CHANGE_EVENT, this.themeListener);
        this.foldAllLines();
        this.setMonacoGlyphs();
        this.setState((state, props) => ({
            ...state,
            editorMounted: true,
        }));
    }

    toggleFoldAllLines(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.checked) {
            this.setState((state, props) => ({
                ...state,
                linesFolded: true,
            }));
            this.foldAllLines();
        } else {
            this.setState((state, props) => ({
                ...state,
                linesFolded: false,
            }));
            this.unFoldAllLines();
        }
    }

    foldAllLines() {
        (this.editorRef as any).trigger('fold', 'editor.foldAll');
    }

    unFoldAllLines() {
        (this.editorRef as any).trigger('unfold', 'editor.unfoldAll');
    }

    toggleOperatorsColorHidden(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState((state, props) => ({
            ...state,
            operatorsColorHidden: event.target.checked,
        }));
    }

    createMonacoEditor() {

        const monacoOptions = {
            readOnly: true,
            scrollBeyondLastLine: false,
            folding: true,
            foldingHighlight: false,
            fontSize: 11,
            color: this.props.appContext.accentBlack,
            glyphMargin: true,
            fixedOverflowWidgets: true,
        }

        const monacoEditor =
            <Editor
                key={this.props.key}
                defaultLanguage="heliosIntermediateRepresentation"
                theme={"uirTheme"}
                defaultValue={this.prepareUirLines()}
                options={monacoOptions}
                loading={<Spinner />}
                beforeMount={this.handleEditorWillMount}
                onMount={this.handleEditorDidMount}
            />
        return monacoEditor;

    }

    createUirViewerLinesFoldedToggler() {
        return <UirToggler
            togglerState={this.state.linesFolded}
            togglerLabelText={"Fold Lines"}
            uirViewerTogglerChangeFunction={this.toggleFoldAllLines} />
    }

    createUirViewerOperatorColoredToggler() {
        return <UirToggler
            togglerState={this.state.operatorsColorHidden}
            togglerLabelText={"Hide Operators"}
            uirViewerTogglerChangeFunction={this.toggleOperatorsColorHidden} />
    }

    setMonacoGlyphs() {
        if (this.globalEventOccurrenceDecorations.length === 0) {
            this.createInitialColorGlyphs();
        } else {
            this.updateColorGlyphs();
        }

    }

    updateColorGlyphs() {
        const currentEventIndex = this.props.events?.indexOf(this.props.currentEvent);
        const eventNumber = (currentEventIndex && currentEventIndex >= 0) ? currentEventIndex + 1 : 1; //Set to 1 if currentEventIndex is undefined as currentEvent is default
        // const eventString = `event${eventNumber}`;
        // const relativeFunctionEventString = `relEvent${eventNumber}`;

        for (let i = 0; i < this.props.chartData.uirLines.length; i++) {

            //Default: No glyph and no glyph margin hover message
            const elemGlyphClasses = ["glyphClassWhite", "glyphClassWhite"];
            let glyphMarginHoverMessage = undefined;

            // color margin glyph for event
            const eventOccurence = this.props.chartData.eventsFrequency[eventNumber][i];
            const relativeFunctionEventOccurence = this.props.chartData.eventsRelativeFrequency[eventNumber][i];

            if (eventOccurence > 0 || relativeFunctionEventOccurence > 0) {
                const eventOccurenceIsFunctionColorGroup = this.props.chartData.isFunction[i];
                let eventOccurenceRelAbsColorGroup = Math.floor((eventOccurenceIsFunctionColorGroup === 1 ? eventOccurence : relativeFunctionEventOccurence) / 10);
                eventOccurenceRelAbsColorGroup = eventOccurenceRelAbsColorGroup === 10 ? 9 : eventOccurenceRelAbsColorGroup;
                const eventOccurrenceColorGroup = `${eventOccurenceIsFunctionColorGroup}${eventOccurenceRelAbsColorGroup}`;
                elemGlyphClasses[0] = this.createCustomCssGlyphClass("Event", eventOccurrenceColorGroup);
                glyphMarginHoverMessage = { value: this.createMarkdownEventsList(i, eventNumber, true) };
            }

            //color line glyph for operator
            const operator = this.props.chartData.operators[i];
            if (!this.state.operatorsColorHidden && operator !== "None") {
                if (Controller.isOperatorUnavailable(operator)) {
                    //node not available, not in sample or nor in time selection
                    elemGlyphClasses[1] = this.createCustomCssGlyphClass("Operator", -1);
                } else if (Controller.isOperatorSelected(operator)) {
                    //node available and selected
                    const operatorColorGroup = this.props.operators!.operatorsId.indexOf(operator);
                    elemGlyphClasses[1] = this.createCustomCssGlyphClass("Operator", operatorColorGroup);
                }
            }


            (this.editorRef as any).deltaDecorations([this.globalEventOccurrenceDecorations[i]], [
                {
                    range: new monaco.Range(i + 1, 1, i + 1, 1),
                    options: {
                        isWholeLine: true,
                        glyphMarginClassName: elemGlyphClasses[0],
                        glyphMarginHoverMessage: glyphMarginHoverMessage,
                        className: elemGlyphClasses[1],
                    }
                }
            ]);
        }

    }

    createInitialColorGlyphs() {
        // create initial white glyphs for each line
        const initialGlyphs: Array<{ range: monaco.Range, options: object }> = this.props.chartData.uirLines.map((elem, index) => {
            return {
                range: new monaco.Range(index + 1, 1, index + 1, 1),
                options: {
                    isWholeLine: true,
                    className: "glyphClassWhite",
                    glyphMarginClassName: "glyphClassWhite",
                }
            }
        });

        this.globalEventOccurrenceDecorations = (this.editorRef as any).deltaDecorations(
            [], initialGlyphs
        );

        this.updateColorGlyphs();
    }

    createCustomCssGlyphClass(glyphClassScaleType: "Event" | "Operator", glyphClassGroupNumber: number | string) {

        //return name of correct css class, create class if not yet created dynamically for operator colors
        const className = `glyphClass${glyphClassScaleType}${glyphClassGroupNumber}`;

        if (glyphClassScaleType === "Operator") {
            if (!this.editorContainerRef.current!.children.namedItem(className)) {
                this.addCssClassForGlyphToDom(className, glyphClassGroupNumber as number);
            }
            return className;
        } else if (glyphClassScaleType == "Event") {
            return className;
        }
        return "";

    }

    addCssClassForGlyphToDom(className: string, glyphClassGroupNumber: number) {
        const style = document.createElement('style');
        style.setAttribute("id", className);
        const color = glyphClassGroupNumber === -1
            ? this.props.appContext.tertiaryColor + model.chartConfiguration.colorLowOpacityHex
            : model.chartConfiguration.colorScale!.operatorsIdColorScaleLowOpacity[glyphClassGroupNumber];
        style.innerHTML = `.${className} { background: ${color}; }`;
        this.editorContainerRef.current!.appendChild(style);
    }

}

const mapStateToProps = (state: model.AppState, ownProps: model.IUirViewerProps) => ({
    chartData: state.chartData[ownProps.chartId].chartData.data as model.IUirViewerData,
    currentEvent: state.currentEvent,
    events: state.events,
    currentOperator: state.currentOperator,
    currentOperatorActiveTimeframePipeline: state.currentOperatorActiveTimeframePipeline,
    operators: state.operators,
});

export default connect(mapStateToProps, undefined)(Context.withAppContext(UirViewer));
