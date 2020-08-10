import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'recompose';

// Components
import HiglassNeighborhoodResultUiOnly from './HiglassNeighborhoodResultUiOnly';
import MessageCenter from './MessageCenter';
import SpinnerCenter from './SpinnerCenter';

// HOCs
import withEither from './with-either';
import withHiGlassListNeighborhood from './with-higlass-list-neighborhood';
import withMaybe from './with-maybe';

const getKey = props => props.windowId;
const isError = props => props.isError;
const isLoading = props => props.isLoading;
const isNull = props => !props.list;
const isEmpty = props => !props.list.length;
const isNotReady = props => props.isNotReady;

const ErrorMsg = props => (
  <MessageCenter msg={props.isError} type="error">
    {props.isErrorNodes}
  </MessageCenter>
);
ErrorMsg.propTypes = {
  isError: PropTypes.string,
  isErrorNodes: PropTypes.node
};

const IsEmptyMsg = props => (
  <MessageCenter msg={props.isEmptyText} type="warning">
    {props.isEmptyNodes}
  </MessageCenter>
);
IsEmptyMsg.propTypes = {
  isEmptyText: PropTypes.string,
  isEmptyNodes: PropTypes.node
};

const IsNotReadyMsg = props => (
  <MessageCenter msg={props.isNotReadyText} type="default">
    {props.isNotReadyNodes}
  </MessageCenter>
);
IsNotReadyMsg.propTypes = {
  isNotReadyText: PropTypes.string,
  isNotReadyNodes: PropTypes.node
};

const IsTrainingMsg = props => (
  <MessageCenter msg={props.isTrainingText} type="loading">
    {props.isTrainingNodes}
  </MessageCenter>
);
IsTrainingMsg.propTypes = {
  isTrainingText: PropTypes.string,
  isTrainingNodes: PropTypes.node
};

const IsNotTrainedMsg = props => (
  <MessageCenter msg={props.isNotTrainedText} type="info">
    {props.isNotTrainedNodes}
  </MessageCenter>
);
IsNotTrainedMsg.propTypes = {
  isNotTrainedText: PropTypes.string,
  isNotTrainedNodes: PropTypes.node
};

// Order of application is top to bottom
const HiglassNeighborhoodResultList = compose(
  withMaybe(isNull),
  withEither(isError, ErrorMsg),
  withEither(isLoading, SpinnerCenter),
  withEither(isNotReady, IsNotReadyMsg),
  withEither(isEmpty, IsEmptyMsg),
  withHiGlassListNeighborhood(getKey)
)(HiglassNeighborhoodResultUiOnly);

export default HiglassNeighborhoodResultList;
