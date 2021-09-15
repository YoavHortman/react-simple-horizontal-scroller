import * as React from 'react';


export interface HorizontalScrollButtonProps {
    containerClassName?: string;
    iconClassName?: string;

    /**
     * Auto is managed by HorizontalScrollContainer and only shows when needed
     */
    visibility?: 'AUTO' | 'ALWAYS' | 'NEVER';

    /**
     * Direction to scroll when clicked
     */
    direction: 'LEFT' | 'RIGHT';
}

/**
 * Placeholder component that is internally replaced
 */
export class HorizontalScrollButton extends React.PureComponent<HorizontalScrollButtonProps> {
    constructor(props: HorizontalScrollButtonProps) {
        super(props);
    }

    public render() {
        return <div />;
    }
}
