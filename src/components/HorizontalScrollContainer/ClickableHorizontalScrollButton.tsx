import * as React from 'react';
import {HorizontalScrollButtonProps} from './HorizontalScrollButton';


interface ClickableHorizontalScrollButtonProps extends HorizontalScrollButtonProps {
    onClick: () => void;
}

export class ClickableHorizontalScrollButton extends React.PureComponent<ClickableHorizontalScrollButtonProps> {
    constructor(props: ClickableHorizontalScrollButtonProps) {
        super(props);
    }

    public render() {
        return <div />;
    }
}
