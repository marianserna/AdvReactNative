import React from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends React.Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
    renderNoMoreCards: () => {}
  };

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();

    // handling gestures (press and drag movements on screen)
    const panResponder = PanResponder.create({
      // press down
      onStartShouldSetPanResponder: () => true,
      // press and move around screen
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      // press down, drag or not, and let go (remove finger from screen)
      onPanResponderRelease: (event, gesture) => {
        // reset to original
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      }
    });

    this.panResponder = panResponder;
    this.position = position;

    this.state = { index: 0 };
  }

  componentWillReceiveProps(nextProps) {
    if (next.props.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  componentWillUpdate() {
    // compatibility code for android
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  forceSwipe = direction => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    // same effect than spring without bouncing (timing produces a more linear feeling)
    // callback can be passed to start so that it will execute after the animation
    Animated.timing(this.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => {
      this.onSwipeComplete(direction);
    });
  };

  onSwipeComplete = direction => {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const item = data[this.state.index];

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    this.position.setValue({ x: 0, y: 0 });
    this.setState({ index: this.state.index + 1 });
  };

  resetPosition = () => {
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  };

  getCardStyle = () => {
    // const { position } = this.position;
    const rotate = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    });

    return {
      ...this.position.getLayout(),
      transform: [{ rotate }]
    };
  };

  renderCards() {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data
      .map((item, i) => {
        if (i < this.state.index) {
          return null;
        }
        // animate only the 1st time on the screen
        if (i === this.state.index) {
          return (
            <Animated.View
              key={item.id}
              {...this.panResponder.panHandlers}
              style={[this.getCardStyle(), styles.cardStyle]}
            >
              {this.props.renderCard(item)}
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={item.id}
            style={[styles.cardStyle, { top: 5 * (i - this.state.index) }]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      })
      .reverse();
  }

  render() {
    return <View>{this.renderCards()}</View>;
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH
  }
};

export default Deck;
