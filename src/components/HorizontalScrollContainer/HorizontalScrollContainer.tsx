import * as React from 'react';
import './HorizontalScrollContainer.css';
import { HorizontalScrollItem } from './HorizontalScrollItem';
import { assertIsDefined, assertNever, isElementOfType } from './utils';

interface MovementControlsWithDirection extends MovementControls {
  direction: 'LEFT' | 'RIGHT';
}

// TODO find a way to provide a container that's controlled by the visiblity,
// TODO and a way to merge the movement control in to it
interface MovementControls {
  containerClassName?: string;
  iconClassName?: string;
  visibility?: 'AUTO' | 'ALWAYS' | 'NONE';

  /**
   * Attaches itself to the unreachable part of a movement controller depending on position
   */
  innerElement?: any;
}

export interface ControlsConfig {
  position?: 'BEFORE_CHILD' | 'AFTER_CHILD' | 'SEPARATED';
  right?: MovementControls;
  left?: MovementControls;
}

export interface HorizontalScrollContainerProps {
  controlsConfig?: ControlsConfig;
  /**
   *  Internal listener is good for when only the window can resize.
   *  In case more elements can be resized the component must be rerendered.
   *  This is not meant to be changed while the component is alive
   */
  useExternalResizeListener?: boolean;
  removeMouseWheelOverride?: boolean;
  selectedItemId?: string;

  /**
   * Always fires onMount
   */
  onScrollStateChange?: (isScrollable: boolean) => void;

  onScrollEnd?: (reachedEnd: 'LEFT' | 'RIGHT' | null) => void;
  onScrollStart?: () => void;

  /**
   * Overrides default behaviour: Math.max(scrollAbleElementWidth / 2, 208)
   * A function that returns an abs number to scroll by e.g:
   * (scrollAbleElementWidth) => Math.max(window.getWidth() / 2, scrollAbleElementWidth / 10);
   */
  customScrollBy?: (scrollAbleElementWidth: number) => number;
}

export interface HorizontalScrollContainerState {
  shaking: 'RIGHT' | 'LEFT' | null;
  isScrollable: boolean;
}

export class HorizontalScrollContainer extends React.Component<HorizontalScrollContainerProps, HorizontalScrollContainerState> {
  private readonly SCROLL_TIMEOUT_INTO_VIEW = 50;
  private readonly SCROLL_TIMEOUT_WHEEL = 100;
  private readonly SCROLL_TIMEOUT_ARROWS = 30;
  private readonly scrollableContainer = React.createRef<HTMLDivElement>();
  private readonly selectedItem = React.createRef<HTMLDivElement>();
  private wasScrollable: boolean | undefined;
  private scrollTimeoutId: number | undefined;
  private resizeTimeoutId: number | undefined;
  private scrollTimeoutTimer: number;
  private isScrolling: boolean;
  private lastSelectedItemId?: string;

  constructor(props: HorizontalScrollContainerProps) {
    super(props);
    this.isScrolling = false;
    this.scrollTimeoutTimer = this.SCROLL_TIMEOUT_INTO_VIEW;
    this.state = {
      shaking: null,
      isScrollable: false,
    };
  }

  public componentDidMount(): void {
    if (this.props.useExternalResizeListener !== true) {
      window.addEventListener('resize', this.resize);
    }
    this.resize();
  }

  public componentWillUnmount(): void {
    window.removeEventListener('resize', this.resize);
  }

  public componentDidUpdate(): void {
    this.resize();
  }

  public render() {
    const isSeprate = this.props.controlsConfig?.position === undefined || this.props.controlsConfig.position === 'SEPARATED';
    const beforeChild = isSeprate || this.props.controlsConfig?.position === 'BEFORE_CHILD';
    const afterChild = isSeprate || this.props.controlsConfig?.position === 'AFTER_CHILD';
    return <div
      onWheel={this.handleWheel}
      onScroll={this.handleScroll}
      className={'HorizontalScrollContainer_root'}
    >
      {this.state.isScrollable && beforeChild ? this.renderControls('BEFORE_CHILD') : null}
      <div
        className={this.getChildrenContainerClass()}
        ref={this.scrollableContainer}
        onAnimationEnd={() => this.setState({ shaking: null })}
      >
        {!this.state.isScrollable && beforeChild ? this.renderControls('BEFORE_CHILD') : null}
        {this.renderChildren()}
        {!this.state.isScrollable && afterChild ? this.renderControls('AFTER_CHILD') : null}
      </div>
      {this.state.isScrollable && afterChild ? this.renderControls('AFTER_CHILD') : null}
    </div>;
  }

  public renderControls(position: 'BEFORE_CHILD' | 'AFTER_CHILD') {
    if (!this.isControlVisible()) {
      return null;
    }

    let movementControls: React.ReactNode | null = null;
    const right: MovementControlsWithDirection = { ...this.props.controlsConfig?.right, direction: 'RIGHT' };
    const left: MovementControlsWithDirection = { ...this.props.controlsConfig?.left, direction: 'LEFT' };
    const positioning = this.props.controlsConfig?.position ?? 'SEPARATED' 
    switch (positioning) {
      case 'BEFORE_CHILD':
        if (position === 'BEFORE_CHILD') {
          movementControls = <>
            {this.isMovementControlsVisible(left) ? this.renderMovementControl(left) : null}
            {left.innerElement}
            {this.isMovementControlsVisible(right) ? this.renderMovementControl(right) : null}
            {right.innerElement}
          </>;
        }
        break;
      case 'AFTER_CHILD':
        if (position === 'AFTER_CHILD') {
          movementControls = <>
            {left.innerElement}
            {this.isMovementControlsVisible(left) ? this.renderMovementControl(left) : null}
            {right.innerElement}
            {this.isMovementControlsVisible(right) ? this.renderMovementControl(right) : null}
          </>;
        }
        break;
      case 'SEPARATED':
        if (position === 'BEFORE_CHILD') {
          movementControls = <>
            {this.isMovementControlsVisible(left) ? this.renderMovementControl(left) : null}
            {right.innerElement}
          </>;
        }
        if (position === 'AFTER_CHILD') {
          movementControls = <>
            {left.innerElement}
            {this.isMovementControlsVisible(right) ? this.renderMovementControl(right) : null}
          </>;
        }
        break;
      default:
        assertNever(positioning);
    }

    return <div
      className={
        'HorizontalScrollContainer_buttonsContainer' +
        (this.state.shaking !== null ? ' HorizontalScrollContainer_buttonsContainerShaking' : '')
      }
    >
      {movementControls}
    </div>;
  }

  private scrollIntoViewIfNeeded() {
    if (this.selectedItem.current !== null && this.lastSelectedItemId !== this.props.selectedItemId) {
      this.lastSelectedItemId = this.props.selectedItemId;
      this.scrollTimeoutTimer = this.SCROLL_TIMEOUT_INTO_VIEW;
      this.selectedItem.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private handleWheel = (e: any) => {
    if (e.deltaY === 0 || e.deltaX !== 0 || this.props.removeMouseWheelOverride === true) {
      return;
    }

    const element = this.scrollableContainer.current;
    assertIsDefined(element)
    const direction = e.deltaY > 0 ? 'RIGHT' : 'LEFT';
    if (this.canScrollToSide(element, direction)) {
      this.scrollTimeoutTimer = this.SCROLL_TIMEOUT_WHEEL;
      element.scrollBy({ top: 0, left: e.deltaY });
    }
  }

  private handleScrollEnd = () => {
    this.isScrolling = false;
    if (this.props.onScrollEnd === undefined) {
      return;
    }

    const element = this.scrollableContainer.current;
    assertIsDefined(element)
    let reachedEnd: 'RIGHT' | 'LEFT' | null = null;
    if (!this.canScrollToSide(element, 'LEFT')) {
      reachedEnd = 'LEFT';
    } else if (!this.canScrollToSide(element, 'RIGHT')) {
      reachedEnd = 'RIGHT';
    }
    this.props.onScrollEnd(reachedEnd);
  }

  private scrollStart() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      if (this.props.onScrollStart !== undefined) {
        this.props.onScrollStart();
      }
    }
  }

  private handleScroll = () => {
    clearTimeout(this.scrollTimeoutId);
    this.scrollStart();
    this.scrollTimeoutId = window.setTimeout(this.handleScrollEnd, this.scrollTimeoutTimer);
  }

  private renderMovementControl(config: MovementControlsWithDirection) {
    const iconClassName = config.iconClassName !== undefined ? config.iconClassName : config.direction === 'LEFT' ? 'HorizontalScrollContainer_defaultLeftArrow' : 'HorizontalScrollContainer_defaultRightArrow';
    return <div
      onClick={() => this.scrollStep(config.direction)}
      className={'HorizontalScrollContainer_defaultArrowContainer' + ' ' + config.containerClassName ?? ''}
    >
      <div className={iconClassName} />
    </div>;
  }

  private renderChildren(): React.ReactNode {
    let children = this.props.children;
    if (this.props.selectedItemId !== undefined) {
      children = this.getChildren(children);
    }
    return children;
  }

  private getChildren(children: React.ReactNode): React.ReactNode {
    return React.Children.map(children, (child) => {
      if (isElementOfType(child, HorizontalScrollItem)) {
        return <div
          {...child.props}
          ref={this.props.selectedItemId === child.props.id ? this.selectedItem : null}
        />;
      } else if (React.isValidElement(child)) {
        return React.cloneElement(child, { children: this.getChildren(child.props.children) });
      }
      return child;
    });
  }

  private isControlVisible(): boolean {
    const right = this.props.controlsConfig?.right;
    const left = this.props.controlsConfig?.left;
    return left === undefined || right === undefined ||
      this.isMovementControlsVisible(right) ||
      this.isMovementControlsVisible(left) ||
      left.innerElement || right.innerElement;
  }

  private isMovementControlsVisible(config: MovementControls | undefined): boolean {
    return config === undefined ||
      config.visibility === 'ALWAYS' ||
      (this.state.isScrollable && config.visibility !== 'NONE');
  }

  private resize = (): void => {
    clearTimeout(this.resizeTimeoutId);
    this.resizeTimeoutId = window.setTimeout(this.resizeListener, 50);
  }

  private resizeListener = (): void => {
    const element = this.scrollableContainer.current;
    if (element === null) {
      return;
    }

    // Do not use element.clientWidth because it gets ROUNDED which causes false positives
    // https://stackoverflow.com/questions/21064101/understanding-offsetwidth-clientwidth-scrollwidth-and-height-respectively
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth
    // TODO understand why ONLY in MAC a +1 is needed, seems to be a problem with the scaling
    const ableToScroll = Math.floor(element.scrollWidth) > Math.ceil(element.getBoundingClientRect().width) + 1;
    if (this.wasScrollable !== ableToScroll) {
      this.wasScrollable = ableToScroll;
      this.setState({ isScrollable: ableToScroll });
      this.handleScrollStateChange(ableToScroll);
    }
    this.scrollIntoViewIfNeeded();
  }


  private handleScrollStateChange(state: boolean): void {
    if (this.props.onScrollStateChange !== undefined) {
      this.props.onScrollStateChange(state);
    }
  }

  private getChildrenContainerClass(): string {
    let classList = 'HorizontalScrollContainer_itemsContainer';

    if (this.state.isScrollable) {
      classList += ' HorizontalScrollContainer_tabsContainerIESupportWhenScrolling';
    }
    if (this.state.shaking === 'LEFT') {
      classList += ' HorizontalScrollContainer_shakeLeft';
    } else if (this.state.shaking === 'RIGHT') {
      classList += ' HorizontalScrollContainer_shakeRight';
    }

    return classList;
  }

  private canScrollToSide(element: HTMLDivElement, direction: 'LEFT' | 'RIGHT'): boolean {
    if (direction === 'LEFT') {
      return element.scrollLeft > 0;
    } else {
      // Math.ceil and floor to help support browser zoom
      return Math.ceil(element.scrollLeft) < Math.floor(element.scrollWidth - element.clientWidth);
    }
  }

  private getScrollBy(element: any, direction: 'LEFT' | 'RIGHT'): number {
    const sideModifier = direction === 'LEFT' ? -1 : 1;
    if (this.props.customScrollBy !== undefined) {
      return sideModifier * this.props.customScrollBy(element.clientWidth);
    } else {
      const minScrollBy = 208; // Arbitrary
      const scrollLeftBy = sideModifier * Math.max(element.clientWidth / 2, minScrollBy);
      return scrollLeftBy;
    }
  }

  private scrollStep(direction: 'LEFT' | 'RIGHT'): void {
    const element = this.scrollableContainer.current;
    assertIsDefined(element)
    if (!this.state.isScrollable || !this.canScrollToSide(element, direction) && this.state.shaking === null) {
      this.setState({ shaking: direction });
    } else if (!this.isScrolling) {
      this.scrollTimeoutTimer = this.SCROLL_TIMEOUT_ARROWS;
      element.scrollBy({
        top: 0,
        left: this.getScrollBy(element, direction),
        behavior: 'smooth',
      });
    }
  }
}
