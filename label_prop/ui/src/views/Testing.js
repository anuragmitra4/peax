import React from 'react';
import RectangleSelection from 'react-rectangle-selection';
import Content from '../components/Content';
import ContentWrapper from '../components/ContentWrapper';

class Testing extends React.Component {
  render() {
    return (
      <ContentWrapper name="search">
        <Content name="search">
          <RectangleSelection
            onSelect={(e, coords) => {
              this.setState({
                origin: coords.origin,
                target: coords.target
              });
            }}
            style={{
              backgroundColor: 'rgba(0,0,255,0.4)',
              borderColor: 'blue'
            }}
          >
            <div style={{ height: 300, width: 300 }}>HI, world</div>
          </RectangleSelection>
        </Content>
      </ContentWrapper>
    );
  }
}

export default Testing;
