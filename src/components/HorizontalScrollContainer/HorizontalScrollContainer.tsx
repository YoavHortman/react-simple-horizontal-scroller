import * as React from 'react';
import './HorizontalScrollContainer.css';
import { HorizontalScrollItem } from './HorizontalScrollItem';
import { assertIsDefined, assertNever, isElementOfType } from './utils';

interface MovementControlsWithDirection extends MovementControls {
  direction: 'LEFT' | 'RIGHT';
}

interface MovementControls {

  /**
   * Set the default icon class and style, gets preseverd when defaultArrow is sent to customCompoent.
   * To change icon color set ```borderColor```
   */
  defaultIconClassName?: string;
  defaultIconStyle?: React.CSSProperties;

  /**
   * Set default container class and style, gets preseverd when defaultArrow is sent to customCompoent.
   */
  defaultIconContainerClassName?: string;
  defaultIconContainerStyle?: React.CSSProperties;

  /** 
   * To override the default arrow movement control, 
   * provide a component that calls scrollStep() onClick.
   * The defeaultArrow is provided for convience and can be rendered without calling scrollStep.
   */
  customComponent?: (scrollStep: () => void, defaultArrow: React.ReactChild) => React.ReactChild | undefined | null

  /**
   * Defaults to AUTO.
   * AUTO: only display when needed according to isScroll
   * ALWAYS: Always on
   * NONE: do not show (This is useful for touch screens where one might not need the controls)
   */
  visibility?: 'AUTO' | 'ALWAYS' | 'NONE';
}

export interface ControlsConfig {
  /**
   * Defaults to: SEPERATED
   * Will display according to this
   * SEPERATED: <- {children} ->
   * BEFORE_CHILD: <- -> {children}
   * AFTER_CHILD: {children} <- ->
   */
  position?: 'BEFORE_CHILD' | 'AFTER_CHILD' | 'SEPARATED';

  /**
   * Right scroll button behaviour
   */
  right?: MovementControls;

  /**
   * Left scroll button behaviour
   */
  left?: MovementControls;
}

export interface HorizontalScrollContainerProps {
  /**
   * Configure controls position, looks and behaviour
   */
  controlsConfig?: ControlsConfig;
  /**
   *  Internal listener is good for when only the window can resize.
   *  In case more elements can be resized the component must be rerendered.
   *  This is not meant to be changed while the component is alive
   */
  useExternalResizeListener?: boolean;

  /**
   * Will prevent conversion of mousewheel vertical scroll to horizontal
   */
  removeMouseWheelOverride?: boolean;

  /**
   * Id of a <HorizontalScrollItem> that is selected
   */
  selectedItemId?: string;

  /**
   * Always fires onMount.
   * Returns if the container is overflowing.
   */
  onScrollStateChange?: (isScrollable: boolean) => void;

  /**
   * Gets called at set intervals AFTER a scroll has ended
   */
  onScrollEnd?: (reachedEnd: 'LEFT' | 'RIGHT' | null) => void;

  /**
   * Gets called whenever a scorll starts
   */
  onScrollStart?: () => void;

  /**
   * Overrides default behaviour: Math.max(scrollAbleElementWidth / 2, 208)
   * A function that returns an abs number to scroll by e.g:
   * (scrollAbleElementWidth) => Math.max(window.getWidth() / 2, scrollAbleElementWidth / 10);
   */
  customScrollBy?: (scrollAbleElementWidth: number) => number;

  /**
   * How to position children in the container if it is not yet scrollable.
   * defaults to: 'start'
   */
  childPosition?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenely';

  /**
   * Add a debounce to the resize listener.
   * This is helpful when window resizing is already a heavy opertaion.
   * Should be left undefined in most cases.
   */
  resizeListenerDebounce?: number;
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
    assertIsDefined(this.scrollableContainer.current);
    this.scrollableContainer.current.addEventListener('wheel', this.handleWheel, { passive: false });

    this.resizeWithDebounce(0);
  }

  public componentWillUnmount(): void {
    assertIsDefined(this.scrollableContainer.current);
    this.scrollableContainer.current.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('resize', this.resize);
  }

  public componentDidUpdate(): void {
    this.resize();
  }

  public render() {
    const isSeperate = this.props.controlsConfig?.position === undefined || this.props.controlsConfig.position === 'SEPARATED';
    const beforeChild = isSeperate || this.props.controlsConfig?.position === 'BEFORE_CHILD';
    const afterChild = isSeperate || this.props.controlsConfig?.position === 'AFTER_CHILD';
    return <div
      onWheel={this.handleWheel}
      className={'HorizontalScrollContainer_root'}
    >
      {this.state.isScrollable && beforeChild ? this.renderControls('BEFORE_CHILD') : null}
      <div
        className={this.getChildrenContainerClass()}
        ref={this.scrollableContainer}
        onAnimationEnd={() => this.setState({ shaking: null })}
        onScroll={this.handleScroll}
        style={{ justifyContent: !this.state.isScrollable ? this.props.childPosition : undefined }}
      >
        {!this.state.isScrollable && beforeChild ? this.renderControls('BEFORE_CHILD') : null}
        {this.renderChildren()}
        {!this.state.isScrollable && afterChild ? this.renderControls('AFTER_CHILD') : null}
      </div>
      {this.state.isScrollable && afterChild ? this.renderControls('AFTER_CHILD') : null}
    </div>;
  }

  public getMovementControls(position: 'BEFORE_CHILD' | 'AFTER_CHILD') {
    const right: MovementControlsWithDirection = { ...this.props.controlsConfig?.right, direction: 'RIGHT' };
    const left: MovementControlsWithDirection = { ...this.props.controlsConfig?.left, direction: 'LEFT' };
    const controlsConfigPosition = this.props.controlsConfig?.position ?? 'SEPARATED'
    switch (controlsConfigPosition) {
      case 'AFTER_CHILD': {
        if (position === 'AFTER_CHILD') {
          return <>
            {this.isMovementControlsVisible(left) ? this.renderMovementControl(left) : null}
            {this.isMovementControlsVisible(right) ? this.renderMovementControl(right) : null}
          </>;
        }
        break;
      }
      case 'BEFORE_CHILD': {
        if (position === 'BEFORE_CHILD') {
          return <>
            {this.isMovementControlsVisible(left) ? this.renderMovementControl(left) : null}
            {this.isMovementControlsVisible(right) ? this.renderMovementControl(right) : null}
          </>;
        }
        break;
      }
      case 'SEPARATED': {
        if (position === 'BEFORE_CHILD') {
          return this.isMovementControlsVisible(left) ? this.renderMovementControl(left) : null;
        }
        if (position === 'AFTER_CHILD') {
          return this.isMovementControlsVisible(right) ? this.renderMovementControl(right) : null;
        }
        break;
      }
      default:
        assertNever(controlsConfigPosition);
    }

  }

  public renderControls(position: 'BEFORE_CHILD' | 'AFTER_CHILD') {
    if (!this.isControlVisible()) {
      return null;
    }

    return <div
      className={
        'HorizontalScrollContainer_buttonsContainer' +
        (this.state.shaking !== null ? ' HorizontalScrollContainer_buttonsContainerShaking' : '')
      }
    >
      {this.getMovementControls(position)}
    </div>;
  }

  private scrollIntoViewIfNeeded() {
    const selected = this.selectedItem.current;
    if (selected !== null && this.lastSelectedItemId !== this.props.selectedItemId) {
      this.lastSelectedItemId = this.props.selectedItemId;
      this.scrollTimeoutTimer = this.SCROLL_TIMEOUT_INTO_VIEW;
      selected.scrollIntoView({ behavior: 'smooth' });
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
    e.preventDefault();
    e.stopPropagation();
  }

  private handleScrollEnd = () => {
    this.isScrolling = false;
    if (this.props.onScrollEnd === undefined) {
      return;
    }

    const element = this.scrollableContainer.current;
    assertIsDefined(element)

    this.props.onScrollEnd(this.getPositionAfterScrollEnd(element));
  }

  private getPositionAfterScrollEnd(element: HTMLDivElement): 'RIGHT' | 'LEFT' | null {
    if (!this.canScrollToSide(element, 'LEFT')) {
      return 'LEFT';
    } else if (!this.canScrollToSide(element, 'RIGHT')) {
      return 'RIGHT';
    }
    return null
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
    const iconClassName = config.direction === 'LEFT' ? 'HorizontalScrollContainer_defaultLeftArrow' : 'HorizontalScrollContainer_defaultRightArrow';
    const scrollStepWithDirectiton = () => this.scrollStep(config.direction);

    const defaultIcon = <div
      onClick={scrollStepWithDirectiton}
      className={'HorizontalScrollContainer_defaultArrowContainer ' + config.defaultIconContainerClassName ?? ''}
      style={config.defaultIconContainerStyle}
    >
      <div
        className={iconClassName + ' ' + config.defaultIconClassName ?? ''}
        style={config.defaultIconStyle}
      />
    </div>;

    if (config.customComponent !== undefined) {
      return config.customComponent(scrollStepWithDirectiton, defaultIcon)
    }
    return defaultIcon;
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
    return this.isMovementControlsVisible(this.props.controlsConfig?.right) ||
      this.isMovementControlsVisible(this.props.controlsConfig?.left);
  }

  private isMovementControlsVisible(config: MovementControls | undefined): boolean {
    if (config === undefined) {
      return this.state.isScrollable;
    } else {
      return config.visibility === 'ALWAYS' || (this.state.isScrollable && config.visibility !== 'NONE');
    }
  }

  private resize = (): void => {
    if (this.props.resizeListenerDebounce === undefined) {
      this.resizeListener();
    } else {
      this.resizeWithDebounce(this.props.resizeListenerDebounce);
    }
  }

  private resizeWithDebounce(debounce: number) {
    clearTimeout(this.resizeTimeoutId);
    this.resizeTimeoutId = window.setTimeout(this.resizeListener, debounce);
  }

  private resizeListener = (): void => {
    const element = this.scrollableContainer.current;
    assertIsDefined(element);

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

  private getScrollBy(element: HTMLDivElement, direction: 'LEFT' | 'RIGHT'): number {
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
