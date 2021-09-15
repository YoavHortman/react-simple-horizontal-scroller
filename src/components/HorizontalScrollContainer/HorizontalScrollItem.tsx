import * as React from 'react';

export interface HorizontalScrollItemProps extends React.HTMLAttributes<HTMLDivElement> {
    id: string;
}

export class HorizontalScrollItem extends React.PureComponent<HorizontalScrollItemProps> {
    public static displayName = `HorizontalScrollItem`;
    constructor(props: HorizontalScrollItemProps) {
        super(props);
    }

    public render() {
        return <div {...this.props}/>;
    }
}
