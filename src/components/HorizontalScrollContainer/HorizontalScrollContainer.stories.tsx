import React from "react";
import { Meta } from "@storybook/react/types-6-0";
import { Story } from "@storybook/react";
import { HorizontalScrollContainer } from "../..";
import { HorizontalScrollItem } from "../..";
import { HorizontalScrollContainerProps } from "./HorizontalScrollContainer";


const meta: Meta = {
  title: "Components/HorziontalScrollContainer",
  component: HorizontalScrollContainer
}

type TemplateProps = { children: any[], props: HorizontalScrollContainerProps }

export default meta;

const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const children = items.map((item) => {
  return <div style={{ flexShrink: 0, width: 100, height: 30, border: '1px solid black' }}>{item}</div>
})



// Create a master template for mapping args to render the Button component
const Template: Story<TemplateProps> = (args: Partial<TemplateProps>) => {
  const [containerWidth, setContainerWidth] = React.useState(400);
  const [selected, setSelected] = React.useState(args.props?.selectedItemId)

  return <div style={{ width: '100%', display: "flex", flexDirection: 'column', alignItems: "center" }}>

    <div style={{ padding: 8 }}>
      <button onClick={() => setContainerWidth(containerWidth + 100)}>+ Width</button>
      <button onClick={() => setContainerWidth(Math.max(100, containerWidth - 100))}>- Width</button>
    </div>


    <div style={{ display: 'flex', overflow: 'hidden', width: containerWidth, border: '1px solid red', padding: 4 }}>
      <HorizontalScrollContainer {...args.props} selectedItemId={selected}>
        {items.map((item) => {
          return <HorizontalScrollItem
            id={"" + item}
            style={{ flexShrink: 0, width: 100, height: 30, border: '1px solid black', background: selected === "" + item ? 'green' : undefined }}
            onClick={() => setSelected("" + item)}
          >
            {item}
          </HorizontalScrollItem>
        })}
      </HorizontalScrollContainer>
    </div></div>
};

export const Default = Template.bind({});
Default.args = {
  children: children
};

export const WithPreselected = Template.bind({});
WithPreselected.args = {
  props: { selectedItemId: '8' },
};
