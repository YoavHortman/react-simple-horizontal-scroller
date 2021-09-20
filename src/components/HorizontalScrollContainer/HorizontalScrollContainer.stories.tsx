import React from "react";
import { Meta } from "@storybook/react/types-6-0";
import { Story } from "@storybook/react";
import { HorizontalScrollContainer } from "../..";
import { HorizontalScrollItem } from "../..";
import { HorizontalScrollContainerProps } from "./HorizontalScrollContainer";


const colors = [
  '#ff00d8',
  '#ff00ab',
  '#ff007b',
  '#ff3b4c',
  '#ff6f0d',
  '#ff9700',
  '#f0b800',
  '#c4d300',
  '#8ce900',
  '#00fc55',
]

const itemStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 100,
  height: 30,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 4px',
  color: 'white',
  boxSizing: 'border-box'
}

const parentStyle: React.CSSProperties = {
  display: 'flex',
  overflow: 'hidden',
  border: '1px solid black',
  padding: 4
}


const meta: Meta = {
  title: "Components/HorziontalScrollContainer",
  component: HorizontalScrollContainer
}

type TemplateProps = { initialItems: number[], props: HorizontalScrollContainerProps }

export default meta;

const Template: Story<TemplateProps> = (args: Partial<TemplateProps>) => {
  const [containerWidth, setContainerWidth] = React.useState(400);
  const [selected, setSelected] = React.useState(args.props?.selectedItemId)
  const [items, setItems] = React.useState(args.initialItems ?? [])

  return <div style={{ width: '100%', display: "flex", flexDirection: 'column', alignItems: "center" }}>

    <div style={{ padding: 8 }}>
      <button onClick={() => setContainerWidth(containerWidth + 100)}>+ Width</button>
      <button onClick={() => setContainerWidth(Math.max(100, containerWidth - 100))}>- Width</button>
    </div>

    <div style={{ padding: 8 }}>
      <button onClick={() => setItems(items.concat(items.length))}>+ Item</button>
      <button onClick={() => setItems(items.slice(0, -1))}>- Item</button>
    </div>

    <div style={{ ...parentStyle, width: containerWidth }}>
      <HorizontalScrollContainer {...args.props} selectedItemId={selected}>
        {items.map((item) => {
          return <HorizontalScrollItem
            id={"" + item}
            style={{ ...itemStyle, background: colors[item % colors.length], border: selected === "" + item ? '3px solid blue' : undefined }}
            onClick={() => setSelected("" + item)}
          >
            {item}
          </HorizontalScrollItem>
        })}
      </HorizontalScrollContainer>
    </div>
  </div>
};

export const Default = Template.bind({});
Default.args = {
  initialItems: [0, 1, 2, 3, 4]
};

export const WithPreselected = Template.bind({});
WithPreselected.args = {
  initialItems: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  props: { selectedItemId: '8' },
};


const Template2: Story<TemplateProps> = (args) => {
  const [selected, setSelected] = React.useState(args.props?.selectedItemId)
  const [items, setItems] = React.useState(args.initialItems ?? [])
  const [isLoading, setIsLoading] = React.useState(false)

  return <div style={{ ...parentStyle, width: 500 }}>
    <HorizontalScrollContainer
      {...args.props}
      controlsConfig={{
        right: {
          customComponent: isLoading ? (scrollStep) => <div>loading..</div> : undefined
        }
      }}
      selectedItemId={selected}
      onScrollEnd={(end) => {
        console.log(end)
        if (end === 'RIGHT' && !isLoading) {
          setIsLoading(true)
          setTimeout(() => {
            setIsLoading(false)
            setItems(items.concat([items.length, items.length + 1, items.length + 2, items.length + 3]))
          }, 3000)
        }
      }}>
      {items.map((item) => {
        return <HorizontalScrollItem
          id={"" + item}
          style={{ ...itemStyle, background: colors[item % colors.length], border: selected === "" + item ? '3px solid blue' : undefined  }}
          onClick={() => setSelected("" + item)}
        >
          {item}
        </HorizontalScrollItem>
      })}
    </HorizontalScrollContainer>
  </div>
}


export const InfiniteScroll = Template2.bind({});
InfiniteScroll.args = {
  initialItems: [0, 1, 2, 3, 4, 5],
};


const Template3: Story<TemplateProps> = (args: Partial<TemplateProps>) => {
  const [items, setItems] = React.useState(args.initialItems ?? [])
  const [scrollState, setScrollState] = React.useState(false);

  return <div style={{ width: '100%', display: "flex", flexDirection: 'column', alignItems: "center" }}>

    <div style={{ ...parentStyle, width: 800 }}>
      <HorizontalScrollContainer
        {...args.props}
        onScrollStateChange={setScrollState}
        controlsConfig={{
          right: {
            customComponent: (scrollStep, defaultIcon) => <><AddItem items={items} onClick={setItems} />{defaultIcon}</>
          },
          left: {
            customComponent: (scrollStep, defaultIcon) => <>{defaultIcon}<RemoveItem items={items} onClick={setItems} /></>
          }
        }}
      >

        {!scrollState && <RemoveItem items={items} onClick={setItems} />}
        {items.map((item) => {
          return <div
            style={{ ...itemStyle, background: colors[item % colors.length] }}
          >
            {item}
          </div>
        })}
        {!scrollState && <AddItem items={items} onClick={setItems} />}
      </HorizontalScrollContainer>
    </div>
  </div>
};


export const TrailingButton = Template3.bind({});
TrailingButton.args = {
  initialItems: [0, 1, 2],
};


interface ItemButtonProps {
  items: number[];
  onClick: (newItems: number[]) => void;
}

const AddItem: React.FC<ItemButtonProps> = (props) => {
  return <button
    style={{ height: '100%', marginLeft: 8, marginRight: 8, width: 64 }}
    onClick={() => props.onClick(props.items.concat(props.items.length))}
  >
    + Item
  </button>;
}

const RemoveItem: React.FC<ItemButtonProps> = (props) => {
  return <button
    style={{ height: '100%', marginLeft: 8, marginRight: 8, width: 64 }}
    onClick={() => props.onClick(props.items.slice(0, -1))}
  >
    - Item
  </button>
}