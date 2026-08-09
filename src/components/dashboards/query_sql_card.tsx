import React from 'react';
import { connect } from 'react-redux';
import * as model from '../../model';
import Editor from '@monaco-editor/react';
import '../../monaco_setup';
import { isDarkTheme, THEME_CHANGE_EVENT } from '../../style/theme';

interface Props {
    queryplanJson: object | undefined;
}

interface State {
    dark: boolean;
}

// The SQL statement this trace profiles. It rides as a root-level "sql" key on
// query_plan_analyzed.json (helios trace.cpp record_plan); packages written
// before that key existed simply don't have it, and the pane renders nothing.
export function sqlOfPlan(queryplanJson: object | undefined): string | undefined {
    const sql = (queryplanJson as { sql?: unknown } | undefined)?.sql;
    return typeof sql === 'string' && sql.trim().length > 0 ? sql.trim() : undefined;
}

// Whether the trace has UIR to profile. pack stamps "uirLines" (the uir.json
// line count) on the plan root: 0 means the query never reached the JIT —
// the interpreter and GPU/Metal tiers emit no UIR at all — so a UIR profiler
// would render an empty view. Packages without the key (pre-annotation) keep
// the old behaviour and show the profiler.
export function uirProfilerAvailable(queryplanJson: object | undefined): boolean {
    const lines = (queryplanJson as { uirLines?: unknown } | undefined)?.uirLines;
    return !(typeof lines === 'number' && lines === 0);
}

// The SQL pane of the UIR profiling dashboard's left box (a tab next to the
// UIR profiler — dashboard_uir.tsx owns the tab bar). Rendered through the
// same locally-bundled read-only Monaco as the UIR profiler, with monaco's
// built-in 'sql' tokenizer and the profiler's 11px code font, so switching
// tabs does not switch typography. Fills its parent; no chrome of its own.
class QuerySqlCard extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = { dark: isDarkTheme() };
        this.themeListener = this.themeListener.bind(this);
    }

    componentDidMount() {
        addEventListener(THEME_CHANGE_EVENT, this.themeListener);
    }

    componentWillUnmount() {
        removeEventListener(THEME_CHANGE_EVENT, this.themeListener);
    }

    themeListener() {
        this.setState({ dark: isDarkTheme() });
    }

    public render() {
        const sql = sqlOfPlan(this.props.queryplanJson);
        if (sql === undefined) return null;

        return (
            // inline height on purpose: the pane must fill whatever box it is
            // given even where the app stylesheet (h-full) is not loaded.
            <div style={{ height: '100%', width: '100%' }}>
                <Editor
                    language="sql"
                    value={sql}
                    theme={this.state.dark ? 'vs-dark' : 'vs'}
                    options={{
                        // Mirrors the UIR profiler's monaco options so the two
                        // tabs read as one surface (uir_viewer.tsx).
                        readOnly: true,
                        domReadOnly: true,
                        scrollBeyondLastLine: false,
                        fontSize: 11,
                        fixedOverflowWidgets: true,
                        minimap: { enabled: false },
                        folding: false,
                        renderLineHighlight: 'none',
                        occurrencesHighlight: false,
                        selectionHighlight: false,
                        contextmenu: false,
                        wordWrap: 'on',
                        scrollbar: { alwaysConsumeMouseWheel: false },
                    }}
                />
            </div>
        );
    }
}

const mapStateToProps = (state: model.AppState) => ({
    queryplanJson: state.queryplanJson,
});

export default connect(mapStateToProps)(QuerySqlCard);
