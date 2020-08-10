import React, { Component } from 'react';
import './ContextMenu.scss';
import PropTypes from 'prop-types';

class ContextMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visible !== this.props.visible) {
      console.log('I am inside ContextMenu');
      this.setState(
        { visible: this.props.visible },
        this.handleContextMenu(this.props.x, this.props.y)
      );
    }
  }

  handleContextMenu = (x, y) => {
    this.setState({ visible: true });
    const clickX = x;
    const clickY = y;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const rootW = this.root.offsetWidth;
    const rootH = this.root.offsetHeight;
    const right = screenW - clickX > rootW;
    const left = !right;
    const top = screenH - clickY > rootH;
    const bottom = !top;
    if (right) {
      this.root.style.left = `${clickX + 5}px`;
    }

    if (left) {
      this.root.style.left = `${clickX - rootW - 5}px`;
    }

    if (top) {
      this.root.style.top = `${clickY + 5}px`;
    }

    if (bottom) {
      this.root.style.top = `${clickY - rootH - 5}px`;
    }
  };

  handleClick = event => {
    const { visible } = this.state;
    const wasOutside = !(event.target.contains === this.root);

    if (wasOutside && visible) this.setState({ visible: false });
  };

  render() {
    const { visible } = this.state;

    return (
      (visible || null) && (
        <div
          ref={ref => {
            this.root = ref;
          }}
          className="contextMenu"
        >
          <div className="contextMenu--option">Positive</div>
          <div className="contextMenu--option">Neutral</div>
          <div className="contextMenu--option">Negative</div>
        </div>
      )
    );
  }
}

ContextMenu.propTypes = {
  visible: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number
};

export default ContextMenu;
