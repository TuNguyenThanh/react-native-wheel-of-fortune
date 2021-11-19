import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native"
import * as d3Shape from 'd3-shape';

import Svg, {G, Text, TSpan, Path, Pattern} from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const {width, height} = Dimensions.get('screen');

class WheelOfFortune extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: false,
      started: false,
      finished: false,
      winner: null,
      gameScreen: new Animated.Value(width - 106),
      wheelOpacity: new Animated.Value(1),
      imageLeft: new Animated.Value(width / 2 - 30),
      imageTop: new Animated.Value(height / 2 - 70),
    };
    this.angle = 0;

    this.prepareWheel();
  }

  prepareWheel = () => {
    this.Rewards = this.props.options.rewards;
    this.RewardCount = this.Rewards.length;
    this.numberOfSegments = this.RewardCount;
    this.fontSize = 13;
    this.oneTurn = 360;
    this.angleBySegment = this.oneTurn / this.numberOfSegments;
    this.angleOffset = this.angleBySegment;
    this.winner = this.props.winner;
      //? this.props.winner
      //: Math.floor(Math.random() * this.numberOfSegments);

    this._wheelPaths = this.makeWheel();
    this._angle = new Animated.Value(0);

    this.props.options.onRef(this);
  };

  resetWheelState = () => {
    this.setState({
      enabled: false,
      started: false,
      finished: false,
      winner: null,
      gameScreen: new Animated.Value(width - 106),
      wheelOpacity: new Animated.Value(1),
      imageLeft: new Animated.Value(width / 2 - 30),
      imageTop: new Animated.Value(height / 2 - 70),
    });
  };

  _tryAgain = () => {
    this.prepareWheel();
    this.resetWheelState();
    this.angleListener();
    this._onPress();
  };

  angleListener = () => {
    this._angle.addListener(event => {
      if (this.state.enabled) {
        this.setState({
          enabled: false,
          finished: false,
        });
      }

      this.angle = event.value;
    });
  };

  componentWillUnmount() {
    this.props.options.onRef(undefined);
  }

  componentDidMount() {
    this.angleListener();
  }

  makeWheel = () => {
    const data = Array.from({length: this.numberOfSegments}).fill(1);
    const arcs = d3Shape.pie()(data);
    var colors = this.props.options.colors
      ? this.props.options.colors
      : [
          '#E07026',
          '#E8C22E',
          '#ABC937',
          '#4F991D',
          '#22AFD3',
          '#5858D0',
          '#7B48C8',
          '#D843B9',
          '#E23B80',
          '#D82B2B',
        ];
    return arcs.map((arc, index) => {
      const instance = d3Shape
        .arc()
        .padAngle(0.0)
        .outerRadius(width / 2)
        .innerRadius(this.props.options.innerRadius || 100);
      return {
        path: instance(arc),
        color: colors[index % colors.length],
        value: this.Rewards[index],
        centroid: instance.centroid(arc),
      };
    });
  };

  _getWinnerIndex = () => {
    const deg = Math.abs(Math.round(this.angle % this.oneTurn));
    // wheel turning counterclockwise
    if (this.angle < 0) {
      return Math.floor(deg / this.angleBySegment);
    }
    // wheel turning clockwise
    return (
      (this.numberOfSegments - Math.floor(deg / this.angleBySegment)) %
      this.numberOfSegments
    );
  };

  _onPress = (winner) => {
    this.angleOffset = this.angleBySegment / 1.4;
    const duration = this.props.options.duration || 10000;
    this.setState({
      started: true,
    });
    Animated.timing(this._angle, {
      toValue:
        365 -
        winner * (this.oneTurn / this.numberOfSegments) +
        360 * (duration / 1000),
      duration: duration,
      useNativeDriver: true,
    }).start(() => {
      const winnerIndex = this._getWinnerIndex();
      this.setState({
        finished: true,
        winner: this._wheelPaths[winnerIndex].value,
      });
      this.props.getWinner(this._wheelPaths[winnerIndex].value, winnerIndex);
    });
  };

  getSpaceText = (charAt) => {
    switch (charAt) {
      case 'I':
      case 'i':
        return 7
      case 'M':
      case 'm':
      case 'W':
      case 'w':
        return 15
      default:
        return 12
    }
  }

  _textRender = (x, y, number, i) => (
    <Text
      x={x - number.length * 5}
      y={y - 80}
      fill={
        this.props.options.textColor ? this.props.options.textColor : '#fff'
      }
      //textAnchor="middle"
      //fontSize={this.fontSize}
      //fontWeight={'500'}
    >
      {Array.from({length: number.length}).map((_, j) => {
        // Render reward text vertically
        if (this.props.options.textAngle === 'vertical') {
          return (
            <TSpan
              x={x - 8}
              dy={this.getSpaceText(number.charAt(j - 1))}
              key={`arc-${i}-slice-${j}`}
              rotate={90}
              fill={this.props.options.textColor}
              fontWeight="bold"
              fontSize={16}
              fontFamily={Platform.select({ ios: "Roboto-Medium", android: "Roboto-Medium" })}
            >
              {number.charAt(j)}
            </TSpan>
          );
        }
        // Render reward text horizontally
        else {
          return (
            <TSpan
              y={y - 50}
              dx={this.fontSize * 0.07}
              key={`arc-${i}-slice-${j}`}
            >
              {number.charAt(j)}
            </TSpan>
          );
        }
      })}
    </Text>
  );

  _renderSvgWheel = () => {
    const { started } = this.state;
    return (
      <View style={styles.container}>
        {this._renderKnob()}
        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              {
                rotate: this._angle.interpolate({
                  inputRange: [-this.oneTurn, 0, this.oneTurn],
                  outputRange: [
                    `-${this.oneTurn}deg`,
                    `0deg`,
                    `${this.oneTurn}deg`,
                  ],
                }),
              },
            ],
            backgroundColor: this.props.options.backgroundColor
              ? this.props.options.backgroundColor
              : '#fff',
            width: width - 100,
            height: width - 100,
            borderRadius: (width - 100) / 2,
            marginTop: -10,
            //borderWidth: this.props.options.borderWidth
            //  ? this.props.options.borderWidth
            //  : 2,
            //borderColor: this.props.options.borderColor
            //  ? this.props.options.borderColor
            //  : '#fff',
            opacity: this.state.wheelOpacity,
          }}>
          <AnimatedSvg
            width={this.state.gameScreen}
            height={this.state.gameScreen}
            viewBox={`0 0 ${width} ${width}`}
            style={{
              transform: [{rotate: `-${this.angleOffset}deg`}],
              margin: 10,
            }}>
            <G y={width / 2} x={width / 2}>
              {this._wheelPaths.map((arc, i) => {
                const [x, y] = arc.centroid;
                const number = arc.value.toString();
                return (
                  <G key={`arc-${i}`}>
                    <Path d={arc.path} strokeWidth={2} fill={arc.color} />
                    <G
                      rotation={
                        (i * this.oneTurn) / this.numberOfSegments +
                        this.angleOffset / (started ? 1.4 : 1.6)
                      }
                      origin={`${x}, ${y}`}>
                      {this._textRender(x, y, number, i)}
                    </G>
                  </G>
                );
              })}
            </G>
          </AnimatedSvg>
        </Animated.View>
      </View>
    );
  };

  _renderKnob = () => {
    const knobSize = this.props.options.knobSize
      ? this.props.options.knobSize
      : 20;
    // [0, this.numberOfSegments]
    const YOLO = Animated.modulo(
      Animated.divide(
        Animated.modulo(
          Animated.subtract(this._angle, this.angleOffset),
          this.oneTurn,
        ),
        new Animated.Value(this.angleBySegment),
      ),
      1,
    );

    return (
      <Animated.View
        style={[{
          width: knobSize,
          height: knobSize * 2,
          justifyContent: 'flex-end',
          zIndex: 1,
          opacity: this.state.wheelOpacity,
          position: 'absolute',
          top: -16,
          transform: [
            {
              rotate: YOLO.interpolate({
                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                outputRange: [
                  '0deg',
                  '0deg',
                  '35deg',
                  '-35deg',
                  '0deg',
                  '0deg',
                ],
              }),
            },
          ],
        }, this.props.knobStyle]}>
        <Svg
          width={knobSize}
          height={(knobSize * 100) / 57}
          viewBox={`0 0 57 100`}
          style={{
            transform: [{translateY: 8}],
          }}>
          <Image
            source={
              this.props.options.knobSource
                ? this.props.options.knobSource
                : require('../assets/images/knob.png')
            }
            resizeMode={'contain'}
            style={{ width: knobSize, height: (knobSize * 100) / 57 }}
          />
        </Svg>
      </Animated.View>
    );
  };

  _renderTopToPlay() {
    return this.props.playButton()
    //if (this.state.started == false) {
    //  return (
    //    <TouchableOpacity
    //      onPress={() => this._onPress()}
    //      activeOpacity={0.7}
    //      disabled={this.state.started}
    //    >
    //      {this.props.playButton()}
    //    </TouchableOpacity>
    //  );
    //}
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            position: 'absolute',
            width: width,
            height: height / 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ImageBackground
            style={{
              width: width,
              height: width,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            source={require("../../../assets/stock-quiz/img-stockquiz-cover.gif")}
          >
            <Animated.View style={[styles.content, { padding: 10 }]}>
              {this._renderSvgWheel()}
            </Animated.View>
          </ImageBackground>
        </View>
        {this.props.playButton ? this._renderTopToPlay() : null}
      </View>
    );
  }
}

export default WheelOfFortune;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width - 80,
    height: width - 80,
  },
  startText: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
});
