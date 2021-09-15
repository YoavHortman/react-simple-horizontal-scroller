# What is react-simple-horizontal-scroller
A 0 dependency, simple and lightweight wrapper, to manage horizontal scrolling and all of its caveats in a user friendly way.

### [Demo link](https://yoavhortman.github.io/react-simple-horizontal-scroller/)

# Get started
```$ npm i react-simple-horizontal-scroller```

# Features
* Only shows scroll controls when actually required
* Will scroll to selected item when mounting
* Vertical mouse wheel scroll will translate to horizontal scroll
* Support for lazy loading when reaching an end
* Rubber band effect for great user experience

# Example usage
```
  <HorizontalScrollContainer>
    <HorizontalScrollItem id="1">Item 1</HorizontalScrollItem>
    <HorizontalScrollItem id="2">Item 2</HorizontalScrollItem>
    ...
  </HorizontalScrollContainer>
```

# Properties
### HorizontalScrollContainer
| Property                  | Type                                             | Details                                                                                                                                                                                                                  | Default Value                             |
|---------------------------|--------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| controlsConfig            | [ControlsConfig](#ControlsConfig)                 | Configure controls position, looks and behaviour                                                                                                                                                                         | undefined                                 |
| useExternalResizeListener | boolean                                          | Internal listener is good for when only the window can resize. In case more elements can be resized the component must be rerendered. This is can not be changed while the component is mounted                          | FALSE                                     |
| removeMouseWheelOverride  | boolean                                          | Will prevent conversion of mousewheel vertical scroll to horizontal                                                                                                                                                      | FALSE                                     |
| selectedItemId            | string                                           | Id of a <HorizontalScrollItem> that is selected                                                                                                                                                                          | undefined                                 |
| onScrollStateChange       | (isScrollable: boolean) => void                  | Always fires onMount with the intial state                                                                                                                                                                               | undefined                                 |
| onScrollEnd               | (reachedEnd: 'LEFT' \| 'RIGHT' \| null) => void; | Gets called AFTER a scroll has ended, useful for loading more content when and end is reached. Returns the side that's been reached or null if no end has been reached.                                                  | undefined                                 |
| onScrollStart             | () => void                                       | Gets called whenever a scroll starts                                                                                                                                                                                     | undefined                                 |
| customScrollBy            | (scrollAbleElementWidth: number) => number       | Overrides default behaviour: Math.max(scrollAbleElementWidth / 2, 208) A function that returns an abs number to scroll by e.g: (scrollAbleElementWidth) => Math.max(window.getWidth() / 2, scrollAbleElementWidth / 10); | Math.max(scrollAbleElementWidth / 2, 208) |


### ControlsConfig
| Property     | Type                                          | Details                                                                                                                                                                                                             | Default Value |
|--------------|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| position     | BEFORE_CHILD' \| 'AFTER_CHILD' \| 'SEPARATED' | Will display according to this  SEPERATED: <- {children} ->  BEFORE_CHILD: <- -> {children}  AFTER_CHILD: {children} <- ->                                                                                          | SEPERATED     |
| right        | [MovementControls](#MovementControls)         | Right scroll button behaviour                                                                                                                                                                                       | undefined     |
| left         | [MovementControls](#MovementControls)         | Left scroll button behaviour                                                                                                                                                                                        | undefined     |
| innerElement | any                                           | Attaches itself to the unreachable part of a movement controller depending on position SEPERATED: <-(HERE) {children} (HERE)-> BEFORE_CHILD: <-(HERE) (HERE)-> {children} AFTER_CHILD: {children} <-(HERE) (HERE)-> | undefined     |

### MovementControls
| Property           | Type                        | Details                                                                                                                                                                                                             | Default Value |
|--------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| containerClassName | string                      | Class name of the control container                                                                                                                                                                                 | undefined     |
| iconClassName      | string                      | Class name of the button itself, defaults to black arrow                                                                                                                                                            | undefined     |
| visibility         | AUTO' \| 'ALWAYS' \| 'NONE' | AUTO: only display when needed according to isScroll ALWAYS: Always on NONE: do not show (This is useful for touch screens where one might not need the controls)                                                   | AUTO          |
| innerElement       | any                         | Attaches itself to the unreachable part of a movement controller depending on position SEPERATED: <-(HERE) {children} (HERE)-> BEFORE_CHILD: <-(HERE) (HERE)-> {children} AFTER_CHILD: {children} <-(HERE) (HERE)-> | undefined     |

## To work on the project
* npm i
* npm run storybook

### TODOS
* Improve demos
* Maybe remove need to use <HorizontalScrollItem /> to select an item
* Use hooks instead of classes
* Get internal doc links to work